import {Pool, type QueryResultRow} from 'pg';
import {localDatabase} from './local-database';
export interface Queryable { query<T extends QueryResultRow=QueryResultRow>(text:string,values?:unknown[]):Promise<{rows:T[];rowCount:number|null}> }
export interface Database extends Queryable { transaction<T>(fn:(tx:Queryable)=>Promise<T>):Promise<T> }
const globalDb=globalThis as typeof globalThis&{tePgPool?:Pool};
export function getDatabase():Database{
 if(process.env.LOCAL_DATABASE_PATH&&process.env.NODE_ENV!=='production')return localDatabase();
 if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is not configured');
 globalDb.tePgPool??=new Pool({connectionString:process.env.DATABASE_URL,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:10000});
 const current=globalDb.tePgPool;
 return {query:(text,values)=>current.query(text,values),async transaction(fn){const client=await current.connect();try{await client.query('BEGIN');const result=await fn(client);await client.query('COMMIT');return result;}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release()}}};
}
