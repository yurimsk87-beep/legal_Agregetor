import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeading } from "@/components/navigator/NavigatorBlocks";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import type { FaqItem } from "@/lib/types";
import { legalCategories } from "@/data/legal-categories";
import { legalProblems } from "@/data/legal-problems";

const heroHints = [
  { label: "Судебный приказ", href: "/problems/dolgi-kredity-i-pristavy/sudebnyy-prikaz/" },
  { label: "Приставы списали деньги", href: "/problems/dolgi-kredity-i-pristavy/spisali-dengi-pristavy/" },
  { label: "Не выплатили зарплату", href: "/problems/rabota-zarplata-i-trudovye-prava/ne-vyplatili-zarplatu/" },
  { label: "Алименты", href: "/problems/semya-i-deti/alimenty/" },
  { label: "Затопили соседи", href: "/problems/zhkh-i-kommunalnye-uslugi/zatopili-sosedi/" },
  { label: "Возврат денег", href: "/problems/pokupki-uslugi-i-zashchita-potrebiteley/vernut-dengi-za-tovar/" }
];

const primaryCategoryCards = [
  {
    slug: "dolgi-kredity-i-pristavy",
    title: "Долги, кредиты и приставы",
    description: "Судебные приказы, списания, аресты карт, кредиты, МФО и жалобы на приставов."
  },
  {
    slug: "semya-i-deti",
    title: "Семья и дети",
    description: "Развод, алименты, дети, раздел имущества, опека и семейные споры."
  },
  {
    slug: "rabota-zarplata-i-trudovye-prava",
    title: "Работа и зарплата",
    description: "Невыплата зарплаты, увольнение, сокращение, отпуск, больничный и трудовые споры."
  },
  {
    slug: "zhile-nedvizhimost-i-zemlya",
    title: "Жильё и ЖКХ",
    description: "Квартира, залив, управляющая компания, коммунальные платежи, аренда и соседи."
  },
  {
    slug: "pokupki-uslugi-i-zashchita-potrebiteley",
    title: "Покупки и услуги",
    description: "Возврат денег, некачественный товар, услуги, гарантия, маркетплейсы и претензии."
  },
  {
    slug: "sud-zhaloby-i-zashchita-prav",
    title: "Суд и жалобы",
    description: "Иски, судебные приказы, апелляции, жалобы, сроки и подготовка документов."
  },
  {
    slug: "nasledstvo",
    title: "Наследство",
    description: "Сроки вступления, завещание, доли, долги наследодателя и споры наследников."
  },
  {
    slug: "avto-dtp-shtrafy-i-transport",
    title: "Авто и ДТП",
    description: "ДТП, ОСАГО, штрафы, лишение прав, автосервис и покупка автомобиля."
  }
];

const primaryCategorySlugs = new Set(primaryCategoryCards.map((category) => category.slug));
const secondaryCategories = legalCategories.filter((category) => !primaryCategorySlugs.has(category.slug));

const popularSituationCards = [
  {
    slug: "sudebnyy-prikaz",
    title: "Пришёл судебный приказ",
    description: "Проверьте срок и подготовьте возражение, если не согласны с взысканием."
  },
  {
    slug: "spisali-dengi-pristavy",
    title: "Приставы списали деньги с карты",
    description: "Разберитесь, кто списал деньги, на каком основании и что можно сделать дальше."
  },
  {
    slug: "ne-vyplatili-zarplatu",
    title: "Не выплатили зарплату",
    description: "Соберите подтверждения долга и выберите способ обращения: работодатель, инспекция или суд."
  },
  {
    slug: "alimenty",
    title: "Алименты",
    description: "Поймите, когда нужен судебный приказ, соглашение или исковое заявление."
  },
  {
    slug: "zatopili-sosedi",
    title: "Затопили соседи",
    description: "Зафиксируйте ущерб, составьте акт и подготовьте требование о компенсации."
  },
  {
    slug: "vernut-dengi-za-tovar",
    title: "Вернуть деньги за товар или услугу",
    description: "Подготовьте претензию и проверьте сроки ответа продавца или исполнителя."
  }
];

