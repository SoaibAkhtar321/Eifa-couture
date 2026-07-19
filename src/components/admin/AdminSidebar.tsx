'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Z_INDEX } from '@/lib/z-index';

interface NavItem {
  label: string;
  href: string;
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Products', href: '/admin/products', comingSoon: true },
  { label: 'Categories', href: '/admin/categories', comingSoon: true },
  { label: 'Collections', href: '/admin/collections', comingSoon: true },
  { label: 'Homepage CMS', href: '/admin/homepage', comingSoon: true },
  { label: 'Banners', href: '/admin/banners', comingSoon: true },
  { label: 'Inventory', href: '/admin/inventory', comingSoon: true },
  { label: 'Orders', href: '/admin/orders', comingSoon: true },
  { label: 'Customers', href: '/admin/customers', comingSoon: true },
  { label: 'Coupons', href: '/admin/coupons', comingSoon: true },
  { label: 'Notifications', href: '/admin/notifications', comingSoon: true },
  { label: 'Media Library', href: '/admin/media', comingSoon: true },
  { label: 'Analytics', href: '/admin/analytics', comingSoon: true },
  { label: 'Settings', href: '/admin/settings', comingSoon: true },
];

export default function AdminSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-charcoal/40 lg:hidden"
          style={{ zIndex: Z_INDEX.backdrop }}
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 w-64 shrink-0 bg-maroon-dark text-cream flex flex-col transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ zIndex: Z_INDEX.drawer }}
      >
        <div className="h-20 flex items-center px-6 border-b border-cream/10">
          <Link href="/admin" className="font-heading text-xl tracking-wide text-cream">
            Eifa Couture
            <span className="block text-xs font-body tracking-[0.2em] text-gold uppercase mt-0.5">
              Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            if (item.comingSoon) {
              return (
                <div
                  key={item.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-md text-sm text-cream/40 cursor-not-allowed"
                  title="Coming soon"
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] uppercase tracking-wide border border-cream/20 rounded px-1.5 py-0.5">
                    Soon
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'block px-3 py-2.5 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-gold text-maroon-dark font-medium'
                    : 'text-cream/80 hover:bg-cream/10 hover:text-cream'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-cream/10">
          <Link href="/" className="text-xs text-cream/60 hover:text-gold transition-colors">
            ← Back to storefront
          </Link>
        </div>
      </aside>
    </>
  );
}