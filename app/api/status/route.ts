import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
export const dynamic='force-dynamic';
export async function GET(){if(!await getChatGPTUser())return Response.json({error:'로그인이 필요합니다.'},{status:401});return Response.json({configured:!!(env as unknown as Record<string,string>).EKAPE_API_KEY},{headers:{'Cache-Control':'no-store'}})}
