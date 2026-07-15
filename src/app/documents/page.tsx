import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeading } from "@/components/navigator/NavigatorBlocks";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import type { FaqItem } from "@/lib/types";
import { navigatorDocuments } from "@/data/documents";

const heroHints = [
  { label: "Возражение на судебный приказ", href: "/documents/vozrazhenie-na-sudebnyy-prikaz/" },
  { label: "Жалоба на пристава", href: "/documents/zhaloba-na-sudebnogo-pristava/" },
  { label: "Претензия продавцу", href: "/documents/pretenziya-prodavcu-o-vozvrate-deneg/" },
  { label: "Алименты", href: "/documents/zayavlenie-o-vzyskanii-alimentov/" },
  { label: "Невыплата зарплаты", href: "/documents/zhaloba-v-trudovuyu-inspekciyu/" },
  { label: "Залив квартиры", href: "/documents/pretenziya-v-upravlyayuschuyu-kompaniyu/" }
];

const popularDocumentCards = [
  {
    slug: "vozrazhenie-na-sudebnyy-prikaz",
    type: "Возражение",
    title: "Возражение на судебный приказ",
    description: "Подходит, если вы получили судебный приказ и не согласны с взысканием. Перед подачей важно проверить дату получения и срок.",
    deadline: true
  },
  {
    slug: "zayavlenie-o-vosstanovlenii-sroka-na-otmenu-sudebnogo-prikaza",
    type: "Заявление",
    title: "Заявление о восстановлении срока",
    description: "Может понадобиться, если срок подачи возражения, жалобы или другого документа уже пропущен.",
    deadline: true
  },
  {
    slug: "zhaloba-na-sudebnogo-pristava",
    type: "Жалоба",
    title: "Жалоба на судебного пристава",
    description: "Поможет обжаловать действия или бездействие пристава: списание, арест счёта, задержку ответа или ошибки в производстве.",
    deadline: false
  },
  {
    slug: "zayavlenie-o-snyatii-aresta-so-scheta",
    type: "Заявление",
    title: "Заявление о снятии ареста со счёта",
    description: "Подходит, если счёт или карта заблокированы, а нужно проверить основания ареста и подготовить обращение.",
    deadline: false
  },
  {
    slug: "pretenziya-prodavcu-o-vozvrate-deneg",
    type: "Претензия",
    title: "Претензия продавцу о возврате денег",
    description: "Используется, если товар не подошёл, оказался некачественным или продавец отказывается вернуть деньги.",
    deadline: true
  },
  {
    slug: "zhaloba-v-trudovuyu-inspekciyu",
    type: "Жалоба",
    title: "Жалоба в трудовую инспекцию",
    description: "Подходит при невыплате зарплаты, незаконном увольнении, нарушении условий труда или отказе в документах.",
    deadline: true
  },
  {
    slug: "zayavlenie-o-vzyskanii-alimentov",
    type: "Заявление",
    title: "Заявление о взыскании алиментов",
    description: "Поможет подготовить обращение по алиментам, если нужно взыскать содержание на ребёнка или другого члена семьи.",
    deadline: false
  },
  {
    slug: "pretenziya-v-upravlyayuschuyu-kompaniyu",
    type: "Претензия",
    title: "Претензия в управляющую компанию",
    description: "Подходит для вопросов по ЖКХ: залив, некачественные услуги, перерасчёт, содержание дома или бездействие УК.",
    deadline: false
  }
];

const popularDocumentSlugs = new Set(popularDocumentCards.map((document) => document.slug));
const otherDocuments = navigatorDocuments.filter((document) => !popularDocumentSlugs.has(document.slug));

