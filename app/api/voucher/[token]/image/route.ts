import {getDatabase} from '@/lib/database';
import {getEntry} from '@/lib/store';
import {renderVoucher} from '@/lib/voucher-image';
import {failure} from '@/lib/http';
export const runtime='nodejs';export const maxDuration=60;export const dynamic='force-dynamic';
export async function GET(req:Request,{params}:{params:Promise<{token:string}>}){try{const entry=await getEntry(getDatabase(),(await params).token);const kind=new URL(req.url).searchParams.get('kind')==='result'?'result':'entry';const png=await renderVoucher(entry,kind);return new Response(new Uint8Array(png),{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store','Content-Disposition':`inline; filename="${entry.code}-${kind}.png"`,'X-Robots-Tag':'noindex, nofollow'}})}catch(e){return failure(e)}}
