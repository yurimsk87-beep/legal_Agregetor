import { Newspaper } from "lucide-react";
import { LawyerEmptyState, LawyerPlaceholderPage } from "@/components/lawyer-cabinet/LawyerCabinetShell";
import { prisma } from "@/lib/prisma";
import { getCurrentLawyerUser } from "@/lib/server-auth";

export const metadata = {
  title: "Публикации | Кабинет юриста",
  robots: { index: false, follow: false }
};

export default async function LawyerPublicationsPage() {
  const user = await getCurrentLawyerUser();
  const lawyer = user
    ? await prisma.lawyer.findUnique({
        where: { userId: user.id },
        select: {
          articles: {
            select: { id: true, title: true, status: true, contentFreshness: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: 20
          }
        }
      })
    : null;
  const articles = lawyer?.articles ?? [];

  return (
    <LawyerPlaceholderPage title="Публикации" description="Здесь вы сможете создавать статьи и отправлять их на модерацию.">
      <section className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm">
        <button type="button" disabled className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-3 text-sm font-semibold text-zinc-500">
          <Newspaper className="h-4 w-4" aria-hidden="true" />
          Создать публикацию
        </button>
        <div className="mt-5">
          {articles.length ? (
            <div className="grid gap-3">
              {articles.map((article) => (
                <article key={article.id} className="rounded-lg border border-line bg-zinc-50 p-4">
                  <h2 className="font-semibold text-ink">{article.title}</h2>
                  <p className="mt-2 text-sm text-zinc-600">
                    {article.status} · {article.contentFreshness} · обновлено {new Intl.DateTimeFormat("ru-RU").format(article.updatedAt)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <LawyerEmptyState title="Публикаций пока нет." description="Редактор публикаций появится после подключения модерации экспертного контента." />
          )}
        </div>
      </section>
    </LawyerPlaceholderPage>
  );
}
