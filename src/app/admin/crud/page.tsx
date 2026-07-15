import type { Metadata } from "next";
import Link from "next/link";
import { Database, ExternalLink } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { requireAdminSession } from "@/lib/server-auth";
import { adminCrudModels, countCrudRows } from "@/lib/admin-crud";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "CRUD сущностей админки",
    description: "Управление всеми Prisma-сущностями юридического SEO-агрегатора.",
    path: "/admin/crud/",
    isIndexable: false
  });
}

export default async function AdminCrudIndexPage() {
  await requireAdminSession();
  const counts = await countCrudRows();

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-trust" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-trust">Admin CRUD</p>
            <h1 className="text-4xl font-semibold text-ink">Все сущности проекта</h1>
            <p className="mt-2 max-w-3xl text-zinc-600">
              Быстрое создание, редактирование и удаление записей по всем моделям Prisma. SEO-поля, UGC, вопросы,
              справочники, индексация и контент управляются из одного раздела.
            </p>
          </div>
        </div>
        <Link href="/admin/" className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
          Назад в дашборд
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminCrudModels.map((model) => (
          <Link
            key={model.name}
            href={model.route}
            className="group rounded-lg border border-line bg-white p-5 transition hover:border-trust hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">{model.name}</h2>
                <p className="mt-1 text-sm text-zinc-500">{model.label}</p>
              </div>
              <ExternalLink className="h-5 w-5 text-zinc-400 transition group-hover:text-trust" aria-hidden="true" />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-sm">
              <span className="text-zinc-500">Записей</span>
              <span className="font-semibold text-ink">{counts.get(model.name) ?? 0}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
