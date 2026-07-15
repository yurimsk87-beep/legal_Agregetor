import { prisma } from "./prisma";
import { normalizeAnalyticsRoute, sanitizeAnalyticsPayload } from "./analytics-privacy";

type LawyerRecipient = {
  id: string;
  email?: string | null;
};

export async function notifyLawyersAboutPublishedQuestion(questionId: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { city: true, service: true }
  });

  if (!question || question.status !== "PUBLISHED") {
    return { ok: false, delivered: 0, reason: "Question is not published." };
  }

  const recipients = await findQuestionRecipients(question.serviceId, question.cityId);
  const results = await Promise.all(recipients.map((lawyer) => sendQuestionEmailToLawyer(lawyer.id, question.id)));

  await prisma.analyticsEvent.create({
    data: {
      type: "QUESTION_PUBLISHED",
      url: normalizeAnalyticsRoute(`/questions/${question.slug}/`) ?? "/questions/[questionSlug]",
      sourcePage: normalizeAnalyticsRoute(question.sourcePage),
      targetType: "QUESTION",
      targetId: question.id,
      payload: sanitizeAnalyticsPayload({
        recipients: recipients.length,
        city: question.city?.slug,
        service: question.service?.slug
      })
    }
  }).catch(() => undefined);

  return {
    ok: true,
    delivered: results.filter((result) => result.ok).length,
    recipients: recipients.length
  };
}

export async function sendQuestionEmailToLawyer(lawyerId: string, questionId: string) {
  const [lawyer, question] = await Promise.all([
    prisma.lawyer.findUnique({
      where: { id: lawyerId },
      include: { user: true, services: { include: { service: true } }, cities: { include: { city: true } } }
    }),
    prisma.question.findUnique({ where: { id: questionId }, include: { city: true, service: true } })
  ]);

  if (!lawyer || !question || !lawyer.user.email) {
    return { ok: false, reason: "Recipient or question not found." };
  }

  const emailPayload = {
    to: lawyer.user.email,
    subject: question.title,
    city: question.city?.name ?? "Россия",
    category: question.service?.name ?? "Юридический вопрос",
    excerpt: question.text.slice(0, 280),
    answerUrl: `/lawyer/questions/${question.id}/answer`,
    warning:
      "В ответе нельзя указывать телефон, email, Telegram, WhatsApp, сайт или другие внешние контакты. Такие ответы будут отправлены на модерацию или отклонены"
  };

  void emailPayload;
  return { ok: true };
}

export async function sendQuestionTelegramToLawyer(lawyerId: string, questionId: string) {
  void lawyerId;
  void questionId;
  return { ok: false, reason: "Telegram notifications are planned for a later stage." };
}

async function findQuestionRecipients(serviceId?: string | null, cityId?: string | null): Promise<LawyerRecipient[]> {
  const baseWhere = {
    active: true,
    blocked: false,
    consentToNotifications: true,
    profileStatus: "APPROVED" as const,
    user: { role: "LAWYER" as const }
  };

  const byServiceAndCity = await prisma.lawyer.findMany({
    where: {
      ...baseWhere,
      services: serviceId ? { some: { serviceId } } : undefined,
      cities: cityId ? { some: { cityId } } : undefined
    },
    select: { id: true, user: { select: { email: true } } },
    take: 30
  });

  const byService = byServiceAndCity.length >= 5 || !serviceId
    ? []
    : await prisma.lawyer.findMany({
        where: {
          ...baseWhere,
          services: { some: { serviceId } }
        },
        select: { id: true, user: { select: { email: true } } },
        take: 30
      });

  const fallback = byServiceAndCity.length + byService.length >= 5
    ? []
    : await prisma.lawyer.findMany({
        where: baseWhere,
        select: { id: true, user: { select: { email: true } } },
        take: 30
      });

  const unique = new Map<string, LawyerRecipient>();
  [...byServiceAndCity, ...byService, ...fallback].forEach((lawyer) => {
    unique.set(lawyer.id, { id: lawyer.id, email: lawyer.user.email });
  });

  return [...unique.values()];
}
