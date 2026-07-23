'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { TextField, TextareaField, NumberField, ToggleField } from '@/components/admin/FormField';
import { storeSettingsFormSchema, type StoreSettingsFormValues } from '@/lib/admin/validation';
import { updateStoreSettings, type StoreSettingsInput } from '@/lib/admin/store-settings-write';
import { uploadStoreAsset, type StoreAssetKind } from '@/lib/admin/store-settings-storage';
import type { DbStoreSettings } from '@/types/database';

interface StoreSettingsFormProps {
  settings: DbStoreSettings;
}

export default function StoreSettingsForm({ settings }: StoreSettingsFormProps) {
  const router = useRouter();

  const [values, setValues] = useState<StoreSettingsFormValues>({
    store_name: settings.store_name,
    store_email: settings.store_email,
    store_phone: settings.store_phone,
    address_line1: settings.address_line1,
    address_line2: settings.address_line2,
    address_city: settings.address_city,
    address_state: settings.address_state,
    address_pincode: settings.address_pincode,
    address_country: settings.address_country,
    business_legal_name: settings.business_legal_name,
    business_registration_no: settings.business_registration_no,
    gstin: settings.gstin,
    logo_url: settings.logo_url,
    favicon_url: settings.favicon_url,
    social_instagram_url: settings.social_instagram_url,
    social_facebook_url: settings.social_facebook_url,
    social_pinterest_url: settings.social_pinterest_url,
    social_youtube_url: settings.social_youtube_url,
    social_twitter_url: settings.social_twitter_url,
    seo_default_title: settings.seo_default_title,
    seo_default_description: settings.seo_default_description,
    currency_code: settings.currency_code,
    currency_symbol: settings.currency_symbol,
    shipping_flat_rate: settings.shipping_flat_rate,
    shipping_free_threshold: settings.shipping_free_threshold,
    shipping_processing_days: settings.shipping_processing_days,
    tax_gst_percent: settings.tax_gst_percent,
    tax_prices_inclusive: settings.tax_prices_inclusive,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState<StoreAssetKind | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof StoreSettingsFormValues>(key: K, value: StoreSettingsFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFormSuccess(null);
  }

  async function handleAssetSelected(file: File | undefined, kind: StoreAssetKind) {
    if (!file) return;
    setUploading(kind);
    setFormError(null);

    const { url, error } = await uploadStoreAsset(file, kind);

    setUploading(null);
    if (error || !url) {
      setFormError(error ?? 'Upload failed.');
      return;
    }

    setField(kind === 'logo' ? 'logo_url' : 'favicon_url', url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const result = storeSettingsFormSchema.safeParse(values);
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

    const input: StoreSettingsInput = { ...result.data };

    const { error } = await updateStoreSettings(input);
    setIsSaving(false);
    if (error) {
      setFormError(error);
      return;
    }
    setFormSuccess('Settings saved.');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Store information */}
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <h2 className="text-sm font-medium text-charcoal">Store information</h2>
            <TextField
              label="Store name"
              value={values.store_name}
              onChange={(e) => setField('store_name', e.target.value)}
              error={fieldErrors.store_name}
              required
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="Store email"
                type="email"
                value={values.store_email ?? ''}
                onChange={(e) => setField('store_email', e.target.value || null)}
                error={fieldErrors.store_email}
              />
              <TextField
                label="Store phone"
                value={values.store_phone ?? ''}
                onChange={(e) => setField('store_phone', e.target.value || null)}
                error={fieldErrors.store_phone}
              />
            </div>
            <TextField
              label="Address line 1"
              value={values.address_line1 ?? ''}
              onChange={(e) => setField('address_line1', e.target.value || null)}
              error={fieldErrors.address_line1}
            />
            <TextField
              label="Address line 2"
              value={values.address_line2 ?? ''}
              onChange={(e) => setField('address_line2', e.target.value || null)}
              error={fieldErrors.address_line2}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="City"
                value={values.address_city ?? ''}
                onChange={(e) => setField('address_city', e.target.value || null)}
                error={fieldErrors.address_city}
              />
              <TextField
                label="State"
                value={values.address_state ?? ''}
                onChange={(e) => setField('address_state', e.target.value || null)}
                error={fieldErrors.address_state}
              />
              <TextField
                label="Pincode"
                value={values.address_pincode ?? ''}
                onChange={(e) => setField('address_pincode', e.target.value || null)}
                error={fieldErrors.address_pincode}
              />
              <TextField
                label="Country"
                value={values.address_country}
                onChange={(e) => setField('address_country', e.target.value)}
                error={fieldErrors.address_country}
                required
              />
            </div>
          </div>

          {/* Business information */}
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <h2 className="text-sm font-medium text-charcoal">Business information</h2>
            <TextField
              label="Business legal name"
              value={values.business_legal_name ?? ''}
              onChange={(e) => setField('business_legal_name', e.target.value || null)}
              error={fieldErrors.business_legal_name}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="Business registration number"
                value={values.business_registration_no ?? ''}
                onChange={(e) => setField('business_registration_no', e.target.value || null)}
                error={fieldErrors.business_registration_no}
              />
              <TextField
                label="GSTIN"
                value={values.gstin ?? ''}
                onChange={(e) => setField('gstin', e.target.value.toUpperCase() || null)}
                error={fieldErrors.gstin}
              />
            </div>
          </div>

          {/* Logo & favicon */}
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-5">
            <h2 className="text-sm font-medium text-charcoal">Logo &amp; favicon</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-medium text-charcoal/70">Logo</p>
                {values.logo_url && (
                  <div className="relative h-20 w-40 overflow-hidden rounded-md border border-charcoal/10 bg-cream">
                    <Image src={values.logo_url} alt="Store logo" fill className="object-contain p-2" />
                  </div>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => handleAssetSelected(e.target.files?.[0], 'logo')}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading === 'logo'}
                  className="rounded-md border border-charcoal/15 px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-charcoal/5 disabled:opacity-50"
                >
                  {uploading === 'logo' ? 'Uploading…' : values.logo_url ? 'Replace logo' : 'Upload logo'}
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-charcoal/70">Favicon</p>
                {values.favicon_url && (
                  <div className="relative h-10 w-10 overflow-hidden rounded-md border border-charcoal/10 bg-cream">
                    <Image src={values.favicon_url} alt="Favicon" fill className="object-contain p-1" />
                  </div>
                )}
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml"
                  className="hidden"
                  onChange={(e) => handleAssetSelected(e.target.files?.[0], 'favicon')}
                />
                <button
                  type="button"
                  onClick={() => faviconInputRef.current?.click()}
                  disabled={uploading === 'favicon'}
                  className="rounded-md border border-charcoal/15 px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-charcoal/5 disabled:opacity-50"
                >
                  {uploading === 'favicon' ? 'Uploading…' : values.favicon_url ? 'Replace favicon' : 'Upload favicon'}
                </button>
              </div>
            </div>
          </div>

          {/* Social media links */}
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <h2 className="text-sm font-medium text-charcoal">Social media links</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="Instagram"
                value={values.social_instagram_url ?? ''}
                onChange={(e) => setField('social_instagram_url', e.target.value || null)}
                error={fieldErrors.social_instagram_url}
                placeholder="https://instagram.com/…"
              />
              <TextField
                label="Facebook"
                value={values.social_facebook_url ?? ''}
                onChange={(e) => setField('social_facebook_url', e.target.value || null)}
                error={fieldErrors.social_facebook_url}
                placeholder="https://facebook.com/…"
              />
              <TextField
                label="Pinterest"
                value={values.social_pinterest_url ?? ''}
                onChange={(e) => setField('social_pinterest_url', e.target.value || null)}
                error={fieldErrors.social_pinterest_url}
                placeholder="https://pinterest.com/…"
              />
              <TextField
                label="YouTube"
                value={values.social_youtube_url ?? ''}
                onChange={(e) => setField('social_youtube_url', e.target.value || null)}
                error={fieldErrors.social_youtube_url}
                placeholder="https://youtube.com/…"
              />
              <TextField
                label="Twitter / X"
                value={values.social_twitter_url ?? ''}
                onChange={(e) => setField('social_twitter_url', e.target.value || null)}
                error={fieldErrors.social_twitter_url}
                placeholder="https://x.com/…"
              />
            </div>
          </div>

          {/* SEO defaults */}
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <h2 className="text-sm font-medium text-charcoal">SEO defaults</h2>
            <TextField
              label="Default meta title"
              value={values.seo_default_title ?? ''}
              onChange={(e) => setField('seo_default_title', e.target.value || null)}
              error={fieldErrors.seo_default_title}
              hint="Shown in search results and browser tabs when a page has no title of its own"
            />
            <TextareaField
              label="Default meta description"
              value={values.seo_default_description ?? ''}
              onChange={(e) => setField('seo_default_description', e.target.value || null)}
              error={fieldErrors.seo_default_description}
              rows={3}
              hint="Shown under the title in search results"
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Currency */}
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <h2 className="text-sm font-medium text-charcoal">Currency</h2>
            <TextField
              label="Currency code"
              value={values.currency_code}
              onChange={(e) => setField('currency_code', e.target.value.toUpperCase())}
              error={fieldErrors.currency_code}
              hint="3-letter ISO code, e.g. INR"
              maxLength={3}
            />
            <TextField
              label="Currency symbol"
              value={values.currency_symbol}
              onChange={(e) => setField('currency_symbol', e.target.value)}
              error={fieldErrors.currency_symbol}
            />
          </div>

          {/* Shipping */}
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <h2 className="text-sm font-medium text-charcoal">Shipping</h2>
            <NumberField
              label="Flat shipping rate"
              value={values.shipping_flat_rate}
              onChange={(e) => setField('shipping_flat_rate', Number(e.target.value))}
              error={fieldErrors.shipping_flat_rate}
              min={0}
              step="0.01"
            />
            <NumberField
              label="Free shipping threshold"
              value={values.shipping_free_threshold ?? ''}
              onChange={(e) => setField('shipping_free_threshold', e.target.value === '' ? null : Number(e.target.value))}
              error={fieldErrors.shipping_free_threshold}
              min={0}
              step="0.01"
              hint="Leave blank to disable free shipping"
            />
            <NumberField
              label="Processing time (days)"
              value={values.shipping_processing_days}
              onChange={(e) => setField('shipping_processing_days', Number(e.target.value))}
              error={fieldErrors.shipping_processing_days}
              min={0}
            />
          </div>

          {/* Tax */}
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <h2 className="text-sm font-medium text-charcoal">Tax</h2>
            <NumberField
              label="GST rate (%)"
              value={values.tax_gst_percent}
              onChange={(e) => setField('tax_gst_percent', Number(e.target.value))}
              error={fieldErrors.tax_gst_percent}
              min={0}
              max={100}
              step="0.01"
            />
            <ToggleField
              label="Prices include tax"
              checked={values.tax_prices_inclusive}
              onChange={(v) => setField('tax_prices_inclusive', v)}
              hint="Off if product prices are tax-exclusive"
            />
          </div>

          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
          )}
          {formSuccess && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {formSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-lg bg-maroon px-5 py-3 text-sm font-medium text-ivory transition hover:bg-maroon/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </form>
  );
}
