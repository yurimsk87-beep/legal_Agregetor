import Link from "next/link";
import { requireAdminSession } from "@/lib/server-auth";

export default async function AdminCategoriesPage() {
  await requireAdminSession();
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-ink">Категории</h1>
      <p className="mt-4 text-zinc-700">Специализации права, перелинковка, FAQ и связанный контент.</p>
      <Link href="/admin/crud/service/" className="mt-6 inline-flex rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white">Открыть CRUD</Link>
    </section>
  );
}
