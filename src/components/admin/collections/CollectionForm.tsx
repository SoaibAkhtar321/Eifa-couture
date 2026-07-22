'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { TextField, TextareaField, NumberField, ToggleField, DateTimeField } from '@/components/admin/FormField';
import { collectionFormSchema, type CollectionFormValues } from '@/lib/admin/validation';
import {
  createCollection,
  updateCollection,
  generateUniqueCollectionSlug,
  type CollectionInput,
} from '@/lib/admin/collections-write';
import { generateSlug } from '@/lib/utils';
import type { DbCollection } from '@/types/database';

interface CollectionFormProps {
  collection?: DbCollection;
}

const emptyValues: CollectionFormValues = {
  name: '',
  slug: '',
  description: '',
  is_featured: false,
  is_active: true,
  sort_order: 0,
  starts_at: '',
  ends_at: '',
};

/**
 * ISO (as stored) → `datetime-local` input value, rendered in the
 * browser's local time zone.
 */
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

export default function CollectionForm({ collection }: CollectionFormProps) {
  const router = useRouter();
  const isEditing = Boolean(collection);

  const [values, setValues] = useState<CollectionFormValues>(
    collection
      ? {
          name: collection.name,
          slug: collection.slug,
          description: collection.description,
          is_featured: collection.is_featured,
          is_active: collection.is_active,
          sort_order: collection.sort_order,
          starts_at: isoToDatetimeLocal(collection.starts_at),
          ends_at: isoToDatetimeLocal(collection.ends_at),
        }
      : emptyValues
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function setField<K extends keyof CollectionFormValues>(key: K, value: CollectionFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(name: string) {
    setField('name', name);
    if (!slugManuallyEdited) {
      setField('slug', generateSlug(name));
    }
  }

  async function handleSlugBlur() {
    if (!values.slug) return;
    const unique = await generateUniqueCollectionSlug(values.name, collection?.id);
    if (unique !== generateSlug(values.name) && values.slug === generateSlug(values.name)) {
      setField('slug', unique);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const result = collectionFormSchema.safeParse(values);
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

    const input: CollectionInput = {
      name: result.data.name,
      slug: result.data.slug,
      description: result.data.description,
      is_featured: result.data.is_featured,
      is_active: result.data.is_active,
      sort_order: result.data.sort_order,
      starts_at: datetimeLocalToIso(result.data.starts_at),
      ends_at: datetimeLocalToIso(result.data.ends_at),
    };

    if (isEditing && collection) {
      const { data, error } = await updateCollection(collection.id, input);
      setIsSaving(false);
      if (error || !data) {
        setFormError(error ?? 'Failed to save collection.');
        return;
      }
      router.push('/admin/collections');
      router.refresh();
    } else {
      const { data, error } = await createCollection(input);
      setIsSaving(false);
      if (error || !data) {
        setFormError(error ?? 'Failed to create collection.');
        return;
      }
      router.push('/admin/collections');
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <TextField
              label="Name"
              value={values.name}
              onChange={(e) => handleNameChange(e.target.value)}
              error={fieldErrors.name}
              required
            />
            <TextField
              label="Slug"
              value={values.slug}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                setField('slug', e.target.value);
              }}
              onBlur={handleSlugBlur}
              error={fieldErrors.slug}
              hint="Used in the collection URL"
              required
            />
            <TextareaField
              label="Description"
              value={values.description}
              onChange={(e) => setField('description', e.target.value)}
              error={fieldErrors.description}
              rows={4}
            />
          </div>

          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <h2 className="text-sm font-medium text-charcoal">Scheduling</h2>
            <p className="text-xs text-charcoal/50">
              Optional campaign window. Leave blank for a side with no bound on that end.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DateTimeField
                label="Starts"
                value={values.starts_at}
                onChange={(e) => setField('starts_at', e.target.value)}
                error={fieldErrors.starts_at}
              />
              <DateTimeField
                label="Ends"
                value={values.ends_at}
                onChange={(e) => setField('ends_at', e.target.value)}
                error={fieldErrors.ends_at}
              />
            </div>
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
          </div>

          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <ToggleField
              label="Active"
              checked={values.is_active}
              onChange={(v) => setField('is_active', v)}
              hint="Visible on the storefront"
            />
            <ToggleField
              label="Featured"
              checked={values.is_featured}
              onChange={(v) => setField('is_featured', v)}
              hint="Eligible for the homepage featured slot"
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
            {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Create collection'}
          </button>
        </div>
      </div>
    </form>
  );
}