const documentTopicCards = [
  {
    title: "Суд и судебные приказы",
    description: "Возражения, ходатайства, жалобы, иски и заявления в суд.",
    href: "/documents/vozrazhenie-na-sudebnyy-prikaz/"
  },
  {
    title: "Долги, приставы и банки",
    description: "Жалобы на приставов, заявления о снятии ареста, претензии в банк и документы по взысканиям.",
    href: "/documents/zhaloba-na-sudebnogo-pristava/"
  },
  {
    title: "Работа и зарплата",
    description: "Жалобы, претензии и иски по зарплате, увольнению, трудовой книжке и работе.",
    href: "/documents/zhaloba-v-trudovuyu-inspekciyu/"
  },
  {
    title: "Семья и алименты",
    description: "Заявления по алиментам, разводу, детям, порядку общения и разделу имущества.",
    href: "/documents/zayavlenie-o-vzyskanii-alimentov/"
  },
  {
    title: "Жильё и ЖКХ",
    description: "Претензии в управляющую компанию, жалобы в жилищную инспекцию, акты и документы по заливу.",
    href: "/documents/pretenziya-v-upravlyayuschuyu-kompaniyu/"
  },
  {
    title: "Покупки и услуги",
    description: "Претензии продавцу, заявления на возврат, жалобы в Роспотребнадзор и иски о защите прав потребителя.",
    href: "/documents/pretenziya-prodavcu-o-vozvrate-deneg/"
  },
  {
    title: "Наследство",
    description: "Заявления о принятии наследства, восстановлении срока, отказе и признании права.",
    href: "/documents/zayavlenie-o-prinyatii-nasledstva/"
  },
  {
    title: "Авто, медицина и другие вопросы",
    description: "Жалобы, претензии и заявления по штрафам, страховке, медицине, соцвыплатам и другим ситуациям.",
    href: "/documents/zhaloba-na-postanovlenie-gibdd/"
  }
];

const preparationSteps = [
  ["Опишите ситуацию", "Укажите, что произошло и какой результат хотите получить."],
  ["Заполните данные", "Добавьте сведения о сторонах, датах, суммах и документах, если они нужны."],
  ["Скачайте и проверьте", "Получите документ и при необходимости передайте его реальному юристу на проверку."]
];

const documentsFaqs: FaqItem[] = [
  {
    id: "documents-download-online",
    question: "Можно ли скачать юридический документ онлайн?",
    answer:
      "Да, на ПравоПоиске можно найти документы по разным ситуациям: заявления, жалобы, претензии, возражения и иски. Перед использованием важно проверить, подходит ли документ к вашей ситуации.",
    entityType: "GENERAL",
    entityId: "documents",
    sortOrder: 1
  },
  {
    id: "documents-how-to-choose",
    question: "Что делать, если я не знаю, какой документ нужен?",
    answer:
      "Начните с описания проблемы или откройте раздел юридических ситуаций. Сервис подскажет, какие документы могут подойти и какие сроки важно проверить.",
    entityType: "GENERAL",
    entityId: "documents",
    sortOrder: 2
  },
  {
    id: "documents-lawyer-replace",
    question: "Документ заменяет консультацию юриста?",
    answer:
      "Нет. Документ помогает подготовиться к обращению, но не заменяет индивидуальную юридическую консультацию. В сложной ситуации лучше передать документ юристу на разбор.",
    entityType: "GENERAL",
    entityId: "documents",
    sortOrder: 3
  },
  {
    id: "documents-required-data",
    question: "Какие данные нужны для документа?",
    answer:
      "Обычно нужны данные сторон, даты, суммы, реквизиты документа или органа, куда вы обращаетесь. Конкретный список зависит от вида документа.",
    entityType: "GENERAL",
    entityId: "documents",
    sortOrder: 4
  },
  {
    id: "documents-lawyer-check",
    question: "Можно ли проверить документ перед отправкой?",
    answer: "Да, важный документ можно передать реальному юристу для проверки сроков, формулировок и приложений.",
    entityType: "GENERAL",
    entityId: "documents",
    sortOrder: 5
  }
];

export const metadata: Metadata = buildMetadata({
  title: "Юридические документы — заявления, жалобы, претензии и иски онлайн",
  description:
    "Найдите юридический документ на ПравоПоиске: заявление, жалобу, претензию, возражение, ходатайство или иск. Сервис поможет подобрать документ под ситуацию, проверить сроки и передать документ юристу на разбор.",
  path: "/documents/",
  isIndexable: true
});

export default function DocumentsPage() {
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Юридические документы", path: "/documents/" }
  ];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), documentsCollectionJsonLd(), documentItemListJsonLd(), faqJsonLd(documentsFaqs)]} />
      <Breadcrumbs items={breadcrumbs} />
      <HeroSection />
      <PopularDocumentsSection />
      <DocumentTopicsSection />
      <ChooseDocumentSection />
      <PreparationSection />
      <LawyerCheckSection />
      <FaqSection />
      <SeoTextSection />
    </>
  );
}

