'use client';
import {useState} from 'react';
import {deletionCopy,type DeletionReceipt} from '@/shared/accounts/deletion';

export default function DeletionForm({language,initial}:{language:'en'|'es';initial:DeletionReceipt|null}) {
  const labels=deletionCopy[language];
  const [receipt,setReceipt]=useState(initial);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();if (busy) return;setBusy(true);setError('');
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15_000);
    try {
      const response=await fetch('/api/account-deletion',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({confirm:'DELETE',language}),signal:controller.signal});
      if (!response.ok) throw new Error(labels.failed);
      setReceipt(await response.json() as DeletionReceipt);
    } catch {setError(labels.failed);} finally {clearTimeout(timer);setBusy(false);}
  }
  if (receipt) return <div className="alert alert-success" role="status"><p>{labels.pending}</p><p>{labels.deadline}: {new Date(receipt.dueAt).toLocaleDateString(language==='es'?'es-CR':'en-US',{timeZone:'UTC'})}</p><p className="small mb-0">{labels.reference}: {receipt.id}</p></div>;
  return <form onSubmit={submit} className="border rounded-3 p-4 my-4"><label className="d-flex gap-2 align-items-start"><input required type="checkbox" className="mt-1" disabled={busy} />{labels.confirm}</label><button type="submit" disabled={busy} className="btn btn-outline-danger mt-3">{busy?labels.loading:labels.button}</button>{error?<p className="text-danger mt-3 mb-0" role="alert">{error}</p>:null}</form>;
}
