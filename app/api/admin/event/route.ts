import {getDatabase} from '@/lib/database';
import {requireAdmin} from '@/lib/auth';
import {closeRegistration,finalize,resetEvent} from '@/lib/store';
import {validateOrigin,AppError} from '@/lib/security';
import {failure,json,readJson} from '@/lib/http';
export async function POST(req:Request){try{
 validateOrigin(req);const operator=await requireAdmin();const d=await readJson(req);
 if(d.action==='close')await closeRegistration(getDatabase());
 else if(d.action==='finalize')await finalize(getDatabase(),d.confirm===true);
 else if(d.action==='reset-draws'||d.action==='reset-all'){
  if(d.confirm!==true)throw new AppError(400,'กรุณายืนยันก่อนล้างข้อมูล');
  await resetEvent(getDatabase(),d.action,d.confirmation,operator);
 }else throw new AppError(400,'คำสั่งไม่ถูกต้อง');
 return json({ok:true});
}catch(e){return failure(e)}}
