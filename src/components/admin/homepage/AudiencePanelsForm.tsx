'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useToast } from '@/components/admin/ui/Toaster';
import { updateAudiencePanelImage } from '@/lib/admin/audience-panels-write';
import { uploadStoreAsset, type StoreAssetKind } from '@/lib/admin/store-settings-storage';
import type { Audience } from '@/lib/catalog';

export interface AudiencePanelState {
  audience: Audience;
  label: string;
  /** Image currently shown on the store (custom or default). */
  currentImage: string;
  /** True when an admin-uploaded image is in use. */
  isCustom: boolean;
}

function PanelCard({ panel }: { panel: AudiencePanelState }) {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState(panel.currentImage);
  const [isCustom, setIsCustom] = useState(panel.isCustom);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    const kind = `panel-${panel.audience}` as StoreAssetKind;
    const { url, error } = await uploadStoreAsset(file, kind);
    if (error || !url) {
      setBusy(false);
      toast.error(error ?? 'Upload failed.');
      return;
    }
    const { error: saveError } = await updateAudiencePanelImage(panel.audience, url);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
    if (saveError) {
      toast.error(`Could not save the image: ${saveError}`);
      return;
    }
    setImage(url);
    setIsCustom(true);
    toast.success(`${panel.label} picture updated.`);
    router.refresh();
  }

  async function handleReset() {
    setBusy(true);
    const { error } = await updateAudiencePanelImage(panel.audience, null);
    setBusy(false);
    if (error) {
      toast.error(`Could not reset: ${error}`);
      return;
    }
    toast.success(`${panel.label} picture reset to the standard one.`);
    router.refresh();
    // the standard image path is resolved on the server; reload to show it
    window.location.reload();
  }

  return (
    <div className="space-y-3 rounded-lg border border-charcoal/10 bg-ivory p-4">
      <h3 className="font-heading text-base text-maroon">{panel.label}</h3>
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-beige/50">
        <Image src={image} alt={`${panel.label} panel picture`} fill sizes="(max-width: 768px) 100vw, 320px" className="object-cover" />
      </div>
      <p className="text-xs text-ink-muted">{isCustom ? 'Your picture is showing.' : 'The standard picture is showing.'}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="min-h-[48px] flex-1 rounded-lg bg-maroon px-4 text-sm font-medium text-ivory hover:bg-maroon/90 disabled:opacity-50"
        >
          {busy ? 'Please wait…' : 'Change picture'}
        </button>
        {isCustom && (
          <button
            type="button"
            disabled={busy}
            onClick={handleReset}
            className="min-h-[48px] rounded-lg border border-charcoal/25 px-4 text-sm font-medium text-charcoal hover:bg-charcoal/5 disabled:opacity-50"
          >
            Use standard
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-label={`Choose a new ${panel.label} picture`}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

export default function AudiencePanelsForm({ panels }: { panels: AudiencePanelState[] }) {
  return (
    <section aria-labelledby="panels-heading" className="space-y-4">
      <div>
        <h2 id="panels-heading" className="font-heading text-xl text-maroon">
          Women, Men and Accessories pictures
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          These pictures appear on the homepage and on each section&apos;s own page. JPEG, PNG or WebP, up to 5MB. A
          tall, portrait photo works best.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {panels.map((panel) => (
          <PanelCard key={panel.audience} panel={panel} />
        ))}
      </div>
    </section>
  );
}
