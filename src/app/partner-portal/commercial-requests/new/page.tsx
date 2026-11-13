import React from 'react';
import { requirePartnerSession } from '@/lib/auth/session';
import { NewCommercialRequestForm } from './new-request-form';

export const dynamic = 'force-dynamic';

export default async function NewCommercialRequestPage() {
  // Server-side guard: the form must not render for non-active organizations.
  await requirePartnerSession();
  return <NewCommercialRequestForm />;
}
