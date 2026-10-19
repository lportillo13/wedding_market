import assert from 'node:assert/strict';
import test from 'node:test';
import { ownedR2ObjectKey } from '@/lib/r2-ownership';

test('R2 deletion permits only exact owner namespaces on the configured host',()=>{
  const prefix='vendors/00000000-0000-4000-8000-000000000001/';
  const base='https://media.example.com';
  const key=prefix+'gallery/image.webp';
  assert.equal(ownedR2ObjectKey(key,prefix,base),key);
  assert.equal(ownedR2ObjectKey(base+'/'+key,prefix,base),key);
  for (const value of [
    key.replace('000000000001','000000000002'),
    base+'/'+prefix+'../secret.webp', base+'/'+prefix+'%2e%2e/secret.webp',
    base+'/'+prefix+'%2f../secret.webp', 'https://evil.example/'+key,
    base+'/'+key+'?x=1', base+'/'+key+'#x', prefix+'foo\\bar', prefix+'foo\nbar',
    'https://user:password@media.example.com/'+key,
  ]) assert.equal(ownedR2ObjectKey(value,prefix,base),null,value);
});
