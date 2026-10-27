import {TextDecoder,TextEncoder} from 'node:util';

Object.assign(globalThis,{TextEncoder,TextDecoder});
jest.mock('@react-native-async-storage/async-storage',()=>{
  const data=new Map<string,string>();
  return {getItem:async(k:string)=>data.get(k)??null,setItem:async(k:string,v:string)=>{data.set(k,v);},removeItem:async(k:string)=>{data.delete(k);}};
});
jest.mock('expo-secure-store',()=>{
  const data=new Map<string,string>();
  return {WHEN_UNLOCKED_THIS_DEVICE_ONLY:1,getItemAsync:async(k:string)=>data.get(k)??null,setItemAsync:async(k:string,v:string)=>{data.set(k,v);},deleteItemAsync:async(k:string)=>{data.delete(k);}};
});
jest.mock('expo-crypto',()=>{
  const crypto=jest.requireActual<typeof import('node:crypto')>('node:crypto');
  return {
    CryptoDigestAlgorithm:{SHA256:'SHA256'},
    digestStringAsync:async(_algorithm:string,value:string)=>crypto.createHash('sha256').update(value).digest('hex'),
    AESEncryptionKey:{generate:async()=>({encoded:async()=>crypto.randomBytes(32).toString('hex')}),import:async(value:string)=>Buffer.from(value,'hex')},
    // Models the installed Android ByteArrayTypeConverter's actual input contract.
    AESSealedData:{fromCombined:(value:Uint8Array)=>{if(!(value instanceof Uint8Array))throw Error('Expected native Uint8Array');return Buffer.from(value);}},
    aesEncryptAsync:async(value:Uint8Array,key:Buffer,options:{additionalData:Uint8Array})=>{
      const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(options.additionalData);
      const encrypted=Buffer.concat([cipher.update(value),cipher.final()]);
      return {combined:async()=>Buffer.concat([iv,encrypted,cipher.getAuthTag()]).toString('base64')};
    },
    aesDecryptAsync:async(value:Buffer,key:Buffer,options:{additionalData:Uint8Array})=>{
      const decipher=crypto.createDecipheriv('aes-256-gcm',key,value.subarray(0,12));decipher.setAAD(options.additionalData);decipher.setAuthTag(value.subarray(-16));
      return Buffer.concat([decipher.update(value.subarray(12,-16)),decipher.final()]);
    },
  };
});

test('the native session adapter round-trips through the strict Android byte-array bridge',async()=>{
  const {nativeSessionStorage}=require('../src/features/auth/nativeSessionStorage') as typeof import('../src/features/auth/nativeSessionStorage');
  const disk=require('@react-native-async-storage/async-storage') as typeof import('@react-native-async-storage/async-storage').default;
  const session=JSON.stringify({refresh_token:'synthetic-review-token',name:'José 🌿',metadata:'x'.repeat(9000)});
  await nativeSessionStorage.setItem('synthetic-session',session);
  expect(await disk.getItem('synthetic-session')).not.toContain('synthetic-review-token');
  expect(await nativeSessionStorage.getItem('synthetic-session')).toBe(session);
  await nativeSessionStorage.removeItem('synthetic-session');
  expect(await nativeSessionStorage.getItem('synthetic-session')).toBeNull();
});
