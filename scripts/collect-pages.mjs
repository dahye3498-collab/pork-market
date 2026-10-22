import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fetchPrices} from '../lib/pork-api.mjs';
const path='data/pork-records.json';
let previous={records:[],coverage:[]};
try{previous=JSON.parse(await readFile(path,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
const days=Number(process.env.COLLECT_DAYS||(previous.coverage.length?7:62));
if(!Number.isInteger(days)||days<1||days>90)throw Error('COLLECT_DAYS must be 1–90');
if(!process.env.EKAPE_API_KEY)throw Error('API secret is missing');
const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());
const tasks=[];
for(let i=days-1;i>=0;i--){const date=new Date(Date.parse(today+'T00:00:00Z')-i*86400000).toISOString().slice(0,10);for(const sex of ['all','025001','025003'])for(const skin of ['Y','N'])tasks.push({date,sex,skin})}
const results=[];let cursor=0,failures=0;
await Promise.all(Array.from({length:3},async()=>{while(cursor<tasks.length){const task=tasks[cursor++];let done=false;for(let attempt=0;attempt<2&&!done;attempt++){try{const xml=await fetchPrices(new URLSearchParams(task),process.env.EKAPE_API_KEY);const records=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m=>Object.fromEntries([...m[1].matchAll(/<([\w]+)>([^<]*)<\/\1>/g)].map(t=>[t[1],t[2].trim()])));for(const r of records){if(r.startYmd!==task.date.replaceAll('-','')||r.endYmd!==r.startYmd||!['탕박','박피'].includes(r.skinNm)||!r.gradeNm||!r.judgeSexNm)throw Error('Invalid daily record');for(const [k,v]of Object.entries(r))if(/(?:Amt|Cnt)$/.test(k)&&v!==''&&(!Number.isFinite(Number(v))||Number(v)<0))throw Error('Invalid amount')};results.push({...task,records:records.some(r=>Number(r.CTotCnt)>0)?records:[]});done=true}catch{if(attempt===1)failures++}}}}));
if(failures)throw Error(`${failures} queries failed; existing published data was preserved`);
const taskKey=t=>[t.date,t.sex,t.skin].join('|');
const covered=new Set(results.map(taskKey));
const recordTask=r=>[r.startYmd.slice(0,4)+'-'+r.startYmd.slice(4,6)+'-'+r.startYmd.slice(6,8),{전체:'all',암:'025001',거세:'025003'}[r.judgeSexNm],r.skinNm==='탕박'?'Y':'N'].join('|');
const records=[...previous.records.filter(r=>!covered.has(recordTask(r))),...results.flatMap(t=>t.records)];
await mkdir('data',{recursive:true});
await writeFile(path,JSON.stringify({schemaVersion:1,updatedAt:new Date().toISOString(),source:'축산물품질평가원',coverage:[...new Set([...previous.coverage,...covered])].sort(),records},null,2)+'\n');
console.log(`Collected ${results.length} daily queries; ${records.length} records saved`);
