"use client";

import VendorSignUpForm from './VendorSignUpForm';
import VendorAccountForm from './VendorAccountForm';
import EditorialAuthLayout from '@/components/auth/EditorialAuthLayout';

type CategoryOption = {
  key: string;
  label: Record<string, unknown> | null;
};

export default function VendorSignupPageContent({
  categories,
  requiresAccount,
  initialOwnerName='',
}: {
  categories: CategoryOption[];
  requiresAccount: boolean;
  initialOwnerName?:string;
}) {
  return (
    <EditorialAuthLayout onboarding vendor>
      {requiresAccount ? <VendorAccountForm /> : <VendorSignUpForm categories={categories} requiresAccount={false} initialOwnerName={initialOwnerName}/>}
    </EditorialAuthLayout>
  );
}
