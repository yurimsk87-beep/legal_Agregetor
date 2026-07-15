import type { Metadata } from "next";
import type { ReactNode } from "react";
import { revalidatePath } from "next/cache";
import type { LeadStatus, QualityStatus, SeoMaturityStatus } from "@prisma/client";
import { AlertTriangle, BarChart3, FileWarning, ShieldAlert } from "lucide-react";
import { AdminDashboardCards } from "@/components/admin/AdminShell";
import { hasForbiddenContact, redactForbiddenContacts } from "@/lib/contact-safety";
import { markQuestionIndexability } from "@/lib/question-indexability";
import { buildMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { logAdminAudit } from "@/lib/request-security";
import { requireAdminSession } from "@/lib/server-auth";
import {
  articles as sampleArticles,
  faqItems as sampleFaqItems,
  lawyers as sampleLawyers,
  questions as sampleQuestions,
  seoPages as sampleSeoPages
} from "@/lib/sample-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminSeoPage = {
  id: string;
  type: string;
  cityId?: string | null;
  serviceId?: string | null;
  lawyerId?: string | null;
  canonical: string;
  title: string;
  description: string;
  isIndexable: boolean;
  seoScore?: number | null;
  seoMaturity?: string | null;
  primaryKeyword?: string | null;
};

type AdminFaq = {
  entityId?: string | null;
};

type RecentLead = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  message: string;
  sourcePage: string;
  sourceType: string;
  desiredFormat?: string | null;
  cityName?: string | null;
  serviceName?: string | null;
  lawyerName?: string | null;
  adminComment?: string | null;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
};

type RecentBotVisit = {
  botName: string;
  url: string;
  statusCode: number;
  visitedAt: Date;
};

type RecentAnalyticsEvent = {
  type: string;
  url: string;
  targetType?: string | null;
  targetId?: string | null;
  createdAt: Date;
};

type EditableSeoPage = AdminSeoPage & {
  slug: string;
  h1: string;
  seoText: string;
  robots: string;
};

type PendingQuestion = {
  id: string;
  title: string;
  text: string;
  userName: string;
  userEmail?: string | null;
  cityName?: string | null;
  serviceName?: string | null;
  qualityStatus: string;
  isIndexable: boolean;
  createdAt: Date;
};

type PendingReview = {
  id: string;
  userName: string;
  rating: number;
  text: string;
  qualityStatus: string;
  isModerated: boolean;
  createdAt: Date;
  lawyerName: string;
};

type PendingAnswer = {
  id: string;
  text: string;
  qualityStatus: string;
  answerQualityScore: number;
  isModerated: boolean;
  createdAt: Date;
  questionTitle: string;
  lawyerName: string;
};

type PendingArticleReview = {
  id: string;
  title: string;
  slug: string;
  status: string;
  contentFreshness: string;
  updatedAt: Date;
  reviewedAt?: Date | null;
};

type DashboardData = {
  source: "PostgreSQL" | "fallback";
  seoPages: AdminSeoPage[];
  editableSeoPages: EditableSeoPage[];
  faqItems: AdminFaq[];
  outdatedArticles: number;
  lowQualityQuestions: number;
  pendingReviews: number;
  pendingAnswers: number;
  verifiedLawyers: number;
  leads: number;
  recentLeads: RecentLead[];
  botVisits: number;
  recentBotVisits: RecentBotVisit[];
  pendingQuestionsList: PendingQuestion[];
  pendingReviewsList: PendingReview[];
  pendingAnswersList: PendingAnswer[];
  pendingArticleReviews: PendingArticleReview[];
  potentialPages: number;
  seoMerges: number;
  indexProblems: number;
  competitorPages: number;
  analyticsEvents: number;
  recentAnalyticsEvents: RecentAnalyticsEvent[];
};

const maturityOptions = [
  "DRAFT",
  "COLLECTING_DATA",
  "READY_FOR_INDEX",
  "INDEXED",
  "NEEDS_IMPROVEMENT",
  "DEINDEXED"
] as const;

