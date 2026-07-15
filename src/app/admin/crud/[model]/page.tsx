import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Database, Trash2 } from "lucide-react";
import {
  buildWhereFromKey,
  displayValue,
  getCrudDelegate,
  getCrudModel,
  getEnumOptions,
  inputValue,
  isLongField,
  makeRowKey,
  parseCrudFormData,
  type CrudField,
  type CrudModelConfig
} from "@/lib/admin-crud";
import { prisma } from "@/lib/prisma";
import { logAdminAudit } from "@/lib/request-security";
import { buildMetadata } from "@/lib/seo";
import { requireAdminSession } from "@/lib/server-auth";

type PageProps = {
  params: Promise<{ model: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageSize = 20;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { model } = await params;
  const config = getCrudModel(model);

  return buildMetadata({
    title: config ? `CRUD ${config.name}` : "CRUD модель не найдена",
    description: "Создание, редактирование и удаление записей в админке.",
    path: config?.route ?? "/admin/crud/",
    isIndexable: false
  });
}

export default async function AdminCrudModelPage({ params, searchParams }: PageProps) {
  await requireAdminSession();
  const { model } = await params;
  const config = getCrudModel(model);
  if (!config) notFound();

  const query = (await searchParams) ?? {};
  const page = getPage(query.page);
  const delegate = getCrudDelegate(config.name);
  const [rows, total] = await Promise.all([
    delegate.findMany({
      orderBy: getOrderBy(config),
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    delegate.count()
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-trust" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-trust">Admin CRUD</p>
            <h1 className="text-4xl font-semibold text-ink">{config.name}</h1>
            <p className="mt-2 text-zinc-600">
              {total} записей. Ключ: {config.keyFields.map((field) => field.name).join(" + ")}.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/crud/" className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
            Все сущности
          </Link>
          <Link href="/admin/" className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
            Дашборд
          </Link>
        </div>
      </div>

      <section className="mt-8 rounded-lg border border-line bg-white p-5">
        <details open>
          <summary className="cursor-pointer text-lg font-semibold text-ink">Создать запись</summary>
          <form action={createCrudRecordAction} className="mt-5 grid gap-4">
            <input type="hidden" name="modelName" value={config.name} />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {config.createFields.map((field) => (
                <CrudFieldInput key={field.name} field={field} mode="create" />
              ))}
            </div>
            <div className="flex justify-end">
              <button type="submit" className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-trust">
                Создать
              </button>
            </div>
          </form>
        </details>
      </section>

      <section className="mt-8 grid gap-4">
        {rows.length ? (
          rows.map((row) => <CrudRow key={makeRowKey(config, row)} model={config} row={row} />)
        ) : (
          <p className="rounded-lg border border-line bg-white p-5 text-zinc-600">Записей пока нет.</p>
        )}
      </section>

      <nav className="mt-8 flex items-center justify-between rounded-lg border border-line bg-white p-4 text-sm">
        <Link
          href={`${config.route}?page=${Math.max(1, page - 1)}`}
          className={page <= 1 ? "pointer-events-none text-zinc-400" : "font-semibold text-ink hover:text-trust"}
        >
          Назад
        </Link>
        <span className="text-zinc-600">
          Страница {page} из {totalPages}
        </span>
        <Link
          href={`${config.route}?page=${Math.min(totalPages, page + 1)}`}
          className={page >= totalPages ? "pointer-events-none text-zinc-400" : "font-semibold text-ink hover:text-trust"}
        >
          Далее
        </Link>
      </nav>
    </section>
  );
}

function CrudRow({ model, row }: { model: CrudModelConfig; row: Record<string, unknown> }) {
  const rowKey = makeRowKey(model, row);

  return (
    <article className="rounded-lg border border-line bg-white p-5">
      <div className="grid gap-3 lg:grid-cols-4">
        {model.listFields.map((field) => (
          <div key={field.name} className="min-w-0 rounded-md bg-zinc-50 px-3 py-2">
            <p className="text-xs font-medium text-zinc-500">{field.name}</p>
            <p className="mt-1 truncate text-sm font-semibold text-ink">{displayValue(row[field.name]) || "—"}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
        <details className="rounded-md border border-line p-4">
          <summary className="cursor-pointer font-semibold text-ink">Редактировать</summary>
          <form action={updateCrudRecordAction} className="mt-4 grid gap-4">
            <input type="hidden" name="modelName" value={model.name} />
            <input type="hidden" name="rowKey" value={rowKey} />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {model.updateFields.map((field) => (
                <CrudFieldInput key={field.name} field={field} value={row[field.name]} mode="update" />
              ))}
            </div>
            <div className="flex justify-end">
              <button type="submit" className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-trust">
                Сохранить
              </button>
            </div>
          </form>
        </details>

        <form action={deleteCrudRecordAction} className="self-start">
          <input type="hidden" name="modelName" value={model.name} />
          <input type="hidden" name="rowKey" value={rowKey} />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Удалить
          </button>
        </form>
      </div>
    </article>
  );
}

function CrudFieldInput({ field, value, mode }: { field: CrudField; value?: unknown; mode: "create" | "update" }) {
  const label = `${field.name}${field.isRequired ? " *" : ""}`;
  const defaultValue = mode === "create" ? "" : inputValue(field, value);
  const commonClass = "rounded-md border border-line px-3 py-2 outline-none focus:border-trust";

  if (field.kind === "enum") {
    return (
      <label className="grid gap-1 text-sm font-medium text-zinc-700">
        {label}
        <select name={field.name} defaultValue={defaultValue} className={commonClass}>
          {mode === "create" && field.hasDefaultValue ? <option value="">default</option> : null}
          {!field.isRequired ? <option value="">null</option> : null}
          {getEnumOptions(field.type).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "Boolean" && !field.isList) {
    return (
      <label className="grid gap-1 text-sm font-medium text-zinc-700">
        {label}
        <select name={field.name} defaultValue={defaultValue || (mode === "create" && field.hasDefaultValue ? String(field.default ?? "") : "")} className={commonClass}>
          {mode === "create" && field.hasDefaultValue ? <option value="">default</option> : null}
          {!field.isRequired ? <option value="">null</option> : null}
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </label>
    );
  }

  if (isLongField(field)) {
    return (
      <label className="grid gap-1 text-sm font-medium text-zinc-700 xl:col-span-3">
        {label}
        <textarea name={field.name} defaultValue={defaultValue} rows={4} className={commonClass} placeholder={placeholderFor(field)} />
      </label>
    );
  }

  return (
    <label className="grid gap-1 text-sm font-medium text-zinc-700">
      {label}
      <input
        name={field.name}
        type={field.type === "Int" || field.type === "Float" ? "number" : "text"}
        step={field.type === "Float" ? "any" : undefined}
        defaultValue={defaultValue}
        className={commonClass}
        placeholder={placeholderFor(field)}
      />
    </label>
  );
}

async function createCrudRecordAction(formData: FormData) {
  "use server";

  const admin = await requireAdminSession();
  const model = getActionModel(formData);
  const data = applySeoAndModerationGuards(model.name, parseCrudFormData(model, formData, "create"));
  await assertRouteSlugMutationAllowed(model.name, data);
  const created = await getCrudDelegate(model.name).create({ data });
  await logAdminAudit({
    adminId: admin.id,
    action: "CRUD_CREATED",
    entityType: model.name,
    afterSnapshot: sanitizeCrudAuditSnapshot(created)
  });
  revalidateCrud(model);
}

async function updateCrudRecordAction(formData: FormData) {
  "use server";

  const admin = await requireAdminSession();
  const model = getActionModel(formData);
  const rowKey = String(formData.get("rowKey") ?? "");
  const where = buildWhereFromKey(model, rowKey);
  const data = applySeoAndModerationGuards(model.name, parseCrudFormData(model, formData, "update"));

  await assertUserMutationAllowed(model.name, where, data, admin.id, "update");
  await assertRouteSlugMutationAllowed(model.name, data);
  const before = await getCrudDelegate(model.name).findMany({ where, take: 1 });
  const updated = await getCrudDelegate(model.name).update({ where, data });
  await logAdminAudit({
    adminId: admin.id,
    action: "CRUD_UPDATED",
    entityType: model.name,
    beforeSnapshot: sanitizeCrudAuditSnapshot(before[0] ?? null),
    afterSnapshot: sanitizeCrudAuditSnapshot(updated)
  });
  revalidateCrud(model);
}

async function deleteCrudRecordAction(formData: FormData) {
  "use server";

  const admin = await requireAdminSession();
  const model = getActionModel(formData);
  const where = buildWhereFromKey(model, String(formData.get("rowKey") ?? ""));

  await assertUserMutationAllowed(model.name, where, {}, admin.id, "delete");
  const before = await getCrudDelegate(model.name).findMany({ where, take: 1 });
  const deleted = await getCrudDelegate(model.name).delete({ where });
  await logAdminAudit({
    adminId: admin.id,
    action: "CRUD_DELETED",
    entityType: model.name,
    beforeSnapshot: sanitizeCrudAuditSnapshot(before[0] ?? deleted)
  });
  revalidateCrud(model);
}

function getActionModel(formData: FormData) {
  const modelName = String(formData.get("modelName") ?? "");
  const model = getCrudModel(modelName);
  if (!model) throw new Error(`Unknown CRUD model: ${modelName}`);
  return model;
}

function applySeoAndModerationGuards(modelName: string, data: Record<string, unknown>) {
  if (modelName === "SeoPage" && typeof data.isIndexable === "boolean") {
    data.robots = data.isIndexable ? "index, follow" : "noindex, follow";
  }

  if (modelName === "Question" && data.qualityStatus && data.qualityStatus !== "APPROVED") {
    data.isIndexable = false;
  }

  if (modelName === "Article" && (data.status !== "APPROVED" || data.contentFreshness === "OUTDATED")) {
    data.isIndexable = false;
  }

  if ((modelName === "Review" || modelName === "Answer") && data.qualityStatus) {
    data.isModerated = data.qualityStatus === "APPROVED";
  }

  return data;
}

async function assertRouteSlugMutationAllowed(modelName: string, data: Record<string, unknown>) {
  const slug = typeof data.slug === "string" ? data.slug.trim() : "";
  if (!slug) return;

  const conflicts: string[] = [];

  if (modelName === "Question") {
    const [city, service] = await Promise.all([
      prisma.city.findUnique({ where: { slug }, select: { id: true } }),
      prisma.service.findUnique({ where: { slug }, select: { id: true } })
    ]);
    if (city) conflicts.push("City");
    if (service) conflicts.push("Service");
  }

  if (modelName === "Lawyer") {
    const city = await prisma.city.findUnique({ where: { slug }, select: { id: true } });
    if (city) conflicts.push("City");
  }

  if (modelName === "City") {
    const [lawyer, question, service] = await Promise.all([
      prisma.lawyer.findUnique({ where: { slug }, select: { id: true } }),
      prisma.question.findUnique({ where: { slug }, select: { id: true } }),
      prisma.service.findUnique({ where: { slug }, select: { id: true } })
    ]);
    if (lawyer) conflicts.push("Lawyer");
    if (question) conflicts.push("Question");
    if (service) conflicts.push("Service");
  }

  if (modelName === "Service") {
    const [city, question] = await Promise.all([
      prisma.city.findUnique({ where: { slug }, select: { id: true } }),
      prisma.question.findUnique({ where: { slug }, select: { id: true } })
    ]);
    if (city) conflicts.push("City");
    if (question) conflicts.push("Question");
  }

  if (conflicts.length) {
    throw new Error(`Slug "${slug}" conflicts with dynamic route namespace: ${conflicts.join(", ")}.`);
  }
}

async function assertUserMutationAllowed(
  modelName: string,
  where: Record<string, unknown>,
  data: Record<string, unknown>,
  adminId: string,
  action: "update" | "delete"
) {
  if (modelName !== "User") return;

  const user = await prisma.user.findUnique({
    where: where as { id: string },
    select: { id: true, role: true }
  });
  if (!user) return;

  const demotesAdmin = action === "delete" || (data.role !== undefined && data.role !== "ADMIN");
  if (user.id === adminId && demotesAdmin) {
    throw new Error("Нельзя удалить или лишить роли ADMIN текущего пользователя.");
  }

  if (user.role === "ADMIN" && demotesAdmin) {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      throw new Error("Нельзя удалить или понизить последнего администратора.");
    }
  }
}

function revalidateCrud(model: CrudModelConfig) {
  revalidatePath("/admin");
  revalidatePath("/admin/crud");
  revalidatePath(model.route);
}

function getOrderBy(model: CrudModelConfig) {
  if (model.scalarFields.some((field) => field.name === "createdAt")) return { createdAt: "desc" };
  if (model.scalarFields.some((field) => field.name === "updatedAt")) return { updatedAt: "desc" };
  return { [model.keyFields[0]?.name ?? "id"]: "asc" };
}

function getPage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function placeholderFor(field: CrudField) {
  if (field.isList) return "JSON array или значения через запятую";
  if (field.type === "Json") return "{}";
  if (field.type === "DateTime") return "2026-05-26T12:00:00.000Z";
  return field.hasDefaultValue ? "default" : undefined;
}

function sanitizeCrudAuditSnapshot(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const snapshot = { ...(value as Record<string, unknown>) };
  delete snapshot.passwordHash;
  delete snapshot.resetToken;
  delete snapshot.token;
  delete snapshot.secret;
  return snapshot;
}
