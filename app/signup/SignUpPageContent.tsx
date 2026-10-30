"use client";

import SignUpForm from './SignUpForm';
import EditorialAuthLayout from '@/components/auth/EditorialAuthLayout';

export default function SignUpPageContent({
  closeHref,
}: {
  closeHref?: string;
  openModalOnLoad?: boolean;
}) {
  return (
    <EditorialAuthLayout onboarding>
      <SignUpForm closeHref={closeHref} />
    </EditorialAuthLayout>
  );
}
