import type {Metadata} from 'next';import VoucherView from './view';
export const metadata:Metadata={title:'Voucher ของคุณ · TE × Sigenergy',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{token:string}>}){return <VoucherView token={(await params).token}/>}
