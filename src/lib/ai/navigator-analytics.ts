import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AiNavigatorAnalyticsParams = {
  from?: string;
  to?: string;
  limit?: number;
  query?: string;
};

const EV = {
  view: "ai_navigator_view",
  error: "ai_navigator_error",
  low: "ai_navigator_low_confidence",
  primary: "ai_navigator_primary_click",
  result: "ai_navigator_result_click",
  question: "ai_navigator_question_view"
} as const;

function parseDate(value?: string, endOfDay = false): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const d = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function getAiNavigatorAnalytics(params: AiNavigatorAnalyticsParams) {
  const from = parseDate(params.from);
  const to = parseDate(params.to, true);
  const limit = Math.min(Math.max(1, Number(params.limit) || 50), 200);
  const queryFilter = params.query?.trim() ? params.query.trim().slice(0, 300) : undefined;

  // Общий фильтр диапазона/запроса (Prisma where).
  const baseWhere: Prisma.AiNavigatorEventWhereInput = {
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    ...(queryFilter ? { query: { contains: queryFilter, mode: "insensitive" } } : {})
  };

  const countOf = (event: string) => prisma.aiNavigatorEvent.count({ where: { ...baseWhere, event } });

  const [views, errors, lowConfidence, primaryClicks, resultClicks, questionViews] = await Promise.all([
    countOf(EV.view),
    countOf(EV.error),
    countOf(EV.low),
    countOf(EV.primary),
    countOf(EV.result),
    countOf(EV.question)
  ]);

  const ctrPrimary = views ? Number((primaryClicks / views).toFixed(4)) : 0;
  const ctrResults = views ? Number((resultClicks / views).toFixed(4)) : 0;

  // Тот же фильтр для raw SQL.
  const conds: Prisma.Sql[] = [];
  if (from) conds.push(Prisma.sql`"createdAt" >= ${from}`);
  if (to) conds.push(Prisma.sql`"createdAt" <= ${to}`);
  if (queryFilter) conds.push(Prisma.sql`"query" ILIKE ${`%${queryFilter}%`}`);
  const whereSql = conds.length ? Prisma.sql`WHERE ${Prisma.join(conds, " AND ")}` : Prisma.empty;
  const andQueryNotNull = conds.length
    ? Prisma.sql`WHERE ${Prisma.join([...conds, Prisma.sql`"query" IS NOT NULL`], " AND ")}`
    : Prisma.sql`WHERE "query" IS NOT NULL`;

  // По дням.
  const byDayRows = await prisma.$queryRaw<Array<{ date: Date; event: string; count: number }>>(Prisma.sql`
    SELECT date_trunc('day', "createdAt")::date AS date, event, count(*)::int AS count
    FROM "AiNavigatorEvent" ${whereSql}
    GROUP BY 1, 2 ORDER BY 1 DESC LIMIT 400
  `);
  const dayMap = new Map<string, { date: string; views: number; primaryClicks: number; resultClicks: number; errors: number; lowConfidence: number }>();
  for (const row of byDayRows) {
    const date = row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date).slice(0, 10);
    const entry = dayMap.get(date) ?? { date, views: 0, primaryClicks: 0, resultClicks: 0, errors: 0, lowConfidence: 0 };
    if (row.event === EV.view) entry.views = row.count;
    else if (row.event === EV.primary) entry.primaryClicks = row.count;
    else if (row.event === EV.result) entry.resultClicks = row.count;
    else if (row.event === EV.error) entry.errors = row.count;
    else if (row.event === EV.low) entry.lowConfidence = row.count;
    dayMap.set(date, entry);
  }
  const byDay = [...dayMap.values()].sort((a, b) => (a.date < b.date ? 1 : -1));

  // Топ запросов (по показам), с low confidence и кликами.
  const topQueries = await prisma.$queryRaw<Array<{ query: string; count: number; lowConfidence: number; clicks: number }>>(Prisma.sql`
    SELECT "query",
      count(*) FILTER (WHERE event = ${EV.view})::int AS count,
      count(*) FILTER (WHERE event = ${EV.low})::int AS "lowConfidence",
      count(*) FILTER (WHERE event IN (${EV.primary}, ${EV.result}))::int AS clicks
    FROM "AiNavigatorEvent" ${andQueryNotNull}
    GROUP BY "query"
    HAVING count(*) FILTER (WHERE event = ${EV.view}) > 0
    ORDER BY count DESC, clicks DESC
    LIMIT ${limit}
  `);

  // Запросы с низкой уверенностью.
  const lowConfidenceQueries = await prisma.$queryRaw<Array<{ query: string; count: number; lastSeen: Date }>>(Prisma.sql`
    SELECT "query", count(*)::int AS count, max("createdAt") AS "lastSeen"
    FROM "AiNavigatorEvent"
    WHERE event = ${EV.low} AND "query" IS NOT NULL
      ${from ? Prisma.sql`AND "createdAt" >= ${from}` : Prisma.empty}
      ${to ? Prisma.sql`AND "createdAt" <= ${to}` : Prisma.empty}
      ${queryFilter ? Prisma.sql`AND "query" ILIKE ${`%${queryFilter}%`}` : Prisma.empty}
    GROUP BY "query" ORDER BY count DESC LIMIT ${limit}
  `);

  // Клики по типам результата.
  const clicksByTargetType = await prisma.$queryRaw<Array<{ targetType: string; count: number }>>(Prisma.sql`
    SELECT "targetType", count(*)::int AS count
    FROM "AiNavigatorEvent"
    WHERE event IN (${EV.primary}, ${EV.result}) AND "targetType" IS NOT NULL
      ${from ? Prisma.sql`AND "createdAt" >= ${from}` : Prisma.empty}
      ${to ? Prisma.sql`AND "createdAt" <= ${to}` : Prisma.empty}
      ${queryFilter ? Prisma.sql`AND "query" ILIKE ${`%${queryFilter}%`}` : Prisma.empty}
    GROUP BY "targetType" ORDER BY count DESC
  `);

  // Последние события.
  const recentEvents = (
    await prisma.aiNavigatorEvent.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true, event: true, query: true, confidence: true, riskLevel: true,
        urgency: true, page: true, targetType: true, targetTitle: true, targetHref: true, createdAt: true
      }
    })
  ).map((e) => ({ ...e, createdAt: e.createdAt.toISOString() }));

  return {
    summary: { views, errors, lowConfidence, primaryClicks, resultClicks, questionViews, ctrPrimary, ctrResults },
    byDay,
    topQueries: topQueries.map((q) => ({ ...q, ctr: q.count ? Number((q.clicks / q.count).toFixed(4)) : 0 })),
    lowConfidenceQueries: lowConfidenceQueries.map((q) => ({ ...q, lastSeen: q.lastSeen instanceof Date ? q.lastSeen.toISOString() : String(q.lastSeen) })),
    clicksByTargetType,
    recentEvents
  };
}

export type AiNavigatorAnalytics = Awaited<ReturnType<typeof getAiNavigatorAnalytics>>;
