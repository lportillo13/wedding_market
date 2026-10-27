import {useEffect,useState} from 'react';
import {Alert,AppState,Platform} from 'react-native';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import type {Session} from '@supabase/supabase-js';
import {MESSAGE_PUSH_CHANNEL,matchesMessagePush,notificationThreadTarget,NoticeDeduplication,type MessagePushScope,type NotificationThreadTarget} from '../../../../shared/notifications/push';
import {withDeadline} from '../../../../shared/resources/deadline';
import {mobileConfig} from '../../lib/config';
import {requestJson} from '../../lib/http';
import {supabase} from '../../lib/supabase';
import {MessagePushController,initialPushState,type SavedPush,type PushContext} from './controller';

type Notifications=typeof import('expo-notifications');
let nativePromise:Promise<Notifications|null>|null=null;
let scope:MessagePushScope|null=null;
let lastIdentity='';const presented=new NoticeDeduplication();
let tokenPending:Promise<string>|null=null;
const storageKey='wm.mobile.message-notifications.v1';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function native(){
 if(Platform.OS==='web'||Constants.appOwnership==='expo')return null;
 nativePromise??=import('expo-notifications').then(module=>{
  module.setNotificationHandler({handleNotification:async notification=>{
   const data=notification.request.content.data;
   const show=matchesMessagePush(data,scope)&&presented.add(String(data?.notificationId));
   return {shouldShowBanner:show,shouldShowList:show,shouldPlaySound:show,shouldSetBadge:false};
  }});return module;
 }).catch(()=>null);
 return nativePromise;
}
function present(value:MessagePushScope|null){
 const identity=value?`${value.recipientId}:${value.bindingId}`:'';
 if(identity&&identity!==lastIdentity){presented.clear();lastIdentity=identity;}
 scope=value;
}
async function loadSaved():Promise<SavedPush>{
 const raw=await SecureStore.getItemAsync(storageKey);
 if(raw&&raw.length<4096){
  try{
   const value=JSON.parse(raw) as SavedPush;
   if(uuid.test(value.deviceId)){
    const saved:SavedPush={deviceId:value.deviceId};
    if(value.optedInAccountId&&uuid.test(value.optedInAccountId))saved.optedInAccountId=value.optedInAccountId;
    const item=value.registered;
    if(item&&uuid.test(item.accountId)&&uuid.test(item.bindingId)&&/^[a-f0-9]{64}$/i.test(item.sessionHash)&&Number.isFinite(Date.parse(item.expiresAt))&&Number.isFinite(item.registeredAt)&&['en','es'].includes(item.language)){
     saved.registered={accountId:item.accountId,bindingId:item.bindingId,sessionHash:item.sessionHash,expiresAt:item.expiresAt,registeredAt:item.registeredAt,language:item.language};
    }
    return saved;
   }
  }catch{/* Invalid local preference is never treated as enabled. */}
 }
 return {deviceId:Crypto.randomUUID()};
}
const headers=(context:PushContext)=>({Authorization:`Bearer ${context.accessToken}`,'Content-Type':'application/json'});

