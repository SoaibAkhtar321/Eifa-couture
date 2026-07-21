'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { TextField, TextareaField, SelectField, NumberField, ToggleField } from '@/components/admin/FormField';
import { categoryFormSchema, type CategoryFormValues } from '@/lib/admin/validation';
import { createCategory, updateCategory, generateUniqueCategorySlug, type CategoryInput } from '@/lib/admin/categories-write';
import { generateSlug } from '@/lib/utils';
import type { DbCategory } from '@/types/database';

interface CategoryFormProps {
  category?: DbCategory;
  categories: DbCategory[];
}

const emptyValues: CategoryFormValues = {
  name: '',
  slug: '',
  description: '',
  image_url: null,
  parent_id: null,
  sort_order: 0,
  is_active: true,
};

export default function CategoryForm({ category, categories }: CategoryFormProps) {
  const router = useRouter();
  const isEditing = Boolean(category);

  const [values, setValues] = useState<CategoryFormValues>(
    category
      ? {
          name: category.name,
          slug: category.slug,
          description: category.description,
          image_url: category.image_url,
          parent_id: category.parent_id,
          sort_order: category.sort_order,
          is_active: category.is_active,
        }
      : emptyValues
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function setField<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) {
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
    const unique = await generateUniqueCategorySlug(values.name, category?.id);
    if (unique !== generateSlug(values.name) && values.slug === generateSlug(values.name)) {
      setField('slug', unique);
    }
  }

  // Parent-category options: everything except the category being
  // edited (and, one level deep, anything already parented under it —
  // the schema doesn't enforce cycle-freedom below one level, so this
  // just covers the common case of accidentally re-parenting a category
  // under its own child).
  const parentOptions = categories.filter(
    (c) => c.id !== category?.id && c.parent_id !== category?.id
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const result = categoryFormSchema.safeParse(values);
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

    const input: CategoryInput = { ...result.data };

    if (isEditing && category) {
      const { data, error } = await updateCategory(category.id, input);
      setIsSaving(false);
      if (error || !data) {
        setFormError(error ?? 'Failed to save category.');
        return;
      }
      router.push('/admin/categories');
      router.refresh();
    } else {
      const { data, error } = await createCategory(input);
      setIsSaving(false);
      if (error || !data) {
        setFormError(error ?? 'Failed to create category.');
        return;
      }
      router.push('/admin/categories');
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
              hint="Used in the category URL"
              required
            />
            <TextareaField
              label="Description"
              value={values.description}
              onChange={(e) => setField('description', e.target.value)}
              error={fieldErrors.description}
              rows={4}
            />
            <TextField
              label="Image URL"
              value={values.image_url ?? ''}
              onChange={(e) => setField('image_url', e.target.value || null)}
              error={fieldErrors.image_url}
              hint="Optional — banner/thumbnail image for this category"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <SelectField
              label="Parent category"
              placeholder="None (top level)"
              value={values.parent_id ?? ''}
              onChange={(e) => setField('parent_id', e.target.value || null)}
              error={fieldErrors.parent_id}
              options={parentOptions.map((c) => ({ value: c.id, label: c.name }))}
            />
            <NumberField
              label="Sort order"
              value={values.sort_order}
              onChange={(e) => setField('sort_order', Number(e.target.value))}
              error={fieldErrors.sort_order}
              hint="Lower numbers appear first"
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
            disabled={isSaving}
            className="w-full rounded-lg bg-maroon px-5 py-3 text-sm font-medium text-ivory transition hover:bg-maroon/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Create category'}
          </button>
        </div>
      </div>
    </form>
  );
}