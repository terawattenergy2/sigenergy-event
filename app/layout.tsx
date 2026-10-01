import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'TE × Sigenergy · สิทธิ์ร่วมลุ้นรางวัล',description:'ลงทะเบียนร่วมงานและรับ voucher ส่วนลดพิเศษ Sigenergy',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="th"><body>{children}</body></html>}
