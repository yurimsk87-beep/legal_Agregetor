import { LawyerPlaceholderPage } from "@/components/lawyer-cabinet/LawyerCabinetShell";
import { prisma } from "@/lib/prisma";
import { getCurrentLawyerUser } from "@/lib/server-auth";

export const metadata = {
  title: "Статистика | Кабинет юриста",
  robots: { index: false, follow: false }
};

export default async function LawyerStatisticsPage() {
  const user = await getCurrentLawyerUser();
  const lawyer = user
    ? await prisma.lawyer.findUnique({
        where: { userId: user.id },
        select: { id: true, reviewCount: true, articles: { select: { id: true } }, answers: { select: { id: true } } }
      })
    : null;
  const profileViews = lawyer
    ? await prisma.analyticsEvent.count({ where: { targetType: "LAWYER", targetId: lawyer.id, type: "LAWYER_PROFILE_VIEW" } }).catch(() => 0)
    : 0;
  const ctaClicks = lawyer
    ? await prisma.analyticsEvent.count({ where: { targetType: "LAWYER", targetId: lawyer.id, type: { in: ["LAWYER_PROFILE_FORM_OPENED", "LAWYER_PROFILE_LEAD_CREATED"] } } }).catch(() => 0)
    : 0;

  return (
    <LawyerPlaceholderPage
      title="Статистика"
      description="Здесь будет обезличенная статистика профиля: просмотры, ответы, публикации и клики по кнопке обращения. Контакты пользователей и заявки здесь не показываются."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Просмотры профиля" value={String(profileViews)} />
        <StatCard label="Просмотры ответов" value={String(lawyer?.answers.length ?? 0)} />
        <StatCard label="Обращения с профиля" value={String(ctaClicks)} />
        <StatCard label="Публикации" value={String(lawyer?.articles.length ?? 0)} />
        <StatCard label="Отзывы" value={String(lawyer?.reviewCount ?? 0)} />
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
