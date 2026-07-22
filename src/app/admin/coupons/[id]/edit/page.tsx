import { notFound } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import CouponForm from '@/components/admin/coupons/CouponForm';
import type { DbCoupon } from '@/types/database';

export const metadata = { title: 'Edit Coupon' };

interface EditCouponPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCouponPage({ params }: EditCouponPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: coupon, error } = await supabase.from('coupons').select('*').eq('id', id).single();

  if (error || !coupon) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">{(coupon as DbCoupon).code}</h1>
        <p className="text-charcoal/60 mt-1">Edit coupon details.</p>
      </div>

      <CouponForm coupon={coupon as DbCoupon} />
    </div>
  );
}
