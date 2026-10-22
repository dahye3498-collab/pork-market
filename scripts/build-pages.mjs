import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out='outputs/pages';
await mkdir(out+'/data',{recursive:true});
for(const file of ['app.js','month.mjs','style.css','sample.xml'])await copyFile('public/dashboard/'+file,out+'/'+file);
let html=await readFile('public/dashboard/index.html','utf8');
html=html.replace('<head>','<head><meta name="pork-data-mode" content="snapshot">');
for(const file of ['app.js','style.css']){const hash=createHash('sha256').update(await readFile('public/dashboard/'+file)).digest('hex').slice(0,12);html=html.replace('"'+file+'"','"'+file+'?v='+hash+'"')}
html=html.replace('API 조회는 서버에서 처리하며','GitHub가 정기 수집한 자료를 조회하며');
await writeFile(out+'/index.html',html);
await copyFile('data/pork-records.json',out+'/data/records.json');
await writeFile(out+'/.nojekyll','');
console.log('Pages static files built');
