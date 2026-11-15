'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

import ConfirmDialog from '@/components/admin/ui/ConfirmDialog';
import {
  uploadProductImages,
  deleteProductImage,
  setPrimaryImage,
  reorderProductImages,
} from '@/lib/admin/storage';
import type { DbProductImage } from '@/types/database';

import PhotoCounter from './PhotoCounter';

interface ImageManagerProps {
  productId: string;
  images: DbProductImage[];
  onChange: (images: DbProductImage[]) => void;
  /** Scopes uploads/primary-selection to one variant's gallery (e.g. a
   *  color's own images) instead of the product-level gallery. Pass
   *  the "owner" variant id for that color — `null` (default) keeps
   *  today's product-level behavior. `images` must already be filtered
   *  to this scope by the caller; this component doesn't filter. */
  variantId?: string | null;
  title?: string;
  emptyMessage?: string;
  /** Product-level gallery only: minimum photos, shown as a counter. */
  minimum?: number;
  /** When true (product is live), deleting below `minimum` is blocked. */
  protectMinimum?: boolean;
}

export default function ImageManager({
  productId,
  images,
  onChange,
  variantId = null,
  title = 'Images',
  emptyMessage = 'No images yet. Upload at least one to publish this product.',
  minimum,
  protectMinimum = false,
}: ImageManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DbProductImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    setErrors([]);

    const hasExistingPrimary = images.some((img) => img.is_primary);
    const { data, errors: uploadErrors } = await uploadProductImages(
      productId,
      Array.from(fileList),
      images.length,
      hasExistingPrimary,
      variantId
    );

    if (data.length > 0) {
      onChange([...images, ...data]);
    }
    if (uploadErrors.length > 0) {
      setErrors(uploadErrors.map((e) => e.message));
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function requestDelete(image: DbProductImage) {
    if (minimum !== undefined && protectMinimum && images.length <= minimum) {
      setErrors([`This product is live and needs at least ${minimum} photos. Add another photo first, then delete this one.`]);
      return;
    }
    setPendingDelete(image);
  }

  async function handleDeleteConfirmed() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    const { error } = await deleteProductImage(pendingDelete);
    setIsDeleting(false);
    if (error) {
      setErrors([error]);
      setPendingDelete(null);
      return;
    }
    onChange(images.filter((img) => img.id !== pendingDelete.id));
    setPendingDelete(null);
  }

  async function handleSetPrimary(imageId: string) {
    const { error } = await setPrimaryImage(productId, imageId, variantId);
    if (error) {
      setErrors([error]);
      return;
    }
    onChange(images.map((img) => ({ ...img, is_primary: img.id === imageId })));
  }

  function handleDragStart(imageId: string) {
    setDraggedId(imageId);
  }

  async function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const currentOrder = sortedImages.map((img) => img.id);
    const fromIndex = currentOrder.indexOf(draggedId);
    const toIndex = currentOrder.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedId(null);
      return;
    }

    const reordered = [...currentOrder];
    reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, draggedId);

    // optimistic update
    onChange(
      images.map((img) => ({
        ...img,
        sort_order: reordered.indexOf(img.id),
      }))
    );
    setDraggedId(null);

    const { error } = await reorderProductImages(reordered);
    if (error) setErrors([error]);
  }

  return (
    <div
      className={`space-y-4 rounded-lg ${isFileDragging ? 'outline-dashed outline-2 outline-maroon' : ''}`}
      onDragOver={(e) => {
        // only react to files dragged from the computer, not to reordering
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          setIsFileDragging(true);
        }
      }}
      onDragLeave={() => setIsFileDragging(false)}
      onDrop={(e) => {
        if (e.dataTransfer.files.length > 0) {
          e.preventDefault();
          setIsFileDragging(false);
          void handleFilesSelected(e.dataTransfer.files);
        }
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg text-maroon">{title}</h3>
        <label className="flex min-h-[44px] cursor-pointer items-center rounded-md border border-maroon/30 px-4 text-sm font-medium text-maroon transition hover:bg-maroon/5">
          {isUploading ? 'Uploading…' : 'Choose photos'}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={isUploading}
            onChange={(e) => handleFilesSelected(e.target.files)}
            className="hidden"
          />
        </label>
      </div>

      {minimum !== undefined && <PhotoCounter count={sortedImages.length} minimum={minimum} />}

      {errors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      {sortedImages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-charcoal/30 p-8 text-center text-sm text-ink-soft">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {sortedImages.map((image) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => handleDragStart(image.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(image.id)}
              className={`group relative overflow-hidden rounded-lg border-2 bg-beige/40 ${
                image.is_primary ? 'border-maroon' : 'border-transparent'
              } cursor-move`}
            >
              <div className="aspect-square">
                <Image
                  src={image.url}
                  alt={image.alt_text || 'Product image'}
                  width={200}
                  height={200}
                  className="h-full w-full object-cover"
                />
              </div>

              {image.is_primary && (
                <span className="absolute left-2 top-2 rounded-full bg-maroon px-2 py-0.5 text-xs font-medium text-ivory">
                  Main photo
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-charcoal/70 p-1.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                {!image.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(image.id)}
                    className="min-h-[44px] rounded px-2 text-xs font-medium text-ivory hover:bg-ivory/20"
                  >
                    Make main photo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => requestDelete(image)}
                  className="ml-auto min-h-[44px] rounded px-2 text-xs font-medium text-red-200 hover:bg-ivory/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-ink-muted">Drag photos here to add them. Drag a photo onto another to reorder. The main photo is the thumbnail.</p>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this photo?"
        message="The photo will be removed from this product."
        confirmLabel="Yes, delete it"
        cancelLabel="No, keep it"
        destructive
        busy={isDeleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
