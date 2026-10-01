import {getDatabase} from '@/lib/database';
import {register} from '@/lib/store';
import {rateLimit,clientBucket,validateOrigin} from '@/lib/security';
import {failure,json,readJson} from '@/lib/http';
export const runtime='nodejs';
export async function POST(req:Request){try{validateOrigin(req);const db=getDatabase();await rateLimit(db,clientBucket(req,'register'),200,10);const result=await register(db,await readJson(req));return json({token:result.token,code:result.entry.code},201)}catch(e){return failure(e)}}