const qualityOptions = ["APPROVED", "NEEDS_REVIEW", "LOW_QUALITY", "DUPLICATE", "PERSONAL_DATA", "SPAM", "LEGAL_RISK"] as const;
const leadStatusOptions = ["NEW", "IN_PROGRESS", "CONTACTED", "CLOSED", "SPAM"] as const;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Админка SEO-платформы",
    description: "SEO-дашборд, модерация, качество страниц и контроль индексации.",
    path: "/admin/",
    isIndexable: false
  });
}

export default async function AdminPage() {
  const admin = await requireAdminSession();
  const data = await getDashboardData();
  const indexablePages = data.seoPages.filter((page) => page.isIndexable && (page.seoScore ?? 0) >= 70);
  const noindexPages = data.seoPages.length - indexablePages.length;
  const withoutFaq = data.seoPages.filter((page) => page.isIndexable && faqCountFor(page, data.faqItems) < 3);
  const weakPages = data.seoPages.filter((page) => (page.seoScore ?? 0) < 70);
  const duplicateTitles = findDuplicates(data.seoPages.map((page) => page.title));
  const duplicateDescriptions = findDuplicates(data.seoPages.map((page) => page.description));
  const duplicateKeywords = findDuplicates(data.seoPages.map((page) => page.primaryKeyword ?? ""));
  const yandexIks = process.env.YANDEX_IKS || "не задан";

  const cards = [
    ["Источник данных", data.source],
    ["ИКС Яндекса", yandexIks],
    ["Всего SEO-страниц", data.seoPages.length],
    ["Indexable", indexablePages.length],
    ["Noindex", noindexPages],
    ["В sitemap", indexablePages.length],
    ["Без FAQ", withoutFaq.length],
    ["seoScore < 70", weakPages.length],
    ["Дубли title", duplicateTitles.length],
    ["Дубли description", duplicateDescriptions.length],
    ["Каннибализация keyword", duplicateKeywords.length],
    ["Устаревший контент", data.outdatedArticles],
    ["UGC на модерации", data.lowQualityQuestions + data.pendingReviews + data.pendingAnswers],
    ["Новые вопросы", data.leads],
    ["Визиты ботов", data.botVisits],
    ["События аналитики", data.analyticsEvents],
    ["PotentialSeoPage", data.potentialPages],
    ["IndexStatus проблемы", data.indexProblems]
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-trust" aria-hidden="true" />
        <div className="flex-1">
          <h1 className="text-4xl font-semibold text-ink">SEO-дашборд</h1>
          <p className="mt-2 text-zinc-600">
            Панель контроля качества, индексации, UGC, вопросов, ботов и каннибализации.
          </p>
        </div>
        <div className="hidden text-right text-sm text-zinc-600 sm:block">
          <p>{admin.email}</p>
          <a href="/logout/" className="font-semibold text-ink hover:text-trust">
            Выйти
          </a>
        </div>
      </div>

      <div className="mt-8">
        <AdminDashboardCards />
      </div>

      <div className="mt-8 rounded-lg border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-trust">Admin CRUD</p>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              Полное управление всеми Prisma-сущностями: создание, редактирование и удаление записей.
            </p>
          </div>
          <a href="/admin/crud/" className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-trust">
            Открыть CRUD
          </a>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={label} className="rounded-lg border border-line bg-white p-5">
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <AdminPanel
          title="Предупреждения"
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />}
          items={[
            ...weakPages.slice(0, 5).map((page) => `${page.canonical}: seoScore ${page.seoScore ?? 0}`),
            ...withoutFaq.slice(0, 5).map((page) => `${page.canonical}: меньше 3 FAQ`)
          ]}
          emptyText="Критичных предупреждений по quality gate нет."
        />
        <AdminPanel
          title="Каннибализация"
          icon={<ShieldAlert className="h-5 w-5 text-red-700" aria-hidden="true" />}
          items={duplicateKeywords.length ? duplicateKeywords : []}
          emptyText="Конфликтов primaryKeyword не найдено."
        />
        <AdminPanel
          title="Очередь качества"
          icon={<FileWarning className="h-5 w-5 text-trust" aria-hidden="true" />}
          items={[
            `Вопросы на модерации: ${data.lowQualityQuestions}`,
            `Отзывы на модерации: ${data.pendingReviews}`,
            `Ответы на модерации: ${data.pendingAnswers}`,
            `SeoMerge: ${data.seoMerges}`,
            `CompetitorPage: ${data.competitorPages}`
          ]}
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <AdminPanel
          title="Последние вопросы"
          icon={<FileWarning className="h-5 w-5 text-trust" aria-hidden="true" />}
          items={data.recentLeads.map(
            (lead) => `${formatDate(lead.createdAt)} · ${lead.name} · ${lead.phone} · ${lead.sourcePage} · ${lead.status}`
          )}
          emptyText="Вопросов пока нет."
        />
        <AdminPanel
          title="Последние обходы ботов"
          icon={<BarChart3 className="h-5 w-5 text-trust" aria-hidden="true" />}
          items={data.recentBotVisits.map(
            (visit) => `${formatDate(visit.visitedAt)} · ${visit.botName} · ${visit.statusCode} · ${visit.url}`
          )}
          emptyText="Визиты ботов пока не зафиксированы."
        />
        <AdminPanel
          title="Последние события"
          icon={<BarChart3 className="h-5 w-5 text-trust" aria-hidden="true" />}
          items={data.recentAnalyticsEvents.map(
            (event) =>
              `${formatDate(event.createdAt)} · ${event.type} · ${event.url}${
                event.targetType ? ` · ${event.targetType}:${event.targetId ?? ""}` : ""
              }`
          )}
          emptyText="Событий аналитики пока нет."
        />
        <AdminPanel
          title="Материалы на проверку"
          icon={<FileWarning className="h-5 w-5 text-amber-600" aria-hidden="true" />}
          items={data.pendingArticleReviews.map(
            (article) => `${article.title} · ${article.status} · ${article.contentFreshness} · обновлено ${formatDate(article.updatedAt)}`
          )}
          emptyText="Материалов, требующих проверки, нет."
        />
      </div>

      <section className="mt-10 rounded-lg border border-line bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-ink">SEO-страницы</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Быстрое управление title, description, H1, seoScore, seoMaturity и isIndexable.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-5">
          {data.editableSeoPages.map((page) => (
            <SeoPageForm key={page.id} page={page} />
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <ModerationQueue questions={data.pendingQuestionsList} reviews={data.pendingReviewsList} answers={data.pendingAnswersList} />
        <LeadQueue leads={data.recentLeads} />
      </section>

      <section className="mt-10 rounded-lg border border-line bg-white p-6">
        <h2 className="text-2xl font-semibold text-ink">Управляемые разделы</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Юристы",
            "Города",
            "Услуги",
            "SEO-страницы",
            "Статьи",
            "Вопросы",
            "Отзывы",
            "Вопросы",
            "SeoMerge",
            "KeywordTarget",
            "LawChange",
            "BotVisit"
          ].map((item) => (
            <div key={item} className="rounded-md border border-line px-3 py-2 text-sm font-medium text-zinc-700">
              {item}
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

async function getDashboardData(): Promise<DashboardData> {
  try {
    const [
      seoPages,
      editableSeoPages,
      faqItems,
      outdatedArticles,
      lowQualityQuestions,
      pendingReviews,
      pendingAnswers,
      verifiedLawyers,
      leads,
      recentLeads,
      botVisits,
      recentBotVisits,
      pendingQuestionsList,
      pendingReviewsList,
      pendingAnswersList,
      pendingArticleReviews,
      potentialPages,
      seoMerges,
      indexProblems,
      competitorPages,
      analyticsEvents,
      recentAnalyticsEvents
    ] = await Promise.all([
      prisma.seoPage.findMany({
        select: {
          id: true,
          type: true,
          cityId: true,
          serviceId: true,
          lawyerId: true,
          canonical: true,
          title: true,
          description: true,
          isIndexable: true,
          seoScore: true,
          seoMaturity: true,
          primaryKeyword: true
        }
      }),
      prisma.seoPage.findMany({
        orderBy: [{ isIndexable: "asc" }, { seoScore: "asc" }, { updatedAt: "desc" }],
        take: 8,
        select: {
          id: true,
          type: true,
          slug: true,
          cityId: true,
          serviceId: true,
          lawyerId: true,
          canonical: true,
          title: true,
          description: true,
          h1: true,
          seoText: true,
          robots: true,
          isIndexable: true,
          seoScore: true,
          seoMaturity: true,
          primaryKeyword: true
        }
      }),
      prisma.faqItem.findMany({ select: { entityId: true } }),
      prisma.article.count({ where: { contentFreshness: { in: ["OUTDATED", "NEEDS_REVIEW"] } } }),
      prisma.question.count({ where: { qualityStatus: { not: "APPROVED" } } }),
      prisma.review.count({ where: { OR: [{ qualityStatus: { not: "APPROVED" } }, { isModerated: false }] } }),
      prisma.answer.count({ where: { OR: [{ qualityStatus: { not: "APPROVED" } }, { isModerated: false }] } }),
      prisma.lawyer.count({ where: { isVerified: true } }),
      prisma.lead.count(),
      prisma.lead.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          message: true,
          sourcePage: true,
          sourceType: true,
          desiredFormat: true,
          status: true,
          adminComment: true,
          createdAt: true,
          updatedAt: true,
          city: { select: { name: true } },
          service: { select: { name: true } },
          lawyer: { select: { firstName: true, lastName: true, middleName: true } }
        }
      }),
      prisma.botVisit.count(),
      prisma.botVisit.findMany({
        orderBy: { visitedAt: "desc" },
        take: 5,
        select: { botName: true, url: true, statusCode: true, visitedAt: true }
      }),
      prisma.question.findMany({
        where: { qualityStatus: { not: "APPROVED" } },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          text: true,
          userName: true,
          userEmail: true,
          qualityStatus: true,
          isIndexable: true,
          createdAt: true,
          city: { select: { name: true } },
          service: { select: { name: true } }
        }
      }),
      prisma.review.findMany({
        where: { OR: [{ qualityStatus: { not: "APPROVED" } }, { isModerated: false }] },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          userName: true,
          rating: true,
          text: true,
          qualityStatus: true,
          isModerated: true,
          createdAt: true,
          lawyer: { select: { firstName: true, lastName: true, middleName: true } }
        }
      }),
      prisma.answer.findMany({
        where: { OR: [{ qualityStatus: { not: "APPROVED" } }, { isModerated: false }] },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          text: true,
          qualityStatus: true,
          answerQualityScore: true,
          isModerated: true,
          createdAt: true,
          question: { select: { title: true } },
          lawyer: { select: { firstName: true, lastName: true, middleName: true } }
        }
      }),
      prisma.article.findMany({
        where: {
          OR: [
            { status: { in: ["DRAFT", "REVIEW_REQUIRED", "OUTDATED"] } },
            { contentFreshness: { in: ["NEEDS_REVIEW", "OUTDATED"] } },
            { reviewedAt: null }
          ]
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: { id: true, title: true, slug: true, status: true, contentFreshness: true, updatedAt: true, reviewedAt: true }
      }),
      prisma.potentialSeoPage.count(),
      prisma.seoMerge.count(),
      prisma.indexStatus.count({
        where: { status: { in: ["DISCOVERED_NOT_INDEXED", "CRAWLED_NOT_INDEXED", "EXCLUDED", "UNKNOWN"] } }
      }),
      prisma.competitorPage.count(),
      prisma.analyticsEvent.count(),
      prisma.analyticsEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { type: true, url: true, targetType: true, targetId: true, createdAt: true }
      })
    ]);

    return {
      source: "PostgreSQL",
      seoPages: seoPages.map((page) => ({ ...page, type: String(page.type), seoMaturity: String(page.seoMaturity) })),
      editableSeoPages: editableSeoPages.map((page) => ({
        ...page,
        type: String(page.type),
        seoMaturity: String(page.seoMaturity)
      })),
      faqItems,
      outdatedArticles,
      lowQualityQuestions,
      pendingReviews,
      pendingAnswers,
      verifiedLawyers,
      leads,
      recentLeads: recentLeads.map((lead) => ({
        ...lead,
        status: String(lead.status),
        sourceType: String(lead.sourceType),
        desiredFormat: lead.desiredFormat ? String(lead.desiredFormat) : null,
        cityName: lead.city?.name ?? null,
        serviceName: lead.service?.name ?? null,
        lawyerName: lead.lawyer
          ? [lead.lawyer.lastName, lead.lawyer.firstName, lead.lawyer.middleName].filter(Boolean).join(" ")
          : null
      })),
      botVisits,
      recentBotVisits,
      pendingQuestionsList: pendingQuestionsList.map((question) => ({
        ...question,
        qualityStatus: String(question.qualityStatus),
        cityName: question.city?.name ?? null,
        serviceName: question.service?.name ?? null
      })),
      pendingReviewsList: pendingReviewsList.map((review) => ({
        ...review,
        qualityStatus: String(review.qualityStatus),
        lawyerName: [review.lawyer.lastName, review.lawyer.firstName, review.lawyer.middleName].filter(Boolean).join(" ")
      })),
      pendingAnswersList: pendingAnswersList.map((answer) => ({
        ...answer,
        qualityStatus: String(answer.qualityStatus),
        questionTitle: answer.question.title,
        lawyerName: [answer.lawyer.lastName, answer.lawyer.firstName, answer.lawyer.middleName].filter(Boolean).join(" ")
      })),
      pendingArticleReviews: pendingArticleReviews.map((article) => ({
        ...article,
        status: String(article.status),
        contentFreshness: String(article.contentFreshness)
      })),
      potentialPages,
      seoMerges,
      indexProblems,
      competitorPages,
      analyticsEvents,
      recentAnalyticsEvents: recentAnalyticsEvents.map((event) => ({ ...event, type: String(event.type) }))
    };
  } catch (error) {
    console.error("Admin dashboard DB fallback", error);
    return fallbackDashboardData();
  }
}

