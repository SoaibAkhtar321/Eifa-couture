'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

import {
  uploadProductImages,
  deleteProductImage,
  setPrimaryImage,
  reorderProductImages,
} from '@/lib/admin/storage';
import type { DbProductImage } from '@/types/database';

interface ImageManagerProps {
  productId: string;
  images: DbProductImage[];
  onChange: (images: DbProductImage[]) => void;
}

export default function ImageManager({ productId, images, onChange }: ImageManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
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
      hasExistingPrimary
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

  async function handleDelete(image: DbProductImage) {
    if (!confirm('Delete this image?')) return;

    const { error } = await deleteProductImage(image);
    if (error) {
      setErrors([error]);
      return;
    }
    onChange(images.filter((img) => img.id !== image.id));
  }

  async function handleSetPrimary(imageId: string) {
    const { error } = await setPrimaryImage(productId, imageId);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg text-maroon">Images</h3>
        <label className="cursor-pointer rounded-md border border-maroon/30 px-4 py-2 text-sm font-medium text-maroon transition hover:bg-maroon/5">
          {isUploading ? 'Uploading…' : 'Upload images'}
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

      {errors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      {sortedImages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-charcoal/20 p-8 text-center text-sm text-charcoal/50">
          No images yet. Upload at least one to publish this product.
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
                  Primary
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-charcoal/70 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                {!image.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(image.id)}
                    className="rounded px-2 py-1 text-xs font-medium text-ivory hover:bg-ivory/20"
                  >
                    Set primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(image)}
                  className="ml-auto rounded px-2 py-1 text-xs font-medium text-red-300 hover:bg-ivory/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-charcoal/50">Drag to reorder. The first image is used as the thumbnail unless a primary is set.</p>
    </div>
  );
}
