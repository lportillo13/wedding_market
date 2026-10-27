import {buildMessagePush} from '../../../shared/notifications/push';
export type DeliveryBinding={token:string;binding_id:string;language:string};
type Message=NonNullable<ReturnType<typeof buildMessagePush>>;
type Ports={bindings:(recipient:string)=>Promise<DeliveryBinding[]>;send:(messages:Message[])=>Promise<{status:number;body:unknown}>;retire:(recipient:string,binding:DeliveryBinding)=>Promise<void>};
export type PushDeliveryResult={outcome:'none'|'accepted'|'failed'|'unconfigured';attempted:number;accepted:number;retired:number};

/** One bounded packet per saved event. Provider failure never removes the durable inbox notice. */
export async function deliverMessagePush(input:{recipientId:string;notificationId:string;type:string},ports:Ports):Promise<PushDeliveryResult>{
 const result:PushDeliveryResult={outcome:'none',attempted:0,accepted:0,retired:0};
 try{
  const seen=new Set<string>();
  const selected:(DeliveryBinding&{message:Message})[]=[];
  for(const binding of await ports.bindings(input.recipientId)){
   if(!/^Expo(nent)?PushToken\[[\w-]{10,160}\]$/.test(binding.token)||seen.has(binding.token))continue;
   const message=buildMessagePush(input,{token:binding.token,bindingId:binding.binding_id,language:binding.language});
   if(!message)continue;selected.push({...binding,message});seen.add(binding.token);if(selected.length===10)break;
  }
  if(!selected.length)return result;
  result.attempted=selected.length;
  const response=await ports.send(selected.map(item=>item.message));
  if(response.status!==200){result.outcome='failed';return result;}
  const body=response.body as {data?:{status?:string;id?:string;details?:{error?:string}}[]}|null;
  if(!Array.isArray(body?.data)){result.outcome='failed';return result;}
  const retire:Promise<void>[]=[];
  for(const [index,binding]of selected.entries()){
   const ticket=body.data[index];
   if(ticket?.status==='ok'&&typeof ticket.id==='string')result.accepted++;
   if(ticket?.status==='error'&&ticket.details?.error==='DeviceNotRegistered'){
    retire.push(ports.retire(input.recipientId,binding).then(()=>{result.retired++;}));
   }
  }
  await Promise.allSettled(retire);
  result.outcome=result.accepted===result.attempted?'accepted':'failed';return result;
 }catch{result.outcome='failed';return result;}
}
