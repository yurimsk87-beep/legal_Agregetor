import type { Metadata } from "next";
import { LawyerDashboard } from "@/components/lawyer-cabinet/LawyerDashboard";
import { prisma } from "@/lib/prisma";
import { getCurrentLawyerUser } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Кабинет юриста",
  robots: {
    index: false,
    follow: false
  }
};

type LawyerActivityInput = {
  profileStatus: string;
  isVerified: boolean;
  photoUrl: string | null;
  description: string;
  education: string;
  services: unknown[];
  cities: unknown[];
  priceItems: unknown[];
  profile: { about: string; casesCount: number } | null;
  answers: {
    status: string;
    qualityStatus: string;
    isModerated: boolean;
    answerQualityScore: number;
    containsContactAttempt: boolean;
    containsUnsupportedLegalClaim: boolean;
    containsFearPressure: boolean;
    containsGenericLeadBait: boolean;
  }[];
  articles: unknown[];
  cases: unknown[];
};

export default async function LawyerCabinetPage() {
  const user = await getCurrentLawyerUser();
  const lawyer = user
    ? await prisma.lawyer.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
          profileStatus: true,
          isVerified: true,
          photoUrl: true,
          description: true,
          education: true,
          reviewCount: true,
          profile: { select: { about: true, casesCount: true } },
          services: { select: { serviceId: true } },
          cities: { select: { cityId: true } },
          priceItems: { select: { id: true } },
          answers: {
            select: {
              id: true,
              status: true,
              qualityStatus: true,
              isModerated: true,
              answerQualityScore: true,
              containsContactAttempt: true,
              containsUnsupportedLegalClaim: true,
              containsFearPressure: true,
              containsGenericLeadBait: true
            }
          },
          articles: {
            where: { status: "APPROVED" },
            select: { id: true }
          },
          cases: { select: { id: true } }
        }
      })
    : null;
  const questionsCount = await prisma.question.count({ where: { status: "PUBLISHED", qualityStatus: "APPROVED" } }).catch(() => 0);
  const profileViews = lawyer
    ? await prisma.analyticsEvent.count({ where: { targetType: "LAWYER", targetId: lawyer.id, type: "LAWYER_PROFILE_VIEW" } }).catch(() => 0)
    : 0;
  const approvedAnswers = lawyer?.answers.filter(isApprovedAnswer) ?? [];
  const activityScore = lawyer ? calculateActivityScore(lawyer, profileViews) : 0;

  return (
    <LawyerDashboard
      activityScore={activityScore}
      stats={[
        ["Статус профиля", lawyer?.profileStatus === "APPROVED" ? "Опубликован" : "Черновик"],
        ["Заполненность профиля", `${lawyer ? calculateProfileCompleteness(lawyer) : 0}%`],
        ["Вопросы для ответа", String(questionsCount)],
        ["Мои ответы", String(lawyer?.answers.length ?? 0)],
        ["Одобренные ответы", String(approvedAnswers.length)],
        ["Отзывы", String(lawyer?.reviewCount ?? 0)],
        ["Просмотры профиля", String(profileViews)],
        ["Публикации", String(lawyer?.articles.length ?? 0)],
        ["Судебные дела", String(lawyer?.cases.length ?? 0)]
      ]}
    />
  );
}

function calculateActivityScore(lawyer: LawyerActivityInput, profileViews: number) {
  const approvedAnswers = lawyer.answers.filter(isApprovedAnswer);
  const averageAnswerQuality = approvedAnswers.length
    ? approvedAnswers.reduce((sum, answer) => sum + answer.answerQualityScore, 0) / approvedAnswers.length
    : 0;
  const contactAttempts = lawyer.answers.filter((answer) => answer.containsContactAttempt).length;
  const contactCompliance = lawyer.answers.length ? Math.max(0, 1 - contactAttempts / lawyer.answers.length) : 1;
  const approvalScore = (lawyer.profileStatus === "APPROVED" ? 3 : 0) + (lawyer.isVerified ? 2 : 0);

  const score =
    calculateProfileCompleteness(lawyer) * 0.25 +
    Math.min(approvedAnswers.length / 10, 1) * 15 +
    (averageAnswerQuality / 100) * 15 +
    contactCompliance * 15 +
    Math.min(lawyer.articles.length / 3, 1) * 10 +
    Math.min(lawyer.cases.length / 3, 1) * 8 +
    Math.min(profileViews / 100, 1) * 7 +
    approvalScore;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateProfileCompleteness(lawyer: LawyerActivityInput) {
  const checks = [
    lawyer.profileStatus === "APPROVED",
    Boolean(lawyer.photoUrl),
    lawyer.description.trim().length >= 80,
    lawyer.education.trim().length >= 20,
    lawyer.services.length > 0,
    lawyer.cities.length > 0,
    lawyer.priceItems.length > 0,
    Boolean(lawyer.profile?.about?.trim()),
    Boolean(lawyer.profile?.casesCount)
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function isApprovedAnswer(answer: LawyerActivityInput["answers"][number]) {
  return (
    answer.status === "PUBLISHED" &&
    answer.qualityStatus === "APPROVED" &&
    answer.isModerated &&
    !answer.containsContactAttempt &&
    !answer.containsUnsupportedLegalClaim &&
    !answer.containsFearPressure &&
    !answer.containsGenericLeadBait &&
    answer.answerQualityScore >= 60
  );
}
