import {randomBytes,scryptSync} from 'node:crypto';
import {createInterface} from 'node:readline/promises';
const rl=createInterface({input:process.stdin,output:process.stdout});console.log('Generate ADMIN_PASSWORD_HASH. Use a unique password, at least 16 characters.');const password=await rl.question('Password (visible only in this local terminal): ');rl.close();if(password.length<16)throw new Error('Password must be at least 16 characters');const salt=randomBytes(16).toString('hex');console.log('\nADMIN_PASSWORD_HASH='+salt+':'+scryptSync(password,salt,64).toString('hex'));
