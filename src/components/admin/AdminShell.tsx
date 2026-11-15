'use client';

import { useState } from 'react';

import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { ToastProvider } from './ui/Toaster';
import type { AdminSession } from '@/lib/admin/auth';

export default function AdminShell({
  admin,
  pendingReturns = 0,
  children,
}: {
  admin: AdminSession;
  pendingReturns?: number;
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ToastProvider>
    <div className="min-h-screen bg-beige">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        pendingReturns={pendingReturns}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <AdminHeader admin={admin} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
    </ToastProvider>
  );
}
