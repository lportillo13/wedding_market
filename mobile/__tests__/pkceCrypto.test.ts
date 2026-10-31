import {webcrypto, randomUUID} from 'node:crypto';
import {TextEncoder} from 'node:util';
import {installPkceCrypto} from '../src/features/auth/pkceCrypto';

test('native PKCE bridges secure randomness and the RFC 7636 SHA-256 test vector', async () => {
  const random=jest.fn((array:Uint32Array)=>webcrypto.getRandomValues(array));
  const host:Parameters<typeof installPkceCrypto>[0]={};
  const crypto=installPkceCrypto(host,{getRandomValues:random,randomUUID,sha256:data=>webcrypto.subtle.digest('SHA-256',data as BufferSource)});
  const nonce=new Uint32Array(56);expect(crypto.getRandomValues!(nonce)).toBe(nonce);expect(random).toHaveBeenCalledWith(nonce);expect(nonce.some(value=>value!==0)).toBe(true);
  const hash=await crypto.subtle!.digest!('SHA-256',new TextEncoder().encode('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'));
  expect(Buffer.from(hash).toString('base64url')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  await expect(crypto.subtle!.digest!('MD5',new Uint8Array())).rejects.toThrow('Unsupported');
});

test('a complete existing WebCrypto implementation is preserved',()=>{
  const digest=jest.fn(),random=jest.fn(),uuid=jest.fn();
  const host={crypto:{getRandomValues:random,randomUUID:uuid,subtle:{digest}}};
  const replacement={getRandomValues:jest.fn(),randomUUID:jest.fn(),sha256:jest.fn()};
  expect(installPkceCrypto(host,replacement)).toBe(host.crypto);expect(host.crypto.subtle.digest).toBe(digest);expect(host.crypto.getRandomValues).toBe(random);expect(host.crypto.randomUUID).toBe(uuid);expect(replacement.sha256).not.toHaveBeenCalled();
});
