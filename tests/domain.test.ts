import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {randomUUID} from 'node:crypto';import {PGlite} from '@electric-sql/pglite';
import type {Database,Queryable} from '../lib/database';import {register,draw,closeRegistration,finalize,resetEvent,linkLine,getEntry} from '../lib/store';import {issueEntryToken,entryId,validateLineSignature,digest} from '../lib/security';import {createHmac} from 'node:crypto';import {PRIZES} from '../lib/prizes';import {renderVoucher} from '../lib/voucher-image';
process.env.APP_SECRET='test-only-application-secret-that-is-long-enough';
const operator=digest('test-admin-session');
async function fixture(){const pg=new PGlite();await pg.exec(await readFile('db/001_initial.sql','utf8'));await pg.exec(await readFile('db/002_merchandise_prizes.sql','utf8'));await pg.query("INSERT INTO admin_session(id,token_hash,expires_at) VALUES(1,$1,now()+interval '1 hour')",[operator]);function adapter(client:any):Queryable{return {async query(text,values){const r=await client.query(text,values);return {rows:r.rows,rowCount:r.affectedRows??null}}}}const db:Database={...adapter(pg),transaction:fn=>pg.transaction(tx=>fn(adapter(tx)))};return {pg,db}}
const input=(i:number,key=randomUUID())=>({name:'ผู้ร่วมงาน '+i,company:'บริษัท '+i,position:'Engineer',consent:true,requestKey:key});
async function expireReveal(db:Database){await db.query("UPDATE event_state SET reveal_until=now()-interval '1 second'")}
test('registration stores fields, retries return same voucher, duplicate identity cannot retrieve another voucher',async()=>{const {pg,db}=await fixture();try{const d=input(1);const a=await register(db,d),b=await register(db,d);assert.equal(a.entry.code,'TE-001');assert.equal(a.token,b.token);assert.equal(a.entry.name,d.name);assert.equal(a.entry.company,d.company);assert.equal(a.entry.position,d.position);await assert.rejects(()=>register(db,input(1)),/ลงทะเบียนแล้ว/);assert.equal(entryId(a.token),a.entry.id);assert.throws(()=>entryId(a.token.slice(0,-1)+'!'));}finally{await pg.close()}});
test('TE-001..TE-150 capacity and unique codes under concurrent registration',async()=>{const {pg,db}=await fixture();try{const entries=await Promise.all(Array.from({length:150},(_,i)=>register(db,input(i))));assert.equal(new Set(entries.map(e=>e.entry.code)).size,150);assert.equal(entries.at(-1)?.entry.code,'TE-150');await assert.rejects(()=>register(db,input(151)),/150/);}finally{await pg.close()}});
test('draw enforces closed registration, active operator, idempotency, spin lock, quotas, and unique winners',async()=>{const {pg,db}=await fixture();try{for(let i=0;i<33;i++)await register(db,input(i));await assert.rejects(()=>draw(db,'sigenstor',randomUUID(),operator),/ปิดรับ/);await closeRegistration(db);await assert.rejects(()=>register(db,input(80)),/ปิดรับ/);await assert.rejects(()=>draw(db,'sigenstor',randomUUID(),'old-session'),/หมดอายุ/);const key=randomUUID();const first=await draw(db,'sigenstor',key,operator);const repeat=await draw(db,'sigenstor',key,operator);assert.equal(first.winner.code,repeat.winner.code);await assert.rejects(()=>draw(db,'neo',randomUUID(),operator),/วงล้อ/);await expireReveal(db);await assert.rejects(()=>draw(db,'sigenstor',randomUUID(),operator),/ครบแล้ว/);const ids=new Set([first.winner.code]);for(const p of PRIZES){for(let i=p.id==='sigenstor'?1:0;i<p.quantity;i++){await expireReveal(db);const r=await draw(db,p.id,randomUUID(),operator);assert.ok(!ids.has(r.winner.code));ids.add(r.winner.code)}}assert.equal(ids.size,30);await expireReveal(db);await finalize(db,true);const {rows}=await db.query('SELECT count(*) AS count FROM draws');assert.equal(Number(rows[0].count),30);await assert.rejects(()=>draw(db,'bundle',randomUUID(),operator),/จบการ/);const loser=(await db.query<{id:string}>('SELECT id FROM participants WHERE id NOT IN(SELECT participant_id FROM draws) LIMIT 1')).rows[0];assert.equal((await getEntry(db,issueEntryToken(loser.id))).finalized,true);}finally{await pg.close()}});
test('two simultaneous draw attempts produce only one committed winner during reveal window',async()=>{const {pg,db}=await fixture();try{for(let i=0;i<3;i++)await register(db,input(i));await closeRegistration(db);const r=await Promise.allSettled([draw(db,'neo',randomUUID(),operator),draw(db,'neo',randomUUID(),operator)]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);assert.equal(Number((await db.query('SELECT count(*) AS count FROM draws')).rows[0].count),1);}finally{await pg.close()}});
test('LINE ownership cannot be rebound; 1 LINE account maps to 1 voucher; only genuine signatures pass',async()=>{const {pg,db}=await fixture();try{const a=await register(db,input(1)),b=await register(db,input(2));await linkLine(db,a.token,'LINE_A');await assert.rejects(()=>linkLine(db,a.token,'LINE_B'),/บัญชี LINE อื่น/);await assert.rejects(()=>linkLine(db,b.token,'LINE_A'),/คนอื่น/);const raw=Buffer.from('{"events":[]}');const secret='test-line-secret';const sig=createHmac('sha256',secret).update(raw).digest('base64');assert.ok(validateLineSignature(raw,sig,secret));assert.ok(!validateLineSignature(Buffer.from('{"events": [ ]}'),sig,secret));}finally{await pg.close()}});
test('entry and result vouchers embed the exact supplied LINE QR asset',async()=>{
 const {pg,db}=await fixture();try{
  const sharp=(await import('sharp')).default;
  const expected=await sharp('public/assets/line-oa-qr.png').resize(300,300,{kernel:'nearest'}).removeAlpha().raw().toBuffer();
  const r=await register(db,input(1));const entry=await getEntry(db,r.token);
  for(const kind of ['entry','result'] as const){const png=await renderVoucher({...entry,prize_id:'sigenstor'},kind);const actual=await sharp(png).extract({left:65,top:666,width:300,height:300}).removeAlpha().raw().toBuffer();assert.deepEqual(actual,expected);}
 }finally{await pg.close()}
});

