/** Bounds actual streamed bytes and time; never accepts a valid prefix of an unfinished body. */
export async function readBoundedJson(input:{body:ReadableStream<Uint8Array>|null},maxBytes=4096,timeoutMs=5000):Promise<unknown>{
 const reader=input.body?.getReader();if(!reader)throw Error('Missing request body');
 let expired=false,bytes=0,text='';const decoder=new TextDecoder();
 const timer=setTimeout(()=>{expired=true;void reader.cancel().catch(()=>{});},timeoutMs);
 try{
  while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>maxBytes){await reader.cancel();throw Error('JSON body too large');}text+=decoder.decode(value,{stream:true});}
  if(expired)throw Error('Incomplete JSON body');
  return JSON.parse(text+decoder.decode()) as unknown;
 }finally{clearTimeout(timer);reader.releaseLock();}
}
