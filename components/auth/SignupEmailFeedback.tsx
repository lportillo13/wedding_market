'use client';

import Link from 'next/link';
import {useLanguage} from '@/contexts/LanguageContext';

export default function SignupEmailFeedback({id, vendor = false}: {id: string; vendor?: boolean}) {
  const {dictionary} = useLanguage();
  const next = vendor ? '/signup/vendor' : '/account/profile';
  return <div id={id} className="wm-auth-error" role="alert">
    <p>{dictionary.login.feedback.emailTaken}</p>
    <div className="wm-auth-journey__links">
      <Link href={'/login?' + new URLSearchParams({next})}>{dictionary.login.editorial.submit}</Link>
      {' · '}
      <Link href={'/forgot-password?' + new URLSearchParams({next})}>{dictionary.login.forgotPassword}</Link>
    </div>
  </div>;
}
