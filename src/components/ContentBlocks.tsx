import Link from "next/link";
import { ArrowRight, CheckCircle2, Scale, ShieldCheck } from "lucide-react";
import { formatQuestionNumber } from "@/lib/question-display";
import type { Article, Question } from "@/lib/types";

export function TrustStrip() {
  const items = [
    "Проверяем профили специалистов",
    "Показываем опыт и специализации",
    "Объясняем сигналы доверия",
    "Модерируем вопросы и ответы",
    "Не публикуем личные контакты юристов"
  ];

  return (
    <section className="bg-ink text-white">
      <div className="mx-auto grid min-w-0 max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-5 lg:px-8">
        {items.map((item) => (
          <div key={item} className="flex min-w-0 items-start gap-2 text-sm leading-6">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
            <span className="min-w-0 break-words">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function WorkSteps() {
  const steps = [
    "Пользователь задает вопрос",
    "Вопрос проходит модерацию",
    "Юристы отвечают",
    "Ответы проходят модерацию",
    "Появляется публичная ветка"
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto min-w-0 max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-ink">Как это работает</h2>
        <div className="mt-6 grid min-w-0 gap-4 md:grid-cols-5">
          {steps.map((step, index) => (
            <article key={step} className="rounded-lg border border-line p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-trust text-sm font-bold text-white">
                {index + 1}
              </div>
              <h3 className="mt-4 font-semibold text-ink">{step}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Публикуются только проверенные вопросы и ответы без личных контактов, спама и лишних персональных данных.
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LinkGrid({
  title,
  items,
  makeHref
}: {
  title: string;
  items: Array<{ slug: string; name: string }>;
  makeHref: (item: { slug: string; name: string }) => string;
}) {
  return (
    <section className="mx-auto min-w-0 max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      <div className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={makeHref(item)}
            className="group flex min-w-0 items-center justify-between gap-2 rounded-lg border border-line bg-white p-4 text-sm font-semibold text-ink shadow-sm hover:border-trust"
          >
            <span className="min-w-0 break-words">{item.name}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-trust" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ArticleList({ articles }: { articles: Article[] }) {
  void articles;
  return null;
}

export function QuestionList({ questions }: { questions: Question[] }) {
  if (questions.length === 0) return null;

  return (
    <section className="mx-auto min-w-0 max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold text-ink">Вопрос-ответ</h2>
      <div className="mt-6 grid min-w-0 gap-4 md:grid-cols-2">
        {questions.slice(0, 6).map((question) => (
          <Link key={question.slug} href={`/questions/${question.slug}/`} className="min-w-0 rounded-lg border border-line bg-white p-5 hover:border-trust">
            <Scale className="h-5 w-5 text-trust" aria-hidden="true" />
            <div className="mt-3 text-xs font-semibold uppercase text-zinc-500">{formatQuestionNumber(question.publicNumber)}</div>
            <h3 className="mt-3 break-words font-semibold text-ink">{question.title}</h3>
            <p className="mt-2 break-words text-sm leading-6 text-zinc-600">{question.text}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function SeoText({ title, text }: { title: string; text: string }) {
  return (
    <section data-seo-block="seo-text" className="bg-zinc-50">
      <div className="mx-auto min-w-0 max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-ink">{title}</h2>
        <div className="mt-4 space-y-4 text-base leading-8 text-zinc-700">
          {text.split("\n").filter(Boolean).map((paragraph) => (
            <p key={paragraph} className="break-words">{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mx-auto min-w-0 max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      <div className="mt-6 grid min-w-0 gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item} className="flex min-w-0 items-start gap-3 rounded-lg border border-line bg-white p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-leaf" aria-hidden="true" />
            <span className="min-w-0 break-words text-sm leading-6 text-zinc-700">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
