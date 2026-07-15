import { LawyerEmptyState, LawyerPlaceholderPage } from "@/components/lawyer-cabinet/LawyerCabinetShell";
import { prisma } from "@/lib/prisma";
import { getCurrentLawyerUser } from "@/lib/server-auth";

export const metadata = {
  title: "Отзывы | Кабинет юриста",
  robots: { index: false, follow: false }
};

export default async function LawyerReviewsPage() {
  const user = await getCurrentLawyerUser();
  const lawyer = user
    ? await prisma.lawyer.findUnique({
        where: { userId: user.id },
        select: {
          reviews: {
            where: { isModerated: true, qualityStatus: "APPROVED" },
            orderBy: { createdAt: "desc" },
            take: 10
          }
        }
      })
    : null;
  const reviews = lawyer?.reviews ?? [];
  const average = reviews.length ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : "0.0";

  return (
    <LawyerPlaceholderPage title="Отзывы" description="Здесь будут отзывы клиентов после модерации администратором платформы.">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Средний рейтинг" value={average} />
        <StatCard label="Количество отзывов" value={String(reviews.length)} />
        <StatCard label="Последние отзывы" value={reviews.length ? "есть" : "нет"} />
        <div className="md:col-span-3">
          {reviews.length ? (
            <div className="grid gap-3">
              {reviews.map((review) => (
                <article key={review.id} className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                    <span className="font-semibold text-ink">{review.userName}</span>
                    <span>{review.rating}/5</span>
                    <span>{new Intl.DateTimeFormat("ru-RU").format(review.createdAt)}</span>
                  </div>
                  <p className="mt-3 leading-7 text-zinc-700">{review.text}</p>
                </article>
              ))}
            </div>
          ) : (
            <LawyerEmptyState title="Пока нет отзывов." description="Отзывы будут видны после модерации администратором." />
          )}
        </div>
      </div>
    </LawyerPlaceholderPage>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
    </article>
  );
}
