import {PGlite} from '@electric-sql/pglite';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {randomBytes,randomUUID,scryptSync,createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
if(process.env.NODE_ENV==='production')throw new Error('Draw demo is local only');
const directory='work/draw-demo';await mkdir(directory,{recursive:true});
let secret;try{secret=await readFile(directory+'/secret','utf8')}catch(e){if(e.code!=='ENOENT')throw e;secret=randomBytes(48).toString('base64url');await writeFile(directory+'/secret',secret,{mode:0o600})}
const db=new PGlite(directory+'/database');
for(const file of ['001_initial.sql','002_merchandise_prizes.sql'])await db.exec(await readFile('db/'+file,'utf8'));
const {rows}=await db.query('SELECT count(*) AS total FROM participants');
if(Number(rows[0].total)===0){
 for(let i=1;i<=40;i++){
  const digest=value=>createHash('sha256').update(value).digest('hex');
  await db.query('INSERT INTO participants(id,code,identity_hash,request_key_hash,name,company,position) VALUES($1,$2,$3,$4,$5,$6,$7)',[randomUUID(),'TE-'+String(i).padStart(3,'0'),digest('demo-person-'+i),digest(randomUUID()),'ผู้ทดสอบ '+String(i).padStart(2,'0'),'บริษัททดสอบ '+(i%8+1),'ผู้ร่วมงานทดสอบ']);
 }
 await db.query('UPDATE event_state SET registrations_closed=true WHERE id=1');
}
await db.close();
const password='TE-Draw-Demo-2026!';const salt=randomBytes(16).toString('hex');
console.log('Draw test: http://127.0.0.1:3002/admin');
console.log('Local test account: admin / '+password);
console.log('40 simulated participants. Separate local database; no production data or LINE API.');
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1','--port','3002'],{stdio:'inherit',env:{...process.env,NODE_ENV:'development',TE_DRAW_DEMO:'1',LOCAL_DATABASE_PATH:directory+'/database',DATABASE_URL:'',APP_SECRET:secret,APP_URL:'http://127.0.0.1:3002',ADMIN_USERNAME:'admin',ADMIN_PASSWORD_HASH:salt+':'+scryptSync(password,salt,64).toString('hex'),LINE_CHANNEL_SECRET:'',LINE_CHANNEL_ACCESS_TOKEN:'',WATCHPACK_POLLING:'1000'}});
child.on('exit',code=>process.exit(code??0));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
