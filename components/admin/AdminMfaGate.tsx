'use client';

import Image from 'next/image';
import { useEffect,useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminMfaGate() {
  const { language }=useLanguage();
  const es=language==='es';
  const router=useRouter();
  const [factor,setFactor]=useState('');
  const [qr,setQr]=useState('');
  const [secret,setSecret]=useState('');
  const [code,setCode]=useState('');
  const [busy,setBusy]=useState(true);
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true;
    void supabaseBrowser.auth.mfa.listFactors().then(({data,error})=>{
      if (!active) return;
      if (error) setError(error.message);
      setFactor(data?.totp.find(f=>f.status==='verified')?.id ?? '');
      setBusy(false);
    });
    return ()=>{active=false;};
  },[]);
  async function enroll() {
    setBusy(true);setError('');
    const {data,error}=await supabaseBrowser.auth.mfa.enroll({factorType:'totp',friendlyName:`Wedding Market admin ${Date.now()}`});
    if (error) setError(error.message);
    else {setFactor(data.id);setQr(data.totp.qr_code);setSecret(data.totp.secret);}
    setBusy(false);
  }
  async function verify(event:React.FormEvent) {
    event.preventDefault();setBusy(true);setError('');
    const {error}=await supabaseBrowser.auth.mfa.challengeAndVerify({factorId:factor,code});
    if (error) {setError(error.message);setBusy(false);}
    else router.refresh();
  }
  return <section className="container py-5" style={{maxWidth:600}}>
    <h1>{es?'Verificación de administrador':'Admin verification'}</h1>
    <p>{es?'Usa una aplicación de autenticación para proteger el acceso al panel.':'Use an authenticator app to protect access to the control panel.'}</p>
    {error && <p role="alert" className="text-danger">{error}</p>}
    {!factor && <button className="btn btn-primary" disabled={busy} onClick={()=>void enroll()}>{es?'Configurar autenticador':'Set up authenticator'}</button>}
    {qr && <><Image src={qr.startsWith('data:')?qr:`data:image/svg+xml;utf8,${encodeURIComponent(qr)}`} unoptimized width={220} height={220} alt={es?'Código QR del autenticador':'Authenticator QR code'}/>
      <details><summary>{es?'Clave de configuración':'Setup key'}</summary><code>{secret}</code></details>
      <p>{es?'Guarda la clave en tu administrador de contraseñas antes de continuar.':'Save the setup key in your password manager before continuing.'}</p></>}
    {factor && <form onSubmit={event=>void verify(event)}>
      <label htmlFor="admin-mfa-code">{es?'Código de 6 dígitos':'6-digit code'}</label>
      <input className="form-control mb-3" id="admin-mfa-code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event=>setCode(event.target.value.replace(/\D/g,''))}/>
      <button className="btn btn-primary" disabled={busy || code.length!==6}>{es?'Verificar':'Verify'}</button>
    </form>}
  </section>;
}
