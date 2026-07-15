import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/server-auth";
import { getAiNavigatorAnalytics, type AiNavigatorAnalytics } from "@/lib/ai/navigator-analytics";
import { getAiNavigatorStatus } from "@/lib/ai/ai-navigator-visibility";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Аналитика ИИ-консультанта", robots: { index: false, follow: false } };

type PageProps = { searchParams?: Promise<{ period?: string; query?: string }> };

const PERIODS = [
  { key: "7", label: "7 дней", days: 7 },
  { key: "30", label: "30 дней", days: 30 },
  { key: "all", label: "Всё время", days: null as number | null }
];

function fromDateFor(period: string): string | undefined {
  const found = PERIODS.find((p) => p.key === period) ?? PERIODS[1];
  if (found.days == null) return undefined;
  const d = new Date();
  d.setDate(d.getDate() - found.days);
  return d.toISOString().slice(0, 10);
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });
}

export default async function AdminAiNavigatorPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const sp = searchParams ? await searchParams : {};
  const period = sp.period && PERIODS.some((p) => p.key === sp.period) ? sp.period : "30";
  const query = (sp.query ?? "").trim();

  let data: AiNavigatorAnalytics | null = null;
  let failed = false;
  try {
    data = await getAiNavigatorAnalytics({ from: fromDateFor(period), limit: 50, query: query || undefined });
  } catch {
    failed = true;
  }

  const qs = (p: string) => `?period=${p}${query ? `&query=${encodeURIComponent(query)}` : ""}`;
  const status = getAiNavigatorStatus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Аналитика ИИ-консультанта</h1>
        <p className="mt-1 text-sm text-zinc-600">Показы, клики и уверенность ИИ-консультанта в поиске.</p>
      </div>

      <StatusBlock status={status} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border border-line bg-white p-1">
          {PERIODS.map((p) => (
            <a key={p.key} href={qs(p.key)} className={["rounded px-3 py-1.5 text-sm font-medium", period === p.key ? "bg-ink text-white" : "text-zinc-700 hover:bg-zinc-100"].join(" ")}>
              {p.label}
            </a>
          ))}
        </div>
        <form action="/admin/ai-navigator/" method="get" className="flex items-center gap-2">
          <input type="hidden" name="period" value={period} />
          <input name="query" defaultValue={query} placeholder="Поиск по запросу…" className="min-h-9 rounded-md border border-line px-3 text-sm outline-none focus:border-trust" />
          <button type="submit" className="min-h-9 rounded-md border border-line px-3 text-sm font-semibold text-ink hover:border-trust">Найти</button>
          {query ? <a href={qs(period).replace(/&query=[^&]*/, "")} className="text-sm text-zinc-500 hover:text-trust">сбросить</a> : null}
        </form>
      </div>

      {failed || !data ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Не удалось загрузить аналитику. Попробуйте обновить страницу позже.
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Показы ИИ-консультанта" value={data.summary.views} />
            <Metric label="Ошибки" value={data.summary.errors} />
            <Metric label="Low confidence" value={data.summary.lowConfidence} />
            <Metric label="Просмотры уточнений" value={data.summary.questionViews} />
            <Metric label="Клики по основному действию" value={data.summary.primaryClicks} />
            <Metric label="Клики по результатам" value={data.summary.resultClicks} />
            <Metric label="CTR primaryAction" value={pct(data.summary.ctrPrimary)} />
            <Metric label="CTR результатов" value={pct(data.summary.ctrResults)} />
          </div>

          <Panel title="Динамика по дням">
            <Table head={["Дата", "Показы", "Primary", "Результаты", "Ошибки", "Low conf."]}>
              {data.byDay.map((d) => (
                <tr key={d.date} className="border-t border-line">
                  <Td>{d.date}</Td><Td>{d.views}</Td><Td>{d.primaryClicks}</Td><Td>{d.resultClicks}</Td><Td>{d.errors}</Td><Td>{d.lowConfidence}</Td>
                </tr>
              ))}
            </Table>
          </Panel>

          <Panel title="Популярные запросы">
            <Table head={["Запрос", "Кол-во", "Low conf.", "Клики", "CTR"]}>
              {data.topQueries.map((q, i) => (
                <tr key={i} className="border-t border-line">
                  <Td><span className="break-all">{q.query}</span></Td><Td>{q.count}</Td><Td>{q.lowConfidence}</Td><Td>{q.clicks}</Td><Td>{pct(q.ctr)}</Td>
                </tr>
              ))}
            </Table>
          </Panel>

          <Panel title="Запросы с низкой уверенностью">
            <Table head={["Запрос", "Кол-во", "Последний раз"]}>
              {data.lowConfidenceQueries.map((q, i) => (
                <tr key={i} className="border-t border-line">
                  <Td><span className="break-all">{q.query}</span></Td><Td>{q.count}</Td><Td>{fmtDateTime(q.lastSeen)}</Td>
                </tr>
              ))}
            </Table>
          </Panel>

          <Panel title="Клики по типам результата">
            <Table head={["Тип", "Клики"]}>
              {data.clicksByTargetType.map((c) => (
                <tr key={c.targetType} className="border-t border-line">
                  <Td>{c.targetType}</Td><Td>{c.count}</Td>
                </tr>
              ))}
            </Table>
          </Panel>

          <Panel title="Последние события">
            <Table head={["Дата", "Event", "Page", "Запрос", "Confidence", "TargetType", "TargetTitle", "Href"]}>
              {data.recentEvents.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <Td>{fmtDateTime(e.createdAt)}</Td>
                  <Td><span className="font-mono text-xs">{e.event.replace("ai_navigator_", "")}</span></Td>
                  <Td>{e.page ?? "—"}</Td>
                  <Td><span className="break-all">{e.query ?? "—"}</span></Td>
                  <Td>{e.confidence ?? "—"}</Td>
                  <Td>{e.targetType ?? "—"}</Td>
                  <Td><span className="break-all">{e.targetTitle ?? "—"}</span></Td>
                  <Td><span className="break-all text-xs text-zinc-500">{e.targetHref ?? "—"}</span></Td>
                </tr>
              ))}
            </Table>
          </Panel>
        </>
      )}
    </div>
  );
}

