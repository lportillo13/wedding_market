import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {drainOwnedR2Prefix} from '@/lib/r2';
import {sendTransactionalEmail} from '@/lib/resend';
import {invalidatePublicVendorCache} from '@/features/vendors/server/cache';
import {processDeletion,type DeletionJob} from './deletion-workflow';
import {buildDeletionEmail} from './deletion-email';

export async function processRequestedDeletion(id:string,actorId:string,finalReview:boolean) {
  const client=createSupabaseAdminClient();
  if (!client) throw new Error('Deletion processing is not configured.');
  const {data:job,error}=await client.from('account_deletion_requests').select('id,user_id,contact_email,language,status').eq('id',id).single();
  if (error || !job) throw new Error('Deletion request not found.');
  const {data:priorMedia}=await client.from('account_deletion_media').select('done').eq('request_id',id);
  const reviewed=finalReview && job.status==='processing' && priorMedia?.length===2 && priorMedia.every(item=>item.done);
  return processDeletion(job as DeletionJob,actorId,Boolean(reviewed),{
    purge:async(requestId)=>{
      const {error}=await client.rpc('purge_requested_account',{p_request:requestId});
      if (error) throw new Error('Account data cleanup failed. Review the request before retrying.');
      invalidatePublicVendorCache();
    },
    cleanMedia:async(requestId)=>{
      const {data:jobs,error}=await client.from('account_deletion_media').select('owner_prefix,done').eq('request_id',requestId);
      if (error || !jobs?.length) throw new Error('Media cleanup job is unavailable.');
      let complete=true;
      for (const work of jobs) {
        if (work.done) continue;
        if (await drainOwnedR2Prefix(work.owner_prefix)) {
          const {error}=await client.from('account_deletion_media').update({done:true}).eq('request_id',requestId).eq('owner_prefix',work.owner_prefix);
          if (error) throw new Error('Unable to save cleanup progress.');
        } else complete=false;
      }
      return complete;
    },
    deleteAuth:async(userId)=>{
      const {error}=await client.auth.admin.deleteUser(userId);
      if (error && error.status!==404 && error.code!=='user_not_found') throw new Error('Login removal failed. Retry this request.');
    },
    confirmByEmail:async(job)=>{
      if (!job.contact_email) return false;
      const result=await sendTransactionalEmail(buildDeletionEmail({...job, contact_email:job.contact_email}));
      return result.status==='sent';
    },
    finish:async(requestId)=>{
      const {error}=await client.rpc('finish_account_deletion',{p_request:requestId});
      if (error) throw new Error('Unable to finalize the deletion receipt. Retry this request.');
    },
  });
}
