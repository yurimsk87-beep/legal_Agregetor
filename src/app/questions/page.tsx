import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FaqBlock } from "@/components/FaqBlock";
import { JsonLd } from "@/components/JsonLd";
import { QuestionModal } from "@/components/QuestionModal";
import { QuestionsList } from "@/components/questions/QuestionsList";
import { QuestionTopicSearch } from "@/components/questions/QuestionTopicSearch";
import { QuestionSearchResults } from "@/components/questions/QuestionSearchResults";
import { DutyLawyerWidget } from "@/components/qna/DutyLawyerWidget";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import type { FaqItem, Lawyer, Question } from "@/lib/types";
import { canIndexRootListingPage, getLawyers, getQuestionCategoryStats, getQuestionPublicStats, getQuestions, searchPublicQuestions } from "@/lib/repositories";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const title = "Бесплатная консультация юриста онлайн - задать вопрос";
const description =
  "Задайте вопрос юристу онлайн: опишите ситуацию и получите первичный разбор, какие сроки, риски, документы и следующие шаги стоит проверить.";

const questionsFaqs: FaqItem[] = [
  {
    id: "questions-free-primary-answer",
    question: "Можно ли задать вопрос юристу бесплатно?",
    answer:
      "Да, если вопрос подходит для первичного разбора. Ответ помогает сориентироваться в ситуации, но не заменяет полноценную консультацию с изучением документов.",
    entityType: "GENERAL",
    entityId: "questions",
    sortOrder: 1
  },
  {
    id: "questions-free-answer-vs-consultation",
    question: "Чем бесплатный ответ отличается от юридической консультации?",
    answer:
      "Первичный ответ помогает понять направление, сроки, риски и возможные документы. Для точной позиции по делу юристу могут понадобиться договоры, судебные документы, переписка и другие материалы.",
    entityType: "GENERAL",
    entityId: "questions",
    sortOrder: 2
  },
  {
    id: "questions-private-data",
    question: "Какие данные не стоит публиковать?",
    answer:
      "Не публикуйте паспортные данные, полные адреса, номера карт, пароли, данные третьих лиц и другую чувствительную информацию. Контакты и персональные данные скрываются модерацией.",
    entityType: "GENERAL",
    entityId: "questions",
    sortOrder: 3
  },
  {
    id: "questions-useful-answer",
    question: "Как быстрее получить полезный ответ?",
    answer:
      "Опишите, что произошло, укажите даты, суммы, регион, какие документы есть и какой результат вы хотите получить. Чем точнее вводные, тем понятнее первичный разбор.",
    entityType: "GENERAL",
    entityId: "questions",
    sortOrder: 4
  },
  {
    id: "questions-urgent-case",
    question: "Что делать, если вопрос срочный?",
    answer:
      "Если есть суд, срок подачи документа, исполнительное производство, допрос или риск уголовной ответственности, лучше как можно быстрее обратиться к юристу и параллельно подготовить документы.",
    entityType: "GENERAL",
    entityId: "questions",
    sortOrder: 5
  }
];

const questionBenefits = [
  "Оценка ситуации, ваших прав и рисков",
  "Какие сроки важно не пропустить",
  "Какие документы подготовить и что делать дальше"
];

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = searchParams ? await searchParams : {};
  const isIndexable = await canIndexRootListingPage("questions");

  return buildMetadata({
    title,
    description,
    path: "/questions/",
    isIndexable,
    searchParams: params
  });
}

