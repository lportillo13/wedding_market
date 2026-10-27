import {matchesMessagePush,NoticeDeduplication,parseMessagePush,type MessagePushScope,type NotificationThreadTarget} from '../../../../shared/notifications/push';

export type PushContext={accountId:string;accessToken:string;language:'en'|'es';role:string};
export type PushBinding={accountId:string;bindingId:string;expiresAt:string;sessionHash:string;language:'en'|'es';registeredAt:number};
export type SavedPush={deviceId:string;optedInAccountId?:string;registered?:PushBinding};
export type PushState={enabled:boolean;busy:boolean;status:'off'|'on'|'denied'|'unsupported'|'error';retryDisable:boolean};
export const initialPushState:PushState={enabled:false,busy:false,status:'off',retryDisable:false};
type Dependencies={
 load:()=>Promise<SavedPush>;save:(value:SavedPush)=>Promise<void>;hash:(token:string)=>Promise<string>;
 permission:(prompt:boolean,language:'en'|'es')=>Promise<'granted'|'denied'|'unsupported'>;
 token:()=>Promise<string>;register:(context:PushContext,deviceId:string,token:string)=>Promise<{bindingId:string;expiresAt:string}>;
 unregister:(context:PushContext,deviceId:string,bindingId:string)=>Promise<void>;
 dismiss:()=>Promise<void>;last:()=>Promise<unknown>;clearLast:()=>Promise<void>;
 resolve:(context:PushContext,id:string)=>Promise<NotificationThreadTarget|null>;
 open:(target:NotificationThreadTarget)=>void;activity:()=>void;unavailable:(language:'en'|'es')=>void;
 changed:(state:PushState)=>void;scope:(scope:MessagePushScope|null)=>void;now?:()=>number;
};

/** One serialized device workflow. Context changes retire in-flight work before it can present. */
export class MessagePushController {
 private context:PushContext|null=null;
 private generation=0;
 private queue:Promise<unknown>=Promise.resolve();
 private saved:SavedPush|null=null;
 private state:PushState={...initialPushState};
 private presented:MessagePushScope|null=null;
 private handled=new NoticeDeduplication();
 private received=new NoticeDeduplication();
 private lastFailure=0;
 private nativeTokenRevision=0;
 private registeredNativeTokenRevision=0;
 private pendingRevoke:{context:PushContext;deviceId:string;bindingId:string}|null=null;
 constructor(private deps:Dependencies){}
 private now(){return (this.deps.now??Date.now)();}
 private emit(patch:Partial<PushState>){this.state={...this.state,...patch};this.deps.changed(this.state);}
 private show(scope:MessagePushScope|null){this.presented=scope;this.deps.scope(scope);}
 private serial<T>(work:()=>Promise<T>){const result=this.queue.then(work,work);this.queue=result.catch(()=>{});return result;}
 private async load(){return this.saved??=await this.deps.load();}
 private async save(value:SavedPush){await this.deps.save(value);this.saved=value;}

 invalidate(){this.generation++;this.show(null);this.handled.clear();this.received.clear();}
 setContext(context:PushContext|null){
  const old=this.context;this.context=context;this.invalidate();this.emit({...initialPushState});
  if(old&&(!context||old.accountId!==context.accountId)){
   const registration=this.saved?.registered;
   if(registration?.accountId===old.accountId)this.pendingRevoke={context:old,deviceId:this.saved!.deviceId,bindingId:registration.bindingId};
   void this.serial(async()=>{
    const value=await this.load();
    if(value.registered?.accountId===old.accountId)this.pendingRevoke={context:old,deviceId:value.deviceId,bindingId:value.registered.bindingId};
    await this.revokePending();
    if(value.registered?.accountId===old.accountId)await this.save({...value,registered:undefined});
   }).catch(()=>{});
   void this.deps.dismiss().catch(()=>{});
  }
  if(context)void this.refresh().catch(()=>{});
 }
 private async revokePending(){const pending=this.pendingRevoke;if(!pending)return;await this.deps.unregister(pending.context,pending.deviceId,pending.bindingId);if(this.pendingRevoke===pending)this.pendingRevoke=null;}

