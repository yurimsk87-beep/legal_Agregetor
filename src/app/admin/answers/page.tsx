import { AdminAnswerActions } from "@/components/AdminModerationActions";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";

export default async function AdminAnswersPage() {
  await requireAdminSession();
  const answers = await prisma.answer.findMany({
    include: { question: true, lawyer: true, auditLogs: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: { createdAt: "desc" },
    take: 80
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-ink">Модерация ответов</h1>
      <div className="mt-8 grid gap-5">
        {answers.map((answer) => (
          <article key={answer.id} className="rounded-lg border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-ink">{answer.question.title}</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {answer.lawyer.lastName} {answer.lawyer.firstName} · {answer.status} · {answer.qualityStatus} · score {answer.answerQualityScore}
                </p>
                {answer.publishedByAdmin ? <p className="mt-1 text-xs text-zinc-500">publishedByAdmin = true</p> : null}
                {answer.containsContactAttempt ? <p className="mt-1 text-sm font-semibold text-red-700">Обнаружена попытка указать контакты</p> : null}
              </div>
              <AdminAnswerActions answerId={answer.id} />
            </div>
            <p className="mt-4 leading-7 text-zinc-700">{answer.text}</p>
            <div className="mt-4 rounded-md bg-zinc-50 p-3 text-xs text-zinc-600">
              Аудит: {answer.auditLogs.map((log) => `${log.action} ${log.createdAt.toLocaleString("ru-RU")}`).join("; ") || "нет записей"}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
