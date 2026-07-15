import Link from "next/link";
import { Scale } from "lucide-react";
import { LawyerEmptyState, LawyerPlaceholderPage } from "@/components/lawyer-cabinet/LawyerCabinetShell";
import { prisma } from "@/lib/prisma";
import { getCurrentLawyerUser } from "@/lib/server-auth";

export const metadata = {
  title: "Судебные дела | Кабинет юриста",
  robots: { index: false, follow: false }
};

export default async function LawyerCourtCasesPage() {
  const user = await getCurrentLawyerUser();
  const lawyer = user
    ? await prisma.lawyer.findUnique({
        where: { userId: user.id },
        select: {
          cases: {
            select: { id: true, title: true, result: true, duration: true, isAnonymized: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: 20
          }
        }
      })
    : null;
  const cases = lawyer?.cases ?? [];

  return (
    <LawyerPlaceholderPage title="Судебные дела" description="Здесь вы сможете добавлять обезличенные судебные дела для усиления доверия к профилю.">
      <section className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm">
        <Link href="/lawyer-cabinet/profile/#судебные-дела" className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-3 text-sm font-semibold hover:border-trust">
          <Scale className="h-4 w-4" aria-hidden="true" />
          Добавить судебное дело в профиле
        </Link>
        <div className="mt-5">
          {cases.length ? (
            <div className="grid gap-3">
              {cases.map((item) => (
                <article key={item.id} className="rounded-lg border border-line bg-zinc-50 p-4">
                  <h2 className="font-semibold text-ink">{item.title}</h2>
                  <p className="mt-2 text-sm text-zinc-600">
                    {item.result} · {item.duration} · {item.isAnonymized ? "обезличено" : "нужна проверка"}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <LawyerEmptyState title="Судебные дела пока не добавлены." description="На MVP дела редактируются в разделе профиля и не содержат персональных данных клиентов." />
          )}
        </div>
      </section>
    </LawyerPlaceholderPage>
  );
}
