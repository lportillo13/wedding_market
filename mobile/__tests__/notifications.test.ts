import {MessagePushController,type PushContext,type SavedPush,type PushState} from '../src/features/notifications/controller';
import {buildMessagePush,type MessagePushScope} from '../../shared/notifications/push';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const context:PushContext={accountId:id(1),accessToken:'session-one',language:'en',role:'client'};
function setup(initial:SavedPush={deviceId:id(3)}){
 let saved=initial;let scope:MessagePushScope|null=null;let state:PushState|undefined;
 const ports={
  load:jest.fn(async()=>saved),save:jest.fn(async(value:SavedPush)=>{saved=value;}),hash:jest.fn(async()=> 'hash'),
  permission:jest.fn(async()=> 'granted' as const),token:jest.fn(async()=> 'ExpoPushToken[testing_device]'),
  register:jest.fn(async()=>({bindingId:id(4),expiresAt:'2030-01-01T00:00:00Z'})),unregister:jest.fn(async()=>{}),dismiss:jest.fn(async()=>{}),
  last:jest.fn(async():Promise<unknown>=>null),clearLast:jest.fn(async()=>{}),resolve:jest.fn(async()=>({notificationId:id(5),rfqId:id(6),vendorId:id(7)})),
  open:jest.fn(),activity:jest.fn(),unavailable:jest.fn(),changed:(value:PushState)=>{state=value;},scope:(value:MessagePushScope|null)=>{scope=value;},now:()=>1_000_000,
 };
 const controller=new MessagePushController(ports);
 return {controller,ports,state:()=>state,scope:()=>scope,saved:()=>saved};
}
describe('message notification lifecycle',()=>{
 test('never prompts at login; explicit opt-in registers once and focus uses cached binding',async()=>{
  const s=setup();s.controller.setContext(context);await s.controller.refresh();expect(s.ports.permission).not.toHaveBeenCalled();expect(s.ports.register).not.toHaveBeenCalled();
  await s.controller.refresh(true);expect(s.ports.permission).toHaveBeenCalledWith(true,'en');expect(s.state()?.enabled).toBe(true);
  await s.controller.refresh();await s.controller.refresh();expect(s.ports.register).toHaveBeenCalledTimes(1);expect(s.scope()?.recipientId).toBe(context.accountId);
 });
 test('a delayed registration from the previous account is retired before it can present',async()=>{
  const s=setup();s.controller.setContext(context);await s.controller.refresh();
  let finish!:(value:{bindingId:string;expiresAt:string})=>void;
  s.ports.register.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
  const pending=s.controller.refresh(true);while(!finish)await Promise.resolve();
  s.controller.setContext({...context,accountId:id(2),accessToken:'other'});expect(s.scope()).toBeNull();
  finish({bindingId:id(4),expiresAt:'2030-01-01T00:00:00Z'});await pending;await s.controller.refresh();
  expect(s.ports.unregister).toHaveBeenCalledWith(context,id(3),id(4));expect(s.saved().registered).toBeUndefined();expect(s.state()?.enabled).toBe(false);
 });
 test('failed secure persistence retires the new registration',async()=>{
  const s=setup();s.controller.setContext(context);await s.controller.refresh();s.ports.save.mockRejectedValueOnce(Error('storage failed'));
  await s.controller.refresh(true);expect(s.scope()).toBeNull();expect(s.ports.unregister).toHaveBeenCalledWith(context,id(3),id(4));expect(s.state()?.status).toBe('error');
 });
 test('failed opt-out remains retryable and never falsely reports notifications as enabled',async()=>{
  const s=setup();s.controller.setContext(context);await s.controller.refresh(true);s.ports.unregister.mockRejectedValueOnce(Error('offline'));
  await expect(s.controller.disconnect(false)).rejects.toThrow('offline');expect(s.scope()).toBeNull();expect(s.saved().optedInAccountId).toBeUndefined();expect(s.saved().registered?.bindingId).toBe(id(4));expect(s.state()?.retryDisable).toBe(true);
  await s.controller.disconnect(false);expect(s.saved().registered).toBeUndefined();expect(s.state()?.enabled).toBe(false);
 });
 test('cold-start tap waits for restoration; duplicate and stale-account taps cannot navigate',async()=>{
  const s=setup();const push=buildMessagePush({notificationId:id(5),recipientId:id(1),type:'quote_answered'},{token:'token',bindingId:id(4),language:'en'})!.data;
  await s.controller.accept(push);expect(s.ports.clearLast).not.toHaveBeenCalled();s.ports.last.mockResolvedValue(push);
  s.controller.setContext(context);await s.controller.refresh(true);expect(s.ports.open).toHaveBeenCalledTimes(1);
  await s.controller.accept(push);expect(s.ports.open).toHaveBeenCalledTimes(1);
  s.controller.receive(push);s.controller.receive(push);expect(s.ports.activity).toHaveBeenCalledTimes(1);
  s.controller.setContext({...context,accountId:id(2)});await s.controller.accept(push);expect(s.ports.open).toHaveBeenCalledTimes(1);
 });
 test('account changes during owned notification lookup cannot open the old thread',async()=>{
  const s=setup();s.controller.setContext(context);await s.controller.refresh(true);
  let finish!:(value:{notificationId:string;rfqId:string;vendorId:string})=>void;
  s.ports.resolve.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
  const push=buildMessagePush({notificationId:id(5),recipientId:id(1),type:'quote_answered'},{token:'token',bindingId:id(4),language:'en'})!.data;
  const pending=s.controller.accept(push);while(!finish)await Promise.resolve();s.controller.setContext(null);finish({notificationId:id(5),rfqId:id(6),vendorId:id(7)});await pending;expect(s.ports.open).not.toHaveBeenCalled();
 });
});