function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-trust">Документы онлайн</p>
        <h1 className="mt-2 text-4xl font-semibold text-ink">Юридические документы</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-700">
          Найдите или сформируйте документ под свою ситуацию: заявление, жалобу, претензию, возражение или иск.
        </p>
        <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600">
          Если не знаете, какой документ нужен, начните с описания проблемы — сервис подскажет подходящий вариант.
        </p>
        <form action="/questions/" role="search" className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="document-search" className="sr-only">
            Найти юридический документ
          </label>
          <input
            id="document-search"
            name="q"
            type="search"
            placeholder="Например: возражение на судебный приказ, жалоба на пристава, претензия продавцу"
            className="min-h-12 flex-1 rounded-md border border-line bg-white px-4 text-base text-ink outline-none placeholder:text-zinc-400 focus:border-trust"
          />
          <button type="submit" className="min-h-12 rounded-md bg-trust px-6 text-sm font-semibold text-white hover:bg-ink">
            Найти документ
          </button>
        </form>
        <p className="mt-3 text-sm leading-6 text-zinc-600">Можно искать по названию документа или описать ситуацию обычными словами.</p>
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
      </div>
    </section>
  );
}

function PopularDocumentsSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading title="Популярные документы" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {popularDocumentCards.map((document) => (
            <article key={document.slug} className="flex h-full flex-col rounded-lg border border-line bg-white p-5 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">{document.type}</span>
                {document.deadline ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Проверьте срок</span> : null}
              </div>
              <h3 className="mt-4 text-lg font-semibold leading-6 text-ink">{document.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{document.description}</p>
              <Link href={`/documents/${document.slug}/`} className="mt-auto pt-4 text-sm font-semibold text-trust hover:text-ink">
                Открыть документ
              </Link>
            </article>
          ))}
        </div>
        <details className="mt-6">
          <summary className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
            Показать все документы
          </summary>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {otherDocuments.map((document) => (
              <Link key={document.slug} href={`/documents/${document.slug}/`} className="rounded-lg border border-line bg-white p-4 shadow-sm hover:border-trust">
                <span className="text-xs font-semibold uppercase tracking-wide text-trust">{document.category}</span>
                <h3 className="mt-2 font-semibold text-ink">{document.title}</h3>
              </Link>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}

function DocumentTopicsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading title="Документы по темам" />
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {documentTopicCards.map((topic) => (
          <Link key={topic.title} href={topic.href} className="rounded-lg border border-line bg-white p-5 shadow-sm hover:border-trust">
            <h3 className="text-lg font-semibold text-ink">{topic.title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{topic.description}</p>
            <span className="mt-4 inline-flex text-sm font-semibold text-trust">Смотреть документы по теме</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ChooseDocumentSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-zinc-50 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-ink">Не знаете, какой документ выбрать?</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600">
            Начните с описания проблемы. ПравоПоиск покажет, какой документ может подойти, какие сроки важно проверить и когда лучше передать ситуацию юристу.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
              Описать проблему
            </Link>
            <Link href="/problems/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
              Перейти к ситуациям
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreparationSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading title="Как подготовить документ" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {preparationSteps.map(([title, text], index) => (
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

function LawyerCheckSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 rounded-lg border border-line bg-zinc-50 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-ink">Хотите проверить документ?</h2>
            <p className="mt-3 text-base leading-7 text-zinc-600">
              Если документ важный, срок спорный или ситуация сложная, передайте документ реальному юристу. Он посмотрит формулировки, сроки и комплект приложений.
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

function FaqSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading title="Частые вопросы" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {documentsFaqs.map((item) => (
          <article key={item.id} className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-ink">{item.question}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SeoTextSection() {
  return (
    <section data-seo-block="seo-text" className="mx-auto max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
      <p className="text-sm leading-7 text-zinc-600">
        Раздел «Юридические документы» помогает найти заявления, жалобы, претензии, возражения, ходатайства и иски для распространённых правовых ситуаций: судебный приказ, долги и приставы, алименты, трудовые споры, жильё и ЖКХ, наследство, возврат денег за товар или услугу. Перед подготовкой документа важно проверить сроки, реквизиты и обстоятельства ситуации. Материалы носят справочный характер, а сложный документ можно передать юристу для индивидуального разбора.
      </p>
    </section>
  );
}

function documentsCollectionJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Юридические документы",
    description:
      "Юридические документы ПравоПоиск: заявления, жалобы, претензии, иски, возражения и ходатайства для гражданских, семейных, трудовых, жилищных, долговых и потребительских ситуаций.",
    url: absoluteUrl("/documents/"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: navigatorDocuments.length,
      itemListElement: navigatorDocuments.map((document, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: document.title,
        url: absoluteUrl(`/documents/${document.slug}/`)
      }))
    }
  };
}

function documentItemListJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Популярные юридические документы",
    itemListElement: popularDocumentCards.map((document, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: document.title,
      description: document.description,
      url: absoluteUrl(`/documents/${document.slug}/`)
    }))
  };
}
