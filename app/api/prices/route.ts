import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { fetchPrices } from '../../../lib/pork-api.mjs';
export const dynamic='force-dynamic';
const cache=new Map<string,{until:number,xml:string}>();
const pending=new Map<string,Promise<string>>();
const messages:Record<string,string>={API_KEY_MISSING:'서버에 API 인증키가 설정되지 않았습니다.',INVALID_DATE:'올바른 조회 날짜를 선택해주세요.',INVALID_FILTER:'조회 조건을 확인해주세요.',UPSTREAM_UNAVAILABLE:'축평원 API에 연결하지 못했습니다. 잠시 후 다시 조회해주세요.',API_AUTH_FAILED:'API 인증이 거절됐습니다. 인증키와 활용승인 상태를 확인해주세요.',API_RESPONSE_ERROR:'API가 정상 응답을 반환하지 않았습니다.',INVALID_RESPONSE:'API 응답 형식을 확인하지 못했습니다.'};
export async function GET(request:Request){
 if(!await getChatGPTUser())return Response.json({error:'로그인이 필요합니다.'},{status:401});
 const input=new URL(request.url).searchParams,key=(env as unknown as Record<string,string>).EKAPE_API_KEY;
 const id=['date','sex','skin'].map(k=>input.get(k)||'').join('|');
 try{
  if(!key)throw Error('API_KEY_MISSING');
  const old=cache.get(id);if(old&&old.until>Date.now())return Response.json({xml:old.xml,cached:true},{headers:{'Cache-Control':'no-store'}});
  let work=pending.get(id);if(!work){if(pending.size>=4)return Response.json({error:'조회가 진행 중입니다. 잠시 후 다시 시도해주세요.'},{status:429});work=fetchPrices(input,key);pending.set(id,work)}
  let xml:string;try{xml=await work}finally{pending.delete(id)}
  if(cache.size>=500)cache.delete(cache.keys().next().value!);cache.set(id,{xml,until:Date.now()+600000});
  return Response.json({xml,cached:false},{headers:{'Cache-Control':'no-store'}});
 }catch(e){const code=e instanceof Error?e.message:'';return Response.json({error:messages[code]||'조회 중 오류가 발생했습니다.'},{status:code==='API_KEY_MISSING'?503:code.startsWith('INVALID_')?400:502,headers:{'Cache-Control':'no-store'}})}
}
