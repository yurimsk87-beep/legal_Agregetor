import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { DocumentCard, ProblemCard, RelatedLawyersBlock, RelatedQuestionsBlock, SectionHeading } from "@/components/navigator/NavigatorBlocks";
import { breadcrumbJsonLd, legalServiceJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { getDiverseCategoryQuestions, getRelatedLawyersBySpecializations } from "@/lib/navigator-relations";
import { categoryQuestionPhrases } from "@/data/related-questions-context";
import type { Lawyer, Question } from "@/lib/types";
import { getLegalCategory, legalCategories } from "@/data/legal-categories";
import type { LegalProblem } from "@/data/legal-problems";
import { getProblemsByCategory } from "@/data/legal-problems";
import type { NavigatorDocument } from "@/data/documents";
import { navigatorDocuments } from "@/data/documents";

type PageProps = { params: Promise<{ category: string }> };

type CategoryPageCopy = {
  title: string;
  description: string;
  h1: string;
  subtitle: string;
  intro: string;
  problemOrder: string[];
  documentSlugs: string[];
  documentsTitle: string;
  documentsDescription: string;
  questionsTitle: string;
  questionsDescription: string;
  questionsEmpty: string;
  lawyersTitle: string;
  lawyersDescription: string;
  lawyersEmpty: string;
};

const categoryPageCopy: Record<string, CategoryPageCopy> = {
  "dolgi-kredity-i-pristavy": {
    title: "Долги и кредиты — судебный приказ, банк, МФО, коллекторы и документы",
    description: "Разберите ситуацию с долгом: судебный приказ, иск банка, коллекторы, МФО, срок давности, списания и документы для защиты.",
    h1: "Долги, кредиты и приставы",
    subtitle: "Выберите похожую ситуацию: судебный приказ, приставы, арест карты, банк, МФО, коллекторы, списание денег или срок давности.",
    intro:
      "Раздел помогает разобраться с долгами, кредитами, судебными приказами, приставами, коллекторами, банками и МФО. Выберите похожую ситуацию — покажем сроки, риски, документы и следующий шаг.",
    problemOrder: [
      "sudebnyy-prikaz",
      "ispolnitelnoe-proizvodstvo",
      "arest-karty-ili-scheta",
      "spisanie-deneg-pristavami",
      "sohranenie-prozhitochnogo-minimuma",
      "bank-podal-v-sud-po-kreditu",
      "kollektory-ugrozhayut",
      "kollektory",
      "mfo-trebuet-vernut-dolg",
      "mikrozaymy",
      "kredit",
      "ne-mozhete-platit-kredit",
      "ogromnye-procenty-po-dolgu",
      "srok-davnosti-po-dolgu",
      "bank-spisal-dengi-bez-soglasiya",
      "prodali-dolg-kollektoram",
      "restrukturizaciya-dolga",
      "bankrotstvo-fizicheskogo-lica",
      "chuzhoy-dolg",
      "oshibochnoe-vzyskanie",
      "zapret-na-vyezd"
    ],
    documentSlugs: [
      "vozrazhenie-na-sudebnyy-prikaz",
      "zayavlenie-o-vosstanovlenii-sroka-na-otmenu-sudebnogo-prikaza",
      "vozrazhenie-na-isk",
      "hodataystvo-o-primenenii-sroka-iskovoy-davnosti",
      "hodataystvo-ob-umenshenii-neustoyki-po-st-333-gk-rf",
      "zayavlenie-o-rassrochke-ispolneniya-resheniya",
      "zhaloba-na-sudebnogo-pristava",
      "zhaloba-na-kollektorov-v-fssp"
    ],
    documentsTitle: "Документы по долгам и кредитам",
    documentsDescription: "Выберите документ по этапу спора: судебный приказ, иск, приставы, коллекторы или реструктуризация.",
    questionsTitle: "Похожие вопросы по долгам",
    questionsDescription: "Показываем вопросы по кредитам, судебным приказам, банкам, МФО, коллекторам и взысканию.",
    questionsEmpty: "Пока нет опубликованных ответов по этой теме. Вы можете задать вопрос юристу или выбрать похожую ситуацию.",
    lawyersTitle: "Юристы по долгам и кредитам",
    lawyersDescription: "Показываем специалистов по кредитам, банкам, взысканию, банкротству и исполнительному производству.",
    lawyersEmpty: "Пока нет юристов с точной специализацией по долгам. Вы можете задать вопрос или открыть общий каталог юристов."
  }
};

const debtQuestionKeywords = [
  "долг",
  "кредит",
  "банк",
  "мфо",
  "займ",
  "коллектор",
  "судебный приказ",
  "взыскание",
  "пристав",
  "срок давности",
  "процент",
  "штраф",
  "пени",
  "неустойк",
  "списал"
];

const debtLawyerKeywords = ["долг", "кредит", "банк", "мфо", "взыскан", "исполнитель", "банкрот", "арбитраж", "гражданск"];

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return legalCategories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getLegalCategory(categorySlug);
  if (!category) {
    return buildMetadata({
      title: "Категория не найдена",
      description: "Категория правового навигатора не найдена.",
      path: `/problems/${categorySlug}/`,
      isIndexable: false
    });
  }

  const pageCopy = categoryPageCopy[category.slug];

  return buildMetadata({
    title: pageCopy?.title ?? `${category.title} — ситуации, сроки, риски и документы`,
    description: pageCopy?.description ?? `Разбираем ситуации по теме «${category.title}»: что проверить, какие сроки учесть, какие документы подготовить и когда нужен юрист.`,
    path: `/problems/${category.slug}/`,
    // Индексируем только раздел «Семья и дети»; остальные подразделы закрыты.
    isIndexable: category.slug === "semya-i-deti"
  });
}

