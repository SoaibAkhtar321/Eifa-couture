'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import CategoryImageUploader, { type CategoryImageState } from '@/components/admin/categories/CategoryImageUploader';
import { TextField, TextareaField, SelectField, NumberField, ToggleField } from '@/components/admin/FormField';
import { useToast } from '@/components/admin/ui/Toaster';
import { saveCategoryAction } from '@/lib/admin/categories-actions';
import {
  findCategorySlugConflict,
  generateUniqueCategorySlug,
  slugConflictMessage,
  type CategoryInput,
} from '@/lib/admin/categories-write';
import { removeUploadedCategoryImage, uploadCategoryImage } from '@/lib/admin/category-images';
import { categoryFormSchema, type CategoryFormValues } from '@/lib/admin/validation';
import { AUDIENCE_OPTIONS } from '@/lib/catalog';
import { generateSlug } from '@/lib/utils';
import type { DbCategory } from '@/types/database';

interface CategoryFormProps {
  category?: DbCategory;
  categories: DbCategory[];
}

function nextSortOrder(categories: DbCategory[], parentId: string | null): number {
  const siblings = categories.filter((c) => c.parent_id === parentId);
  return siblings.length === 0 ? 10 : Math.max(...siblings.map((c) => c.sort_order)) + 10;
}