function fallbackDashboardData(): DashboardData {
  return {
    source: "fallback",
    seoPages: sampleSeoPages,
    editableSeoPages: sampleSeoPages.slice(0, 8).map((page) => ({
      ...page,
      slug: page.slug,
      h1: page.h1,
      seoText: page.seoText,
      robots: page.isIndexable ? "index, follow" : "noindex, follow"
    })),
    faqItems: sampleFaqItems,
    outdatedArticles: sampleArticles.filter(
      (article) => article.contentFreshness === "OUTDATED" || article.contentFreshness === "NEEDS_REVIEW"
    ).length,
    lowQualityQuestions: sampleQuestions.filter((question) => question.qualityStatus !== "APPROVED").length,
    pendingReviews: 0,
    pendingAnswers: 0,
    verifiedLawyers: sampleLawyers.filter((lawyer) => lawyer.isVerified).length,
    leads: 0,
    recentLeads: [],
    botVisits: 0,
    recentBotVisits: [],
    pendingQuestionsList: [],
    pendingReviewsList: [],
    pendingAnswersList: [],
    pendingArticleReviews: sampleArticles
      .filter((article) => article.status !== "APPROVED" || article.contentFreshness === "OUTDATED" || article.contentFreshness === "NEEDS_REVIEW")
      .slice(0, 8)
      .map((article) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        status: article.status ?? "DRAFT",
        contentFreshness: article.contentFreshness ?? "FRESH",
        updatedAt: new Date(article.updatedAt),
        reviewedAt: article.reviewedAt ? new Date(article.reviewedAt) : null
      })),
    potentialPages: 0,
    seoMerges: 0,
    indexProblems: 0,
    competitorPages: 0,
    analyticsEvents: 0,
    recentAnalyticsEvents: []
  };
}

