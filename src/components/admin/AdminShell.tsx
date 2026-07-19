'use client';

import { useState } from 'react';

import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import type { AdminSession } from '@/lib/admin/auth';

export default function AdminShell({
  admin,
  children,
}: {
  admin: AdminSession;
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-beige">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <AdminHeader admin={admin} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}





