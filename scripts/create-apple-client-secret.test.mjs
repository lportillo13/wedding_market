import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,verify} from 'node:crypto';
import {createAppleClientSecret} from './create-apple-client-secret.mjs';
test('Apple OAuth secret has a verifiable ES256 signature, exact audience/client and bounded expiry',()=>{
  const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const now=1800000000;
  const result=createAppleClientSecret({privateKey:privateKey.export({type:'pkcs8',format:'pem'}),teamId:'TESTTEAM01',keyId:'TESTKEY001',clientId:'com.example.web',now});
  const [header,payload,signature]=result.token.split('.');
  assert.deepEqual(JSON.parse(Buffer.from(header,'base64url').toString()),{alg:'ES256',kid:'TESTKEY001'});
  assert.deepEqual(JSON.parse(Buffer.from(payload,'base64url').toString()),{iss:'TESTTEAM01',iat:now,exp:now+180*86400,aud:'https://appleid.apple.com',sub:'com.example.web'});
  assert.equal(Buffer.from(signature,'base64url').length,64);
  assert.equal(verify('sha256',Buffer.from(header+'.'+payload),{key:publicKey,dsaEncoding:'ieee-p1363'},Buffer.from(signature,'base64url')),true);
  assert.equal(result.token.includes('PRIVATE KEY'),false);
});
test('wrong curves and invalid identifiers cannot generate an Apple client secret',()=>{
  const {privateKey}=generateKeyPairSync('ec',{namedCurve:'secp384r1'});
  const values={privateKey:privateKey.export({type:'pkcs8',format:'pem'}),teamId:'TESTTEAM01',keyId:'TESTKEY001',clientId:'com.example.web'};
  assert.throws(()=>createAppleClientSecret(values),/ES256/);
  assert.throws(()=>createAppleClientSecret({...values,teamId:'wrong'}));
  assert.throws(()=>createAppleClientSecret({...values,clientId:'https://example.invalid'}));
});
