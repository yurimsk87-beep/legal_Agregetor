import { requireAdminSession } from "@/lib/server-auth";

export default async function AdminSettingsPage() {
  await requireAdminSession();
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-ink">Настройки</h1>
      <p className="mt-4 text-zinc-700">Настройки платформы, модерации, уведомлений и SEO-политик.</p>
    </section>
  );
}
