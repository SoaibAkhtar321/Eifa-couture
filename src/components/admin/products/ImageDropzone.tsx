'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import PhotoCounter from './PhotoCounter';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface ImageDropzoneProps {
  files: File[];
  /** Minimum photos needed; shows a counter and hint when set. */
  minimum?: number;
  onChange: (files: File[]) => void;
  error?: string;
}

/** Drag-and-drop photo picker with previews, used while creating a product
 *  (the product row doesn't exist yet, so photos are staged in the browser
 *  and uploaded right after the product is saved). First photo = main photo. */
export default function ImageDropzone({ files, minimum, onChange, error }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  function addFiles(list: FileList | File[]) {
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const file of Array.from(list)) {
      if (!ALLOWED_TYPES.includes(file.type)) rejected.push(`${file.name}: only JPEG, PNG or WebP photos.`);
      else if (file.size > MAX_FILE_SIZE) rejected.push(`${file.name}: larger than 5MB.`);
      else accepted.push(file);
    }
    setProblems(rejected);
    if (accepted.length > 0) onChange([...files, ...accepted]);
    if (inputRef.current) inputRef.current.value = '';
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= files.length) return;
    const next = [...files];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragging ? 'border-maroon bg-maroon/5' : error ? 'border-red-400' : 'border-charcoal/25'
        }`}
      >
        <p className="text-sm text-charcoal">Drag photos here, or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="min-h-[48px] rounded-lg bg-maroon px-6 text-sm font-medium text-ivory hover:bg-maroon/90"
        >
          Choose photos
        </button>
        <p className="text-xs text-ink-muted">JPEG, PNG or WebP, up to 5MB each. The first photo is the main photo.</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          aria-label="Choose product photos"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {minimum !== undefined && <PhotoCounter count={files.length} minimum={minimum} />}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {problems.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {problems.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.lastModified}-${index}`} className="overflow-hidden rounded-lg border border-charcoal/15 bg-beige/40">
              <div className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not optimisable */}
                <img src={previews[index]} alt={`Preview of ${file.name}`} className="h-full w-full object-cover" />
                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-maroon px-2 py-0.5 text-xs font-medium text-ivory">
                    Main photo
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 p-1">
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                    aria-label={`Move ${file.name} earlier`}
                    className="flex h-11 w-11 items-center justify-center rounded text-charcoal hover:bg-charcoal/10 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, index + 1)}
                    disabled={index === files.length - 1}
                    aria-label={`Move ${file.name} later`}
                    className="flex h-11 w-11 items-center justify-center rounded text-charcoal hover:bg-charcoal/10 disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onChange(files.filter((_, i) => i !== index))}
                  className="min-h-[44px] rounded px-3 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
