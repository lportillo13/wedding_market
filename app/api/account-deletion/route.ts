import { NextResponse } from 'next/server';
import { createAuthenticatedRequestClient } from '@/lib/supabase/request';

export async function POST(request:Request) {
  const origin=request.headers.get('origin');
  const allowed=process.env.NODE_ENV==='development' ? new URL(request.url).origin : 'https://thewedmarket.com';
  if (!request.headers.get('authorization')?.match(/^Bearer \S+$/i) && origin !== allowed && origin !== 'https://www.thewedmarket.com') {
    return NextResponse.json({error:'Invalid request origin.'},{status:403});
  }
  const client=await createAuthenticatedRequestClient(request);
  const {data:{user}}=await client.auth.getUser();
  if (!user) return NextResponse.json({error:'Authentication required.'},{status:401});
  // Fixed small request body; streamed size is checked, not only Content-Length.
  const reader=request.body?.getReader(); let size=0; let raw='';
  if (!reader) return NextResponse.json({error:'Invalid request.'},{status:400});
  const deadline=setTimeout(()=>{void reader.cancel();},5_000);
  try {
    const decoder=new TextDecoder();
    while (true) {
      const {done,value}=await reader.read();if (done) break;
      size+=value.length;if (size>1024) {await reader.cancel();return NextResponse.json({error:'Request too large.'},{status:413});}
      raw+=decoder.decode(value,{stream:true});
    }
    const body=JSON.parse(raw) as {confirm?:unknown;language?:unknown};
    if (body?.confirm !== 'DELETE') return NextResponse.json({error:'Deletion confirmation is required.'},{status:400});
    const {data,error}=await client.rpc('request_account_deletion',{p_language:body.language==='es'?'es':'en'}).abortSignal(AbortSignal.timeout(10_000));
    if (error) return NextResponse.json({error:'Unable to record the deletion request. Please try again.'},{status:503});
    return NextResponse.json(data,{headers:{'Cache-Control':'private, no-store'}});
  } catch {return NextResponse.json({error:'Invalid or incomplete request.'},{status:400});}
  finally {clearTimeout(deadline);reader.releaseLock();}
}
