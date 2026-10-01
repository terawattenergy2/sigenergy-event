import QRCode from 'qrcode';import {appOrigin} from '@/lib/security';import {failure} from '@/lib/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{return new Response(new Uint8Array(await QRCode.toBuffer(appOrigin(),{width:800,margin:4,errorCorrectionLevel:'M'})),{headers:{'Content-Type':'image/png','Cache-Control':'no-store','Content-Disposition':'inline; filename="event-registration-qr.png"'}})}catch(e){return failure(e)}}
