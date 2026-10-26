import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {requireAdminUser} from '@/lib/admin/requireAdmin';
import {processRequestedDeletion} from '@/features/accounts/server/process-deletion';

async function processRequest(form:FormData) {
  'use server';
  const actor=await requireAdminUser();if (!actor) throw new Error('Verified administrator required.');
  const id=String(form.get('id')??'');
  if (!/^[0-9a-f-]{36}$/i.test(id) || form.get('confirmed')!=='on') throw new Error('Confirm the saved deletion request.');
  let result='failed';
  try {result=await processRequestedDeletion(id,actor.id,form.get('reviewed')==='on');} catch {result='failed';}
  revalidatePath('/vendors');revalidatePath('/private-control-room-hub/account-requests');
  redirect('/private-control-room-hub/account-requests?result='+encodeURIComponent(result));
}

export default async function AccountRequestsPage({searchParams}:{searchParams:Promise<{result?:string}>}) {
  const user=await requireAdminUser();if (!user) redirect('/login');
  const client=await createSupabaseServerClient();
  const {data,error}=await client.from('account_deletion_requests').select('id,user_id,language,requested_at,due_at,status').neq('status','completed').order('due_at').limit(50);
  if (error) throw new Error('Unable to load account requests.');
  const results:Record<string,string>={completed:'Deletion completed and confirmation email sent.','media-pending':'Account data removed. Continue to drain the remaining media batch.','review-required':'Account, login and origin media removed. Finish the CDN/backup review before sending confirmation.','email-pending':'Cleanup finished; confirmation email could not be sent. Check delivery settings and retry.',failed:'The request remains recorded. Check provider availability and retry; completion has not been recorded.'};
  const result=(await searchParams).result;
  return <section><h1 className="text-2xl font-semibold mb-4">Account deletion requests</h1>
    <p>Oldest 50 open requests. Process within 30 days. Each step is retryable; no background polling runs.</p>
    {result&&results[result]?<p role="status" className="border rounded p-3 my-3">{results[result]}</p>:null}
    {!data?.length?<p>No pending requests.</p>:data.map(job=><article key={job.id} className="border rounded p-4 my-4">
      <h2 className="font-semibold">{job.id}</h2><p>Account: {job.user_id} · {job.status} · {job.language}</p><p>Due: {new Date(job.due_at).toISOString().slice(0,10)}</p>
      <p>Processing permanently removes this requested account and its content. Preserve any specific legal hold before proceeding. After origin cleanup, purge the Wedding Market media cache in Cloudflare and review backup handling before final confirmation.</p>
      <form action={processRequest}><input type="hidden" name="id" value={job.id}/>
        <label className="block my-3"><input type="checkbox" name="confirmed" required/> I verified this saved request and authorize the next deletion step.</label>
        {job.status==='processing'?<label className="block my-3"><input type="checkbox" name="reviewed"/> Origin cleanup was previously completed; I have now purged CDN copies and reviewed backups/retention. Send completion confirmation.</label>:null}
        <button className="btn btn-outline-danger" type="submit">Process next step</button>
      </form>
    </article>)}
  </section>;
}