function SeoPageForm({ page }: { page: EditableSeoPage }) {
  return (
    <form action={updateSeoPageAction} className="grid gap-4 rounded-lg border border-line bg-zinc-50 p-4">
      <input type="hidden" name="id" value={page.id} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{page.canonical}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {page.type} · keyword: {page.primaryKeyword || "не задан"}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input name="isIndexable" type="checkbox" defaultChecked={page.isIndexable} className="h-4 w-4 rounded border-line text-trust" />
          Indexable
        </label>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Title
          <input name="title" defaultValue={page.title} className="rounded-md border border-line px-3 py-2 outline-none focus:border-trust" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Description
          <input name="description" defaultValue={page.description} className="rounded-md border border-line px-3 py-2 outline-none focus:border-trust" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          H1
          <input name="h1" defaultValue={page.h1} className="rounded-md border border-line px-3 py-2 outline-none focus:border-trust" />
        </label>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px]">
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          SEO-текст
          <textarea
            name="seoText"
            defaultValue={page.seoText}
            rows={3}
            className="rounded-md border border-line px-3 py-2 outline-none focus:border-trust"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          seoScore
          <input
            name="seoScore"
            type="number"
            min={0}
            max={100}
            defaultValue={page.seoScore ?? 0}
            className="rounded-md border border-line px-3 py-2 outline-none focus:border-trust"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          seoMaturity
          <select name="seoMaturity" defaultValue={page.seoMaturity ?? "DRAFT"} className="rounded-md border border-line px-3 py-2 outline-none focus:border-trust">
            {maturityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-trust">
          Сохранить SEO-страницу
        </button>
      </div>
    </form>
  );
}

