import { LawyerQuestionsMock } from "@/components/lawyer-cabinet/LawyerCabinetMocks";
import { LawyerPlaceholderPage } from "@/components/lawyer-cabinet/LawyerCabinetShell";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Вопросы для ответа | Кабинет юриста",
  robots: { index: false, follow: false }
};

export default async function LawyerQuestionsPage() {
  const questions = await prisma.question
    .findMany({
      where: { status: "PUBLISHED", qualityStatus: "APPROVED" },
      include: { city: true, service: true, answers: { select: { id: true } } },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 30
    })
    .catch(() => []);

  return (
    <LawyerPlaceholderPage
      title="Вопросы для ответа"
      description="Здесь будут опубликованные вопросы пользователей, на которые вы сможете ответить после подключения полноценного модуля."
    >
      <LawyerQuestionsMock
        questions={questions.map((question) => ({
          id: question.id,
          category: question.service?.name ?? "Юридический вопрос",
          city: question.city?.name ?? "Россия",
          title: question.title,
          text: question.text,
          answersCount: question.answers.length,
          date: new Intl.DateTimeFormat("ru-RU").format(question.publishedAt ?? question.createdAt)
        }))}
      />
    </LawyerPlaceholderPage>
  );
}
