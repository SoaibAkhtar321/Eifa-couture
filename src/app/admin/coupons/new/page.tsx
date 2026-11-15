import { requireAdmin } from '@/lib/admin/auth';
import CouponForm from '@/components/admin/coupons/CouponForm';

export const metadata = { title: 'New Coupon' };

export default async function NewCouponPage() {
  await requireAdmin();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">Add coupon</h1>
        <p className="text-ink-muted mt-1">Coupons apply a discount to a customer&apos;s order at checkout.</p>
      </div>

      <CouponForm />
    </div>
  );
}
