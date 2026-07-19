'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';


const orderSteps = [
  {
    title: 'Order Received',
    description: 'Your order request has been placed successfully.',
  },
  {
    title: 'Processing',
    description: 'Our team checks product availability and prepares your order.',
  },
  {
    title: 'Packed With Care',
    description: 'Your handcrafted piece is packed safely for dispatch.',
  },
  {
    title: 'Out For Delivery',
    description: 'Your order is on the way to your address.',
  },
];

export default function TrackOrderPage() {
  const [submittedOrderId, setSubmittedOrderId] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const orderId = String(formData.get('orderId') || '').trim();

    setSubmittedOrderId(orderId);
  };

  return (
    <>

      <main className="bg-ivory">
        <section className="border-b border-beige bg-gradient-to-b from-cream/70 to-ivory">
          <div className="luxury-container py-6 sm:py-8 lg:py-12">
            <nav
              aria-label="Breadcrumb"
              className="mb-5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-charcoal/45 sm:text-[11px]"
            >
              <Link href="/" className="hover:text-maroon">
                Home
              </Link>

              <span>/</span>

              <span className="text-charcoal/70">Track Order</span>
            </nav>

            <div className="max-w-2xl">
              <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
                Order Updates
              </span>

              <h1 className="font-heading text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
                Track Your Order
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-charcoal/55 sm:text-base">
                Enter your order ID or registered phone number to check your
                order status. This page is ready for demo flow and can later be
                connected to real order data.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14 lg:py-20">
          <div className="luxury-container">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
              <div className="border border-beige bg-white p-5 sm:p-7 lg:p-8">
                <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.28em] text-gold">
                  Find Order
                </span>

                <h2 className="font-heading text-3xl text-charcoal">
                  Enter Order Details
                </h2>

                <p className="mt-3 text-sm leading-7 text-charcoal/58">
                  Use your order ID or phone number. Later, this will fetch
                  order status from the database.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                      Order ID / Phone Number
                    </span>

                    <input
                      required
                      type="text"
                      name="orderId"
                      placeholder="Example: EIFA-1024 or 9876543210"
                      className="w-full border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
                    />
                  </label>

                  <button
                    type="submit"
                    className="btn-luxury btn-luxury-primary w-full"
                  >
                    Track Demo Order
                  </button>
                </form>

                {submittedOrderId && (
                  <div className="mt-6 border border-gold/40 bg-gold/10 p-4">
                    <p className="font-subheading text-base text-charcoal">
                      Demo tracking for:{' '}
                      <span className="font-medium text-maroon">
                        {submittedOrderId}
                      </span>
                    </p>

                    <p className="mt-2 text-sm leading-7 text-charcoal/58">
                      Real order tracking will be connected when backend order
                      saving is added.
                    </p>
                  </div>
                )}
              </div>

              <div className="border border-beige bg-white p-5 sm:p-7 lg:p-8">
                <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.28em] text-gold">
                  Order Journey
                </span>

                <h2 className="font-heading text-3xl text-charcoal">
                  How Your Order Moves
                </h2>

                <div className="mt-7 space-y-5">
                  {orderSteps.map((step, index) => (
                    <article key={step.title} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold bg-cream font-body text-xs text-maroon">
                          {index + 1}
                        </span>

                        {index !== orderSteps.length - 1 && (
                          <span className="mt-2 h-10 w-px bg-beige" />
                        )}
                      </div>

                      <div className="pb-3">
                        <h3 className="font-heading text-2xl text-charcoal">
                          {step.title}
                        </h3>

                        <p className="mt-2 text-sm leading-7 text-charcoal/58">
                          {step.description}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 border border-beige bg-cream/60 p-5 text-center sm:p-7">
              <h2 className="font-heading text-3xl text-charcoal">
                Need Help With An Order?
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-charcoal/58">
                Contact our support team for product enquiries, delivery
                updates, or custom order assistance.
              </p>

              <Link
                href="/contact"
                className="btn-luxury btn-luxury-secondary mt-6 inline-flex"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </section>
      </main>

    </>
  );
}