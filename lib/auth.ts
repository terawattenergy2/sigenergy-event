import {cookies} from 'next/headers';
import {getDatabase} from './database';
import {AppError,digest} from './security';
export const ADMIN_COOKIE='te_admin_session';
export async function requireAdmin(){const value=(await cookies()).get(ADMIN_COOKIE)?.value;if(!value)throw new AppError(401,'กรุณาเข้าสู่ระบบผู้จัดงาน');const {rows}=await getDatabase().query('SELECT id FROM admin_session WHERE id=1 AND token_hash=$1 AND expires_at>now()',[digest(value)]);if(!rows.length)throw new AppError(401,'เซสชันหมดอายุ หรือบัญชีนี้เข้าสู่ระบบจากเครื่องอื่นแล้ว');return digest(value)}
