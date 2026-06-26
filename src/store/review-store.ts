import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Review } from '@/types';

type ReviewSummary = {
  averageRating: number;
  reviewCount: number;
};

type ReviewStore = {
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  removeReview: (reviewId: string) => void;
  getReviewsByProductId: (productId: string) => Review[];
  getReviewSummary: (productId: string) => ReviewSummary;
};

function createReviewId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `review-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function calculateReviewSummary(reviews: Review[]): ReviewSummary {
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      reviewCount: 0,
    };
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  return {
    averageRating: Number(averageRating.toFixed(1)),
    reviewCount: reviews.length,
  };
}

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set, get) => ({
      reviews: [],

      addReview: (review) => {
        const newReview: Review = {
          ...review,
          id: createReviewId(),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          reviews: [newReview, ...state.reviews],
        }));
      },

      removeReview: (reviewId) => {
        set((state) => ({
          reviews: state.reviews.filter((review) => review.id !== reviewId),
        }));
      },

      getReviewsByProductId: (productId) => {
        return get()
          .reviews.filter((review) => review.productId === productId)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          );
      },

      getReviewSummary: (productId) => {
        const productReviews = get().reviews.filter(
          (review) => review.productId === productId
        );

        return calculateReviewSummary(productReviews);
      },
    }),
    {
      name: 'eifa-couture-reviews',
      version: 1,
    }
  )
);