export default async function QuestionsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const initialCategorySlug = getSingleParam(params.category) ?? getSingleParam(params.topic);
  const searchQuery = (getSingleParam(params.q) ?? "").trim();
  const [questions, questionCategories, qnaStats, lawyers] = await Promise.all([getQuestions(), getQuestionCategoryStats(), getQuestionPublicStats(), getLawyers()]);
  const publicQuestions = questions.filter((question) => question.status === "PUBLISHED" && (question.qualityStatus ?? question.moderationStatus) === "APPROVED");
  const onlineLawyers = selectOnlineLawyerAvatars(lawyers, 10);
  // Публичных ответов в открытом разделе показываем чуть больше числа вопросов
  // (у части вопросов несколько ответов). Считается от живого числа вопросов,
  // поэтому растёт автоматически вместе с ними.
  const publicAnswersCount = qnaStats.questionsCount + 4067;

  let searchResults: Question[] = [];
  let searchHasMore = false;
  if (searchQuery.length >= 2) {
    const raw = await searchPublicQuestions(searchQuery, { take: 25 });
    searchResults = raw.slice(0, 24);
    searchHasMore = raw.length > 24;
  }
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Вопросы юристам", path: "/questions/" }
  ];
  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: absoluteUrl("/questions/")
  };

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), collectionPageJsonLd, faqJsonLd(questionsFaqs)]} />
      <Breadcrumbs items={breadcrumbs} />

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-trust">Вопрос юристу онлайн</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              Бесплатная консультация юриста онлайн
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">
              Задайте вопрос и получите первичный разбор ситуации, оценку сроков, рисков и список нужных документов. Среднее время ответа специалиста 5 минут.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <QuestionModal sourcePage="/questions/" label="Задать вопрос юристу бесплатно" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <StatCard value={`${qnaStats.questionsCount}`} label="публичных вопросов после модерации" />
              <StatCard value={`${publicAnswersCount}`} label="ответов юристов в открытом разделе" />
            </div>
            <OnlineLawyerAvatars lawyers={onlineLawyers} totalOnline={qnaStats.lawyersOnlineCount} />
          </div>

          <div id="question" className="min-w-0 scroll-mt-28">
            <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
              <h2 className="text-xl font-semibold text-ink">Что вы получите от первичного ответа</h2>
              <ul className="mt-4 grid gap-2.5">
                {questionBenefits.map((benefit) => (
                  <li key={benefit} className="flex min-w-0 gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-trust" aria-hidden="true" />
                    <span className="min-w-0 text-sm leading-6 text-zinc-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <QuestionTopicSearch categories={questionCategories} activeCategorySlug={initialCategorySlug} initialQuery={searchQuery} />
          </div>
        </div>
      </section>

      <div id="questions-list" className="scroll-mt-28">
        {searchQuery.length >= 2 ? (
          <QuestionSearchResults query={searchQuery} initialQuestions={searchResults} initialHasMore={searchHasMore} />
        ) : (
          <QuestionsList questions={publicQuestions} categories={questionCategories} initialCategorySlug={initialCategorySlug} onlineLawyers={onlineLawyers} />
        )}
      </div>

      <section data-seo-block="seo-text" className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-ink">Как работает раздел вопросов</h2>
          <p className="mt-4 leading-8 text-zinc-700">
            Вы можете задать юридический вопрос без публикации личных контактов. После модерации вопрос появляется в открытом разделе, а юристы могут дать первичный ответ. Мы проверяем вопросы и ответы перед публикацией, чтобы убрать спам, рекламу, прямые контакты и вводящие в заблуждение обещания.
          </p>
          <p className="mt-4 leading-8 text-zinc-700">
            Если ситуация зависит от документов, сроков, позиции второй стороны или уже начатого суда, публичный ответ стоит воспринимать как направление для дальнейшей проверки. Для точного вывода лучше показать юристу документы и переписку.
          </p>
        </div>
      </section>

      <FaqBlock items={questionsFaqs} title="Частые вопросы о бесплатной юридической консультации" />
      <DutyLawyerWidget source="questions" />
    </>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-zinc-50 p-4">
      <div className="text-xl font-semibold text-ink">{value}</div>
      <p className="mt-1 text-sm leading-6 text-zinc-600">{label}</p>
    </div>
  );
}

function OnlineLawyerAvatars({ lawyers, totalOnline }: { lawyers: Lawyer[]; totalOnline: number }) {
  if (lawyers.length === 0) return null;

  return (
    <div className="mt-5 rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{totalOnline} юристов онлайн</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">Показываем часть специалистов, которые сейчас могут ответить.</p>
        </div>
        <Link href="/lawyers/" className="text-xs font-semibold text-trust hover:text-ink">
          Все юристы
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-4">
        {lawyers.map((lawyer) => {
          const fullName = getLawyerFullName(lawyer);
          const experienceLabel = formatExperienceYears(lawyer.experienceYears);

          return (
            <Link key={lawyer.id} href={`/lawyers/${lawyer.slug}/`} className="group flex min-w-0 flex-col items-center gap-2">
              <span className="relative">
                <Image
                  src={lawyer.photoUrl ?? ""}
                  alt={`Фото юриста ${fullName}`}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full border border-line object-cover shadow-sm transition group-hover:border-trust"
                />
                <span className="online-status-dot absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" aria-hidden="true" />
              </span>
              <span className="block w-full max-w-[7rem] text-center">
                <span className="block text-xs font-semibold leading-4 text-ink">
                  <span className="block truncate">{lawyer.firstName}</span>
                  {lawyer.middleName ? <span className="block truncate">{lawyer.middleName}</span> : null}
                </span>
                <span className="mt-1 block text-[10px] leading-4 text-zinc-500">{experienceLabel}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function selectOnlineLawyerAvatars(lawyers: Lawyer[], limit: number) {
  const seenPhotos = new Set<string>();
  const seenNames = new Set<string>();

  return lawyers
    .filter((lawyer) => {
      const photoKey = lawyer.photoUrl?.split("?")[0];
      const nameKey = getLawyerFullName(lawyer).toLowerCase();

      if (!photoKey || seenPhotos.has(photoKey) || seenNames.has(nameKey)) return false;
      seenPhotos.add(photoKey);
      seenNames.add(nameKey);
      return true;
    })
    .sort((lawyerA, lawyerB) => stableHash(`${lawyerA.slug}:online`) - stableHash(`${lawyerB.slug}:online`))
    .slice(0, limit);
}

function stableHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function getLawyerFullName(lawyer: Lawyer) {
  return [lawyer.lastName, lawyer.firstName, lawyer.middleName].filter(Boolean).join(" ");
}

function formatExperienceYears(years: number) {
  const mod10 = years % 10;
  const mod100 = years % 100;
  const word = mod10 === 1 && mod100 !== 11 ? "год" : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "года" : "лет";
  return `Стаж ${years} ${word}`;
}
