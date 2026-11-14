'use client';

import { useRef, useState } from 'react';

import CategoryPlaceholder from '@/components/ui/CategoryPlaceholder';
import { prepareCategoryImage, type PreparedCategoryImage } from '@/lib/admin/category-images';

/** What the picture field currently holds. Nothing is uploaded until the form is saved. */
export type CategoryImageState =
  | { kind: 'none' }
  | { kind: 'existing'; url: string }
  | { kind: 'new'; prepared: PreparedCategoryImage };

interface CategoryImageUploaderProps {
  image: CategoryImageState;
  onChange: (next: CategoryImageState) => void;
  /** Live values so the preview matches the homepage card. */
  name: string;
  description: string;
}

function previewSrc(image: CategoryImageState): string | null {
  if (image.kind === 'new') return image.prepared.previewUrl;
  if (image.kind === 'existing') return image.url;
  return null;
}

/** Picture picker + a live preview of the homepage "Shop by Category" card (4:5, text at the bottom). */
export default function CategoryImageUploader({ image, onChange, name, description }: CategoryImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const src = previewSrc(image);

  async function handleFile(file: File) {
    setProblem(null);
    setIsProcessing(true);
    const { data, error } = await prepareCategoryImage(file);
    setIsProcessing(false);
    if (inputRef.current) inputRef.current.value = '';

    if (error || !data) {
      setProblem(error ?? 'This picture could not be used.');
      return;
    }
    if (image.kind === 'new') URL.revokeObjectURL(image.prepared.previewUrl);
    onChange({ kind: 'new', prepared: data });
  }

  function handleRemove() {
    setProblem(null);
    if (image.kind === 'new') URL.revokeObjectURL(image.prepared.previewUrl);
    onChange({ kind: 'none' });
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-charcoal">Category picture</span>

      <div className="flex flex-col gap-5 sm:flex-row">
        {/* Live preview of the homepage card */}
        <div className="w-full max-w-[220px] shrink-0">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-charcoal ring-1 ring-gold-deep/30">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin preview (local blob or stored file)
              <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <CategoryPlaceholder name={name || 'New'} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="font-heading text-[22px] leading-tight text-white">{name.trim() || 'Category name'}</p>
              {description.trim() && (
                <p className="mt-1 line-clamp-2 font-body text-xs leading-5 text-white/90">{description}</p>
              )}
              <p className="mt-2 font-body text-[10px] uppercase tracking-[0.2em] text-gold-light">Explore →</p>
            </div>
          </div>
          <p className="mt-1.5 text-center text-xs text-ink-muted">This is how it looks on the homepage</p>
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isProcessing}
              className="min-h-[48px] rounded-lg bg-maroon px-5 text-sm font-medium text-ivory transition hover:bg-maroon/90 disabled:opacity-50"
            >
              {isProcessing ? 'Preparing…' : src ? 'Replace picture' : 'Choose picture'}
            </button>
            {src && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isProcessing}
                className="min-h-[48px] rounded-lg border border-red-200 px-5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Remove picture
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            aria-label="Choose a category picture"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />

          {problem && <p className="text-sm text-red-600">{problem}</p>}

          <ul className="space-y-1 text-xs text-ink-muted">
            <li>JPG, PNG or WebP, up to 5 MB. We shrink it automatically so the store stays fast.</li>
            <li>The card is taller than wide (4:5). The picture is cropped to fit, so keep the subject in the middle.</li>
            <li>
              No picture? The homepage shows the newest product photo from this category, or a maroon and gold card
              with the first letter of the name.
            </li>
            {image.kind === 'new' && <li className="text-gold-deep">New picture ready — it uploads when you save.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
