import { AdminAssistedAnswerForm } from "@/components/AdminAssistedAnswerForm";
import { AdminQuestionActions } from "@/components/AdminModerationActions";
import { hasForbiddenContact } from "@/lib/contact-safety";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";

export default async function AdminQuestionsPage() {
  await requireAdminSession();
  const [questions, lawyers] = await Promise.all([
    prisma.question.findMany({
      include: {
        city: true,
        service: true,
        attachments: true,
        answers: true,
        leads: {
          orderBy: { createdAt: "desc" },
          take: 3
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.lawyer.findMany({
      include: { profile: true },
      orderBy: { lastName: "asc" },
      take: 100
    })
  ]);
  const lawyerOptions = lawyers.map((lawyer) => ({
    id: lawyer.id,
    name: `${lawyer.lastName} ${lawyer.firstName}`,
    consent: Boolean(lawyer.profile?.consentToAdminAssistedAnswers)
  }));

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-ink">Модерация вопросов</h1>
      <div className="mt-8 grid gap-5">
        {questions.map((question) => (
          <article key={question.id} className="rounded-lg border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs text-zinc-500">{question.createdAt.toLocaleString("ru-RU")}</p>
                <h2 className="mt-2 text-xl font-semibold text-ink">{question.title}</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {question.city?.name ?? "Без города"} · {question.service?.name ?? "Без категории"} · {question.status} · {question.qualityStatus}
                </p>
              </div>
              <AdminQuestionActions questionId={question.id} />
            </div>
            <dl className="mt-4 grid gap-2 text-sm text-zinc-700">
              <div>Пользователь: {question.userName} · {question.userEmail}</div>
              <div>sourcePage: {question.sourcePage ?? "не указан"}</div>
              <div>Файлы: {question.attachments.length ? question.attachments.map((file) => file.fileName).join(", ") : "нет"}</div>
              <div>Найдены персональные данные/контакты: {hasForbiddenContact(`${question.title}\n${question.text}`) ? "да" : "нет"}</div>
              <div>Похожие вопросы: проверяются по заголовку и тексту при создании вопроса.</div>
              <div>Комментарий модерации: {question.moderationComment ?? "нет"}</div>
              <div>
                Wizard: {question.enrichmentStatus} · сценарий {question.scenarioId ?? "не определен"} · стадия {question.legalStage ?? "не указана"} · срочность {question.urgency ?? "не указана"} · риск {question.riskLevel ?? "не указан"}
              </div>
              <div>Lead score: {question.leadScore} · SEO quality score: {question.seoQualityScore} · предварительный разбор: {question.preliminaryAnswerStatus}</div>
              <div>Связанные заявки: {question.leads.length ? question.leads.map((lead) => `${lead.id} (${lead.status})`).join(", ") : "нет"}</div>
            </dl>
            <div className="mt-4 grid gap-4 text-sm leading-7 text-zinc-700">
              {question.rawText ? <AdminTextBlock title="Raw question" text={question.rawText} /> : null}
              <AdminTextBlock title="Public/enriched question" text={question.enrichedText ?? question.text} />
              {question.facts ? <AdminTextBlock title="Facts" text={formatJsonValue(question.facts)} /> : null}
              {question.missingFacts ? <AdminTextBlock title="Missing facts" text={formatJsonValue(question.missingFacts)} /> : null}
              {question.clarificationAnswers ? <AdminTextBlock title="Clarification answers" text={formatJsonValue(question.clarificationAnswers)} /> : null}
              {question.preliminaryAnswer ? <AdminTextBlock title="Preliminary answer shown to user" text={question.preliminaryAnswer} /> : null}
            </div>
            {question.status === "PUBLISHED" ? <AdminAssistedAnswerForm questionId={question.id} lawyers={lawyerOptions} /> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminTextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-line bg-zinc-50 p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-2 whitespace-pre-line break-words">{text}</p>
    </div>
  );
}

function formatJsonValue(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item)).join("\n");
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${String(item)}`)
      .join("\n");
  }
  return String(value ?? "");
}
