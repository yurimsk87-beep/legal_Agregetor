import { LawyerAnswersMock } from "@/components/lawyer-cabinet/LawyerCabinetMocks";
import { LawyerPlaceholderPage } from "@/components/lawyer-cabinet/LawyerCabinetShell";
import { prisma } from "@/lib/prisma";
import { getCurrentLawyerUser } from "@/lib/server-auth";

export const metadata = {
  title: "Мои ответы | Кабинет юриста",
  robots: { index: false, follow: false }
};

export default async function LawyerAnswersPage() {
  const user = await getCurrentLawyerUser();
  const lawyer = user
    ? await prisma.lawyer.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
          answers: {
            include: { question: { select: { title: true } } },
            orderBy: { createdAt: "desc" },
            take: 50
          }
        }
      })
    : null;

  return (
    <LawyerPlaceholderPage
      title="Мои ответы"
      description="Здесь будут ваши черновики, ответы на модерации, опубликованные и отклоненные ответы."
    >
      <LawyerAnswersMock
        answers={(lawyer?.answers ?? []).map((answer) => ({
          id: answer.id,
          questionTitle: answer.question.title,
          text: answer.text,
          status: answer.status,
          qualityStatus: answer.qualityStatus,
          containsContactAttempt: answer.containsContactAttempt,
          date: new Intl.DateTimeFormat("ru-RU").format(answer.createdAt)
        }))}
      />
    </LawyerPlaceholderPage>
  );
}
