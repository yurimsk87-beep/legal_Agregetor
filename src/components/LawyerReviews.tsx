"use client";

import { useState, useTransition } from "react";
import type { Review } from "@/lib/types";

type PublicReview = Pick<Review, "id" | "lawyerId" | "serviceId" | "cityId" | "userName" | "rating" | "text" | "qualityStatus" | "isModerated" | "createdAt">;

type LawyerReviewsProps = {
  lawyerId: string;
  initialReviews: PublicReview[];
  initialHasMore: boolean;
  totalCount?: number;
  pageSize?: number;
};

type ReviewsResponse =
  | {
      ok: true;
      items: PublicReview[];
      nextCursor: string | null;
    }
  | {
      ok: false;
      message?: string;
    };

export function LawyerReviews({
  lawyerId,
  initialReviews,
  initialHasMore,
  totalCount,
  pageSize = 4
}: LawyerReviewsProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [cursor, setCursor] = useState(initialReviews.at(-1)?.id ?? null);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!reviews.length) return null;

  const visibleCountLabel = totalCount && totalCount > reviews.length ? `${reviews.length} из ${totalCount}` : String(reviews.length);

  function loadMoreReviews() {
    startTransition(async () => {
      setError("");

      try {
        const params = new URLSearchParams({
          lawyerId,
          limit: String(pageSize)
        });
        if (cursor) params.set("cursor", cursor);

        const response = await fetch(`/api/reviews?${params.toString()}`, {
          method: "GET",
          headers: { Accept: "application/json" }
        });
        const payload = (await response.json()) as ReviewsResponse;

        if (!response.ok || !payload.ok) {
          setError(payload.ok === false && payload.message ? payload.message : "Не удалось загрузить отзывы.");
          return;
        }

        setReviews((current) => {
          const knownIds = new Set(current.map((review) => review.id));
          const nextItems = payload.items.filter((review) => !knownIds.has(review.id));
          return [...current, ...nextItems];
        });
        setCursor(payload.nextCursor);
        setHasMore(Boolean(payload.nextCursor));
      } catch {
        setError("Не удалось загрузить отзывы.");
      }
    });
  }

  return (
    <section className="mt-8 rounded-lg border border-line bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-ink">Отзывы</h2>
        <span className="rounded-md bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
          Показано {visibleCountLabel}
        </span>
      </div>
      <div className="mt-5 grid gap-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {hasMore ? (
        <button
          type="button"
          onClick={loadMoreReviews}
          disabled={isPending}
          className="mt-5 inline-flex min-h-11 items-center rounded-md border border-line px-4 py-3 text-sm font-semibold text-ink transition hover:border-trust disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Загружаем..." : "Показать ещё"}
        </button>
      ) : null}
    </section>
  );
}

function ReviewCard({ review }: { review: PublicReview }) {
  return (
    <article className="rounded-lg border border-line bg-zinc-50 p-5">
      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
        <span className="font-semibold text-ink">{review.userName}</span>
        <span>{review.rating}/5</span>
        <span>{formatReviewDate(review.createdAt)}</span>
      </div>
      <p className="mt-3 break-words leading-7 text-zinc-700">{review.text}</p>
    </article>
  );
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU").format(new Date(value));
}
