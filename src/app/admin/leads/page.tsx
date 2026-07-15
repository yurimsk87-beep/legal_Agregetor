import type { LeadOutcome, LeadSourceType, LeadStatus, Prisma } from "@prisma/client";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAdminAudit } from "@/lib/request-security";
import { requireAdminSession } from "@/lib/server-auth";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const mvpStatuses = ["NEW", "IN_PROGRESS", "CONTACTED", "CLOSED", "SPAM"] as const satisfies readonly LeadStatus[];
const outcomes = [
  "CREATED",
  "CONTACTED",
  "CONSULTATION_DONE",
  "USER_NOT_RESPONDING",
  "NEEDS_ANOTHER_SPECIALIST",
  "CLOSED_SUCCESS",
  "CLOSED_FAILED"
] as const satisfies readonly LeadOutcome[];
const sourceTypes = [
  "GENERAL",
  "LAWYER_PROFILE",
  "LAWYER_ANSWER",
  "SERVICE_PAGE",
  "CITY_PAGE",
  "CITY_SERVICE_PAGE",
  "ARTICLE",
  "QUESTION",
  "DOCUMENT",
  "CALCULATOR"
] as const satisfies readonly LeadSourceType[];

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Заявки",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  const admin = await requireAdminSession();
  const query = (await searchParams) ?? {};
  const filters = parseFilters(query);
  const [leads, cities, services] = await Promise.all([
    prisma.lead.findMany({
      where: buildWhere(filters),
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        city: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
        lawyer: { select: { id: true, firstName: true, lastName: true, middleName: true, slug: true } }
      }
    }),
    prisma.city.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.service.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
  ]);

  await logAdminAudit({
    action: "LEADS_LIST_VIEWED",
    entityType: "Lead",
    adminId: admin.id,
    afterSnapshot: { filters: pickLeadAuditFilters(filters), count: leads.length }
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-semibold text-trust">Admin CRM</p>
        <h1 className="text-4xl font-semibold text-ink">Заявки</h1>
        <p className="mt-3 max-w-3xl text-zinc-600">
          Все обращения пользователей обрабатывает только администратор платформы. Юрист-источник показан справочно и не получает контакты пользователя.
        </p>
      </div>

      <form className="mt-8 grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-3 xl:grid-cols-6">
        <FilterSelect name="status" label="Статус" value={filters.status} options={mvpStatuses} />
        <FilterSelect name="outcome" label="Результат" value={filters.outcome} options={outcomes} />
        <FilterSelect name="sourceType" label="Источник" value={filters.sourceType} options={sourceTypes} />
        <FilterSelect name="cityId" label="Город" value={filters.cityId} options={cities.map((city) => city.id)} labels={new Map(cities.map((city) => [city.id, city.name]))} />
        <FilterSelect name="serviceId" label="Услуга" value={filters.serviceId} options={services.map((service) => service.id)} labels={new Map(services.map((service) => [service.id, service.name]))} />
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Поиск
          <input name="q" defaultValue={filters.q} placeholder="Имя, телефон, email" className="rounded-md border border-line px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          С даты
          <input name="dateFrom" type="date" defaultValue={filters.dateFrom} className="rounded-md border border-line px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          По дату
          <input name="dateTo" type="date" defaultValue={filters.dateTo} className="rounded-md border border-line px-3 py-2" />
        </label>
        <div className="flex items-end gap-2 xl:col-span-2">
          <button className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-trust">Фильтровать</button>
          <a href="/admin/leads/" className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
            Сбросить
          </a>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3">Контакт</th>
                <th className="px-4 py-3">Город / услуга</th>
                <th className="px-4 py-3">Источник</th>
                <th className="px-4 py-3">Сообщение</th>
                <th className="px-4 py-3">Обработка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leads.map((lead) => (
                <tr key={lead.id} className="align-top">
                  <td className="px-4 py-4 text-zinc-600">
                    <p>{lead.createdAt.toLocaleDateString("ru-RU")}</p>
                    <p className="mt-1 text-xs">{lead.createdAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</p>
                    <p className="mt-2 text-xs text-zinc-400">{lead.id}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-ink">{lead.name}</p>
                    <p className="mt-1 text-zinc-700">{lead.phone}</p>
                    {lead.email ? <p className="mt-1 text-zinc-600">{lead.email}</p> : null}
                  </td>
                  <td className="px-4 py-4 text-zinc-700">
                    <p>{lead.city?.name ?? "Город не указан"}</p>
                    <p className="mt-1">{lead.service?.name ?? "Услуга не указана"}</p>
                  </td>
                  <td className="px-4 py-4 text-zinc-700">
                    <p className="font-medium text-ink">{lead.sourceType}</p>
                    <p className="mt-1 max-w-[220px] break-words text-xs">{lead.sourcePage}</p>
                    {lead.lawyer ? (
                      <p className="mt-2 text-xs text-zinc-600">
                        Юрист-источник: {[lead.lawyer.lastName, lead.lawyer.firstName, lead.lawyer.middleName].filter(Boolean).join(" ")}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <p className="max-w-xs whitespace-pre-wrap text-zinc-700">{lead.message}</p>
                  </td>
                  <td className="px-4 py-4">
                    <form action={updateLeadAction} className="grid min-w-64 gap-2">
                      <input type="hidden" name="leadId" value={lead.id} />
                      <select name="status" defaultValue={lead.status} className="rounded-md border border-line px-3 py-2">
                        {mvpStatuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <select name="outcome" defaultValue={lead.outcome} className="rounded-md border border-line px-3 py-2">
                        {outcomes.map((outcome) => (
                          <option key={outcome} value={outcome}>{outcome}</option>
                        ))}
                      </select>
                      <textarea name="adminComment" defaultValue={lead.adminComment ?? ""} rows={3} className="rounded-md border border-line px-3 py-2" placeholder="Комментарий администратора" />
                      <button className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-trust">Сохранить</button>
                    </form>
                    <p className="mt-2 text-xs text-zinc-500">Обновлено: {lead.updatedAt.toLocaleString("ru-RU")}</p>
                  </td>
                </tr>
              ))}
              {!leads.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">Заявок по выбранным фильтрам нет.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

async function updateLeadAction(formData: FormData) {
  "use server";

  const admin = await requireAdminSession();
  const leadId = String(formData.get("leadId") ?? "");
  const status = parseEnum(String(formData.get("status") ?? ""), mvpStatuses);
  const outcome = parseEnum(String(formData.get("outcome") ?? ""), outcomes);
  const adminComment = String(formData.get("adminComment") ?? "").trim().slice(0, 2000) || null;

  if (!leadId || !status || !outcome) return;

  const before = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!before) return;

  const after = await prisma.lead.update({
    where: { id: leadId },
    data: { status, outcome, adminComment }
  });

  await logAdminAudit({
    adminId: admin.id,
    action: "LEAD_UPDATED",
    entityType: "Lead",
    entityId: leadId,
    beforeSnapshot: pickLeadAuditSnapshot(before),
    afterSnapshot: pickLeadAuditSnapshot(after)
  });

  revalidatePath("/admin/leads/");
}

function parseFilters(query: Record<string, string | string[] | undefined>) {
  return {
    status: parseEnum(first(query.status), mvpStatuses),
    outcome: parseEnum(first(query.outcome), outcomes),
    sourceType: parseEnum(first(query.sourceType), sourceTypes),
    cityId: first(query.cityId),
    serviceId: first(query.serviceId),
    q: first(query.q).trim(),
    dateFrom: first(query.dateFrom),
    dateTo: first(query.dateTo)
  };
}

function buildWhere(filters: ReturnType<typeof parseFilters>): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.outcome) where.outcome = filters.outcome;
  if (filters.sourceType) where.sourceType = filters.sourceType;
  if (filters.cityId) where.cityId = filters.cityId;
  if (filters.serviceId) where.serviceId = filters.serviceId;
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { phone: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } }
    ];
  }
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: new Date(`${filters.dateFrom}T00:00:00.000Z`) } : {}),
      ...(filters.dateTo ? { lte: new Date(`${filters.dateTo}T23:59:59.999Z`) } : {})
    };
  }
  return where;
}

function FilterSelect<T extends string>({ name, label, value, options, labels }: { name: string; label: string; value?: T | string; options: readonly T[] | string[]; labels?: Map<string, string> }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-zinc-700">
      {label}
      <select name={name} defaultValue={value ?? ""} className="rounded-md border border-line px-3 py-2">
        <option value="">Все</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.get(option) ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function parseEnum<T extends string>(value: string, allowed: readonly T[]) {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function pickLeadAuditSnapshot(lead: { status: LeadStatus; outcome: LeadOutcome }) {
  return {
    status: lead.status,
    outcome: lead.outcome
  };
}

function pickLeadAuditFilters(filters: ReturnType<typeof parseFilters>) {
  return {
    status: filters.status,
    outcome: filters.outcome,
    sourceType: filters.sourceType,
    cityId: filters.cityId,
    serviceId: filters.serviceId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo
  };
}
