import {PGlite} from '@electric-sql/pglite';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {randomBytes,scryptSync} from 'node:crypto';
if(process.env.NODE_ENV==='production')throw new Error('Demo is local only');
let existing;
try{existing=await readFile('.env.local','utf8')}catch(e){if(e.code!=='ENOENT')throw e}
if(existing!==undefined){
 if(existing.startsWith('# LOCAL DEMO ONLY.') && /^LOCAL_DATABASE_PATH=work\/local-db$/m.test(existing)){
  console.log('เดโมถูกตั้งค่าไว้แล้ว เก็บข้อมูลและการตั้งค่าเดิมไว้ ไม่ต้องตั้งค่าซ้ำ');
  console.log('หากเว็บกำลังทำงานอยู่ เปิด http://127.0.0.1:3000 ได้เลย มิฉะนั้นรัน yarn dev');
  process.exit(0);
 }
 console.log('พบ .env.local ที่ตั้งค่าไว้แล้ว จึงเก็บไว้โดยไม่เขียนทับ หากตั้งค่าเสร็จแล้วรัน yarn dev ได้เลย');
 process.exit(0);
}
await mkdir('work',{recursive:true});const db=new PGlite('work/local-db');await db.exec(await readFile('db/001_initial.sql','utf8'));await db.close();
const password='TE-Local-Demo-2026!';const salt=randomBytes(16).toString('hex');
await writeFile('.env.local',`# LOCAL DEMO ONLY. Never upload this file or copy these credentials into production.\nLOCAL_DATABASE_PATH=work/local-db\nAPP_SECRET=${randomBytes(48).toString('base64url')}\nADMIN_USERNAME=admin\nADMIN_PASSWORD_HASH=${salt}:${scryptSync(password,salt,64).toString('hex')}\nAPP_URL=http://127.0.0.1:3000\nNEXT_PUBLIC_LINE_OA_URL=\nLINE_CHANNEL_SECRET=\nLINE_CHANNEL_ACCESS_TOKEN=\nNEXT_PUBLIC_COMPANY_NAME=TE\n`);
console.log(`Local demo ready. Run yarn dev. Organizer: admin / ${password}. Use your own PostgreSQL, secrets and password on Vercel.`);
