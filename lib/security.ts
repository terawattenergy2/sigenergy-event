import {createHmac,createHash,timingSafeEqual,randomBytes,scryptSync} from 'node:crypto';
import type {Database} from './database';
export class AppError extends Error {constructor(public status:number,message:string){super(message)}}
export function appSecret(){const s=process.env.APP_SECRET;if(!s||s.length<32)throw new Error('APP_SECRET must contain at least 32 characters');return s}
export function digest(text:string){return createHash('sha256').update(text).digest('hex')}
function equal(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
export function issueEntryToken(id:string){return `${id}.${createHmac('sha256',appSecret()).update(`entry:${id}`).digest('base64url')}`}
export function entryId(token:string){const [id,mac,...rest]=token.split('.');if(rest.length||!/^\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b$/i.test(id??'')||!mac||!equal(issueEntryToken(id),token))throw new AppError(404,'ไม่พบ voucher หรือรหัสไม่ถูกต้อง');return id}
export function checkPassword(password:string,encoded:string){try{const [salt,hash]=encoded.split(':');if(!salt||!hash)return false;const candidate=scryptSync(password,salt,64).toString('hex');return equal(candidate,hash)}catch{return false}}
export function newSession(){return randomBytes(32).toString('base64url')}
export function validateOrigin(request:Request){const expected=appOrigin();if(request.headers.get('origin')!==expected)throw new AppError(403,'คำขอไม่ถูกต้อง กรุณาเปิดเว็บจากลิงก์ของงาน');}
export function appOrigin(){const raw=process.env.APP_URL;if(!raw)throw new Error('APP_URL is not configured');const u=new URL(raw);if(process.env.NODE_ENV==='production'&&u.protocol!=='https:')throw new Error('APP_URL must use HTTPS in production');return u.origin}
export function validateLineSignature(body:Buffer,signature:string,secret:string){return equal(createHmac('sha256',secret).update(body).digest('base64'),signature)}
export async function rateLimit(db:Database,bucket:string,max:number,minutes:number){const {rows}=await db.query<{hits:number}>(`INSERT INTO rate_limits(bucket,hits,resets_at) VALUES($1,1,now()+($2::int*interval '1 minute')) ON CONFLICT(bucket) DO UPDATE SET hits=CASE WHEN rate_limits.resets_at<=now() THEN 1 ELSE rate_limits.hits+1 END,resets_at=CASE WHEN rate_limits.resets_at<=now() THEN now()+($2::int*interval '1 minute') ELSE rate_limits.resets_at END RETURNING hits`,[bucket,minutes]);if(rows[0].hits>max)throw new AppError(429,'มีคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่');}
export function clientBucket(req:Request,scope:string){const ip=req.headers.get('x-vercel-forwarded-for')??req.headers.get('x-forwarded-for')??'local';return `${scope}:${createHmac('sha256',appSecret()).update(ip.split(',')[0].trim()).digest('hex')}`}
