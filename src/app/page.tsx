import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  FileText,
  Route,
  SearchCheck,
  ShieldCheck
} from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { NavigatorHero, SectionHeading } from "@/components/navigator/NavigatorBlocks";
import { isAiNavigatorVisible } from "@/lib/ai/ai-navigator-visibility";
import { faqJsonLd, legalServiceJsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { getFaqs, getLawyers } from "@/lib/repositories";

export const revalidate = 900;

const title = "ПравоПоиск — юридическая помощь онлайн, документы и консультация юриста";
const description =
  "Опишите юридическую проблему на ПравоПоиске: сервис поможет разобраться в ситуации, проверить сроки и риски, подобрать документы, задать вопрос юристу онлайн или отправить документ на проверку.";

const searchOutcomes = [
  {
    icon: SearchCheck,
    title: "Разбор ситуации",
    description: "Покажем, что произошло, какие сроки и риски важно проверить."
  },
  {
    icon: Route,
    title: "План действий",
    description: "Объясним, с чего начать и какой следующий шаг выбрать."
  },
  {
    icon: FileText,
    title: "Документы под вашу ситуацию",
    description: "Подберём или сформируем заявления, жалобы, претензии и другие юридические документы."
  },
  {
    icon: FileCheck2,
    title: "Проверка реальным юристом",
    description: "После прохождения этапов можно передать ситуацию и документы юристу для индивидуального разбора."
  }
];

const serviceSteps = [
  ["Опишите проблему", "Напишите вопрос своими словами или выберите подсказку."],
  ["Получите разбор и документы", "Сервис покажет сроки, риски, план действий и подходящие документы."],
  ["Передайте юристу, если нужна проверка", "Юрист сможет посмотреть вашу ситуацию, документы и дать индивидуальный разбор."]
];

const trustItems = [
  "Документы и инструкции подготовлены с учётом законодательства РФ.",
  "Материалы помогают сориентироваться, но не заменяют индивидуальную консультацию юриста.",
  "Сложную ситуацию или важный документ можно передать реальному юристу на разбор."
];

const navigationLinks = [
  {
    title: "О проекте",
    description: "Как работает ПравоПоиск и чем он может помочь.",
    href: "/about/"
  },
  {
    title: "Ситуации",
    description: "Разборы типовых юридических проблем.",
    href: "/problems/"
  },
  {
    title: "Документы",
    description: "Шаблоны заявлений, жалоб и претензий.",
    href: "/documents/"
  },
  {
    title: "Вопросы юристам",
    description: "Ответы на вопросы пользователей.",
    href: "/questions/"
  },
  {
    title: "Юристы",
    description: "Профили специалистов и информация для выбора юриста.",
    href: "/lawyers/"
  },
  {
    title: "Проверка документов",
    description: "Загрузите документ, проверьте сроки и риски, затем отправьте юристу при необходимости.",
    href: "/document-check/"
  }
];

export function generateMetadata() {
  const meta = buildMetadata({
    title,
    description,
    path: "/",
    isIndexable: true
  });
  // Главная использует продуктовый title из ТЗ без дополнительного брендового суффикса.
  return { ...meta, title: { absolute: title } };
}

export default async function HomePage() {
  const [lawyers, faqs] = await Promise.all([getLawyers(), getFaqs("GENERAL", "home")]);
  const popularLawyers = lawyers.slice(0, 4);
  const aiNavigatorVisible = await isAiNavigatorVisible();

  return (
    <>
      <JsonLd
        data={[
          websiteJsonLd(),
          organizationJsonLd(),
          legalServiceJsonLd({
            path: "/",
            name: "ПравоПоиск",
            description,
            lawyers: popularLawyers
          }),
          faqJsonLd(faqs)
        ]}
      />
      <NavigatorHero aiNavigatorEnabled={aiNavigatorVisible} />
      <main>
        <SearchOutcomeSection />
        <LawyerReviewCtaSection />
        <ServiceStepsSection />
        <TrustSection />
        <ServiceNavigationSection />
        <SeoTextSection />
      </main>
    </>
  );
}

function SearchOutcomeSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading title="Что вы получите" />
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {searchOutcomes.map(({ icon: Icon, title, description }) => (
          <article key={title} className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <Icon className="h-5 w-5 text-trust" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold leading-6 text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function LawyerReviewCtaSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 rounded-lg border border-line bg-zinc-50 p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Нужен разбор юриста?</h2>
            <p className="mt-3 text-base leading-7 text-zinc-600">
              Если после поиска и подготовки документов нужна индивидуальная оценка, передайте ситуацию реальному юристу. Он посмотрит описание, сроки, документы и подскажет, что лучше сделать дальше.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/questions/" className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
              Перейти к вопросам юристам
            </Link>
            <Link href="/document-check/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
              Проверить документ
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceStepsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading title="Как работает ПравоПоиск" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {serviceSteps.map(([title, description], index) => (
          <article key={title} className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-trust text-sm font-bold text-white">{index + 1}</span>
            <h3 className="mt-4 font-semibold text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-trust text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-ink sm:text-3xl">Почему можно доверять ПравоПоиску</h2>
          <p className="mt-3 text-base leading-7 text-zinc-600">
            Сервис помогает подготовиться к решению вопроса без обещаний гарантированного результата.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {trustItems.map((item) => (
            <p key={item} className="flex gap-3 rounded-lg border border-line bg-white p-4 text-sm leading-6 text-zinc-700 shadow-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-trust" aria-hidden="true" />
              <span>{item}</span>
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceNavigationSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading
          title="Разделы сервиса"
          description="Для тех, кто хочет изучить сайт вручную, оставили короткую навигацию по основным разделам."
        />
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {navigationLinks.map((item) => (
            <Link key={item.title} href={item.href} className="group rounded-lg border border-line bg-white p-4 shadow-sm hover:border-trust">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-ink">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">{item.description}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-zinc-400 group-hover:text-trust" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function SeoTextSection() {
  return (
    <section data-seo-block="seo-text" className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold text-ink">Юридическая помощь онлайн без лишних шагов</h2>
      <p className="mt-4 leading-8 text-zinc-700">
        ПравоПоиск — юридическая помощь онлайн: сервис помогает описать ситуацию, получить правовую инструкцию, подобрать юридические документы и понять, когда нужна юридическая консультация или юрист онлайн. На сайте есть материалы про судебный приказ, алименты, долги и приставы, трудовой спор и жилищный вопрос. Важный документ можно передать на проверку документа юристом, а сложный случай — на разбор ситуации юристом.
      </p>
    </section>
  );
}
