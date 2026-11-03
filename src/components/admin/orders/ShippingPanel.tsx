'use client';

import { FormEvent, useEffect, useState } from 'react';

import { TextField } from '@/components/admin/FormField';
import { createClient } from '@/lib/supabase/client';

type Shipping = {
  shipping_provider: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
};

/** Courier + tracking details the customer sees on their Track Order page. */
export default function ShippingPanel({ orderId }: { orderId: string }) {
  const [data, setData] = useState<Shipping | null>(null);
  const [provider, setProvider] = useState('');
  const [number, setNumber] = useState('');
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    createClient()
      .from('orders')
      .select('shipping_provider, tracking_number, tracking_url, shipped_at, delivered_at')
      .eq('id', orderId)
      .single()
      .then(({ data: row }) => {
        if (!row) return;
        const shipping = row as Shipping;
        setData(shipping);
        setProvider(shipping.shipping_provider ?? '');
        setNumber(shipping.tracking_number ?? '');
        setUrl(shipping.tracking_url ?? '');
      });
  }, [orderId]);

  async function save(event: FormEvent) {
    event.preventDefault();
    const trimmedUrl = url.trim();
    if (trimmedUrl && !/^https?:\/\//i.test(trimmedUrl)) {
      setMessage('Tracking link must start with https://');
      return;
    }
    setSaving(true);
    setMessage(null);
    const { error } = await createClient()
      .from('orders')
      .update({
        shipping_provider: provider.trim() || null,
        tracking_number: number.trim() || null,
        tracking_url: trimmedUrl || null,
      })
      .eq('id', orderId);
    setSaving(false);
    setMessage(error ? `Could not save: ${error.message}` : 'Saved — the customer can now see this.');
  }

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleString('en-IN') : '—');

  return (
    <section className="rounded-lg border border-charcoal/10 bg-ivory p-6">
      <h2 className="font-heading text-lg text-maroon">Shipping & tracking</h2>
      <p className="mt-1 text-xs text-charcoal/60">
        Add the courier details when you hand the parcel over, then set the status to “Shipped”.
      </p>
      <form onSubmit={save} className="mt-4 space-y-3">
        <TextField label="Courier" placeholder="e.g. Delhivery, Blue Dart, India Post" value={provider} onChange={(e) => setProvider(e.target.value)} />
        <TextField label="Tracking / AWB number" value={number} onChange={(e) => setNumber(e.target.value)} />
        <TextField label="Tracking link (optional)" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-maroon px-4 py-2 text-sm font-medium text-ivory hover:bg-maroon/90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save tracking'}
        </button>
        {message && <p className="text-xs text-charcoal/70">{message}</p>}
      </form>
      {data && (
        <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-charcoal/10 pt-4 text-xs">
          <dt className="text-charcoal/60">Shipped</dt>
          <dd>{fmt(data.shipped_at)}</dd>
          <dt className="text-charcoal/60">Delivered</dt>
          <dd>{fmt(data.delivered_at)}</dd>
        </dl>
      )}
    </section>
  );
}
