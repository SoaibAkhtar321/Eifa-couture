'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { CONTACT_INFO } from '@/lib/constants';
import { CONTACT_ENQUIRY_TYPES, contactSchema } from '@/lib/contact/schema';

type Status = 'idle' | 'sending' | 'sent';

const initial = {
  name: '',
  email: '',
  phone: '',
  topic: CONTACT_ENQUIRY_TYPES[0] as string,
  orderNumber: '',
  message: '',
  consent: false,
  website: '',
};

export default function ContactForm() {
  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    setError(null);

    const check = contactSchema.safeParse(values);
    if (!check.success) {
      setError(check.error.issues[0]?.message ?? 'Please check the form.');
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        setStatus('sent');
        setValues(initial);
        return;
      }
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      setError(
        body?.error?.message ??
          `Something went wrong. Please email ${CONTACT_INFO.email} or call ${CONTACT_INFO.phone}.`
      );
    } catch {
      setError(`Network problem. Please try again, or email ${CONTACT_INFO.email}.`);
    }
    setStatus('idle');
  }

  if (status === 'sent') {
    return (
      <div role="status" className="border border-beige bg-white p-6 sm:p-8">
        <h3 className="font-heading text-2xl text-charcoal">Thank you, we have your message</h3>
        <p className="mt-3 text-sm leading-7 text-ink-muted">
          We will reply to the email address you gave us. If it is urgent, call {CONTACT_INFO.phone}.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-5 text-xs uppercase tracking-[0.2em] text-maroon hover:text-gold"
        >
          Send another message
        </button>
      </div>
    );
  }

  const label = 'block text-xs uppercase tracking-[0.18em] text-ink-muted';

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 border border-beige bg-white p-5 sm:p-7 lg:p-8">
      {/* Honeypot: hidden from people and screen readers, bots fill it. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>
          Leave this field empty
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={(e) => set('website', e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className={label}>Name</label>
          <input id="cf-name" className="input-luxury mt-1 w-full" autoComplete="name" maxLength={80} required
            value={values.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label htmlFor="cf-email" className={label}>Email</label>
          <input id="cf-email" type="email" className="input-luxury mt-1 w-full" autoComplete="email" maxLength={254} required
            value={values.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div>
          <label htmlFor="cf-phone" className={label}>Phone (optional)</label>
          <input id="cf-phone" type="tel" className="input-luxury mt-1 w-full" autoComplete="tel" maxLength={20}
            value={values.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <div>
          <label htmlFor="cf-topic" className={label}>Enquiry type</label>
          <select id="cf-topic" className="select-luxury mt-1 w-full"
            value={values.topic} onChange={(e) => set('topic', e.target.value)}>
            {CONTACT_ENQUIRY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="cf-order" className={label}>Order number (optional)</label>
        <input id="cf-order" className="input-luxury mt-1 w-full" maxLength={40}
          value={values.orderNumber} onChange={(e) => set('orderNumber', e.target.value)} />
      </div>

      <div>
        <label htmlFor="cf-message" className={label}>Message</label>
        <textarea id="cf-message" rows={5} className="input-luxury mt-1 w-full" maxLength={2000} required
          value={values.message} onChange={(e) => set('message', e.target.value)} />
      </div>

      <label className="flex items-start gap-3 text-sm leading-6 text-ink-muted">
        <input type="checkbox" className="mt-1" checked={values.consent}
          onChange={(e) => set('consent', e.target.checked)} />
        <span>
          I agree that Eifa Couture may use these details to reply to my enquiry, as described in the{' '}
          <Link href="/privacy-policy" className="text-maroon underline">Privacy Policy</Link>.
        </span>
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="btn-luxury inline-flex border border-gold bg-gold px-8 py-4 text-charcoal hover:bg-white disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}
