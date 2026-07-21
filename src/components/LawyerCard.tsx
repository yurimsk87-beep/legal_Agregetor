import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Star } from "lucide-react";
import type { Lawyer } from "@/lib/types";
import { getFullName, getInitials, getStatusLabel } from "@/lib/sample-data";
import { TrackableLink } from "@/components/TrackableLink";
import { redactForbiddenContacts } from "@/lib/contact-safety";

type LawyerCardProps = {
  lawyer: Lawyer;
  compact?: boolean;
  hideReviewCopy?: boolean;
};

export function LawyerCard({ lawyer, compact = false }: LawyerCardProps) {
  const fullName = getFullName(lawyer);
  const cityName = lawyer.cities[0]?.name ?? "Россия";
  const priceLabel = lawyer.consultationPrice
    ? `от ${lawyer.consultationPrice.toLocaleString("ru-RU")} ₽`
    : firstServicePriceLabel(lawyer.profile?.servicesAndPricesText) ?? "Стоимость по запросу";
  const ratingLabel = lawyer.reviewCount && lawyer.reviewCount > 0 ? formatProfileRating(lawyer.rating) : null;

  return (
    <article className="w-full min-w-0 rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex min-w-0 gap-4">
        {lawyer.photoUrl ? (
          <Image src={lawyer.photoUrl} alt={`Фото профиля ${fullName}`} width={64} height={64} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-wheat text-lg font-semibold text-ink">
            {getInitials(lawyer)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <TrackableLink
              href={`/lawyers/${lawyer.slug}/`}
              eventType="LAWYER_PROFILE_CLICK"
              targetType="LAWYER"
              targetId={lawyer.id}
              className="inline-flex min-h-11 max-w-full min-w-0 items-center break-words text-lg font-semibold text-ink hover:text-trust focus:outline-none focus:ring-2 focus:ring-trust/30"
            >
              {fullName}
            </TrackableLink>
            {lawyer.isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-trust">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Проверен
              </span>
            ) : null}
            {ratingLabel ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                Рейтинг {ratingLabel}/10
              </span>
            ) : null}
          </div>
          <p className="mt-1 break-words text-sm text-zinc-600">
            {getStatusLabel(lawyer.status)} · {lawyer.experienceYears} лет опыта · {cityName}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {lawyer.services.slice(0, 3).map((service) => (
              <Link
                key={service.slug}
                href={`/${service.slug}/`}
                className="inline-flex min-h-11 max-w-full items-center break-words rounded-md border border-line px-2.5 py-1 text-xs font-medium text-zinc-700 hover:border-trust hover:text-trust focus:outline-none focus:ring-2 focus:ring-trust/30"
              >
                {service.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
      {!compact ? (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-600">{redactForbiddenContacts(lawyer.description)}</p>
      ) : null}
      <div className="mt-5 grid min-w-0 gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-700">
          <span>{priceLabel}</span>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          <TrackableLink
            href={`/lawyers/${lawyer.slug}/`}
            eventType="LAWYER_PROFILE_CLICK"
            targetType="LAWYER"
            targetId={lawyer.id}
            className="inline-flex min-h-11 max-w-full min-w-0 items-center break-words rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-trust focus:outline-none focus:ring-2 focus:ring-trust/30"
          >
            Посмотреть профиль
          </TrackableLink>
        </div>
      </div>
    </article>
  );
}

function formatProfileRating(value?: number | null) {
  if (!value || value <= 0) return null;

  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(Math.min(value, 10));
}

function firstServicePriceLabel(value?: string | null) {
  if (!value) return null;

  const firstLine = value
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .find(Boolean);
  if (!firstLine) return null;

  const [, ...priceParts] = firstLine.replace(/\s+[—–]\s+/g, " - ").split(/\s+-\s+/);
  const price = priceParts.join(" - ").trim();

  return price ? `Услуги: ${price}` : firstLine;
}
