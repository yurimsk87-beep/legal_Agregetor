import { AnswerForm } from "@/components/AnswerForm";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ questionId: string }>;
};

export const metadata = {
  title: "Ответить на вопрос | Кабинет юриста",
  robots: { index: false, follow: false }
};

export default async function LawyerCabinetAnswerPage({ params }: PageProps) {
  const { questionId } = await params;
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { city: true, service: true }
  });

  if (!question || question.status !== "PUBLISHED") {
    return (
      <section className="rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-ink">Вопрос недоступен для ответа</h1>
        <p className="mt-3 text-zinc-600">Ответить можно только на опубликованный вопрос после модерации.</p>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-trust">Ответ юриста</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">{question.title}</h1>
        <p className="mt-3 text-sm text-zinc-600">
          {question.city?.name ?? "Россия"} · {question.service?.name ?? "Юридический вопрос"}
        </p>
        <p className="mt-5 whitespace-pre-line leading-8 text-zinc-700">{question.enrichedText ?? question.text}</p>
        <QuestionStructure
          legalStage={question.legalStage}
          urgency={question.urgency}
          riskLevel={question.riskLevel}
          facts={question.facts}
          missingFacts={question.missingFacts}
        />
      </div>
      <AnswerForm questionId={question.id} />
    </section>
  );
}

function QuestionStructure({
  legalStage,
  urgency,
  riskLevel,
  facts,
  missingFacts
}: {
  legalStage?: string | null;
  urgency?: string | null;
  riskLevel?: string | null;
  facts?: unknown;
  missingFacts?: unknown;
}) {
  const factItems = Array.isArray(facts) ? facts.map(String) : [];
  const missingItems = Array.isArray(missingFacts) ? missingFacts.map(String) : [];
  if (!legalStage && !urgency && !riskLevel && factItems.length === 0 && missingItems.length === 0) return null;

  return (
    <div className="mt-6 rounded-lg border border-line bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
      <h2 className="text-lg font-semibold text-ink">Структура ситуации</h2>
      <p className="mt-2">Стадия: {legalStage ?? "не указана"} · Срочность: {urgency ?? "не указана"} · Риск: {riskLevel ?? "не указан"}</p>
      {factItems.length ? <p className="mt-3 whitespace-pre-line">Что известно:{"\n"}{factItems.map((item) => `- ${item}`).join("\n")}</p> : null}
      {missingItems.length ? <p className="mt-3 whitespace-pre-line">Что желательно уточнить:{"\n"}{missingItems.map((item) => `- ${item}`).join("\n")}</p> : null}
    </div>
  );
}
