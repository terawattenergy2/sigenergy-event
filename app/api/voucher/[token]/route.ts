import {getDatabase} from '@/lib/database';
import {getEntry} from '@/lib/store';
import {publicEntry} from '@/lib/public-entry';
import {failure,json} from '@/lib/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(_:Request,{params}:{params:Promise<{token:string}>}){try{return json(publicEntry(await getEntry(getDatabase(),(await params).token)))}catch(e){return failure(e)}}