test('reset draw keeps vouchers and permits a new draw; clear all invalidates old vouchers and starts at TE-001',async()=>{
 const {pg,db}=await fixture();try{
  const a=await register(db,input(1));await register(db,input(2));await closeRegistration(db);
  await draw(db,'sigenstor',randomUUID(),operator);
  await assert.rejects(()=>resetEvent(db,'reset-draws','WRONG',operator));
  await assert.rejects(()=>resetEvent(db,'reset-draws','RESET DRAW',operator),/วงล้อ/);
  await expireReveal(db);
  await assert.rejects(()=>resetEvent(db,'reset-all','DELETE ALL','invalid'),/หมดอายุ/);
  assert.equal(Number((await db.query('SELECT count(*) AS count FROM draws')).rows[0].count),1);
  await finalize(db,true);await resetEvent(db,'reset-draws','RESET DRAW',operator);
  assert.equal((await getEntry(db,a.token)).prize_id,null);
  assert.equal(Number((await db.query('SELECT count(*) AS count FROM participants')).rows[0].count),2);
  assert.equal((await db.query('SELECT finalized FROM event_state')).rows[0].finalized,false);
  await draw(db,'sigenstor',randomUUID(),operator);await expireReveal(db);
  await resetEvent(db,'reset-all','DELETE ALL',operator);
  await assert.rejects(()=>getEntry(db,a.token),/ไม่พบ voucher/);
  assert.equal((await register(db,input(1))).entry.code,'TE-001');
  assert.equal(Number((await db.query('SELECT count(*) AS count FROM draws')).rows[0].count),0);
 }finally{await pg.close()}
});