 refresh(prompt=false,force=false){
  const context=this.context,version=this.generation;
  return this.serial(()=>this.sync(context,version,prompt,force));
 }
 nativeTokenChanged(){this.nativeTokenRevision++;return this.refresh(false,true);}
 private async sync(context:PushContext|null,version:number,prompt:boolean,force:boolean){
  const current=()=>Boolean(context&&this.context===context&&version===this.generation);
  if(!context||!current())return;
  this.emit({busy:true,retryDisable:false});
  try{
   const value=await this.load();if(!current())return;
   if(!prompt&&value.optedInAccountId!==context.accountId){
    if(value.registered?.accountId===context.accountId){
     if(this.lastFailure&&this.now()-this.lastFailure<60_000){this.emit({enabled:false,status:'error',retryDisable:true});return;}
     this.pendingRevoke={context,deviceId:value.deviceId,bindingId:value.registered.bindingId};
     await this.revokePending();await this.save({...value,registered:undefined});
    }
    this.emit({enabled:false,status:'off'});return;
   }
   const permission=await this.deps.permission(prompt,context.language);if(!current())return;
   if(permission!=='granted'){
    this.show(null);this.emit({enabled:false,status:permission});
    if(value.registered?.accountId===context.accountId){this.pendingRevoke={context,deviceId:value.deviceId,bindingId:value.registered.bindingId};await this.revokePending();await this.save({...value,registered:undefined});}
    return;
   }
   const sessionHash=await this.deps.hash(context.accessToken);if(!current())return;
   const previous=value.registered;
   if(!prompt&&!force&&this.nativeTokenRevision===this.registeredNativeTokenRevision&&previous?.accountId===context.accountId&&previous.sessionHash===sessionHash&&previous.language===context.language&&this.now()-previous.registeredAt<12*3600_000&&Date.parse(previous.expiresAt)>this.now()){
    this.show({recipientId:context.accountId,bindingId:previous.bindingId,expiresAt:previous.expiresAt});this.emit({enabled:true,status:'on'});await this.accept(await this.deps.last());return;
   }
   if(!prompt&&!force&&this.lastFailure&&this.now()-this.lastFailure<60_000){this.emit({enabled:false,status:'error'});return;}
   const tokenRevision=this.nativeTokenRevision;
   const token=await this.deps.token();if(!current())return;
   const binding=await this.deps.register(context,value.deviceId,token);
   const retire=()=>this.deps.unregister(context,value.deviceId,binding.bindingId);
   if(!current()){await retire();return;}
   const registered:PushBinding={...binding,accountId:context.accountId,sessionHash,language:context.language,registeredAt:this.now()};
   try{await this.save({...value,optedInAccountId:context.accountId,registered});}catch(error){await retire().catch(()=>{});throw error;}
   if(!current()){await this.save({...value,registered:undefined});await retire();return;}
   this.registeredNativeTokenRevision=tokenRevision;
   this.lastFailure=0;this.show({recipientId:context.accountId,bindingId:binding.bindingId,expiresAt:binding.expiresAt});this.emit({enabled:true,status:'on'});
   await this.accept(await this.deps.last());
  }catch{if(current()){this.lastFailure=this.now();this.show(null);this.emit({enabled:false,status:'error',retryDisable:this.saved?.optedInAccountId!==context.accountId&&this.pendingRevoke?.context.accountId===context.accountId});}}
  finally{if(current())this.emit({busy:false});}
 }

 disconnect(keepPreference=true){
  const context=this.context;this.invalidate();const version=this.generation;this.emit({enabled:false,busy:true,status:'off',retryDisable:false});
  void this.deps.dismiss().catch(()=>{});
  return this.serial(async()=>{
   try{
    const value=await this.load();
    if(value.registered&&context&&value.registered.accountId===context.accountId)this.pendingRevoke={context,deviceId:value.deviceId,bindingId:value.registered.bindingId};
    const next={...value,optedInAccountId:keepPreference?value.optedInAccountId:undefined};
    await this.save(next);
    await this.revokePending();
    await this.save({...next,registered:undefined});
   }catch(error){if(version===this.generation){this.lastFailure=this.now();this.emit({status:'error',retryDisable:!keepPreference});}throw error;}
   finally{if(version===this.generation)this.emit({busy:false});}
  });
 }
 receive(value:unknown){const data=parseMessagePush(value);if(!data||!matchesMessagePush(data,this.presented,this.now())||!this.received.add(data.notificationId))return;this.deps.activity();}
 async accept(value:unknown){
  const data=parseMessagePush(value),context=this.context,version=this.generation;
  if(!data)return;
  // A cold-start tap remains in the native response slot until session restoration finishes.
  if(!context||!this.presented)return;
  if(!matchesMessagePush(data,this.presented,this.now())){await this.deps.clearLast().catch(()=>{});return;}
  if(!this.handled.add(data.notificationId))return;
  await this.deps.clearLast().catch(()=>{});
  try{
   const target=await this.deps.resolve(context,data.notificationId);
   if(version!==this.generation||this.context!==context||!matchesMessagePush(data,this.presented,this.now()))return;
   if(target)this.deps.open(target);else this.deps.unavailable(context.language);
  }catch{if(version===this.generation)this.deps.unavailable(context.language);}
 }
}
