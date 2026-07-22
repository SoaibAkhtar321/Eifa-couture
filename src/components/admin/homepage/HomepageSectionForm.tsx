'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { TextField, TextareaField, NumberField, ToggleField, SelectField } from '@/components/admin/FormField';
import { homepageSectionFormSchema, type HomepageSectionFormValues } from '@/lib/admin/validation';
import { updateHomepageSection, type HomepageSectionInput } from '@/lib/admin/homepage-sections-write';
import type { DbHomepageSection } from '@/types/database';

interface HomepageSectionFormProps {
  section: DbHomepageSection;
  /** Only passed (and only rendered) for the 'featured_collection' section. */
  collectionOptions?: { id: string; name: string }[];
}

export default function HomepageSectionForm({ section, collectionOptions }: HomepageSectionFormProps) {
  const router = useRouter();

  const [values, setValues] = useState<HomepageSectionFormValues>({
    title: section.title,
    subtitle: section.subtitle,
    is_active: section.is_active,
    sort_order: section.sort_order,
    item_limit: section.item_limit,
    source_collection_id: section.source_collection_id,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function setField<K extends keyof HomepageSectionFormValues>(key: K, value: HomepageSectionFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const result = homepageSectionFormSchema.safeParse(values);
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

    const input: HomepageSectionInput = { ...result.data };

    const { error } = await updateHomepageSection(section.id, input);
    setIsSaving(false);
    if (error) {
      setFormError(error);
      return;
    }
    router.push('/admin/homepage');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <TextField
              label="Section title"
              value={values.title ?? ''}
              onChange={(e) => setField('title', e.target.value)}
              error={fieldErrors.title}
              hint="Leave blank to use the section's default heading"
            />
            <TextareaField
              label="Section subtitle"
              value={values.subtitle ?? ''}
              onChange={(e) => setField('subtitle', e.target.value)}
              error={fieldErrors.subtitle}
              hint="Leave blank to use the section's default subtitle"
              rows={3}
            />

            {collectionOptions && (
              <SelectField
                label="Source collection"
                placeholder="Auto (currently featured collection)"
                value={values.source_collection_id ?? ''}
                onChange={(e) => setField('source_collection_id', e.target.value || null)}
                error={fieldErrors.source_collection_id}
                hint="Optional — pick a specific collection, or leave on Auto to use whichever collection is marked Featured"
                options={collectionOptions.map((c) => ({ value: c.id, label: c.name }))}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <NumberField
              label="Display order"
              value={values.sort_order}
              onChange={(e) => setField('sort_order', Number(e.target.value))}
              error={fieldErrors.sort_order}
              hint="Lower numbers appear first"
            />
            <NumberField
              label="Number of items displayed"
              value={values.item_limit}
              onChange={(e) => setField('item_limit', Number(e.target.value))}
              error={fieldErrors.item_limit}
              min={1}
              max={24}
            />
          </div>

          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6">
            <ToggleField
              label="Active"
              checked={values.is_active}
              onChange={(v) => setField('is_active', v)}
              hint="Show this section on the homepage"
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
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </form>
  );
}