function StatusBlock({ status }: { status: ReturnType<typeof getAiNavigatorStatus> }) {
  const Flag = ({ on }: { on: boolean }) => (
    <span className={["rounded px-2 py-0.5 text-xs font-semibold", on ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"].join(" ")}>
      {on ? "true" : "false"}
    </span>
  );
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "AI_NAVIGATOR_ENABLED", value: <Flag on={status.enabled} /> },
    { label: "AI_NAVIGATOR_VISIBLE_TO", value: <span className="font-mono text-xs">{status.visibleTo}</span> },
    { label: "AI_NAVIGATOR_LLM_ENABLED", value: <Flag on={status.llmFlag} /> },
    { label: "LLM эффективно активна", value: <Flag on={status.llmEffective} /> },
    { label: "AI_PROVIDER", value: <span className="font-mono text-xs">{status.provider ?? "—"}</span> },
    { label: "AI_MODEL", value: <span className="font-mono text-xs">{status.model ?? "—"}</span> },
    { label: "AI_BASE_URL", value: <span className="break-all font-mono text-xs">{status.baseUrl ?? "—"}</span> },
    { label: "AI_API_KEY", value: <span className="text-xs text-zinc-600">{status.apiKeyConfigured ? "задан (скрыт)" : "не задан"}</span> }
  ];

  return (
    <Panel title="Статус ИИ-консультанта">
      <div className="grid gap-x-6 gap-y-2 px-4 py-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 border-b border-line/60 py-1.5">
            <span className="text-xs font-medium text-zinc-600">{row.label}</span>
            {row.value}
          </div>
        ))}
      </div>
      <p className="border-t border-line px-4 py-3 text-xs leading-5 text-zinc-500">
        {status.enabled
          ? `Карточка показывается ${status.visibleTo === "all" ? "всем пользователям" : "только администраторам"}.`
          : "ИИ-консультант выключен: карточка не показывается в поиске. События аналитики будут появляться только от ручных API-тестов или прошлых сессий."}
        {" "}AI_API_KEY не отображается из соображений безопасности.
      </p>
    </Panel>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <p className="text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-600">{label}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white shadow-sm">
      <h2 className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">{title}</h2>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="text-xs uppercase tracking-wide text-zinc-500">
          {head.map((h) => (
            <th key={h} className="px-4 py-2 font-semibold">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {children}
        {/* пустое состояние */}
      </tbody>
    </table>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2 align-top text-zinc-700">{children}</td>;
}
