export const PRIZES=[
 {id:'sigenstor',label:'SigenStor',discount:5,cap:20000,quantity:1,color:'#1c6bea'},
 {id:'neo',label:'SigenStor NEO',discount:3,cap:10000,quantity:2,color:'#24b8dc'},
 {id:'bundle',label:'Sigenergy + JA Solar',discount:2,cap:5000,quantity:10,color:'#8fa9ff'},
 {id:'hat',label:'หมวก TE',discount:0,cap:3000,quantity:10,color:'#39a8da'},
 {id:'shirt',label:'เสื้อ TE',discount:0,cap:2500,quantity:5,color:'#526ed3'},
 {id:'micro',label:'Sigen Micro',discount:0,cap:12400,quantity:2,color:'#13aab1'}
] as const;
export type PrizeId=typeof PRIZES[number]['id'];
export type Participant={id:string;code:string;name:string;company:string;position:string;created_at:string;line_user_id:string|null};
export type Entry=Participant & {prize_id:string|null;draw_id:string|null;drawn_at:string|null;finalized:boolean};
export function prizeFor(id:string|null){return PRIZES.find(p=>p.id===id)}
export function resultStatus(entry:Entry){return entry.prize_id?'winner':entry.finalized?'not_selected':'pending'}

export const TOTAL_WINNERS=PRIZES.reduce((sum,p)=>sum+p.quantity,0);
export function prizeLabel(p:{label:string;discount:number}){return p.discount?`${p.label} ${p.discount}%`:p.label}
export function prizeValue(p:{discount:number;cap:number;label:string}){return `${p.discount?"ส่วนลดสูงสุด":p.label==="Sigen Micro"?"มูลค่ากว่า":"มูลค่า"} ${p.cap.toLocaleString("th-TH")} บาท`}
