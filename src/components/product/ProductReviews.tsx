'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import { useReviewStore } from '@/store/review-store';

import type { Product } from '@/types';

type ProductReviewsProps = {
  product: Product;
};

function getStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) =>
    index < Math.round(rating) ? '★' : '☆'
  ).join('');
}

function formatReviewDate(date: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export default function ProductReviews({ product }: ProductReviewsProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const reviews = useReviewStore((state) => state.reviews);
  const addReview = useReviewStore((state) => state.addReview);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const productReviews = useMemo(() => {
    if (!hasMounted) return [];

    return reviews
      .filter((review) => review.productId === product.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [hasMounted, product.id, reviews]);

  const reviewSummary = useMemo(() => {
    if (productReviews.length === 0) {
      return {
        averageRating: 0,
        reviewCount: 0,
      };
    }

    const totalRating = productReviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );

    return {
      averageRating: Number((totalRating / productReviews.length).toFixed(1)),
      reviewCount: productReviews.length,
    };
  }, [productReviews]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !comment.trim()) {
      setSuccessMessage('Please add review title and comment.');
      return;
    }

    addReview({
      userId: 'demo-customer',
      productId: product.id,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      images: [],
      isVerified: false,
    });

    setRating(5);
    setTitle('');
    setComment('');
    setSuccessMessage('Thank you. Your review has been added.');
  };

  return (
    <section className="border-y border-beige bg-cream/45 py-12 sm:py-16 lg:py-20">
      <div className="luxury-container">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          <div>
            <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
              Customer Reviews
            </span>

            <h2 className="font-heading text-4xl leading-tight text-charcoal sm:text-5xl">
              Ratings & Reviews
            </h2>

            <div className="mt-6 border border-beige bg-white p-6">
              {hasMounted && reviewSummary.reviewCount > 0 ? (
                <>
                  <div className="flex items-end gap-3">
                    <span className="font-heading text-6xl leading-none text-maroon">
                      {reviewSummary.averageRating}
                    </span>

                    <span className="pb-2 text-sm uppercase tracking-[0.2em] text-charcoal/45">
                      / 5
                    </span>
                  </div>

                  <p className="mt-3 text-2xl leading-none text-gold">
                    {getStars(reviewSummary.averageRating)}
                  </p>

                  <p className="mt-4 text-sm leading-7 text-charcoal/58">
                    Based on {reviewSummary.reviewCount}{' '}
                    {reviewSummary.reviewCount === 1 ? 'review' : 'reviews'} for
                    this product.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl leading-none text-gold">☆☆☆☆☆</p>

                  <h3 className="mt-4 font-heading text-3xl text-charcoal">
                    No reviews yet
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-charcoal/58">
                    Be the first customer to review this product.
                  </p>
                </>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 border border-beige bg-white p-5 sm:p-6"
            >
              <h3 className="font-heading text-3xl text-charcoal">
                Write A Review
              </h3>

              <div className="mt-5">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                  Your Rating
                </span>

                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`text-3xl leading-none transition-colors ${
                        value <= rating ? 'text-gold' : 'text-charcoal/20'
                      }`}
                      aria-label={`${value} star rating`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-5 block">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                  Review Title
                </span>

                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Example: Beautiful craftsmanship"
                  className="w-full border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                  Your Review
                </span>

                <textarea
                  rows={5}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Share your experience with this product"
                  className="w-full resize-none border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
                />
              </label>

              <button
                type="submit"
                className="btn-luxury btn-luxury-primary mt-6 w-full"
              >
                Submit Review
              </button>

              {successMessage && (
                <p className="mt-4 text-center text-sm text-maroon">
                  {successMessage}
                </p>
              )}

              <p className="mt-4 text-center text-xs leading-6 text-charcoal/45">
                Demo review system. Later, reviews can be connected with login,
                order verification, and admin approval.
              </p>
            </form>
          </div>

          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-gold">
                  Review List
                </p>

                <h3 className="mt-2 font-heading text-3xl text-charcoal">
                  What Customers Say
                </h3>
              </div>
            </div>

            {!hasMounted ? (
              <div className="border border-beige bg-white p-6 text-center">
                <p className="text-sm text-charcoal/55">Loading reviews...</p>
              </div>
            ) : productReviews.length === 0 ? (
              <div className="border border-beige bg-white p-8 text-center">
                <h3 className="font-heading text-3xl text-charcoal">
                  No customer reviews yet
                </h3>

                <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-charcoal/55">
                  Once customers review this product, their feedback will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {productReviews.map((review) => (
                  <article
                    key={review.id}
                    className="border border-beige bg-white p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xl leading-none text-gold">
                          {getStars(review.rating)}
                        </p>

                        <h4 className="mt-3 font-heading text-2xl text-charcoal">
                          {review.title}
                        </h4>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-charcoal/45">
                          {formatReviewDate(review.createdAt)}
                        </p>

                        <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-maroon">
                          {review.isVerified
                            ? 'Verified Purchase'
                            : 'Customer Review'}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-charcoal/60">
                      {review.comment}
                    </p>
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