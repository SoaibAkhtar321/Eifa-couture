import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { createClient } from '@/lib/supabase/server';

// Private / transactional page: keep it out of search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Guest checkout creates an anonymous Supabase session. That session may place
// and track its own orders but must never open the account area, so anonymous
// visitors (and signed-out ones) are sent to sign in. Data is still protected
// by RLS; this only closes the page itself.
export default async function PrivateSectionLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) {
    redirect('/login?next=/account');
  }

  return children;
}
