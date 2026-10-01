export const PRIZES=[
 {id:'sigenstor',label:'SigenStor',discount:5,cap:20000,quantity:1,color:'#1c6bea'},
 {id:'neo',label:'SigenStor NEO',discount:3,cap:10000,quantity:2,color:'#24b8dc'},
 {id:'bundle',label:'Sigenergy + JA Solar',discount:2,cap:5000,quantity:10,color:'#8fa9ff'}
] as const;
export type PrizeId=typeof PRIZES[number]['id'];
export type Participant={id:string;code:string;name:string;company:string;position:string;created_at:string;line_user_id:string|null};
export type Entry=Participant & {prize_id:string|null;draw_id:string|null;drawn_at:string|null;finalized:boolean};
export function prizeFor(id:string|null){return PRIZES.find(p=>p.id===id)}
export function resultStatus(entry:Entry){return entry.prize_id?'winner':entry.finalized?'not_selected':'pending'}
