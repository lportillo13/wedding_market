import Link from 'next/link';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {requireAdminUser} from '@/lib/admin/requireAdmin';
import {invalidatePublicVendorCache} from '@/features/vendors/server/cache';

async function resolve(form:FormData) {
  'use server';
  if(!await requireAdminUser()||form.get('confirm')!=='on')throw Error('Verified moderation confirmation required.');
  const client=await createSupabaseServerClient();
  const {error}=await client.rpc('resolve_content_report',{p_report:String(form.get('report')),p_action:String(form.get('action')),p_message:String(form.get('message')??'').trim()||null});
  if(error)throw Error('Unable to resolve this report. Verify its scope and retry.');
  invalidatePublicVendorCache();revalidatePath('/vendors');revalidatePath('/private-control-room-hub/moderation');
  redirect('/private-control-room-hub/moderation');
}

export default async function ModerationPage({searchParams}:{searchParams:Promise<{id?:string}>}) {
  if(!await requireAdminUser())redirect('/login');
  const client=await createSupabaseServerClient();
  const {data:reports,error}=await client.from('content_reports').select('id,kind,target_id,vendor_id,reason,details,created_at').is('resolved_at',null).order('created_at').limit(50);
  if(error)throw Error('Unable to load reports.');
  const id=(await searchParams).id;const report=reports?.find(item=>item.id===id);
  let messages:{id:string;sender_role:string;body:string;created_at:string}[]=[];
  if(report){const {data,error}=await client.rpc('read_moderation_case',{p_report:report.id});if(error)throw Error('Unable to load this case.');messages=data??[];}
  return <section><h1 className="text-2xl font-semibold mb-3">Content reports</h1><p>Review the oldest 50 open reports promptly. Urgent threats need immediate attention. Review only the selected reported conversation; private group conversations remain separate.</p>
    {reports?.map(item=><article key={item.id} className="border rounded p-3 my-3"><p>{item.kind} · {item.reason} · {new Date(item.created_at).toISOString().slice(0,10)}</p><p>{item.details}</p><p>Reference: {item.target_id}{item.vendor_id?' / '+item.vendor_id:''}</p><Link href={'?id='+item.id}>Review this case</Link>
      {report?.id===item.id?<><ul>{messages.map(message=><li key={message.id}><strong>{message.sender_role}</strong> {message.body}<div className="small">{message.id}</div></li>)}</ul><form action={resolve}><input type="hidden" name="report" value={item.id}/><label>Action<select name="action" className="form-select"><option value="resolved">Resolved after review</option><option value="dismissed">Dismiss after review</option>{item.kind==='vendor'?<option value="unpublish">Unpublish vendor</option>:<option value="remove_message">Remove the specified message</option>}<option value="suspend">Restrict the reported account from posting</option></select></label>{item.kind==='conversation'?<label className="d-block my-2">Message ID, only for removal<input name="message" className="form-control"/></label>:null}<label className="d-block my-2"><input type="checkbox" name="confirm" required/> I reviewed the case and confirm this action.</label><button className="btn btn-outline-danger">Apply moderation action</button></form></>:null}
    </article>)}{!reports?.length?<p>No open reports.</p>:null}
  </section>;
}
