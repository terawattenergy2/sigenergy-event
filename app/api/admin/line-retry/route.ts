import {getDatabase} from '@/lib/database';import {requireAdmin} from '@/lib/auth';import {deliverOutbox} from '@/lib/line';import {validateOrigin} from '@/lib/security';import {failure,json} from '@/lib/http';
export const maxDuration=60;
export async function POST(req:Request){try{validateOrigin(req);await requireAdmin();return json(await deliverOutbox(getDatabase(),3))}catch(e){return failure(e)}}
