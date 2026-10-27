import type {SupabaseClient} from '@supabase/supabase-js';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {readBoundedJson} from '@/shared/resources/read-json';
import {deliverMessagePush,type DeliveryBinding,type PushDeliveryResult} from './delivery';

export type PushNotificationPayload={notificationId:string;recipientId:string;type:string;title:string;body:string|null;data:unknown};

export async function sendMobilePushNotification(_client:SupabaseClient,payload:PushNotificationPayload):Promise<PushDeliveryResult>{
 const delivery=createSupabaseAdminClient();
 if(!delivery)return {outcome:'unconfigured',attempted:0,accepted:0,retired:0};
 const result=await deliverMessagePush(payload,{
  bindings:async recipient=>{
   const {data,error}=await delivery.rpc('active_message_push_bindings',{p_recipient:recipient}).abortSignal(AbortSignal.timeout(5000));
   if(error)throw Error('Push binding lookup failed');return (data??[]) as DeliveryBinding[];
  },
  send:async messages=>{
   const accessToken=process.env.EXPO_ACCESS_TOKEN?.trim();
   const response=await fetch('https://exp.host/--/api/v2/push/send',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json',...(accessToken?{Authorization:`Bearer ${accessToken}`}:{})},body:JSON.stringify(messages),signal:AbortSignal.timeout(5000)});
   return {status:response.status,body:await readBoundedJson(response,64*1024,5000)};
  },
  retire:async(recipient,binding)=>{
   const {error}=await delivery.from('user_push_tokens').update({is_active:false,updated_at:new Date().toISOString()}).eq('user_id',recipient).eq('binding_id',binding.binding_id).eq('token',binding.token).abortSignal(AbortSignal.timeout(5000));
   if(error)throw Error('Unable to retire expired device');
  },
 });
 if(result.outcome==='failed')console.warn('A saved inbox notification could not be accepted by the push provider.');
 return result;
}
