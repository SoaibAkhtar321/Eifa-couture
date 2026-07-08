'use client';

/* ============================================
   EIFA COUTURE — Address Form
   ============================================
   Shared form for both "Add Address" and "Edit Address". Inline,
   not a modal — same pattern as EditProfileForm. Parent
   (AddressList) owns which address is being added/edited and
   passes initialValues + onSubmit/onCancel accordingly.
   ============================================ */

import { useState } from 'react';

import {
  ADDRESS_TYPE_OPTIONS,
  isValidIndianPhone,
  isValidIndianPincode,
  type AddressInput,
} from '@/lib/addresses';
import type { AddressType } from '@/types/database';

interface AddressFormProps {
  initialValues?: Partial<AddressInput>;
  /** True when this is the user's only address — default is forced on and the checkbox is locked. */
  forceDefault?: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (input: AddressInput) => void;
  onCancel: () => void;
}

const emptyValues: AddressInput = {
  full_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  pincode: '',
  type: 'home',
  is_default: false,
};

export default function AddressForm({
  initialValues,
  forceDefault = false,
  isSubmitting,
  submitLabel,
  onSubmit,
  onCancel,
}: AddressFormProps) {
  const [values, setValues] = useState<AddressInput>({ ...emptyValues, ...initialValues });
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof AddressInput>(key: K, value: AddressInput[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!values.full_name.trim()) return setError('Please enter a full name.');
    if (!isValidIndianPhone(values.phone)) return setError('Please enter a valid 10-digit phone number.');
    if (!values.address_line1.trim()) return setError('Please enter the address.');
    if (!values.city.trim()) return setError('Please enter a city.');
    if (!values.state.trim()) return setError('Please enter a state.');
    if (!isValidIndianPincode(values.pincode)) return setError('Please enter a valid 6-digit pincode.');

    onSubmit({
      ...values,
      full_name: values.full_name.trim(),
      phone: values.phone.trim(),
      address_line1: values.address_line1.trim(),
      address_line2: values.address_line2?.trim() || null,
      city: values.city.trim(),
      state: values.state.trim(),
      pincode: values.pincode.trim(),
      is_default: forceDefault ? true : values.is_default,
    });
  };

  return (
    <form className="border border-beige bg-white p-6 sm:p-8" onSubmit={handleSubmit} noValidate>
      {error && (
        <p className="mb-6 font-body text-xs text-red-700 bg-red-50 border border-red-200 px-4 py-3">
          {error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/75 mb-2">
            Full Name
          </label>
          <input
            id="full_name"
            type="text"
            className="w-full border border-charcoal/15 bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold"
            value={values.full_name}
            onChange={(e) => update('full_name', e.target.value)}
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/75 mb-2">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="10-digit mobile number"
            className="w-full border border-charcoal/15 bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold placeholder:text-charcoal/45"
            value={values.phone}
            onChange={(e) => update('phone', e.target.value)}
            inputMode="numeric"
            autoComplete="tel"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="address_line1" className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/75 mb-2">
            Address Line 1
          </label>
          <input
            id="address_line1"
            type="text"
            placeholder="House no., street, area"
            className="w-full border border-charcoal/15 bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold placeholder:text-charcoal/45"
            value={values.address_line1}
            onChange={(e) => update('address_line1', e.target.value)}
            autoComplete="address-line1"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="address_line2" className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/75 mb-2">
            Address Line 2 <span className="normal-case text-charcoal/40">(optional)</span>
          </label>
          <input
            id="address_line2"
            type="text"
            placeholder="Landmark, apartment, etc."
            className="w-full border border-charcoal/15 bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold placeholder:text-charcoal/45"
            value={values.address_line2 ?? ''}
            onChange={(e) => update('address_line2', e.target.value)}
            autoComplete="address-line2"
          />
        </div>

        <div>
          <label htmlFor="city" className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/75 mb-2">
            City
          </label>
          <input
            id="city"
            type="text"
            className="w-full border border-charcoal/15 bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold"
            value={values.city}
            onChange={(e) => update('city', e.target.value)}
            autoComplete="address-level2"
          />
        </div>

        <div>
          <label htmlFor="state" className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/75 mb-2">
            State
          </label>
          <input
            id="state"
            type="text"
            className="w-full border border-charcoal/15 bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold"
            value={values.state}
            onChange={(e) => update('state', e.target.value)}
            autoComplete="address-level1"
          />
        </div>

        <div>
          <label htmlFor="pincode" className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/75 mb-2">
            Pincode
          </label>
          <input
            id="pincode"
            type="text"
            placeholder="6-digit pincode"
            className="w-full border border-charcoal/15 bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold placeholder:text-charcoal/45"
            value={values.pincode}
            onChange={(e) => update('pincode', e.target.value)}
            inputMode="numeric"
            autoComplete="postal-code"
          />
        </div>

        <div>
          <label htmlFor="type" className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/75 mb-2">
            Address Type
          </label>
          <select
            id="type"
            className="w-full border border-charcoal/15 bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold"
            value={values.type}
            onChange={(e) => update('type', e.target.value as AddressType)}
          >
            {ADDRESS_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 flex items-center gap-3">
          <input
            id="is_default"
            type="checkbox"
            className="h-4 w-4 border-charcoal/25 accent-maroon disabled:opacity-50"
            checked={forceDefault ? true : values.is_default}
            disabled={forceDefault}
            onChange={(e) => update('is_default', e.target.checked)}
          />
          <label htmlFor="is_default" className="font-body text-sm text-charcoal/75">
            {forceDefault ? 'This will be your default address' : 'Set as default address'}
          </label>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-4">
        <button type="submit" disabled={isSubmitting} className="btn-luxury btn-luxury-primary disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="btn-luxury btn-luxury-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}