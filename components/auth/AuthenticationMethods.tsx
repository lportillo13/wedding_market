'use client';
import {useEffect,useId,useRef,useState,type KeyboardEvent} from 'react';
import {useLanguage} from '@/contexts/LanguageContext';
import {supabaseBrowser} from '@/lib/supabase/client';
import {authFeedbackKey} from '@/lib/auth-feedback';
import {accessCallback,accessContinuation,emailCodeAddress,validEmailCode,type AccessIntent} from '@/features/auth/domain/access';
import {accessCopy} from '@/features/auth/presentation/access-copy';

export default function AuthenticationMethods({intent='login',nextPath='/account/profile',defaultWorkspace=false,disabled=false,onBusyChange}:{intent?:AccessIntent;nextPath?:string;defaultWorkspace?:boolean;disabled?:boolean;onBusyChange?:(busy:boolean)=>void}) {
  const {language,dictionary}=useLanguage(),copy=accessCopy[language],id=useId();
  const [providers,setProviders]=useState<{google:boolean;apple:boolean}|null>(null);
  const [email,setEmail]=useState(''),[sentTo,setSentTo]=useState(''),[code,setCode]=useState('');
  const [open,setOpen]=useState(false),[pending,setPending]=useState<string|null>(null),[error,setError]=useState('');
  const [resendAt,setResendAt]=useState(0),[remaining,setRemaining]=useState(0);
  const flight=useRef(false),codeRef=useRef<HTMLInputElement>(null);
  const busy=disabled||pending!==null;
  useEffect(()=>{onBusyChange?.(pending!==null);},[pending,onBusyChange]);
  useEffect(()=>()=>onBusyChange?.(false),[onBusyChange]);
  useEffect(()=>{const controller=new AbortController();fetch('/api/auth/providers',{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error('Unavailable');return response.json();}).then(value=>{if(!controller.signal.aborted)setProviders({google:value.google===true,apple:value.apple===true});}).catch(()=>{if(!controller.signal.aborted)setProviders({google:false,apple:false});});return()=>controller.abort();},[]);
  useEffect(()=>{if(!resendAt)return;const tick=()=>setRemaining(Math.max(0,Math.ceil((resendAt-Date.now())/1000)));tick();const timer=window.setInterval(tick,1000);return()=>clearInterval(timer);},[resendAt]);
  useEffect(()=>{if(remaining===0&&resendAt)setResendAt(0);},[remaining,resendAt]);
  useEffect(()=>{const restore=(event:PageTransitionEvent)=>{if(event.persisted){flight.current=false;setPending(null);}};window.addEventListener('pageshow',restore);return()=>window.removeEventListener('pageshow',restore);},[]);
  async function oauth(provider:'google'|'apple') {
    if(flight.current||busy)return;flight.current=true;setPending(provider);setError('');
    try{const {data,error}=await supabaseBrowser.auth.signInWithOAuth({provider,options:{redirectTo:location.origin+accessCallback(intent,nextPath,defaultWorkspace),skipBrowserRedirect:true}});if(error||!data.url)throw error??new Error('Unavailable');window.location.assign(data.url);}
    catch(error){setError(dictionary.login.feedback[authFeedbackKey(error)]);flight.current=false;setPending(null);}
  }
  async function send() {
    if(flight.current||busy||remaining>0)return;
    const address=emailCodeAddress(sentTo||email);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)||address.length>254){setError(copy.invalidEmail);return;}
    flight.current=true;setPending('send');setError('');
    try{const {error}=await supabaseBrowser.auth.signInWithOtp({email:address,options:{shouldCreateUser:true,emailRedirectTo:location.origin+accessCallback(intent,nextPath,defaultWorkspace),data:{language}}});if(error)throw error;setSentTo(address);setCode('');setRemaining(60);setResendAt(Date.now()+60000);requestAnimationFrame(()=>codeRef.current?.focus());}
    catch(error){setError(dictionary.login.feedback[authFeedbackKey(error)]);}
    finally{flight.current=false;setPending(null);}
  }
  async function verify() {
    if(flight.current||busy)return;if(!validEmailCode(code)){setError(copy.invalidCode);return;}
    flight.current=true;setPending('verify');setError('');
    try{const {error}=await supabaseBrowser.auth.verifyOtp({email:sentTo,token:code.replace(/\s/g,''),type:'email'});if(error)throw error;window.location.replace(accessContinuation(intent,nextPath,defaultWorkspace));}
    catch(error){setError(authFeedbackKey(error)==='rateLimited'?dictionary.login.feedback.rateLimited:copy.codeError);flight.current=false;setPending(null);}
  }
  function enter(event:KeyboardEvent<HTMLInputElement>){if(event.key==='Enter'){event.preventDefault();event.stopPropagation();if(sentTo)void verify();else void send();}}
  return <div className="wm-auth-access" data-auth-alternative>
    <div className="wm-auth-access__providers" aria-busy={providers===null}>
      <button type="button" className="wm-auth-btn wm-auth-btn--ghost" disabled={busy||!providers?.google} onClick={()=>oauth('google')}><svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/><path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.964L3.964 7.3C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/></svg>{pending==='google'?copy.working:copy.google}</button>
      <button type="button" className="wm-auth-btn wm-auth-btn--ghost" disabled={busy||!providers?.apple} onClick={()=>oauth('apple')}><svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path fill="currentColor" d="M17.1 12.7c0-2 1.6-3 1.7-3.1-1-1.5-2.6-1.7-3.2-1.7-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.7.8-3.5 2-1.5 2.5-.4 6.2 1 8.2.7 1 1.5 2.1 2.6 2.1s1.5-.7 2.9-.7 1.8.7 2.9.7 1.8-1 2.5-2.1c.8-1.2 1.1-2.4 1.2-2.5-.1 0-2.2-.8-2.2-2.9ZM14.9 6.5c.6-.8 1.1-1.8 1-2.9-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.8 1 .1 2-.5 2.7-1.3Z"/></svg>{pending==='apple'?copy.working:copy.apple}</button>
    </div>
    {providers&&!providers.google&&!providers.apple&&<p className="wm-auth-access__note">{copy.unavailable}</p>}
    {!open?<button type="button" className="wm-auth-btn wm-auth-btn--ghost" disabled={busy} onClick={()=>setOpen(true)}>{copy.email}</button>:<div className="wm-auth-access__code" role="group" aria-label={copy.email}>
      {!sentTo?<><label htmlFor={id+'-email'}>{copy.emailLabel}</label><input id={id+'-email'} type="text" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} onKeyDown={enter} disabled={busy}/><button type="button" className="wm-auth-btn" onClick={send} disabled={busy}>{pending==='send'?copy.sending:copy.send}</button></>:<><p role="status">{copy.sent} <strong>{sentTo}</strong>.</p><label htmlFor={id+'-code'}>{copy.codeLabel}</label><input ref={codeRef} id={id+'-code'} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={12} value={code} onChange={event=>setCode(event.target.value)} onKeyDown={enter} disabled={busy}/><button type="button" className="wm-auth-btn" onClick={verify} disabled={busy}>{pending==='verify'?copy.verifying:copy.verify}</button><div className="wm-auth-access__code-actions"><button type="button" disabled={busy||remaining>0} onClick={send}>{remaining>0?`${copy.wait} ${remaining}s`:copy.resend}</button><button type="button" disabled={busy} onClick={()=>{setSentTo('');setCode('');setRemaining(0);setResendAt(0);setError('');}}>{copy.change}</button></div></>}
    </div>}
    {error&&<p className="wm-auth-error" role="alert">{error}</p>}
    <p className="wm-auth-access__note">{copy.persistent}</p>
    <div className="wm-auth-divider">{copy.divider}</div>
  </div>;
}
