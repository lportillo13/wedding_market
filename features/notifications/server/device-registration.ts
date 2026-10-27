import {NextResponse} from 'next/server';
import {z} from 'zod';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {createAuthenticatedRequestClient} from '@/lib/supabase/request';
import {readBoundedJson} from '@/shared/resources/read-json';

const token=z.string().max(180).regex(/^Expo(nent)?PushToken\[[A-Za-z0-9_-]{10,160}\]$/);
const registration=z.object({token,platform:z.enum(['ios','android']),deviceId:z.string().uuid().nullish(),language:z.enum(['en','es']).default('en')}).strict();
const revocation=z.union([z.object({deviceId:z.string().uuid(),bindingId:z.string().uuid()}).strict(),z.object({token}).strict()]);
const json=(value:unknown,status=200)=>NextResponse.json(value,{status,headers:{'Cache-Control':'private, no-store'}});

export async function POST(request:Request) {
 if(!/^Bearer \S+$/i.test(request.headers.get('authorization')??''))return json({ok:false,message:'Authentication required.'},401);
 const client=await createAuthenticatedRequestClient(request);const {data:{user}}=await client.auth.getUser();
 if(!user)return json({ok:false,message:'Authentication required.'},401);
 let body:unknown;try{body=await readBoundedJson(request);}catch{return json({ok:false,message:'Invalid device registration.'},400);}
 const parsed=registration.safeParse(body);if(!parsed.success)return json({ok:false,message:'Invalid device registration.'},400);
 if(!createSupabaseAdminClient())return json({ok:false,message:'Mobile notification delivery is not configured.'},503);
 const input=parsed.data;
 const {data,error}=await client.rpc('register_message_push_device',{p_token:input.token,p_platform:input.platform,p_device:input.deviceId??null,p_language:input.language}).abortSignal(AbortSignal.timeout(8000));
 if(error)return json({ok:false,message:'Unable to enable notifications. Check your connection and try again.'},503);
 return json({ok:true,accountId:user.id,...data});
}

export async function DELETE(request:Request) {
 if(!/^Bearer \S+$/i.test(request.headers.get('authorization')??''))return json({ok:false,message:'Authentication required.'},401);
 const client=await createAuthenticatedRequestClient(request);const {data:{user}}=await client.auth.getUser();
 if(!user)return json({ok:false,message:'Authentication required.'},401);
 let body:unknown;try{body=await readBoundedJson(request);}catch{return json({ok:false,message:'Invalid device revocation.'},400);}
 const parsed=revocation.safeParse(body);if(!parsed.success)return json({ok:false,message:'Invalid device revocation.'},400);
 const input=parsed.data;
 const {error}=await client.rpc('unregister_message_push_device', 'token' in input?{p_token:input.token}:{p_device:input.deviceId,p_binding:input.bindingId}).abortSignal(AbortSignal.timeout(8000));
 if(error)return json({ok:false,message:'Unable to turn off notifications. Please try again.'},503);
 return json({ok:true});
}
