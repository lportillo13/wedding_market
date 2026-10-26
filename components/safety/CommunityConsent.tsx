'use client';
import Link from 'next/link';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {supabaseBrowser} from '@/lib/supabase/client';
import {safetyCopy} from '@/shared/safety/copy';
import {withDeadline} from '@/shared/resources/deadline';

export default function CommunityConsent({language}:{language:'en'|'es'}) {
  const labels=safetyCopy[language];const router=useRouter();const [accepted,setAccepted]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  async function accept(event:React.FormEvent) {
    event.preventDefault();setBusy(true);setError('');
    try {const {error}=await withDeadline(signal=>supabaseBrowser.rpc('accept_community_terms').abortSignal(signal));if(error)throw error;setAccepted(true);router.refresh();}
    catch {setError(labels.failed);} finally {setBusy(false);}
  }
  if(accepted)return null;
  return <aside className="container my-3"><form onSubmit={accept} className="border rounded-3 p-3"><p className="small mb-2">{labels.consent}</p><p className="d-flex gap-3 small"><Link href={`/terms?lang=${language}`}>{language==='es'?'Términos':'Terms'}</Link><Link href={`/privacy?lang=${language}`}>{language==='es'?'Privacidad':'Privacy'}</Link><Link href={`/community-guidelines?lang=${language}`}>{language==='es'?'Normas de la Comunidad':'Community Guidelines'}</Link></p><label className="d-flex gap-2"><input type="checkbox" required disabled={busy}/>{labels.accept}</label><button disabled={busy} className="btn btn-outline-dark btn-sm mt-2">{language==='es'?'Continuar':'Continue'}</button>{error?<p role="alert">{error}</p>:null}</form></aside>;
}