// Блок рекомендуемых документов на странице категории: ссылка «Сформировать
// документ» ведёт сразу на нужный вариант генератора под тему категории, а не на
// общий генератор. Пока заполнено для «долги и кредиты» (по запросу).
const CATEGORY_DOCUMENT_VARIANT: Record<string, Record<string, string>> = {
  "dolgi-kredity-i-pristavy": {
    "vozrazhenie-na-sudebnyy-prikaz": "credit-loan",
    "zayavlenie-o-vosstanovlenii-sroka-na-otmenu-sudebnogo-prikaza": "late-copy",
    "zhaloba-na-sudebnogo-pristava": "money-withdrawn",
    "zayavlenie-o-snyatii-aresta-so-scheta": "salary-account"
  }
};

export default async function ProblemCategoryPage({ params }: PageProps) {
  const { category: categorySlug } = await params;
  const category = getLegalCategory(categorySlug);
  if (!category) notFound();

  const pageCopy = categoryPageCopy[category.slug];
  const problems = sortProblems(getProblemsByCategory(category.slug), pageCopy?.problemOrder);
  const relatedDocuments = getCategoryDocuments(pageCopy?.documentSlugs);
  const [relatedQuestions, relatedLawyers] = await Promise.all([
    getDiverseCategoryQuestions(categoryQuestionPhrases(category.slug, category.questionTopics)),
    getRelatedLawyersBySpecializations(category.lawyerSpecializations)
  ]);
  const visibleQuestions = category.slug === "dolgi-kredity-i-pristavy" ? filterDebtQuestions(relatedQuestions) : relatedQuestions;
  const visibleLawyers = category.slug === "dolgi-kredity-i-pristavy" ? filterDebtLawyers(relatedLawyers) : relatedLawyers;
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Правовой навигатор", path: "/problems/" },
    { name: category.title, path: `/problems/${category.slug}/` }
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbs),
          legalServiceJsonLd({
            path: `/problems/${category.slug}/`,
            name: pageCopy?.h1 ?? category.title,
            description: pageCopy?.description ?? category.description,
            lawyers: visibleLawyers
          })
        ]}
      />
      <Breadcrumbs items={breadcrumbs} />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-trust">Правовой навигатор</p>
        <h1 className="mt-2 text-4xl font-semibold text-ink">{pageCopy?.h1 ?? category.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-700">{pageCopy?.subtitle ?? category.userProblem}</p>
        {pageCopy?.intro ? <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600">{pageCopy.intro}</p> : null}
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeading title="Жизненные ситуации" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {problems.map((problem) => (
            <ProblemCard key={problem.slug} problem={problem} />
          ))}
        </div>
      </section>
      {relatedDocuments.length ? (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <SectionHeading title={pageCopy?.documentsTitle ?? "Документы"} description={pageCopy?.documentsDescription ?? "Подберите документ под этап вашей ситуации."} />
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {relatedDocuments.map((document) => (
                <DocumentCard
                  key={document.slug}
                  document={document}
                  variantKey={CATEGORY_DOCUMENT_VARIANT[categorySlug]?.[document.slug]}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {visibleQuestions.length || pageCopy ? (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <SectionHeading title={pageCopy?.questionsTitle ?? "Похожие вопросы"} description={pageCopy?.questionsDescription ?? "Реальные Q&A по темам этой категории."} />
            <div className="mt-6">
              {visibleQuestions.length ? (
                <RelatedQuestionsBlock questions={visibleQuestions} />
              ) : (
                <CategoryEmptyState actionHref="/questions/#question" actionLabel="Задать вопрос юристу" text={pageCopy?.questionsEmpty ?? "Пока нет опубликованных вопросов по этой теме."} />
              )}
            </div>
          </div>
        </section>
      ) : null}
      {visibleLawyers.length || pageCopy ? (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading title={pageCopy?.lawyersTitle ?? "Юристы по теме"} description={pageCopy?.lawyersDescription} />
          <div className="mt-6">
            {visibleLawyers.length ? (
              <RelatedLawyersBlock lawyers={visibleLawyers} />
            ) : (
              <CategoryEmptyState actionHref="/lawyers/" actionLabel="Посмотреть юристов" secondaryHref="/questions/#question" secondaryLabel="Задать вопрос юристу" text={pageCopy?.lawyersEmpty ?? "Пока нет юристов с точной специализацией."} />
            )}
          </div>
        </section>
      ) : null}
    </>
  );
}

function sortProblems(problems: LegalProblem[], order?: string[]) {
  if (!order?.length) return problems;
  const rank = new Map(order.map((slug, index) => [slug, index]));
  return [...problems].sort((a, b) => (rank.get(a.slug) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.slug) ?? Number.MAX_SAFE_INTEGER));
}

function getCategoryDocuments(slugs: string[] | undefined) {
  if (!slugs?.length) return [];
  const documentsBySlug = new Map(navigatorDocuments.map((document) => [document.slug, document]));
  return slugs.map((slug) => documentsBySlug.get(slug)).filter((document): document is NavigatorDocument => Boolean(document));
}

function CategoryEmptyState({
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
  text
}: {
  actionHref: string;
  actionLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
      <p className="max-w-3xl leading-7 text-zinc-700">{text}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={actionHref} className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
          {actionLabel}
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link href={secondaryHref} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function filterDebtQuestions(questions: Question[]) {
  return questions.filter((question) => hasPublishedAnswer(question) && isDebtQuestion(question));
}

function hasPublishedAnswer(question: Question) {
  return question.answers.some((answer) => answer.status === "PUBLISHED" && !answer.containsContactAttempt && !answer.containsGenericLeadBait);
}

function isDebtQuestion(question: Question) {
  const haystack = [question.title, question.text, question.summary ?? "", question.service?.name ?? "", question.category ?? "", ...(question.tags ?? [])].join(" ").toLowerCase();
  return debtQuestionKeywords.some((keyword) => haystack.includes(keyword));
}

function filterDebtLawyers(lawyers: Lawyer[]) {
  return lawyers.filter((lawyer) => {
    const haystack = lawyer.services.map((service) => service.name).join(" ").toLowerCase();
    return debtLawyerKeywords.some((keyword) => haystack.includes(keyword));
  });
}
