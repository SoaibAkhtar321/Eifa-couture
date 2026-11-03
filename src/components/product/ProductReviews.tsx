'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@/types';

type ProductReviewsProps = {
  product: Product;
};

type ReviewRow = {
  id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified: boolean;
  created_at: string;
};

function getStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (index < Math.round(rating) ? '★' : '☆')).join('');
}

function formatReviewDate(date: string) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(date)
  );
}

export default function ProductReviews({ product }: ProductReviewsProps) {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[] | null>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Only customers whose order containing this product was delivered may review.
  const [canReview, setCanReview] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    createClient()
      .rpc('has_received_product', { p_product_id: product.id })
      .then(({ data }) => {
        if (!cancelled) setCanReview(data === true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, product.id]);

  const loadReviews = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('reviews')
      .select('id, user_id, rating, title, comment, is_verified, created_at')
      .eq('product_id', product.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(50);
    return (data ?? []) as ReviewRow[];
  }, [product.id]);

  useEffect(() => {
    let cancelled = false;
    loadReviews().then((rows) => {
      if (!cancelled) setReviews(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [loadReviews]);

  const summary = useMemo(() => {
    if (!reviews || reviews.length === 0) return { averageRating: 0, reviewCount: 0 };
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return { averageRating: Number((total / reviews.length).toFixed(1)), reviewCount: reviews.length };
  }, [reviews]);

  const hasReviewed = !!user && !!reviews?.some((review) => review.user_id === user.id);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const trimmedTitle = title.trim();
    const trimmedComment = comment.trim();
    if (!trimmedTitle || !trimmedComment) {
      setMessage('Please add a review title and comment.');
      return;
    }

    setSubmitting(true);
    setMessage('');
    const supabase = createClient();
    const { error } = await supabase.from('reviews').upsert(
      {
        user_id: user.id,
        product_id: product.id,
        rating,
        title: trimmedTitle.slice(0, 120),
        comment: trimmedComment.slice(0, 2000),
      },
      { onConflict: 'user_id,product_id' }
    );
    setSubmitting(false);

    if (error) {
      setMessage('Only customers who received this product can review it.');
      return;
    }

    setTitle('');
    setComment('');
    setRating(5);
    setMessage('Thank you — your review has been saved.');
    setReviews(await loadReviews());
  };

  return (
    <section className="border-y border-beige bg-cream/45 py-12 sm:py-16 lg:py-20">
      <div className="luxury-container">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          <div>
            <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
              Customer Reviews
            </span>
            <h2 className="font-heading text-4xl leading-tight text-charcoal sm:text-5xl">Ratings & Reviews</h2>

            <div className="mt-6 border border-beige bg-white p-6">
              {summary.reviewCount > 0 ? (
                <>
                  <div className="flex items-end gap-3">
                    <span className="font-heading text-6xl leading-none text-maroon">{summary.averageRating}</span>
                    <span className="pb-2 text-sm uppercase tracking-[0.2em] text-charcoal/45">/ 5</span>
                  </div>
                  <p className="mt-3 text-2xl leading-none text-gold">{getStars(summary.averageRating)}</p>
                  <p className="mt-4 text-sm leading-7 text-charcoal/58">
                    Based on {summary.reviewCount} {summary.reviewCount === 1 ? 'review' : 'reviews'}.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl leading-none text-gold">☆☆☆☆☆</p>
                  <h3 className="mt-4 font-heading text-3xl text-charcoal">No reviews yet</h3>
                  <p className="mt-3 text-sm leading-7 text-charcoal/58">Be the first to review this piece.</p>
                </>
              )}
            </div>

            {isAuthenticated && canReview === null ? null : isAuthenticated && !canReview ? (
              <div className="mt-6 border border-beige bg-white p-5 text-center sm:p-6">
                <p className="text-sm leading-7 text-charcoal/75">
                  Reviews are written by customers who have received this piece. Once your order is delivered, you can
                  share your experience here.
                </p>
              </div>
            ) : isAuthenticated ? (
              <form onSubmit={handleSubmit} className="mt-6 border border-beige bg-white p-5 sm:p-6">
                <h3 className="font-heading text-3xl text-charcoal">
                  {hasReviewed ? 'Update Your Review' : 'Write A Review'}
                </h3>

                <fieldset className="mt-5">
                  <legend className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">Your Rating</legend>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className={`text-3xl leading-none transition-colors ${value <= rating ? 'text-gold' : 'text-charcoal/20'}`}
                        aria-label={`${value} star rating`}
                        aria-pressed={value === rating}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="mt-5 block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">Review Title</span>
                  <input
                    type="text"
                    value={title}
                    maxLength={120}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Example: Beautiful craftsmanship"
                    className="w-full border border-beige bg-ivory px-4 py-3 text-base text-charcoal outline-none transition-colors focus:border-gold sm:text-sm"
                  />
                </label>

                <label className="mt-5 block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">Your Review</span>
                  <textarea
                    rows={5}
                    value={comment}
                    maxLength={2000}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Share your experience with this product"
                    className="w-full resize-none border border-beige bg-ivory px-4 py-3 text-base text-charcoal outline-none transition-colors focus:border-gold sm:text-sm"
                  />
                </label>

                <button type="submit" disabled={submitting} className="btn-luxury btn-luxury-primary mt-6 w-full disabled:opacity-60">
                  {submitting ? 'Saving…' : 'Submit Review'}
                </button>

                {message && <p className="mt-4 text-center text-sm text-maroon" role="status">{message}</p>}
              </form>
            ) : (
              <div className="mt-6 border border-beige bg-white p-5 text-center sm:p-6">
                <p className="text-sm text-charcoal/60">Bought this piece? Sign in to write a review once it’s delivered.</p>
                <Link
                  href={`/login?next=${encodeURIComponent(`/product/${product.slug}`)}`}
                  className="btn-luxury btn-luxury-secondary mt-4 inline-flex"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-gold">Review List</p>
            <h3 className="mb-5 mt-2 font-heading text-3xl text-charcoal">What Customers Say</h3>

            {reviews === null ? (
              <div className="border border-beige bg-white p-6 text-center">
                <p className="text-sm text-charcoal/55">Loading reviews…</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="border border-beige bg-white p-8 text-center">
                <p className="mx-auto max-w-sm text-sm leading-7 text-charcoal/55">
                  Once customers review this product, their feedback will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <article key={review.id} className="border border-beige bg-white p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xl leading-none text-gold" aria-label={`${review.rating} out of 5`}>
                          {getStars(review.rating)}
                        </p>
                        {review.title && <h4 className="mt-3 font-heading text-2xl text-charcoal">{review.title}</h4>}
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-charcoal/45">
                          {formatReviewDate(review.created_at)}
                        </p>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-maroon">
                          {review.is_verified ? 'Verified Purchase' : 'Customer Review'}
                        </p>
                      </div>
                    </div>
                    {review.comment && <p className="mt-4 text-sm leading-7 text-charcoal/60">{review.comment}</p>}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
