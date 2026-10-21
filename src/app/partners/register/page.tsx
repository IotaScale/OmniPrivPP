import React from 'react';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { PartnerSignupWizard } from '@/app/sign-up/partner-signup-wizard';

export const dynamic = 'force-dynamic';

export default async function PartnersRegisterPage() {
  const session = await getSession();

  if (session) {
    if (session.role === 'channel_admin') {
      redirect('/channel-admin');
    } else {
      redirect('/partner-portal');
    }
  }

  return <PartnerSignupWizard />;
}
