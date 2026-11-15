import type { Metadata } from 'next';

import { requireAdmin } from '@/lib/admin/auth';
import { getRequestedReturnCount } from '@/lib/admin/returns-inbox';
import AdminShell from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: {
    default: 'Admin Dashboard',
    template: '%s | Eifa Couture Admin',
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  const pendingReturns = await getRequestedReturnCount();

  return (
    <AdminShell admin={admin} pendingReturns={pendingReturns}>
      {children}
    </AdminShell>
  );
}