const popularSituationItems = popularSituationCards.flatMap((item) => {
  const problem = legalProblems.find((candidate) => candidate.slug === item.slug);
  return problem ? [{ ...item, href: `/problems/${problem.categorySlug}/${problem.slug}/` }] : [];
});

const startScenarios = [
  ["Не знаете, какой документ нужен", "Откройте ситуацию — сервис покажет, какие документы могут подойти."],
  ["Есть сроки или риск списаний", "Проверьте важные даты и возможные последствия."],
  ["Нужен юрист", "Если ситуация сложная, можно передать описание и документы реальному юристу на разбор."]
];

const usageSteps = [
  ["Опишите проблему", "Введите запрос своими словами или выберите тему."],
  ["Откройте подходящую ситуацию", "Посмотрите сроки, риски, документы и первый шаг."],
  ["Передайте юристу, если нужна проверка", "Юрист сможет разобрать ситуацию и документы после прохождения этапов."]
];

const problemsFaqs: FaqItem[] = [
  {
    id: "problems-what-is",
    question: "Что такое юридическая ситуация?",
    answer:
      "Это типовая жизненная проблема: например, пришёл судебный приказ, приставы списали деньги, не выплатили зарплату или нужно оформить алименты.",
    entityType: "GENERAL",
    entityId: "problems",
    sortOrder: 1
  },
  {
    id: "problems-how-to-search",
    question: "Как найти подходящую ситуацию?",
    answer: "Введите проблему в поиск или выберите одну из основных тем. Можно писать обычными словами.",
    entityType: "GENERAL",
    entityId: "problems",
    sortOrder: 2
  },
  {
    id: "problems-what-inside",
    question: "Что есть внутри страницы ситуации?",
    answer: "Краткий разбор, сроки, риски, план действий, документы и варианты, когда стоит подключить юриста.",
    entityType: "GENERAL",
    entityId: "problems",
    sortOrder: 3
  },
  {
    id: "problems-not-found",
    question: "Что делать, если точной ситуации нет?",
    answer:
      "Опишите проблему в поиске или перейдите в раздел вопросов юристам. После уточнений ситуацию можно передать реальному юристу на разбор.",
    entityType: "GENERAL",
    entityId: "problems",
    sortOrder: 4
  }
];

export const metadata: Metadata = buildMetadata({
  title: "Юридические ситуации — правовой навигатор, документы и помощь юриста",
  description:
    "Найдите юридическую ситуацию на ПравоПоиске: судебный приказ, алименты, долги и приставы, трудовые споры, жильё, наследство и другие вопросы. Сервис покажет сроки, риски, документы и следующий шаг.",
  path: "/problems/",
  isIndexable: true
});

export default function ProblemsPage() {
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Юридические ситуации", path: "/problems/" }
  ];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), problemsCollectionJsonLd(), categoryItemListJsonLd(), faqJsonLd(problemsFaqs)]} />
      <Breadcrumbs items={breadcrumbs} />
      <HeroSection />
      <MainCategoriesSection />
      <PopularSituationsSection />
      <StartScenarioSection />
      <UsageSection />
      <FaqSection />
      <FinalCtaSection />
      <SeoTextSection />
    </>
  );
}

function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-trust">Правовой навигатор</p>
        <h1 className="mt-2 text-4xl font-semibold text-ink">Юридические ситуации</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-700">
          Опишите проблему или выберите тему — мы покажем разбор, сроки, риски, документы и случаи, когда стоит подключить юриста.
        </p>
        <form action="/questions/" role="search" className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="problem-search" className="sr-only">
            Найти юридическую ситуацию
          </label>
          <input
            id="problem-search"
            name="q"
            type="search"
            placeholder="Например: судебный приказ, списали деньги с карты, не выплатили зарплату"
            className="min-h-12 flex-1 rounded-md border border-line bg-white px-4 text-base text-ink outline-none placeholder:text-zinc-400 focus:border-trust"
          />
          <button type="submit" className="min-h-12 rounded-md bg-trust px-6 text-sm font-semibold text-white hover:bg-ink">
            Найти ситуацию
          </button>
        </form>
        <p className="mt-3 text-sm leading-6 text-zinc-600">Можно писать обычными словами — юридические термины знать не нужно.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {heroHints.map((hint) => (
            <Link
              key={hint.href}
              href={hint.href}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust hover:text-trust"
            >
              {hint.label}
            </Link>
          ))}
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-6 text-zinc-600">
          Раздел помогает начать с понятной проблемы: судебный приказ, долги у приставов, невыплата зарплаты, алименты, залив квартиры, возврат денег и другие жизненные ситуации.
        </p>
      </div>
    </section>
  );
}

function MainCategoriesSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading title="Основные темы" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {primaryCategoryCards.map((category) => (
            <Link key={category.slug} href={`/problems/${category.slug}/`} className="rounded-lg border border-line bg-white p-5 shadow-sm hover:border-trust">
              <h3 className="text-lg font-semibold text-ink">{category.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{category.description}</p>
            </Link>
          ))}
        </div>
        {secondaryCategories.length ? (
          <details className="mt-6">
            <summary className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
              Показать все категории
            </summary>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {secondaryCategories.map((category) => (
                <Link key={category.slug} href={`/problems/${category.slug}/`} className="rounded-lg border border-line bg-white p-4 shadow-sm hover:border-trust">
                  <h3 className="font-semibold text-ink">{category.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">{category.description}</p>
                </Link>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </section>
  );
}

function PopularSituationsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading title="Популярные ситуации" />
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {popularSituationItems.map((item) => (
          <article key={item.slug} className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{item.description}</p>
            <Link href={item.href} className="mt-4 inline-flex text-sm font-semibold text-trust hover:text-ink">
              Открыть разбор
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function StartScenarioSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading title="Когда начать с ситуации" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {startScenarios.map(([title, text]) => (
            <article key={title} className="rounded-lg border border-line bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function UsageSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading title="Как пользоваться разделом" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {usageSteps.map(([title, text], index) => (
          <article key={title} className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-trust text-sm font-bold text-white">{index + 1}</span>
            <h3 className="mt-4 font-semibold text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading title="Частые вопросы" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {problemsFaqs.map((item) => (
            <article key={item.id} className="rounded-lg border border-line bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-ink">{item.question}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-line bg-zinc-50 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-ink">Не нашли свою ситуацию?</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600">Опишите проблему своими словами — сервис подберёт разбор, документы и следующий шаг.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
            Найти решение
          </Link>
          <Link href="/questions/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
            Перейти к вопросам юристам
          </Link>
        </div>
      </div>
    </section>
  );
}

function SeoTextSection() {
  return (
    <section data-seo-block="seo-text" className="mx-auto max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
      <p className="text-sm leading-7 text-zinc-600">
        Раздел «Юридические ситуации» помогает найти правовой разбор по распространённым вопросам: судебный приказ, долги и приставы, алименты, трудовой спор, жилищный вопрос, наследство, возврат денег за товар или услугу, ДТП и жалобы. На страницах ситуаций можно посмотреть сроки, риски, юридические документы и возможные следующие шаги. Материалы носят справочный характер, а сложную ситуацию можно передать юристу для индивидуального разбора.
      </p>
    </section>
  );
}

function problemsCollectionJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Юридические ситуации",
    description:
      "Правовой навигатор ПравоПоиск: юридические ситуации, сроки, риски, документы и помощь юриста по семейным, жилищным, долговым, трудовым, судебным и другим правовым темам.",
    url: absoluteUrl("/problems/"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: legalCategories.length,
      itemListElement: legalCategories.map((category, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: category.title,
        url: absoluteUrl(`/problems/${category.slug}/`)
      }))
    }
  };
}

function categoryItemListJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Категории юридических ситуаций",
    itemListElement: legalCategories.map((category, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: category.title,
      description: category.description,
      url: absoluteUrl(`/problems/${category.slug}/`)
    }))
  };
}
