'use client';
import {useEffect,useRef,useState} from 'react';
import {supabaseBrowser} from '@/lib/supabase/client';
import {safetyCopy} from '@/shared/safety/copy';
import {withDeadline} from '@/shared/resources/deadline';

export default function ContentSafety({kind,targetId,vendorId=null,language}:{kind:'vendor'|'conversation';targetId:string;vendorId?:string|null;language:'en'|'es'}) {
  const labels=safetyCopy[language];const [open,setOpen]=useState(false);const [blocked,setBlocked]=useState(false);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  const stateVersion=useRef(0);
  useEffect(()=>{
    if(kind!=='conversation'||!vendorId)return;let active=true;const version=++stateVersion.current;
    void withDeadline(signal=>supabaseBrowser.rpc('conversation_safety_state',{p_rfq:targetId,p_vendor:vendorId}).abortSignal(signal)).then(({data})=>{if(active&&version===stateVersion.current)setBlocked(data===true);}).catch(()=>{});
    return()=>{active=false;};
  },[kind,targetId,vendorId]);
  async function block() {
    if(busy)return;stateVersion.current++;setBusy(true);setMessage('');
    try {const {error}=await withDeadline(signal=>supabaseBrowser.rpc('set_conversation_block',{p_rfq:targetId,p_vendor:vendorId,p_blocked:!blocked}).abortSignal(signal));if(error)throw error;setBlocked(!blocked);}
    catch {setMessage(labels.failed);}finally{setBusy(false);}
  }
  async function report(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();if(busy)return;setBusy(true);setMessage('');const form=new FormData(event.currentTarget);
    try {const {error}=await withDeadline(signal=>supabaseBrowser.rpc('report_content',{p_kind:kind,p_target:targetId,p_vendor:vendorId,p_reason:String(form.get('reason')),p_details:String(form.get('details')??'')}).abortSignal(signal));if(error)throw error;setMessage(labels.sent);setOpen(false);}
    catch {setMessage(labels.failed);}finally{setBusy(false);}
  }
  return <div className="my-3"><div className="d-flex flex-wrap gap-2"><button className="btn btn-link btn-sm text-secondary" onClick={()=>setOpen(!open)}>{labels.report}</button>{kind==='conversation'?<button disabled={busy} className="btn btn-outline-secondary btn-sm" onClick={block}>{blocked?labels.unblock:labels.block}</button>:null}</div>{blocked?<p className="small text-muted mt-2">{labels.blocked}</p>:null}
    {open?<form onSubmit={report} className="border rounded p-3 mt-2"><label className="d-block">{labels.reason}<select required name="reason" className="form-select">{(['spam','harassment','misleading','rights','other'] as const).map(reason=><option key={reason} value={reason}>{labels[reason]}</option>)}</select></label><label className="d-block mt-2">{labels.details}<textarea name="details" maxLength={2000} className="form-control" rows={3}/></label><button disabled={busy} className="btn btn-outline-dark btn-sm mt-2">{labels.send}</button></form>:null}
    {message?<p role="status" className="small mt-2">{message}</p>:null}
  </div>;
}
