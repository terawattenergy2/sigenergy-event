import {requireAdmin} from '@/lib/auth';
import {getDatabase} from '@/lib/database';
import {getEntry} from '@/lib/store';
import {issueEntryToken,AppError} from '@/lib/security';
import {renderVoucher} from '@/lib/voucher-image';
import {failure} from '@/lib/http';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){try{
 await requireAdmin();const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))throw new AppError(400,'รหัสไม่ถูกต้อง');
 const entry=await getEntry(getDatabase(),issueEntryToken(id));
 if(!entry.prize_id)throw new AppError(409,'ผู้ร่วมงานนี้ยังไม่ได้รับรางวัล');
 const png=await renderVoucher(entry,'result');
 return new Response(new Uint8Array(png),{headers:{'Content-Type':'image/png','Content-Disposition':`attachment; filename="${entry.code}-winner-voucher.png"`,'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});
}catch(e){return failure(e)}}
