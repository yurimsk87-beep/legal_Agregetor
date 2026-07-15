import { hasForbiddenContact } from "./contact-safety";
import { prisma } from "./prisma";
import { getPublicAnswerWhere } from "./qna-publication-rules";
import { findSimilarQuestions } from "./questions-similarity";
import { canIndexQuestionPage, isIndexableQuestionAnswer } from "./seo";

export async function markQuestionIndexability(questionId: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      answers: {
        where: getPublicAnswerWhere()
      },
      reports: {
        where: { status: { in: ["NEW", "IN_REVIEW"] } }
      }
    }
  });

  if (!question) return;

  const similarQuestions = await findSimilarQuestions({
    title: question.title,
    text: question.text,
    cityId: question.cityId,
    serviceId: question.serviceId,
    excludeQuestionId: question.id,
    publicOnly: true,
    limit: 1
  });
  const questionHasNoContacts = !hasForbiddenContact(`${question.title}\n${question.text}\n${question.userName}`);
  const hasApprovedLawyerAnswer = question.answers.some(isIndexableQuestionAnswer);
  const hasUniqueAnswer =
    hasApprovedLawyerAnswer &&
    new Set(question.answers.map((answer) => answer.text.trim().toLowerCase())).size === question.answers.length;
  const hasSimilarQuestions = similarQuestions.length > 0;
  const canIndex = canIndexQuestionPage({
    ...question,
    hasOpenReports: question.reports.length > 0,
    isIndexable: true,
    trustScore: 85
  });

  const totalScore = canIndex ? 85 : 50;

  await prisma.$transaction([
    prisma.question.update({
      where: { id: question.id },
      data: {
        trustScore: totalScore,
        isIndexable: canIndex && totalScore >= 85
      }
    }),
    prisma.questionTrustScore.create({
      data: {
        questionId: question.id,
        hasApprovedLawyerAnswer,
        hasUniqueAnswer,
        noPersonalData: questionHasNoContacts,
        noContactLeak: questionHasNoContacts && question.answers.every(isIndexableQuestionAnswer),
        hasGoodStructure: question.title.trim().length >= 20 && question.text.trim().length >= 120,
        hasSimilarQuestions,
        hasInternalLinks: hasSimilarQuestions,
        hasNoComplaints: question.reports.length === 0,
        authorTrustScore: 0,
        userEngagementScore: 0,
        totalScore
      }
    })
  ]);
}
