import Link from "next/link";
import { FilePenLine } from "lucide-react";
import { lawyerDashboardStats } from "@/lib/lawyer-cabinet-mock";

const profileTodo = [
  "Основная информация",
  "Фото",
  "Специализации",
  "Описание",
  "Опыт работы",
  "Образование",
  "Услуги и цены",
  "Судебные дела",
  "Публикации"
];

const activityFactors = [
  "заполненность профиля",
  "полезные ответы без контактов",
  "публикации",
  "дела из практики",
  "просмотры профиля",
  "соблюдение правил платформы"
];

export function LawyerDashboardCards({ stats = process.env.NODE_ENV === "production" ? [] : lawyerDashboardStats }: { stats?: string[][] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(([label, value]) => (
        <article key={label} className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
        </article>
      ))}
    </div>
  );
}

export function LawyerDashboard({ stats, activityScore = 0 }: { stats?: string[][]; activityScore?: number }) {
  return (
    <section className="grid gap-6">
      <div className="rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-trust">ПравоПоиск</p>
        <h1 className="mt-2 text-4xl font-semibold text-ink">Кабинет юриста</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-zinc-600">
          Управляйте профилем, отвечайте на вопросы и развивайте публичную страницу.
        </p>
      </div>

      <LawyerDashboardCards stats={stats} />

      <section className="rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[220px_1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-trust">Активность профиля</p>
            <p className="mt-2 text-5xl font-semibold text-ink">{activityScore}/100</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-ink">Ваш показатель активности</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
              Он зависит от заполненности профиля, полезных ответов, публикаций, дел из практики и соблюдения правил платформы.
              Этот показатель не обещает первое место в выдаче и не смешивается с рейтингом по отзывам.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {activityFactors.map((item) => (
                <span key={item} className="rounded-md border border-line bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-ink">Что заполнить в профиле</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Чем полнее профиль, тем понятнее пользователю ваш опыт. Прямые контакты в профиле не публикуются.
            </p>
          </div>
          <Link href="/lawyer-cabinet/profile/" className="inline-flex items-center gap-2 rounded-md bg-trust px-4 py-3 text-sm font-semibold text-white hover:bg-ink">
            <FilePenLine className="h-4 w-4" aria-hidden="true" />
            Редактировать профиль
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profileTodo.map((item) => (
            <div key={item} className="rounded-md border border-line bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-ink">Как усилить профиль</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
          Активные и проверенные юристы получают больше доверия, просмотров профиля и обращений через платформу.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Заполните профиль полностью",
            "Выберите города и специализации",
            "Отвечайте на вопросы без контактов",
            "Публикуйте полезные материалы",
            "Собирайте отзывы после консультаций",
            "Соблюдайте правила платформы"
          ].map((item) => (
            <div key={item} className="rounded-md border border-line bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
              {item}
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
