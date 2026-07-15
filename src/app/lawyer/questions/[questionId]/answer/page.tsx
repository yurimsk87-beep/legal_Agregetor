import { redirect } from "next/navigation";
import { AnswerForm } from "@/components/AnswerForm";
import { buildMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/server-auth";

type PageProps = {
  params: Promise<{ questionId: string }>;
};

export const metadata = buildMetadata({
  title: "Ответить на вопрос",
  description: "Кабинет юриста: форма ответа на опубликованный вопрос.",
  path: "/lawyer/questions/answer/",
  isIndexable: false
});

export default async function LawyerAnswerPage({ params }: PageProps) {
  const { questionId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login/?next=${encodeURIComponent(`/lawyer/questions/${questionId}/answer/`)}`);
  }
  if (user.role !== "LAWYER") {
    redirect("/");
  }

  const question = await prisma.question.findUnique({ where: { id: questionId }, include: { city: true, service: true } });
  if (!question || question.status !== "PUBLISHED") {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-ink">Вопрос недоступен для ответа</h1>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-ink">{question.title}</h1>
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
      <div className="mt-8">
        <AnswerForm questionId={question.id} />
      </div>
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
    <div className="mt-6 rounded-lg border border-line bg-white p-5 text-sm leading-6 text-zinc-700">
      <h2 className="text-lg font-semibold text-ink">Структура ситуации</h2>
      <p className="mt-2">Стадия: {legalStage ?? "не указана"} · Срочность: {urgency ?? "не указана"} · Риск: {riskLevel ?? "не указан"}</p>
      {factItems.length ? <p className="mt-3 whitespace-pre-line">Что известно:{"\n"}{factItems.map((item) => `- ${item}`).join("\n")}</p> : null}
      {missingItems.length ? <p className="mt-3 whitespace-pre-line">Что желательно уточнить:{"\n"}{missingItems.map((item) => `- ${item}`).join("\n")}</p> : null}
    </div>
  );
}
