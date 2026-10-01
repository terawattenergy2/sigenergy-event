import {resultStatus,prizeFor,type Entry} from './prizes';
export function publicEntry(entry:Entry){return {code:entry.code,name:entry.name,company:entry.company,position:entry.position,lineLinked:!!entry.line_user_id,status:resultStatus(entry),prize:prizeFor(entry.prize_id)??null}}
