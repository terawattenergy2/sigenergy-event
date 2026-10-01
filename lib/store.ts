import {randomInt,randomUUID} from 'node:crypto';
import type {Database,Queryable} from './database';
import {AppError,digest,entryId,issueEntryToken} from './security';
import {PRIZES, type Entry,type Participant,type PrizeId} from './prizes';
const LOCK_ID=734211;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ENTRY_SELECT=`SELECT p.*, d.prize_id, d.id AS draw_id, d.created_at AS drawn_at, e.finalized FROM participants p CROSS JOIN event_state e LEFT JOIN draws d ON d.participant_id=p.id WHERE e.id=1 AND p.id=$1`;
export async function getEntry(db:Queryable,token:string){const id=entryId(token);const {rows}=await db.query<Entry>(ENTRY_SELECT,[id]);if(!rows.length)throw new AppError(404,'ไม่พบ voucher');return rows[0]}
export function registrationInput(data:Record<string,unknown>){const values=['name','company','position'].map(key=>{const v=data[key];if(typeof v!=='string'||!v.trim()||v.length>120)throw new AppError(400,'กรุณากรอกชื่อ บริษัท และตำแหน่ง แต่ละช่องไม่เกิน 120 ตัวอักษร');return v.trim().normalize('NFC').replace(/\s+/g,' ')});if(data.consent!==true)throw new AppError(400,'กรุณายินยอมให้ใช้ข้อมูลสำหรับกิจกรรมนี้');if(typeof data.requestKey!=='string'||!UUID.test(data.requestKey))throw new AppError(400,'รหัสคำขอไม่ถูกต้อง กรุณารีเฟรชหน้าเว็บ');return {name:values[0],company:values[1],position:values[2],requestKey:data.requestKey};}
export async function register(db:Database,data:Record<string,unknown>){const input=registrationInput(data);return db.transaction(async tx=>{await tx.query('SELECT pg_advisory_xact_lock($1)',[LOCK_ID]);const key=digest(input.requestKey);const prior=await tx.query<Participant>('SELECT * FROM participants WHERE request_key_hash=$1',[key]);if(prior.rows.length)return {token:issueEntryToken(prior.rows[0].id),entry:prior.rows[0]};const state=(await tx.query('SELECT registrations_closed FROM event_state WHERE id=1 FOR UPDATE')).rows[0];if(state.registrations_closed)throw new AppError(409,'ปิดรับลงทะเบียนแล้ว กรุณาติดต่อผู้จัดงาน');
const identity=digest(JSON.stringify([input.name,input.company,input.position].map(v=>v.toLowerCase())));if((await tx.query('SELECT id FROM participants WHERE identity_hash=$1',[identity])).rows.length)throw new AppError(409,'ข้อมูลนี้ลงทะเบียนแล้ว กรุณาเปิด voucher เดิม หรือติดต่อผู้จัดงาน');
const next=Number((await tx.query("SELECT COALESCE(MAX(SUBSTRING(code FROM 4)::integer),0)+1 AS next FROM participants")).rows[0].next);if(next>150)throw new AppError(409,'ผู้ร่วมงานลงทะเบียนครบ 150 คนแล้ว กรุณาติดต่อผู้จัดงาน');
const id=randomUUID();const code='TE-'+String(next).padStart(3,'0');const {rows}=await tx.query<Participant>('INSERT INTO participants(id,code,identity_hash,request_key_hash,name,company,position) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[id,code,identity,key,input.name,input.company,input.position]);return {token:issueEntryToken(id),entry:rows[0]};})}
export async function overview(db:Database){const [state,participants,counts,outbox]=await Promise.all([db.query('SELECT * FROM event_state WHERE id=1'),db.query<Entry>(`SELECT p.*,d.prize_id,d.id AS draw_id,d.created_at AS drawn_at,e.finalized FROM participants p CROSS JOIN event_state e LEFT JOIN draws d ON d.participant_id=p.id WHERE e.id=1 ORDER BY p.created_at,p.id`),db.query<{prize_id:string;count:string}>('SELECT prize_id,count(*) FROM draws GROUP BY prize_id'),db.query('SELECT count(*) AS count FROM line_outbox WHERE sent_at IS NULL')]);return {state:state.rows[0],participants:participants.rows,prizes:PRIZES.map(p=>({...p,awarded:Number(counts.rows.find(c=>c.prize_id===p.id)?.count??0)})),pendingMessages:Number(outbox.rows[0].count)}}
export async function closeRegistration(db:Database){await db.transaction(async tx=>{await tx.query('SELECT pg_advisory_xact_lock($1)',[LOCK_ID]);await tx.query('UPDATE event_state SET registrations_closed=true,updated_at=now() WHERE id=1')})}
export async function draw(db:Database,prizeId:PrizeId,key:string,operator:string){if(!UUID.test(key))throw new AppError(400,'รหัสการสุ่มไม่ถูกต้อง');if(!PRIZES.some(p=>p.id===prizeId))throw new AppError(400,'ไม่พบประเภทรางวัล');return db.transaction(async tx=>{await tx.query('SELECT pg_advisory_xact_lock($1)',[LOCK_ID]);const authorized=await tx.query('SELECT id FROM admin_session WHERE id=1 AND token_hash=$1 AND expires_at>now()',[operator]);if(!authorized.rows.length)throw new AppError(401,'บัญชีผู้จัดงานหมดอายุ กรุณาเข้าสู่ระบบใหม่');
const existing=await tx.query('SELECT d.*,p.name,p.company,p.position,p.code FROM draws d JOIN participants p ON p.id=d.participant_id WHERE request_key=$1',[key]);if(existing.rows.length)return {winner:existing.rows[0],replayed:true};
const state=(await tx.query('SELECT *,reveal_until>now() AS busy FROM event_state WHERE id=1 FOR UPDATE')).rows[0];if(!state.registrations_closed)throw new AppError(409,'กรุณาปิดรับลงทะเบียนก่อนเริ่มจับรางวัล');if(state.finalized)throw new AppError(409,'จบการจับรางวัลแล้ว');if(state.busy)throw new AppError(409,'วงล้อกำลังแสดงผล กรุณารอให้รอบนี้จบ');const prize=PRIZES.find(p=>p.id===prizeId)!;
const awarded=Number((await tx.query('SELECT count(*) AS count FROM draws WHERE prize_id=$1',[prizeId])).rows[0].count);if(awarded>=prize.quantity)throw new AppError(409,'รางวัลประเภทนี้แจกครบแล้ว');
const candidates=(await tx.query<Participant>('SELECT p.* FROM participants p WHERE NOT EXISTS(SELECT 1 FROM draws d WHERE d.participant_id=p.id) ORDER BY p.created_at,p.id')).rows;if(!candidates.length)throw new AppError(409,'ไม่มีผู้ร่วมงานที่ยังไม่ได้รับรางวัล');
const winner=candidates[randomInt(candidates.length)];const drawId=randomUUID();await tx.query('INSERT INTO draws(id,request_key,participant_id,prize_id,operator) VALUES($1,$2,$3,$4,$5)',[drawId,key,winner.id,prizeId,operator]);await tx.query("UPDATE event_state SET reveal_until=now()+interval '8 seconds',updated_at=now() WHERE id=1");
return {winner:{id:drawId,participant_id:winner.id,prize_id:prizeId,name:winner.name,company:winner.company,position:winner.position,code:winner.code},replayed:false};})}
export async function finalize(db:Database,confirm:boolean){if(!confirm)throw new AppError(400,'กรุณายืนยันการจบการจับรางวัล');return db.transaction(async tx=>{await tx.query('SELECT pg_advisory_xact_lock($1)',[LOCK_ID]);const state=(await tx.query('SELECT *,reveal_until>now() AS busy FROM event_state WHERE id=1 FOR UPDATE')).rows[0];if(!state.registrations_closed)throw new AppError(409,'กรุณาปิดรับลงทะเบียนก่อน');if(state.busy)throw new AppError(409,'กรุณารอวงล้อแสดงผลให้จบ');if(state.finalized)return;
await tx.query('UPDATE event_state SET finalized=true,updated_at=now() WHERE id=1');})}
export async function linkLine(db:Database,token:string,lineUser:string){return db.transaction(async tx=>{await tx.query('SELECT pg_advisory_xact_lock($1)',[LOCK_ID]);const entry=await getEntry(tx,token);if(entry.line_user_id&&entry.line_user_id!==lineUser)throw new AppError(409,'voucher นี้ผูกกับบัญชี LINE อื่นแล้ว กรุณาติดต่อผู้จัดงาน');const other=await tx.query('SELECT id FROM participants WHERE line_user_id=$1 AND id<>$2',[lineUser,entry.id]);if(other.rows.length)throw new AppError(409,'บัญชี LINE นี้ผูกกับผู้ร่วมงานคนอื่นแล้ว กรุณาติดต่อผู้จัดงาน');await tx.query('UPDATE participants SET line_user_id=$1,line_linked_at=COALESCE(line_linked_at,now()) WHERE id=$2',[lineUser,entry.id]);return {...entry,line_user_id:lineUser}})}

export async function resetEvent(db:Database,mode:'reset-draws'|'reset-all',confirmation:unknown,operator:string){
 const expected=mode==='reset-all'?'DELETE ALL':'RESET DRAW';
 if(confirmation!==expected)throw new AppError(400,'กรุณาพิมพ์คำยืนยันให้ถูกต้อง');
 return db.transaction(async tx=>{
  await tx.query('SELECT pg_advisory_xact_lock($1)',[LOCK_ID]);
  const authorized=await tx.query('SELECT id FROM admin_session WHERE id=1 AND token_hash=$1 AND expires_at>now()',[operator]);
  if(!authorized.rows.length)throw new AppError(401,'บัญชีผู้จัดงานหมดอายุ กรุณาเข้าสู่ระบบใหม่');
  const state=(await tx.query('SELECT reveal_until>now() AS busy FROM event_state WHERE id=1 FOR UPDATE')).rows[0];
  if(state.busy)throw new AppError(409,'กรุณารอวงล้อแสดงผลให้จบก่อนล้างข้อมูล');
  await tx.query('DELETE FROM line_outbox');
  await tx.query('DELETE FROM draws');
  if(mode==='reset-all'){
   await tx.query('DELETE FROM participants');
   await tx.query('DELETE FROM webhook_events');
   await tx.query('DELETE FROM rate_limits');
   await tx.query('UPDATE event_state SET registrations_closed=false,finalized=false,reveal_until=NULL,updated_at=now() WHERE id=1');
  }else{
   await tx.query('UPDATE event_state SET finalized=false,reveal_until=NULL,updated_at=now() WHERE id=1');
  }
 });
}