export function useMessageNotifications({eligible,language,role,onOpen,onActivity}:{eligible:boolean;language:'en'|'es';role:string;onOpen:(target:NotificationThreadTarget)=>void;onActivity:()=>void}){
 const [state,setState]=useState(initialPushState);const [session,setSession]=useState<Session|null>(null);
 const [controller]=useState(()=>new MessagePushController({
  load:loadSaved,
  save:value=>SecureStore.setItemAsync(storageKey,JSON.stringify(value),{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY}),
  hash:token=>Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,token),
  permission:async(prompt,lang)=>{
   const module=await native();if(!module)return 'unsupported';
   if(Platform.OS==='android')await module.setNotificationChannelAsync(MESSAGE_PUSH_CHANNEL,{name:lang==='es'?'Mensajes y cotizaciones':'Messages and quotes',importance:module.AndroidImportance.HIGH,sound:'default',enableVibrate:false,lightColor:'#4B352C',lockscreenVisibility:module.AndroidNotificationVisibility.PRIVATE});
   let permission=await module.getPermissionsAsync();
   if(!permission.granted&&prompt&&permission.canAskAgain)permission=await module.requestPermissionsAsync({ios:{allowAlert:true,allowSound:true,allowBadge:false}});
   return permission.granted||permission.ios?.status===3?'granted':'denied';
  },
  token:async()=>{
   const module=await native();if(!module)throw Error('Native build required');
   const projectId=Constants.expoConfig?.extra?.eas?.projectId??Constants.easConfig?.projectId;
   if(typeof projectId!=='string'||!projectId)throw Error('Push project unavailable');
   if(!tokenPending){
    const work=module.getExpoPushTokenAsync({projectId}).then(result=>result.data);
    tokenPending=work;void work.then(()=>{if(tokenPending===work)tokenPending=null;},()=>{if(tokenPending===work)tokenPending=null;});
   }
   const pending=tokenPending;return withDeadline(()=>pending,15_000);
  },
  register:async(context,deviceId,token)=>{
   const reply=await requestJson<{ok?:boolean;accountId?:string;deviceId?:string;bindingId?:string;expiresAt?:string}>(`${mobileConfig.webApiUrl}/api/mobile/push-token`,{method:'POST',headers:headers(context),body:JSON.stringify({deviceId,token,platform:Platform.OS,language:context.language})});
   if(!reply.ok||reply.accountId!==context.accountId||reply.deviceId!==deviceId||!reply.bindingId||!uuid.test(reply.bindingId)||!reply.expiresAt||!Number.isFinite(Date.parse(reply.expiresAt))||Date.parse(reply.expiresAt)<=Date.now())throw Error('Registration failed');
   return {bindingId:reply.bindingId,expiresAt:reply.expiresAt};
  },
  unregister:async(context,deviceId,bindingId)=>{
   await requestJson(`${mobileConfig.webApiUrl}/api/mobile/push-token`,{method:'DELETE',headers:headers(context),body:JSON.stringify({deviceId,bindingId})});
  },
  dismiss:async()=>{const module=await native();await module?.dismissAllNotificationsAsync();await module?.setBadgeCountAsync(0);},
  last:async()=>{const module=await native();const response=await module?.getLastNotificationResponseAsync().catch(()=>null);return response?.actionIdentifier===module?.DEFAULT_ACTION_IDENTIFIER?response?.notification.request.content.data:null;},
  clearLast:async()=>{await (await native())?.clearLastNotificationResponseAsync();},
  resolve:async(context,id)=>{
   const client=supabase;if(!client)return null;
   const {data,error}=await withDeadline(signal=>client.from('notifications').select('id,type,data').eq('id',id).eq('recipient_id',context.accountId).is('deleted_at',null).abortSignal(signal).maybeSingle());
   if(error)throw Error('Unable to open notification');if(!data)return null;
   const target=notificationThreadTarget(data,context.role);
   if(target)await withDeadline(signal=>client.from('notifications').update({read_at:new Date().toISOString()}).eq('id',id).eq('recipient_id',context.accountId).abortSignal(signal),5000).catch(()=>{});
   return target;
  },
  open:onOpen,activity:onActivity,changed:setState,scope:present,
  unavailable:lang=>Alert.alert(lang==='es'?'Notificación':'Notification',lang==='es'?'No se pudo abrir esta conversación. Revisa tu bandeja de entrada.':'This conversation could not be opened. Please check your inbox.'),
 }));

 useEffect(()=>{
  if(!supabase)return;
  const {data}=supabase.auth.onAuthStateChange((_event,value)=>{controller.invalidate();setSession(value?{...value}:null);});
  return()=>{data.subscription.unsubscribe();controller.invalidate();};
 },[controller]);
 useEffect(()=>{
  controller.setContext(eligible&&session?{accountId:session.user.id,accessToken:session.access_token,language,role}:null);
 },[controller,eligible,session,language,role]);
 useEffect(()=>{
  let active=true;const remove:(()=>void)[]=[];
  void native().then(module=>{
   if(!module||!active)return;
   const received=module.addNotificationReceivedListener(notice=>controller.receive(notice.request.content.data));
   const opened=module.addNotificationResponseReceivedListener(response=>{if(response.actionIdentifier===module.DEFAULT_ACTION_IDENTIFIER)void controller.accept(response.notification.request.content.data);});
   const token=module.addPushTokenListener(()=>{void controller.refresh(false,true);});
   remove.push(()=>received.remove(),()=>opened.remove(),()=>token.remove());
  });
  const foreground=AppState.addEventListener('change',value=>{if(value==='active')void controller.refresh();});
  return()=>{active=false;remove.forEach(dispose=>dispose());foreground.remove();controller.invalidate();};
 },[controller]);
 return {...state,visible:Boolean(eligible&&session),language,enable:()=>{void controller.refresh(true);},disable:()=>{void controller.disconnect(false).catch(()=>{});},disconnect:()=>controller.disconnect()};
}
