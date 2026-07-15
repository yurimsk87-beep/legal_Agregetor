import Link from "next/link";
import { requireAdminSession } from "@/lib/server-auth";

export default async function AdminSeoPage() {
  await requireAdminSession();
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-ink">SEO-дашборд</h1>
      <p className="mt-4 text-zinc-700">Canonical, robots, sitemap, noindex-причины, maturity и clean URL.</p>
      <Link href="/admin/crud/seoPage/" className="mt-6 inline-flex rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white">Открыть CRUD</Link>
    </section>
  );
}
