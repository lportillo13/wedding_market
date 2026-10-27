import {NativeTokenChanges} from '../src/features/notifications/nativeTokenChanges';

const android={type:'android',data:'synthetic-native-token'};
describe('native token event admission',()=>{
 test('SDK acquisition emits its token without recursively requesting another acquisition',()=>{
  const changes=new NativeTokenChanges();
  expect(changes.observe(android,true)?.refresh).toBe(false);
  for(let n=0;n<20;n++)expect(changes.observe({...android},false)?.refresh).toBe(false);
 });
 test('an initial background event and a genuine rotation each request one refresh',()=>{
  const changes=new NativeTokenChanges();
  expect(changes.observe(android,false)?.refresh).toBe(true);
  expect(changes.observe(android,false)?.refresh).toBe(false);
  const rotated={...android,data:'rotated-synthetic-token'};
  expect(changes.observe(rotated,true)?.refresh).toBe(true);
  expect(changes.observe(rotated,false)?.refresh).toBe(false);
 });
 test('platform changes count even when their token text matches',()=>{
  const changes=new NativeTokenChanges();changes.observe(android,true);
  expect(changes.observe({...android,type:'ios'},false)?.refresh).toBe(true);
 });
 test('invalid native events do not consume the first valid event',()=>{
  const changes=new NativeTokenChanges();
  for(const value of [null,{},[],{type:'web',data:'wrong-platform'},{type:'ios',data:''},{type:'android',data:'x'.repeat(4097)}])expect(changes.observe(value,true)).toBeNull();
  expect(changes.observe(android,false)?.refresh).toBe(true);
 });
});
