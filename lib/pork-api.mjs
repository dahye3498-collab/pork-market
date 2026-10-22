export const API_ENDPOINT='https://data.ekape.or.kr/openapi-data/service/user/grade/auct/pigGrade';
export function buildQuery(input,key){
 if(!key)throw new Error('API_KEY_MISSING');
 const date=input.get('date')||'';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw new Error('INVALID_DATE');
 const sex=input.get('sex')||'025001',skin=input.get('skin')||'Y';
 if(!['025001','025002','025003','all'].includes(sex)||!['Y','N'].includes(skin))throw new Error('INVALID_FILTER');
 const url=new URL(API_ENDPOINT);url.searchParams.set('startYmd',date.replaceAll('-',''));url.searchParams.set('endYmd',date.replaceAll('-',''));url.searchParams.set('skinYn',skin);if(sex!=='all')url.searchParams.set('sexCd',sex);
 let decoded=key.trim();try{decoded=decodeURIComponent(decoded)}catch{}
 url.searchParams.set('serviceKey',decoded);url.searchParams.set('egradeExceptYn','Y');return url;
}
export async function fetchPrices(input,key,fetcher=fetch){
 const url=buildQuery(input,key);let response;
 try{response=await fetcher(url,{signal:AbortSignal.timeout(20000),redirect:'error',headers:{Accept:'application/xml'}})}catch{throw new Error('UPSTREAM_UNAVAILABLE')}
 if(!response.ok)throw new Error('UPSTREAM_UNAVAILABLE');
 const text=await response.text();if(text.length>2_000_000)throw new Error('INVALID_RESPONSE');
 const code=text.match(/<resultCode>\s*([^<]+)\s*<\/resultCode>/)?.[1]?.trim();
 if(code!=='00')throw new Error(['20','30','31'].includes(code||'')?'API_AUTH_FAILED':'API_RESPONSE_ERROR');
 if(!text.includes('<response>')||!text.includes('</response>'))throw new Error('INVALID_RESPONSE');
 // Reconstruct only whitelisted record fields. Never forward request URLs or credentials.
 const allowed=/^(?:startYmd|endYmd|gradeNm|judgeSexNm|skinNm|(?:CTot|CCity|CEast|CWest|c_0513|c_1101eTot)(?:Amt|Cnt))$/;
 const items=[...text.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(match=>{
  const tags=[...match[1].matchAll(/<([A-Za-z_][\w]*)>([^<]*)<\/\1>/g)].filter(m=>allowed.test(m[1]));
  return '<item>'+tags.map(m=>'<'+m[1]+'>'+m[2]+'</'+m[1]+'>').join('')+'</item>';
 });
 return '<response><header><resultCode>00</resultCode><resultMsg>NORMAL SERVICE.</resultMsg></header><body><items>'+items.join('')+'</items></body></response>';
}
