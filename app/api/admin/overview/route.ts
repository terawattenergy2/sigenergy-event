import {getDatabase} from '@/lib/database';import {requireAdmin} from '@/lib/auth';import {overview} from '@/lib/store';import {lineReady} from '@/lib/line';import {failure,json} from '@/lib/http';
export const dynamic='force-dynamic';
export async function GET(){try{await requireAdmin();const data=await overview(getDatabase());return json({...data,participants:data.participants.map(({line_user_id,...p})=>({...p,lineLinked:!!line_user_id})),lineReady:lineReady()})}catch(e){return failure(e)}}
