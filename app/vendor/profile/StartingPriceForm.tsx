"use client";
import {useState} from 'react';
import {useLanguage} from '@/contexts/LanguageContext';
import {useProfileAction} from './useProfileAction';
import ProfileSaveBar from './ProfileSaveBar';
import {saveStartingPrice} from './actions';

export default function StartingPriceForm({price, currency}:{price:string;currency:string}) {
  const {language,dictionary} = useLanguage();
  const labels = dictionary.vendorDashboard.profileContact;
  const [value,setValue] = useState(price);
  const [code,setCode] = useState(currency);
  const [state,action,pending] = useProfileAction(saveStartingPrice,{ok:false,message:''});
  return <form action={action} data-profile-save>
    <div className="row g-3"><div className="col-md-8"><label className="form-label" htmlFor="studio-starting-price">{labels.startingPriceLabel}</label><input id="studio-starting-price" name="starting_price" className="form-control" inputMode="decimal" value={value} onChange={event=>setValue(event.target.value)}/><p className="form-text">{labels.startingPriceHelp}</p></div><div className="col-md-4"><label className="form-label" htmlFor="studio-starting-currency">{labels.startingCurrencyLabel}</label><input id="studio-starting-currency" name="starting_price_currency" className="form-control" maxLength={3} value={code} onChange={event=>setCode(event.target.value)}/></div></div>
    <p className="form-text mt-3">{language === 'es' ? 'Este precio es independiente de tus paquetes. Puedes dejarlo vacío.' : 'This price is separate from your packages. You can leave it blank.'}</p>
    <ProfileSaveBar state={state} pending={pending}/>
  </form>;
}