export default function CategoryForm({ category, categories }: CategoryFormProps) {
  const router = useRouter();
  const toast = useToast();
  const isEditing = Boolean(category);

  const [values, setValues] = useState<CategoryFormValues>(
    category
      ? {
          name: category.name,
          slug: category.slug,
          description: category.description ?? '',
          image_url: category.image_url,
          parent_id: category.parent_id,
          audience: category.audience,
          sort_order: category.sort_order,
          is_active: category.is_active,
        }
      : {
          name: '',
          slug: '',
          description: '',
          image_url: null,
          parent_id: null,
          audience: null,
          sort_order: nextSortOrder(categories, null),
          is_active: true,
        }
  );
  const [image, setImage] = useState<CategoryImageState>(
    category?.image_url ? { kind: 'existing', url: category.image_url } : { kind: 'none' }
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing);
  const [sortTouched, setSortTouched] = useState(isEditing);
  const newIdRef = useRef<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function setField<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function setFieldError(key: string, message: string | null) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) next[key] = message;
      else delete next[key];
      return next;
    });
  }

  function handleNameChange(name: string) {
    setField('name', name);
    if (!slugManuallyEdited) {
      setField('slug', generateSlug(name));
    }
  }

  // New categories: once the name is typed, make sure the automatic web
  // address is free (live or deleted rows) and add "-2" etc. if not.
  async function handleNameBlur() {
    if (slugManuallyEdited || !values.name.trim()) return;
    const unique = await generateUniqueCategorySlug(values.name, category?.id);
    if (unique) {
      setField('slug', unique);
      setFieldError('slug', null);
    }
  }

  async function handleSlugBlur() {
    if (!values.slug) return;
    const conflict = await findCategorySlugConflict(values.slug, category?.id);
    setFieldError('slug', conflict ? slugConflictMessage(conflict) : null);
  }

  // Parent choices: top-level categories only (the store shows two levels),
  // never the category itself. A category that already has sub-categories
  // has to stay top-level.
  const hasChildren = Boolean(category && categories.some((c) => c.parent_id === category.id));
  const parentOptions = categories
    .filter((c) => !c.parent_id && c.id !== category?.id)
    .map((c) => ({ value: c.id, label: c.is_active ? c.name : `${c.name} (hidden)` }));
  const selectedParent = categories.find((c) => c.id === values.parent_id);
  const audienceLocked = Boolean(selectedParent?.audience);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const result = categoryFormSchema.safeParse({ ...values, image_url: values.image_url });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        errors[String(issue.path[0])] = issue.message;
      });
      setFieldErrors(errors);
      setFormError('Please check the highlighted fields.');
      return;
    }
    if (!result.data.audience) {
      setFieldErrors({ audience: 'Choose Women, Men or Accessories.' });
      setFormError('Please check the highlighted fields.');
      return;
    }
    setFieldErrors({});
    setIsSaving(true);

    if (!category && !newIdRef.current) newIdRef.current = crypto.randomUUID();
    const id = category?.id ?? (newIdRef.current as string);

    // 1. Upload the new picture (if any) BEFORE saving the row.
    let imageUrl: string | null = null;
    let uploadedPath: string | null = null;
    if (image.kind === 'existing') {
      imageUrl = image.url;
    } else if (image.kind === 'new') {
      const upload = await uploadCategoryImage(id, image.prepared);
      if (upload.error || !upload.url) {
        setIsSaving(false);
        setFormError(upload.error ?? 'Picture upload failed.');
        return;
      }
      imageUrl = upload.url;
      uploadedPath = upload.path;
    }

    // 2. Save through the server action (admin check, audit log, cache refresh,
    //    and removal of the replaced picture from Storage).
    const input: CategoryInput = { ...result.data, image_url: imageUrl };
    const response = await saveCategoryAction({ id, isNew: !category, values: input });
    setIsSaving(false);

    if (response.error || response.fieldErrors) {
      // Don't leave an unused file behind.
      if (uploadedPath) await removeUploadedCategoryImage(uploadedPath);
      if (response.fieldErrors) setFieldErrors(response.fieldErrors);
      setFormError(response.error ?? 'Please check the highlighted fields.');
      return;
    }

    toast.success(isEditing ? 'Category saved' : 'Category created');
    router.push('/admin/categories');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-4 rounded-lg border border-charcoal/10 bg-ivory p-4 sm:p-6">
            <TextField
              label="Name"
              value={values.name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={handleNameBlur}
              error={fieldErrors.name}
              hint="The name shoppers see, for example “Shoes”."
              required
            />
            <TextField
              label="Web address (slug)"
              value={values.slug}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                setField('slug', e.target.value);
                setFieldError('slug', null);
              }}
              onBlur={handleSlugBlur}
              error={fieldErrors.slug}
              hint={
                isEditing
                  ? 'Part of the category link. Changing it breaks old links to this category, so only change it if you must.'
                  : 'Part of the category link. It fills in by itself from the name, so you rarely need to touch it.'
              }
              required
            />
            <TextareaField
              label="Short description"
              value={values.description}
              onChange={(e) => setField('description', e.target.value)}
              error={fieldErrors.description}
              hint="One or two short lines shown on the homepage card. You can leave it empty."
              rows={3}
            />
          </div>

          <div className="rounded-lg border border-charcoal/10 bg-ivory p-4 sm:p-6">
            <CategoryImageUploader
              image={image}
              onChange={setImage}
              name={values.name}
              description={values.description}
            />
            {fieldErrors.image_url && <p className="mt-2 text-xs text-red-600">{fieldErrors.image_url}</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 rounded-lg border border-charcoal/10 bg-ivory p-4 sm:p-6">
            <SelectField
              label="Who is this category for?"
              placeholder="Select Women, Men or Accessories"
              value={values.audience ?? ''}
              onChange={(e) => setField('audience', (e.target.value || null) as CategoryFormValues['audience'])}
              error={fieldErrors.audience}
              options={AUDIENCE_OPTIONS}
              disabled={audienceLocked}
              hint={
                audienceLocked
                  ? 'Taken from the parent category.'
                  : 'Decides which page it belongs to: Women, Men or Accessories. Shoppers on those pages only see their own categories.'
              }
              required
            />
            <SelectField
              label="Parent category"
              value={values.parent_id ?? ''}
              onChange={(e) => {
                const parentId = e.target.value || null;
                setField('parent_id', parentId);
                const parent = categories.find((c) => c.id === parentId);
                if (parent?.audience) setField('audience', parent.audience);
                if (!sortTouched) setField('sort_order', nextSortOrder(categories, parentId));
              }}
              error={fieldErrors.parent_id}
              options={[{ value: '', label: 'None — main category' }, ...parentOptions]}
              disabled={hasChildren}
              hint={
                hasChildren
                  ? 'This category has sub-categories, so it has to stay a main category.'
                  : 'Leave empty for a main category: it appears in “Shop by Category” on the homepage. Choose a parent to make it a sub-category (it then shows inside its parent in the shop filter).'
              }
            />
            <NumberField
              label="Position"
              value={values.sort_order}
              onChange={(e) => {
                setSortTouched(true);
                setField('sort_order', Number(e.target.value));
              }}
              error={fieldErrors.sort_order}
              hint="Lower numbers show first. Easier: use the ▲ ▼ arrows on the category list."
            />
          </div>

          <div className="rounded-lg border border-charcoal/10 bg-ivory p-4 sm:p-6">
            <ToggleField
              label="Show in store"
              checked={values.is_active}
              onChange={(v) => setField('is_active', v)}
              hint="Turn off to hide it from shoppers without deleting it."
            />
          </div>

          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="min-h-[48px] w-full rounded-lg bg-maroon px-5 py-3 text-sm font-medium text-ivory transition hover:bg-maroon/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Create category'}
          </button>
        </div>
      </div>
    </form>
  );
}
