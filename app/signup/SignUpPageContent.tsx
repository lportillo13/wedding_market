"use client";

import SignUpForm from './SignUpForm';
import EditorialAuthLayout from '@/components/auth/EditorialAuthLayout';
import type {CoupleOnboardingData} from '@/features/auth/domain/couple-onboarding';

export default function SignUpPageContent({
  closeHref,
  verifiedAccount,nextPath,
}: {
  closeHref?: string;
  openModalOnLoad?: boolean;
  verifiedAccount?:Omit<CoupleOnboardingData,'password'>;
  nextPath?:string;
}) {
  return (
    <EditorialAuthLayout onboarding>
      <SignUpForm closeHref={closeHref} verifiedAccount={verifiedAccount} nextPath={nextPath}/>
    </EditorialAuthLayout>
  );
}
