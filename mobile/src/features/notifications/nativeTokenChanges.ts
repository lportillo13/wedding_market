export type NativePushToken={type:'android'|'ios';data:string};

/** Native registration can emit the current token again; only a change needs a refresh. */
export class NativeTokenChanges {
 private identity:string|null=null;
 observe(value:unknown,acquiringToken:boolean):{token:NativePushToken;refresh:boolean}|null {
  if(!value||typeof value!=='object')return null;
  const candidate=value as Record<string,unknown>;
  if(!['android','ios'].includes(String(candidate.type))||typeof candidate.data!=='string'||!candidate.data||candidate.data.length>4096)return null;
  const token:NativePushToken={type:candidate.type as NativePushToken['type'],data:candidate.data};
  const key=`${token.type}:${token.data}`,first=this.identity===null,changed=this.identity!==key;
  this.identity=key;
  // The first event from getDevicePushTokenAsync already belongs to this acquisition.
  return {token,refresh:changed&&!(first&&acquiringToken)};
 }
}
