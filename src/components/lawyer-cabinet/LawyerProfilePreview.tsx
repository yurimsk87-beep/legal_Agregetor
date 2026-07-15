"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { emptyLawyerProfile, mockLawyerProfile, type LawyerProfileDraft } from "@/lib/lawyer-cabinet-mock";

const storageKey = "pravopoisk-lawyer-profile-draft";
const initialProfile = process.env.NODE_ENV === "production" ? emptyLawyerProfile : mockLawyerProfile;

export function ProfilePreview() {
  const [profile, setProfile] = useState<LawyerProfileDraft>(initialProfile);

  useEffect(() => {
    async function loadProfile() {
      const response = await fetch("/api/lawyer-cabinet/profile", { cache: "no-store" }).catch(() => null);
      if (response?.ok) {
        const data = (await response.json()) as { profile?: LawyerProfileDraft };
        if (data.profile) {
          setProfile(data.profile);
          return;
        }
      }

      const saved = window.localStorage.getItem(storageKey);
      if (saved) setProfile(JSON.parse(saved) as LawyerProfileDraft);
    }

    loadProfile();
  }, []);

  return (
    <section className="grid gap-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
        Предпросмотр. Эта страница не индексируется и видна только вам.
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/lawyer-cabinet/profile/" className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-trust">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Вернуться к редактированию
        </Link>
      </div>

      <article className="rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <div className="rounded-lg bg-emerald-50 p-5 text-center">
            {profile.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photoUrl} alt={`Фото профиля ${profile.fullName}`} className="mx-auto h-28 w-28 rounded-full object-cover" />
            ) : (
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-trust text-3xl font-bold text-white">
                {profile.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("")}
              </div>
            )}
            <button type="button" className="mt-5 w-full rounded-md bg-trust px-4 py-3 text-sm font-semibold text-white">
              Обратиться через платформу
            </button>
            <p className="mt-3 text-xs leading-5 text-zinc-600">Контакты не показываются. Обращение идет через платформу.</p>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-4xl font-semibold text-ink">{profile.fullName}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Профиль проверяется
              </span>
            </div>
            <p className="mt-2 text-lg text-zinc-700">{profile.headline}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-zinc-100 px-3 py-1">{profile.city}</span>
              <span className="rounded-full bg-zinc-100 px-3 py-1">{profile.legalStatus}</span>
              <span className="rounded-full bg-zinc-100 px-3 py-1">Стаж {profile.experienceYears} лет</span>
            </div>
            <p className="mt-5 leading-8 text-zinc-700">{profile.cardDescription}</p>
          </div>
        </div>
      </article>

      <PreviewSection title="Специализации" items={profile.primarySpecializations} />
      <PreviewSection title="Форматы работы" items={profile.workFormats} />
      <TextSection title="Описание" paragraphs={[profile.about, profile.helpWith, profile.caseTypes, profile.consultationProcess, profile.advantages, profile.clientPreparation]} />

      {profile.visibility.experience ? (
        <ListSection
          title="Опыт работы"
          items={profile.experience.map((item) => ({
            title: `${item.position} · ${item.organization}`,
            meta: `${item.city} · ${item.startDate} — ${item.current ? "по настоящее время" : item.endDate}`,
            text: item.description
          }))}
        />
      ) : null}

      {profile.visibility.education ? (
        <ListSection
          title="Образование"
          items={profile.education.map((item) => ({
            title: item.institution,
            meta: `${item.faculty} · ${item.specialty} · ${item.qualification} · ${item.graduationYear}`,
            text: item.description
          }))}
        />
      ) : null}

      {profile.visibility.services ? (
        <ListSection
          title="Услуги и цены"
          items={profile.services.map((item) => ({
            title: item.title,
            meta: priceLabel(item),
            text: item.description
          }))}
        />
      ) : null}

      {profile.visibility.courtCases ? (
        <ListSection
          title="Судебные дела"
          items={profile.courtCases.map((item) => ({
            title: item.title,
            meta: `${item.court} · ${item.category} · ${item.year} · ${item.result}`,
            text: item.description
          }))}
        />
      ) : null}

      <ListSection title="Публикации" items={[]} emptyText="Пока нет публикаций." />
      <ListSection title="Отзывы" items={[]} emptyText="Пока нет отзывов." />
    </section>
  );
}

function PreviewSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-950">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function TextSection({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  return (
    <section className="rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      <div className="mt-4 grid gap-3 leading-7 text-zinc-700">
        {paragraphs.filter(Boolean).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

function ListSection({
  title,
  items,
  emptyText = "Данные пока не добавлены."
}: {
  title: string;
  items: Array<{ title: string; meta: string; text: string }>;
  emptyText?: string;
}) {
  return (
    <section className="rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      <div className="mt-4 grid gap-3">
        {items.length ? (
          items.map((item) => (
            <article key={`${item.title}-${item.meta}`} className="rounded-lg border border-line bg-zinc-50 p-4">
              <h3 className="font-semibold text-ink">{item.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">{item.meta}</p>
              {item.text ? <p className="mt-3 leading-7 text-zinc-700">{item.text}</p> : null}
            </article>
          ))
        ) : (
          <p className="rounded-md bg-zinc-50 p-4 text-sm text-zinc-600">{emptyText}</p>
        )}
      </div>
    </section>
  );
}

function priceLabel(item: { priceType: string; priceFrom: string; priceTo: string; fixedPrice: string }) {
  if (item.priceType === "Бесплатно") return "Бесплатно";
  if (item.priceType === "Фиксированная") return `${item.fixedPrice || "0"} ₽`;
  if (item.priceType === "Диапазон") return `${item.priceFrom || "0"}–${item.priceTo || "0"} ₽`;
  if (item.priceType === "От") return `от ${item.priceFrom || "0"} ₽`;
  return "По договоренности";
}
