import { ACCOUNT_NOTIFICATION_TYPES, VENDOR_NOTIFICATION_TYPES, type NotificationType } from './events';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const types:readonly string[]=['quote_answered','vendor_new_request','vendor_quote_accepted','thread_reply'];
export const MESSAGE_PUSH_CHANNEL='wm-messages-quotes';
export type MessagePushNotice={source:'wedding-market';version:1;notificationId:string;recipientId:string;bindingId:string;type:NotificationType};
export type MessagePushScope={recipientId:string;bindingId:string;expiresAt:string};
export type NotificationThreadTarget={notificationId:string;rfqId:string;vendorId:string};

export function parseMessagePush(value:unknown):MessagePushNotice|null {
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const data=value as Record<string,unknown>;
  if(data.source!=='wedding-market'||data.version!==1||!types.includes(String(data.type)))return null;
  if(!['notificationId','recipientId','bindingId'].every(key=>typeof data[key]==='string'&&uuid.test(data[key] as string)))return null;
  return {source:'wedding-market',version:1,notificationId:String(data.notificationId),recipientId:String(data.recipientId),bindingId:String(data.bindingId),type:data.type as NotificationType};
}

export function matchesMessagePush(value:unknown,scope:MessagePushScope|null,now=Date.now()) {
  const data=parseMessagePush(value);
  return Boolean(data&&scope&&data.recipientId===scope.recipientId&&data.bindingId===scope.bindingId&&Date.parse(scope.expiresAt)>now);
}

const copy={
 en:{quote_answered:['New quote','A vendor sent a quote. Open Wedding Market to review it.'],thread_reply:['New message','You have a new message. Open Wedding Market to read it.'],vendor_new_request:['New wedding request','You received a request. Open Wedding Market to view it.'],vendor_quote_accepted:['Quote accepted','A couple accepted a quote. Open Wedding Market to view it.']},
 es:{quote_answered:['Nueva cotización','Un proveedor envió una cotización. Abre Wedding Market para revisarla.'],thread_reply:['Nuevo mensaje','Tienes un nuevo mensaje. Abre Wedding Market para leerlo.'],vendor_new_request:['Nueva solicitud de boda','Recibiste una solicitud. Abre Wedding Market para verla.'],vendor_quote_accepted:['Cotización aceptada','Una pareja aceptó una cotización. Abre Wedding Market para verla.']},
} as const;

/** Lock-screen payloads contain opaque routing IDs, never conversation data, names or prices. */
export function buildMessagePush(input:{notificationId:string;recipientId:string;type:string},binding:{token:string;bindingId:string;language:string}) {
  const notice=parseMessagePush({source:'wedding-market',version:1,notificationId:input.notificationId,recipientId:input.recipientId,bindingId:binding.bindingId,type:input.type});
  if(!notice)return null;
  const [title,body]=copy[binding.language==='es'?'es':'en'][notice.type];
  return {to:binding.token,sound:'default',channelId:MESSAGE_PUSH_CHANNEL,ttl:86400,title,body,data:notice};
}

/** Resolve only an owned notification after sign-in; never navigate to a URL supplied by a push. */
export function notificationThreadTarget(notification:{id:string;type:string;data:unknown},role:string):NotificationThreadTarget|null {
  const allowed:readonly string[]=role==='vendor'||role==='admin'?VENDOR_NOTIFICATION_TYPES:role==='client'?ACCOUNT_NOTIFICATION_TYPES:[];
  if(!allowed.includes(notification.type)||!uuid.test(notification.id)||!notification.data||typeof notification.data!=='object')return null;
  const data=notification.data as Record<string,unknown>;
  if(typeof data.rfqId!=='string'||typeof data.vendorId!=='string'||!uuid.test(data.rfqId)||!uuid.test(data.vendorId))return null;
  return {notificationId:notification.id,rfqId:data.rfqId,vendorId:data.vendorId};
}

export class NoticeDeduplication {
  private ids=new Set<string>();
  add(id:string) {if(this.ids.has(id))return false;this.ids.add(id);if(this.ids.size>100)this.ids.delete(this.ids.values().next().value!);return true;}
  clear(){this.ids.clear();}
}
