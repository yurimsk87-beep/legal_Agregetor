import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeLawyerAnswerQuality } from "@/lib/answer-quality";
import { redactForbiddenContacts } from "@/lib/contact-safety";
import { prisma } from "@/lib/prisma";
import { markQuestionIndexability } from "@/lib/question-indexability";
import { getCurrentUser } from "@/lib/server-auth";
import {
  checkRateLimit,
  clientKey,
  payloadTooLargeResponse,
  readJsonWithLimit,
  rejectCrossOrigin,
  RequestPayloadTooLargeError
} from "@/lib/request-security";

const answerSchema = z.object({
  questionId: z.string().min(1),
  text: z.string().min(80),
  lawyerId: z.string().optional(),
  adminAssisted: z.boolean().optional()
});

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const user = await getCurrentUser();
  if (!user || (user.role !== "LAWYER" && user.role !== "ADMIN")) {
    return NextResponse.json({ ok: false, message: "Login required." }, { status: 401 });
  }

  const limited = checkRateLimit({ key: `answer:${clientKey(request, user.id)}`, limit: 12, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await readJsonWithLimit(request, 24_000);
  } catch (error) {
    if (error instanceof RequestPayloadTooLargeError) return payloadTooLargeResponse();
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const parsed = answerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const lawyer = await resolveAnswerLawyer(user, data.lawyerId);
  if (!lawyer || !lawyer.active || lawyer.blocked || lawyer.profileStatus !== "APPROVED") {
    return NextResponse.json({ ok: false, message: "Active lawyer profile required." }, { status: 403 });
  }

  const isAdminAssisted = user.role === "ADMIN" && Boolean(data.adminAssisted || data.lawyerId);
  if (isAdminAssisted && !lawyer.profile?.consentToAdminAssistedAnswers) {
    return NextResponse.json(
      { ok: false, message: "Нет согласия на публикацию ответов редакцией от имени юриста." },
      { status: 403 }
    );
  }

  const question = await prisma.question.findUnique({
    where: { id: data.questionId },
    select: { id: true, status: true }
  });
  if (!question) {
    return NextResponse.json({ ok: false, message: "Question not found." }, { status: 404 });
  }
  if (question.status !== "PUBLISHED") {
    return NextResponse.json({ ok: false, message: "Answering is available only after question publication." }, { status: 409 });
  }

  const quality = analyzeLawyerAnswerQuality(data.text);
  const hasContacts = quality.containsContactAttempt;
  const safeText = redactForbiddenContacts(data.text);
  const score = quality.score;
  const canPublishAdminAssisted = isAdminAssisted && quality.reviewStatus === "APPROVED";
  const status: "PUBLISHED" | "MODERATION" = canPublishAdminAssisted ? "PUBLISHED" : "MODERATION";
  const qualityStatus: "PERSONAL_DATA" | "APPROVED" | "PENDING" | "LOW_QUALITY" | "LEGAL_RISK" = hasContacts
    ? "PERSONAL_DATA"
    : canPublishAdminAssisted
      ? "APPROVED"
      : quality.containsUnsupportedLegalClaim
        ? "LEGAL_RISK"
        : quality.containsGenericLeadBait || quality.containsFearPressure
          ? "LOW_QUALITY"
          : "PENDING";

  const answer = await prisma.answer.create({
    data: {
      questionId: data.questionId,
      lawyerId: lawyer.id,
      text: safeText,
      authorType: isAdminAssisted ? "ADMIN_ASSISTED" : "LAWYER",
      createdByUserId: user.id,
      publishedByUserId: canPublishAdminAssisted ? user.id : null,
      publishedByAdmin: canPublishAdminAssisted,
      status,
      qualityStatus,
      containsContactAttempt: hasContacts,
      containsUnsupportedLegalClaim: quality.containsUnsupportedLegalClaim,
      containsFearPressure: quality.containsFearPressure,
      containsGenericLeadBait: quality.containsGenericLeadBait,
      legalReferencesVerified: quality.legalReferencesVerified,
      answerReviewStatus: quality.reviewStatus,
      answerReviewReason: quality.reviewReason,
      moderationComment: quality.reviewReason,
      answerQualityScore: score,
      isModerated: canPublishAdminAssisted,
      publishedAt: canPublishAdminAssisted ? new Date() : null
    }
  });

  await prisma.answerAuditLog.createMany({
    data: [
      {
        answerId: answer.id,
        action: isAdminAssisted ? "ADMIN_ASSISTED_CREATED" : "LAWYER_ANSWER_CREATED",
        actorUserId: user.id,
        newStatus: status,
        comment: isAdminAssisted ? `Ответ создан редакцией от имени юриста ${lawyer.id}.` : null
      },
      ...(hasContacts
        ? [
            {
              answerId: answer.id,
              action: "CONTACT_ATTEMPT_DETECTED",
              actorUserId: user.id,
              newStatus: status,
              comment: "Ответ отправлен на модерацию из-за контактов."
            }
          ]
        : []),
      ...(canPublishAdminAssisted
        ? [
            {
              answerId: answer.id,
              action: "PUBLISHED",
              actorUserId: user.id,
              oldStatus: "MODERATION" as const,
              newStatus: "PUBLISHED" as const,
              comment: "Admin-assisted ответ опубликован после проверки качества."
            }
          ]
        : [])
    ]
  });

  if (canPublishAdminAssisted) {
    await markQuestionIndexability(answer.questionId);
  }

  return NextResponse.json({
    ok: true,
    id: answer.id,
    status: answer.status,
    qualityStatus: answer.qualityStatus,
    containsContactAttempt: answer.containsContactAttempt,
    answerQualityScore: answer.answerQualityScore,
    answerReviewStatus: answer.answerReviewStatus,
    answerReviewReason: answer.answerReviewReason,
    publishedByAdmin: answer.publishedByAdmin
  });
}

async function resolveAnswerLawyer(user: { id: string; role: string }, requestedLawyerId?: string) {
  if (user.role === "ADMIN" && requestedLawyerId) {
    return prisma.lawyer.findUnique({
      where: { id: requestedLawyerId },
      include: { profile: true }
    });
  }

  if (user.role !== "LAWYER") return null;
  return prisma.lawyer.findUnique({
    where: { userId: user.id },
    include: { profile: true }
  });
}
