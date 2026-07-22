import Link from 'next/link';

import { createClient } from '@/lib/supabase/server';
import CouponTable from '@/components/admin/coupons/CouponTable';
import type { DbCoupon } from '@/types/database';

export const metadata = { title: 'Coupons' };

async function getCoupons(): Promise<{ data: DbCoupon[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  return { data: (data ?? []) as DbCoupon[], error: error?.message ?? null };
}

export default async function AdminCouponsPage() {
  const { data: coupons, error } = await getCoupons();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl text-maroon">Coupons</h1>
          <p className="text-charcoal/60 mt-1">
            {coupons.length} coupon{coupons.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="rounded-lg bg-maroon px-5 py-2.5 text-sm font-medium text-ivory transition hover:bg-maroon/90"
        >
          Add coupon
        </Link>
      </div>

      <CouponTable rows={coupons} error={error} />
    </div>
  );
}
