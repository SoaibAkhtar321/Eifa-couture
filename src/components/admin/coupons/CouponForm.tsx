'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { TextField, NumberField, SelectField, ToggleField, DateTimeField } from '@/components/admin/FormField';
import { couponFormSchema, type CouponFormValues } from '@/lib/admin/validation';
import { createCoupon, updateCoupon, type CouponInput } from '@/lib/admin/coupons-write';
import type { DbCoupon } from '@/types/database';

interface CouponFormProps {
  coupon?: DbCoupon;
}

const emptyValues: CouponFormValues = {
  code: '',
  type: 'percentage',
  value: 0,
  min_order: null,
  max_discount: null,
  usage_limit: null,
  per_user_limit: 1,
  is_active: true,
  starts_at: '',
  expires_at: '',
};

/** ISO (as stored) → `datetime-local` input value, in the browser's local time zone. */
function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

/** `datetime-local` input value → ISO, or null for an empty field. */
function datetimeLocalToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default function CouponForm({ coupon }: CouponFormProps) {
  const router = useRouter();
  const isEditing = Boolean(coupon);

  const [values, setValues] = useState<CouponFormValues>(
    coupon
      ? {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          min_order: coupon.min_order,
          max_discount: coupon.max_discount,
          usage_limit: coupon.usage_limit,
          per_user_limit: coupon.per_user_limit,
          is_active: coupon.is_active,
          starts_at: isoToDatetimeLocal(coupon.starts_at),
          expires_at: isoToDatetimeLocal(coupon.expires_at),
        }
      : emptyValues
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function setField<K extends keyof CouponFormValues>(key: K, value: CouponFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const result = couponFormSchema.safeParse({ ...values, code: values.code.trim().toUpperCase() });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        errors[String(issue.path[0])] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSaving(true);

    const input: CouponInput = {
      code: result.data.code,
      type: result.data.type,
      value: result.data.value,
      min_order: result.data.min_order,
      max_discount: result.data.max_discount,
      usage_limit: result.data.usage_limit,
      per_user_limit: result.data.per_user_limit,
      is_active: result.data.is_active,
      starts_at: datetimeLocalToIso(result.data.starts_at),
      expires_at: datetimeLocalToIso(result.data.expires_at),
    };

    if (isEditing && coupon) {
      const { data, error } = await updateCoupon(coupon.id, input);
      setIsSaving(false);
      if (error || !data) {
        setFormError(error ?? 'Failed to save coupon.');
        return;
      }
      router.push('/admin/coupons');
      router.refresh();
    } else {
      const { data, error } = await createCoupon(input);
      setIsSaving(false);
      if (error || !data) {
        setFormError(error ?? 'Failed to create coupon.');
        return;
      }
      router.push('/admin/coupons');
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <TextField
              label="Code"
              value={values.code}
              onChange={(e) => setField('code', e.target.value.toUpperCase())}
              error={fieldErrors.code}
              hint="Customers enter this at checkout, e.g. EIFA10"
              required
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label="Discount type"
                value={values.type}
                onChange={(e) => setField('type', e.target.value as CouponFormValues['type'])}
                error={fieldErrors.type}
                options={[
                  { value: 'percentage', label: 'Percentage' },
                  { value: 'fixed', label: 'Fixed amount' },
                ]}
                required
              />
              <NumberField
                label={values.type === 'percentage' ? 'Value (%)' : 'Value (₹)'}
                value={values.value}
                onChange={(e) => setField('value', Number(e.target.value))}
                error={fieldErrors.value}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberField
                label="Minimum order value"
                value={values.min_order ?? ''}
                onChange={(e) => setField('min_order', e.target.value === '' ? null : Number(e.target.value))}
                error={fieldErrors.min_order}
                hint="Optional"
              />
              <NumberField
                label="Max discount cap"
                value={values.max_discount ?? ''}
                onChange={(e) => setField('max_discount', e.target.value === '' ? null : Number(e.target.value))}
                error={fieldErrors.max_discount}
                hint="Optional — mainly for percentage coupons"
              />
            </div>
          </div>

          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DateTimeField
                label="Starts"
                value={values.starts_at}
                onChange={(e) => setField('starts_at', e.target.value)}
                error={fieldErrors.starts_at}
                hint="Leave blank to start immediately"
              />
              <DateTimeField
                label="Expires"
                value={values.expires_at}
                onChange={(e) => setField('expires_at', e.target.value)}
                error={fieldErrors.expires_at}
                hint="Leave blank for no expiry"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <NumberField
              label="Total usage limit"
              value={values.usage_limit ?? ''}
              onChange={(e) => setField('usage_limit', e.target.value === '' ? null : Number(e.target.value))}
              error={fieldErrors.usage_limit}
              hint="Optional — leave blank for unlimited"
            />
            <NumberField
              label="Per-user limit"
              value={values.per_user_limit}
              onChange={(e) => setField('per_user_limit', Number(e.target.value))}
              error={fieldErrors.per_user_limit}
            />
          </div>

          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6">
            <ToggleField
              label="Active"
              checked={values.is_active}
              onChange={(v) => setField('is_active', v)}
              hint="Redeemable at checkout"
            />
          </div>

          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-lg bg-maroon px-5 py-3 text-sm font-medium text-ivory transition hover:bg-maroon/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Create coupon'}
          </button>
        </div>
      </div>
    </form>
  );
}
