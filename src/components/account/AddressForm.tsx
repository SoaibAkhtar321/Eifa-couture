'use client';

import { useState } from 'react';
import type { AddressInput } from '@/lib/addresses';

interface AddressFormProps {
  initialData?: Partial<AddressInput>;
  forceDefault?: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (data: AddressInput) => void;
  onCancel?: () => void;
}


export default function AddressForm({
  initialData,
  forceDefault = false,
  isSubmitting = false,
  submitLabel = 'Save Address',
  onSubmit,
  onCancel,
}: AddressFormProps) {
  const [formData, setFormData] = useState<AddressInput>({
  full_name: initialData?.full_name || '',
  phone: initialData?.phone || '',
  address_line1: initialData?.address_line1 || '',
  address_line2: initialData?.address_line2 || '',
  city: initialData?.city || '',
  state: initialData?.state || '',
  pincode: initialData?.pincode || '',
  is_default: forceDefault || (initialData?.is_default ?? false),
  type: initialData?.type || 'home', // Make sure this is here!
});
  const [errors, setErrors] = useState<Partial<Record<keyof AddressInput, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name as keyof AddressInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleManualSubmit = () => {
    const newErrors: Partial<Record<keyof AddressInput, string>> = {};

    if (!formData.full_name?.trim()) newErrors.full_name = 'Name is required';
    if (!formData.phone?.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address_line1?.trim()) newErrors.address_line1 = 'Address line 1 is required';
    if (!formData.city?.trim()) newErrors.city = 'City is required';
    if (!formData.state?.trim()) newErrors.state = 'State is required';
    if (!formData.pincode?.trim()) newErrors.pincode = 'PIN code is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="space-y-6 border border-beige bg-white p-6 sm:p-8">
      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
          Full Name
        </span>
        <input
          type="text"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          className={`w-full border bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold ${
            errors.full_name ? 'border-red-400' : 'border-beige'
          }`}
          placeholder="e.g. John Doe"
        />
        {errors.full_name && (
          <span className="mt-1 block text-xs text-red-600">{errors.full_name}</span>
        )}
      </label>

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
          Phone Number
        </span>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={`w-full border bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold ${
            errors.phone ? 'border-red-400' : 'border-beige'
          }`}
          placeholder="+91 98765 43210"
        />
        {errors.phone && (
          <span className="mt-1 block text-xs text-red-600">{errors.phone}</span>
        )}
      </label>

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
          Address Line 1
        </span>
        <input
          type="text"
          name="address_line1"
          value={formData.address_line1}
          onChange={handleChange}
          className={`w-full border bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold ${
            errors.address_line1 ? 'border-red-400' : 'border-beige'
          }`}
          placeholder="House/Flat No., Building Name"
        />
        {errors.address_line1 && (
          <span className="mt-1 block text-xs text-red-600">{errors.address_line1}</span>
        )}
      </label>

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
          Address Line 2 (Optional)
        </span>
        <input
          type="text"
          name="address_line2"
          value={formData.address_line2 || ''}
          onChange={handleChange}
          className="w-full border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
          placeholder="Street Name, Area, Landmark"
        />
      </label>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
            City
          </span>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className={`w-full border bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold ${
              errors.city ? 'border-red-400' : 'border-beige'
            }`}
            placeholder="e.g. Mumbai"
          />
          {errors.city && (
            <span className="mt-1 block text-xs text-red-600">{errors.city}</span>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
            State
          </span>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className={`w-full border bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold ${
              errors.state ? 'border-red-400' : 'border-beige'
            }`}
            placeholder="e.g. Maharashtra"
          />
          {errors.state && (
            <span className="mt-1 block text-xs text-red-600">{errors.state}</span>
          )}
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
          PIN Code
        </span>
        <input
          type="text"
          name="pincode"
          value={formData.pincode}
          onChange={handleChange}
          className={`w-full border bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold ${
            errors.pincode ? 'border-red-400' : 'border-beige'
          }`}
          placeholder="e.g. 400001"
        />
        {errors.pincode && (
          <span className="mt-1 block text-xs text-red-600">{errors.pincode}</span>
        )}
      </label>

      {!forceDefault && (
        <label className="flex cursor-pointer items-center gap-3 pt-2">
          <input
            type="checkbox"
            name="is_default"
            checked={formData.is_default}
            onChange={handleChange}
            className="h-4 w-4 accent-maroon"
          />
          <span className="text-sm text-charcoal/70">Set as default delivery address</span>
        </label>
      )}

      <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:items-center sm:gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-charcoal/60 transition-colors hover:text-maroon disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        
        <button
          type="button"
          onClick={handleManualSubmit}
          disabled={isSubmitting}
          className="btn-luxury btn-luxury-primary flex-1 min-h-[48px] text-[11px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving Address…' : submitLabel}
        </button>
      </div>
    </div>
  );
}