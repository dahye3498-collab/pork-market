const DAY=86400000;
const iso=time=>new Date(time).toISOString().slice(0,10);
export function recentRange(today){const end=Date.parse(today+'T00:00:00Z')-DAY;return {start:iso(end-29*DAY),end:iso(end)}}
export function previousMonthRange(today){const [year,month]=today.split('-').map(Number);return {start:iso(Date.UTC(year,month-2,1)),end:iso(Date.UTC(year,month-1,1)-DAY)}}
export function dayRange(start,end){const a=Date.parse(start+'T00:00:00Z'),b=Date.parse(end+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||!Number.isFinite(a)||!Number.isFinite(b)||iso(a)!==start||iso(b)!==end||b<a||b-a>30*DAY)throw Error('조회 범위는 올바른 날짜로 최대 31일까지 선택해주세요.');return Array.from({length:(b-a)/DAY+1},(_,i)=>iso(a+i*DAY))}
export function skinTasks(dates,skin){if(!['both','Y','N'].includes(skin))throw Error('돈피구분을 확인해주세요.');return dates.flatMap(date=>(skin==='both'?['Y','N']:[skin]).map(code=>date+'|'+code))}
export async function runDailyBatch(dates,load,onProgress=()=>{}){
 let cursor=0,done=0;const results=[],errors=[];
 async function worker(){while(cursor<dates.length){const date=dates[cursor++];try{results.push({date,value:await load(date)})}catch(e){errors.push({date,message:e?.message||'조회 실패'})}done++;onProgress({done,total:dates.length,errors:errors.length})}}
 await Promise.all(Array.from({length:Math.min(3,dates.length)},()=>worker()));
 return {results:results.sort((a,b)=>a.date.localeCompare(b.date)),errors:errors.sort((a,b)=>a.date.localeCompare(b.date))};
}
