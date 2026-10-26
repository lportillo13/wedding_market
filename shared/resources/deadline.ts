/** Bounded network work without retries. Works with Supabase builders on web and native. */
export async function withDeadline<T>(operation:(signal:AbortSignal)=>PromiseLike<T>,ms=10_000):Promise<T> {
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  try {
    return await Promise.race([Promise.resolve().then(()=>operation(controller.signal)),new Promise<never>((_,reject)=>{
      timer=setTimeout(()=>{controller.abort();reject(new Error('Request timed out. Please try again.'));},ms);
    })]);
  } finally {if(timer)clearTimeout(timer);}
}