function ModerationQueue({ questions, reviews, answers }: { questions: PendingQuestion[]; reviews: PendingReview[]; answers: PendingAnswer[] }) {
  return (
    <article className="rounded-lg border border-line bg-white p-6">
      <h2 className="text-2xl font-semibold text-ink">Модерация UGC</h2>
      <div className="mt-5 grid gap-5">
        <div>
          <h3 className="font-semibold text-ink">Вопросы</h3>
          <div className="mt-3 grid gap-3">
            {questions.length ? (
              questions.map((question) => (
                <form key={question.id} action={moderateQuestionAction} className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-700">
                  <input type="hidden" name="id" value={question.id} />
                  <p className="font-medium text-ink">{question.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {question.userName} · {formatDate(question.createdAt)} · {question.qualityStatus}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {question.userEmail ? `Email: ${question.userEmail}. ` : ""}
                    {question.cityName ? `Город: ${question.cityName}. ` : ""}
                    {question.serviceName ? `Тема: ${question.serviceName}. ` : ""}
                    {hasForbiddenContact(`${question.title}\n${question.text}\n${question.userName}`) ? "Найдены контакты или обход платформы." : "Контактов не найдено."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <select name="qualityStatus" defaultValue="APPROVED" className="rounded-md border border-line px-2 py-1">
                      {qualityOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-md bg-ink px-3 py-1 font-semibold text-white" type="submit">
                      Обновить
                    </button>
                  </div>
                </form>
              ))
            ) : (
              <p className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-600">Нет вопросов на модерации.</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-ink">Ответы юристов</h3>
          <div className="mt-3 grid gap-3">
            {answers.length ? (
              answers.map((answer) => (
                <form key={answer.id} action={moderateAnswerAction} className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-700">
                  <input type="hidden" name="id" value={answer.id} />
                  <p className="font-medium text-ink">{answer.questionTitle}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {answer.lawyerName} · {formatDate(answer.createdAt)} · {answer.qualityStatus} · score {answer.answerQualityScore}
                  </p>
                  <p className="mt-2 line-clamp-3">{answer.text}</p>
                  {hasForbiddenContact(answer.text) ? (
                    <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                      Найдены контакты или попытка обхода платформы.
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <select name="qualityStatus" defaultValue="APPROVED" className="rounded-md border border-line px-2 py-1">
                      {qualityOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <input
                      name="answerQualityScore"
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={Math.max(answer.answerQualityScore, 70)}
                      className="w-24 rounded-md border border-line px-2 py-1"
                    />
                    <label className="inline-flex items-center gap-2 rounded-md border border-line px-2 py-1 text-xs">
                      <input name="redactContacts" type="checkbox" defaultChecked={hasForbiddenContact(answer.text)} />
                      скрыть контакты
                    </label>
                    <button className="rounded-md bg-ink px-3 py-1 font-semibold text-white" type="submit">
                      Обновить
                    </button>
                  </div>
                </form>
              ))
            ) : (
              <p className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-600">Нет ответов на модерации.</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-ink">Отзывы</h3>
          <div className="mt-3 grid gap-3">
            {reviews.length ? (
              reviews.map((review) => (
                <form key={review.id} action={moderateReviewAction} className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-700">
                  <input type="hidden" name="id" value={review.id} />
                  <p className="font-medium text-ink">
                    {review.userName} · {review.rating}/5 · {review.lawyerName}
                  </p>
                  <p className="mt-1 line-clamp-2">{review.text}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <select name="qualityStatus" defaultValue="APPROVED" className="rounded-md border border-line px-2 py-1">
                      {qualityOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-md bg-ink px-3 py-1 font-semibold text-white" type="submit">
                      Обновить
                    </button>
                  </div>
                </form>
              ))
            ) : (
              <p className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-600">Нет отзывов на модерации.</p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function LeadQueue({ leads }: { leads: RecentLead[] }) {
  const adminOnlyNote =
    "Вопросы обрабатывает только администратор. Юрист в вопросе - это страница-источник, а не назначенный исполнитель.";

  return (
    <article className="rounded-lg border border-line bg-white p-6">
      <h2 className="text-2xl font-semibold text-ink">Вопросы</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{adminOnlyNote}</p>
      <div className="mt-5 grid gap-3">
        {leads.length ? (
          leads.map((lead) => (
            <form key={lead.id} action={updateLeadStatusAction} className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-700">
              <input type="hidden" name="id" value={lead.id} />
              <p className="font-medium text-ink">
                {lead.name} · {lead.phone}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {formatDate(lead.createdAt)} · {lead.sourcePage}
              </p>
              <p className="mt-2 line-clamp-2">{lead.message}</p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                Источник: {lead.sourceType}, {lead.sourcePage}
                {lead.email ? `. Email: ${lead.email}` : ""}
                {lead.cityName ? `. Город: ${lead.cityName}` : ""}
                {lead.serviceName ? `. Услуга: ${lead.serviceName}` : ""}
                {lead.desiredFormat ? `. Формат: ${lead.desiredFormat}` : ""}
                {lead.lawyerName ? `. Юрист-источник: ${lead.lawyerName}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <select name="status" defaultValue={lead.status} className="rounded-md border border-line px-2 py-1">
                  {leadStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <input
                  name="adminComment"
                  defaultValue={lead.adminComment ?? ""}
                  placeholder="Комментарий администратора"
                  className="min-w-60 flex-1 rounded-md border border-line px-2 py-1"
                />
                <button className="rounded-md bg-ink px-3 py-1 font-semibold text-white" type="submit">
                  Сменить статус
                </button>
              </div>
            </form>
          ))
        ) : (
          <p className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-600">Вопросов пока нет.</p>
        )}
      </div>
    </article>
  );
}

async function updateSeoPageAction(formData: FormData) {
  "use server";

  await requireAdminSession();

  const id = stringField(formData, "id");
  const title = stringField(formData, "title");
  const description = stringField(formData, "description");
  const h1 = stringField(formData, "h1");
  const seoText = stringField(formData, "seoText");
  const seoScore = clamp(Number(formData.get("seoScore") ?? 0), 0, 100);
  const seoMaturity = parseOption(formData.get("seoMaturity"), maturityOptions, "DRAFT") as SeoMaturityStatus;
  const isIndexable = formData.get("isIndexable") === "on";

  await prisma.seoPage.update({
    where: { id },
    data: {
      title,
      description,
      h1,
      seoText,
      seoScore,
      seoMaturity,
      isIndexable,
      robots: isIndexable ? "index, follow" : "noindex, follow",
      manualTitle: title,
      manualDescription: description,
      seoMode: "MANUAL"
    }
  });

  revalidatePath("/admin");
}

async function moderateQuestionAction(formData: FormData) {
  "use server";

  await requireAdminSession();

  const id = stringField(formData, "id");
  const qualityStatus = parseOption(formData.get("qualityStatus"), qualityOptions, "APPROVED") as QualityStatus;

  await prisma.question.update({
    where: { id },
    data: {
      qualityStatus,
      isDuplicate: qualityStatus === "DUPLICATE",
      isIndexable: false
    }
  });

  revalidatePath("/admin");
}

async function moderateAnswerAction(formData: FormData) {
  "use server";

  await requireAdminSession();

  const id = stringField(formData, "id");
  const qualityStatus = parseOption(formData.get("qualityStatus"), qualityOptions, "APPROVED") as QualityStatus;
  const answerQualityScore = clamp(Number(formData.get("answerQualityScore") ?? 0), 0, 100);
  const redactContacts = formData.get("redactContacts") === "on";
  const answer = await prisma.answer.findUnique({ where: { id }, select: { text: true, questionId: true } });

  await prisma.answer.update({
    where: { id },
    data: {
      text: redactContacts ? redactForbiddenContacts(answer?.text ?? "") : undefined,
      qualityStatus,
      answerQualityScore,
      isModerated: qualityStatus === "APPROVED" && answerQualityScore >= 60
    }
  });
  if (answer?.questionId) {
    await markQuestionIndexability(answer.questionId);
  }

  revalidatePath("/admin");
}

async function moderateReviewAction(formData: FormData) {
  "use server";

  await requireAdminSession();

  const id = stringField(formData, "id");
  const qualityStatus = parseOption(formData.get("qualityStatus"), qualityOptions, "APPROVED") as QualityStatus;

  await prisma.review.update({
    where: { id },
    data: {
      qualityStatus,
      isModerated: qualityStatus === "APPROVED"
    }
  });

  revalidatePath("/admin");
}

async function updateLeadStatusAction(formData: FormData) {
  "use server";

  const admin = await requireAdminSession();

  const id = stringField(formData, "id");
  const status = parseOption(formData.get("status"), leadStatusOptions, "NEW") as LeadStatus;
  const adminComment = stringField(formData, "adminComment");

  const before = await prisma.lead.findUnique({ where: { id }, select: { status: true } });
  if (!before) return;

  const after = await prisma.lead.update({
    where: { id },
    data: { status, adminComment: adminComment || null },
    select: { status: true }
  });

  await logAdminAudit({
    adminId: admin.id,
    action: "LEAD_UPDATED",
    entityType: "Lead",
    entityId: id,
    actorRole: "ADMIN",
    beforeSnapshot: { previousStatus: before.status },
    afterSnapshot: { newStatus: after.status }
  });

  revalidatePath("/admin");
}

function AdminPanel({
  title,
  icon,
  items,
  emptyText = "Нет данных."
}: {
  title: string;
  icon: ReactNode;
  items: string[];
  emptyText?: string;
}) {
  const visibleItems = items.length ? items : [emptyText];

  return (
    <article className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-semibold text-ink">{title}</h2>
      </div>
      <div className="mt-4 grid gap-2">
        {visibleItems.map((item, index) => (
          <p key={`${title}-${index}`} className="rounded-md bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
            {item}
          </p>
        ))}
      </div>
    </article>
  );
}

function faqCountFor(page: AdminSeoPage, faqItems: AdminFaq[]) {
  const entityId =
    page.type === "CITY_SERVICE"
      ? `${page.cityId}:${page.serviceId}`
      : page.type === "CITY"
        ? page.cityId
        : page.type === "SERVICE"
          ? page.serviceId
          : page.type === "LAWYER"
            ? page.lawyerId
            : page.id;

  return faqItems.filter((faq) => faq.entityId === entityId).length;
}

function findDuplicates(values: string[]) {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([value]) => value);
}

function stringField(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function parseOption<T extends readonly string[]>(value: FormDataEntryValue | null, options: T, fallback: T[number]) {
  const stringValue = String(value ?? "");
  return options.includes(stringValue) ? stringValue : fallback;
}

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}
