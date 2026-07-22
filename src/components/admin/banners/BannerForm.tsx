'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { TextField, TextareaField, NumberField, ToggleField, DateTimeField } from '@/components/admin/FormField';
import { bannerFormSchema, type BannerFormValues } from '@/lib/admin/validation';
import { createBanner, updateBanner, type BannerInput } from '@/lib/admin/banners-write';
import { uploadBannerImage, type BannerImageVariant } from '@/lib/admin/banners-storage';
import BannerPreview from './BannerPreview';
import type { DbBanner } from '@/types/database';

interface BannerFormProps {
  banner?: DbBanner;
}

const emptyValues: BannerFormValues = {
  title: '',
  subtitle: '',
  image_url: '',
  mobile_image_url: null,
  link_url: null,
  cta_label: null,
  sort_order: 0,
  is_active: true,
  starts_at: '',
  ends_at: '',
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

export default function BannerForm({ banner }: BannerFormProps) {
  const router = useRouter();
  const isEditing = Boolean(banner);

  // A banner's `image_url` is NOT NULL, so the id is minted up front —
  // for a new banner this becomes the Storage folder *and* the row's
  // primary key once saved (see lib/admin/banners-storage.ts).
  const [bannerId] = useState(() => banner?.id ?? crypto.randomUUID());

  const [values, setValues] = useState<BannerFormValues>(
    banner
      ? {
          title: banner.title,
          subtitle: banner.subtitle,
          image_url: banner.image_url,
          mobile_image_url: banner.mobile_image_url,
          link_url: banner.link_url,
          cta_label: banner.cta_label,
          sort_order: banner.sort_order,
          is_active: banner.is_active,
          starts_at: isoToDatetimeLocal(banner.starts_at),
          ends_at: isoToDatetimeLocal(banner.ends_at),
        }
      : emptyValues
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState<BannerImageVariant | null>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof BannerFormValues>(key: K, value: BannerFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageSelected(file: File | undefined, variant: BannerImageVariant) {
    if (!file) return;
    setUploading(variant);
    setFormError(null);

    const { url, error } = await uploadBannerImage(bannerId, file, variant);

    setUploading(null);
    if (error || !url) {
      setFormError(error ?? 'Image upload failed.');
      return;
    }

    if (variant === 'desktop') {
      setField('image_url', url);
      setFieldErrors((prev) => ({ ...prev, image_url: '' }));
    } else {
      setField('mobile_image_url', url);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const result = bannerFormSchema.safeParse(values);
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

    const input: BannerInput = {
      title: result.data.title,
      subtitle: result.data.subtitle,
      image_url: result.data.image_url,
      mobile_image_url: result.data.mobile_image_url,
      link_url: result.data.link_url,
      cta_label: result.data.cta_label,
      sort_order: result.data.sort_order,
      is_active: result.data.is_active,
      starts_at: datetimeLocalToIso(result.data.starts_at),
      ends_at: datetimeLocalToIso(result.data.ends_at),
    };

    if (isEditing && banner) {
      const { data, error } = await updateBanner(banner.id, input);
      setIsSaving(false);
      if (error || !data) {
        setFormError(error ?? 'Failed to save banner.');
        return;
      }
    } else {
      const { data, error } = await createBanner({ ...input, id: bannerId });
      setIsSaving(false);
      if (error || !data) {
        setFormError(error ?? 'Failed to create banner.');
        return;
      }
    }

    router.push('/admin/banners');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <TextField
              label="Title"
              value={values.title}
              onChange={(e) => setField('title', e.target.value)}
              error={fieldErrors.title}
              required
            />
            <TextareaField
              label="Subtitle"
              value={values.subtitle}
              onChange={(e) => setField('subtitle', e.target.value)}
              error={fieldErrors.subtitle}
              rows={3}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="CTA label"
                value={values.cta_label ?? ''}
                onChange={(e) => setField('cta_label', e.target.value || null)}
                error={fieldErrors.cta_label}
                hint="e.g. Shop Now"
              />
              <TextField
                label="Link URL"
                value={values.link_url ?? ''}
                onChange={(e) => setField('link_url', e.target.value || null)}
                error={fieldErrors.link_url}
                hint="Where the banner links to"
              />
            </div>
          </div>

          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-5">
            <h2 className="text-sm font-medium text-charcoal">Images</h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-medium text-charcoal/70">
                  Desktop image <span className="text-maroon">*</span>
                </p>
                {values.image_url && (
                  <div className="relative aspect-video overflow-hidden rounded-md border border-charcoal/10">
                    <Image src={values.image_url} alt="Desktop banner" fill className="object-cover" />
                  </div>
                )}
                <label className="block cursor-pointer rounded-md border border-maroon/30 px-4 py-2 text-center text-sm font-medium text-maroon transition hover:bg-maroon/5">
                  {uploading === 'desktop' ? 'Uploading…' : values.image_url ? 'Replace image' : 'Upload image'}
                  <input
                    ref={desktopInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading !== null}
                    onChange={(e) => {
                      void handleImageSelected(e.target.files?.[0], 'desktop');
                      if (desktopInputRef.current) desktopInputRef.current.value = '';
                    }}
                    className="hidden"
                  />
                </label>
                {fieldErrors.image_url && <p className="text-xs text-red-600">{fieldErrors.image_url}</p>}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-charcoal/70">Mobile image</p>
                {values.mobile_image_url && (
                  <div className="relative aspect-[9/16] max-h-48 overflow-hidden rounded-md border border-charcoal/10">
                    <Image src={values.mobile_image_url} alt="Mobile banner" fill className="object-cover" />
                  </div>
                )}
                <label className="block cursor-pointer rounded-md border border-charcoal/20 px-4 py-2 text-center text-sm font-medium text-charcoal/70 transition hover:bg-charcoal/5">
                  {uploading === 'mobile' ? 'Uploading…' : values.mobile_image_url ? 'Replace image' : 'Upload image'}
                  <input
                    ref={mobileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading !== null}
                    onChange={(e) => {
                      void handleImageSelected(e.target.files?.[0], 'mobile');
                      if (mobileInputRef.current) mobileInputRef.current.value = '';
                    }}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-charcoal/50">Optional — falls back to the desktop image if omitted.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-medium text-charcoal">Live preview</h2>
            <BannerPreview
              title={values.title}
              subtitle={values.subtitle}
              imageUrl={values.image_url || null}
              mobileImageUrl={values.mobile_image_url}
              ctaLabel={values.cta_label}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <NumberField
              label="Sort order"
              value={values.sort_order}
              onChange={(e) => setField('sort_order', Number(e.target.value))}
              error={fieldErrors.sort_order}
              hint="Lower numbers appear first"
            />
            <DateTimeField
              label="Starts at"
              value={values.starts_at}
              onChange={(e) => setField('starts_at', e.target.value)}
              error={fieldErrors.starts_at}
              hint="Optional — leave blank to start immediately"
            />
            <DateTimeField
              label="Ends at"
              value={values.ends_at}
              onChange={(e) => setField('ends_at', e.target.value)}
              error={fieldErrors.ends_at}
              hint="Optional — leave blank to run indefinitely"
            />
          </div>

          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6">
            <ToggleField
              label="Active"
              checked={values.is_active}
              onChange={(v) => setField('is_active', v)}
              hint="Visible on the storefront"
            />
          </div>

          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
          )}

          <button
            type="submit"
            disabled={isSaving || uploading !== null}
            className="w-full rounded-lg bg-maroon px-5 py-3 text-sm font-medium text-ivory transition hover:bg-maroon/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Create banner'}
          </button>
        </div>
      </div>
    </form>
  );
}
