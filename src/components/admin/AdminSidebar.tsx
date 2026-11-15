'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import { Z_INDEX } from '@/lib/z-index';

interface NavItem {
  label: string;
  href: string;
  comingSoon?: boolean;
}

// The four things the shop owner uses every day.
const PRIMARY_ITEMS: NavItem[] = [
  { label: 'Products', href: '/admin/products' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Returns', href: '/admin/returns' },
  { label: 'Homepage', href: '/admin/homepage' },
  { label: 'Settings', href: '/admin/settings' },
];

// Everything else, tucked under "More".
const MORE_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Categories', href: '/admin/categories' },
  { label: 'Collections', href: '/admin/collections' },
  { label: 'Banners', href: '/admin/banners' },
  { label: 'Inventory', href: '/admin/inventory' },
  { label: 'Customers', href: '/admin/customers' },
  { label: 'Coupons', href: '/admin/coupons' },
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'Finance', href: '/admin/finance' },
  { label: 'Audit Log', href: '/admin/audit-log' },
  { label: 'Notifications', href: '/admin/notifications' },
  { label: 'Media Library', href: '/admin/media', comingSoon: true },
];

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar({
  isOpen,
  onClose,
  pendingReturns = 0,
}: {
  isOpen: boolean;
  onClose: () => void;
  pendingReturns?: number;
}) {
  const pathname = usePathname();
  const moreHasActive = MORE_ITEMS.some((item) => !item.comingSoon && isItemActive(pathname, item.href));
  const [moreOpen, setMoreOpen] = useState(false);
  // Stay open on any page that lives under "More" so the current page is visible.
  const showMore = moreOpen || moreHasActive;

  function renderItem(item: NavItem) {
    if (item.comingSoon) {
      return (
        <div
          key={item.href}
          className="flex min-h-[44px] cursor-not-allowed items-center justify-between rounded-md px-3 text-sm text-cream/70"
          title="Coming soon"
        >
          <span>{item.label}</span>
          <span className="rounded border border-cream/30 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">Soon</span>
        </div>
      );
    }

    const isActive = isItemActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex min-h-[44px] items-center rounded-md px-3 text-sm transition-colors',
          isActive ? 'bg-gold text-maroon-dark font-medium' : 'text-cream/90 hover:bg-cream/10 hover:text-cream'
        )}
      >
        <span>{item.label}</span>
        {item.href === '/admin/returns' && pendingReturns > 0 && (
          <span
            className={cn(
              'ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none',
              isActive ? 'bg-maroon-dark text-gold' : 'bg-gold text-maroon-dark'
            )}
            aria-label={`${pendingReturns} return${pendingReturns === 1 ? '' : 's'} awaiting review`}
          >
            {pendingReturns > 99 ? '99+' : pendingReturns}
          </span>
        )}
      </Link>
    );
  }

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
          <Link href="/admin" onClick={onClose} className="font-heading text-xl tracking-wide text-cream">
            Eifa Couture
            <span className="block text-xs font-body tracking-[0.2em] text-gold uppercase mt-0.5">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1" aria-label="Admin">
          {PRIMARY_ITEMS.map(renderItem)}

          <div className="pt-3">
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              aria-expanded={showMore}
              aria-controls="admin-more-nav"
              className="flex min-h-[44px] w-full items-center justify-between rounded-md px-3 text-sm text-cream/90 transition-colors hover:bg-cream/10 hover:text-cream"
            >
              <span>More</span>
              <span aria-hidden="true" className={cn('transition-transform', showMore && 'rotate-180')}>
                ▾
              </span>
            </button>
            {showMore && (
              <div id="admin-more-nav" className="mt-1 space-y-1 border-l border-cream/15 pl-2">
                {MORE_ITEMS.map(renderItem)}
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-cream/10">
          <Link href="/" className="inline-flex min-h-[44px] items-center text-xs text-cream/80 hover:text-gold transition-colors">
            ← Back to storefront
          </Link>
        </div>
      </aside>
    </>
  );
}
