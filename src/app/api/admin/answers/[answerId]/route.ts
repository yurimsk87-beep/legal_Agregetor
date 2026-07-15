import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeLawyerAnswerQuality } from "@/lib/answer-quality";
import { redactForbiddenContacts } from "@/lib/contact-safety";
import { prisma } from "@/lib/prisma";
import { markQuestionIndexability } from "@/lib/question-indexability";
import {
  RequestPayloadTooLargeError,
  logAdminAudit,
  logModeration,
  payloadTooLargeResponse,
  readJsonWithLimit,
  rejectCrossOrigin
} from "@/lib/request-security";
import { getCurrentAdminUser } from "@/lib/server-auth";

type RouteProps = {
  params: Promise<{ answerId: string }>;
};

const updateSchema = z.object({
  action: z.enum(["publish", "reject", "moderation", "redact"]),
  text: z.string().optional(),
  moderationComment: z.string().optional().nullable()
});

export async function PATCH(request: Request, { params }: RouteProps) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const { answerId } = await params;
  const admin = await getCurrentAdminUser();
  if (!admin) {
    await logAdminAudit({
      request,
      action: "ANSWER_MODERATION_PERMISSION_DENIED",
      entityType: "Answer",
      entityId: answerId,
      actorRole: "UNAUTHORIZED"
    });
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await readJsonWithLimit(request, 24_000);
  } catch (error) {
    if (error instanceof RequestPayloadTooLargeError) return payloadTooLargeResponse();
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    include: { question: true }
  });
  if (!answer) {
    return NextResponse.json({ ok: false, message: "Answer not found." }, { status: 404 });
  }

  const data = parsed.data;
  const qualitySourceText = data.text ?? answer.text;
  const nextText = data.text ? redactForbiddenContacts(data.text) : answer.text;
  const quality = analyzeLawyerAnswerQuality(qualitySourceText);
  const containsContactAttempt = quality.containsContactAttempt;
  const score = quality.score;

  if (data.action === "publish" && quality.reviewStatus !== "APPROVED") {
    await logAnswerChange(answer.id, admin.id, String(answer.status), "MODERATION", "QUALITY_CHECK_FAILED", "ANSWER_QUALITY_CHECK_FAILED");
    const updated = await prisma.answer.update({
      where: { id: answer.id },
      data: {
        text: nextText,
        status: "MODERATION",
        qualityStatus: qualityStatusFromReview(quality),
        containsContactAttempt,
        containsUnsupportedLegalClaim: quality.containsUnsupportedLegalClaim,
        containsFearPressure: quality.containsFearPressure,
        containsGenericLeadBait: quality.containsGenericLeadBait,
        legalReferencesVerified: quality.legalReferencesVerified,
        answerReviewStatus: quality.reviewStatus,
        answerReviewReason: quality.reviewReason,
        answerQualityScore: score,
        isModerated: false,
        moderationComment: data.moderationComment ?? quality.reviewReason ?? "Ответ не прошел quality-check."
      }
    });
    await markQuestionIndexability(answer.questionId);
    await auditAnswerModeration(request, admin.id, answer, updated, "quality_check_failed");
    return NextResponse.json({ ok: false, answer: updated, message: quality.reviewReason ?? "Ответ не прошел quality-check." }, { status: 409 });
  }

  const actionUpdate =
    data.action === "publish"
      ? {
          status: "PUBLISHED" as const,
          qualityStatus: "APPROVED" as const,
          isModerated: true,
          publishedAt: answer.publishedAt ?? new Date(),
          publishedByUserId: admin.id,
          answerQualityScore: score
        }
      : data.action === "reject"
        ? {
            status: "REJECTED" as const,
            qualityStatus: "LOW_QUALITY" as const,
            isModerated: false,
            answerQualityScore: score
          }
        : {
            status: "MODERATION" as const,
            qualityStatus: qualityStatusFromReview(quality),
            isModerated: false,
            answerQualityScore: score
          };

  const updated = await prisma.answer.update({
    where: { id: answer.id },
    data: {
      ...actionUpdate,
      text: nextText,
      containsContactAttempt,
      containsUnsupportedLegalClaim: quality.containsUnsupportedLegalClaim,
      containsFearPressure: quality.containsFearPressure,
      containsGenericLeadBait: quality.containsGenericLeadBait,
      legalReferencesVerified: quality.legalReferencesVerified,
      answerReviewStatus: data.action === "publish" ? "APPROVED" : quality.reviewStatus,
      answerReviewReason: data.action === "publish" ? null : quality.reviewReason,
      moderationComment: data.moderationComment ?? answer.moderationComment
    }
  });

  await logAnswerChange(answer.id, admin.id, String(answer.status), String(updated.status), data.action.toUpperCase(), null);
  await auditAnswerModeration(request, admin.id, answer, updated, data.action);

  await markQuestionIndexability(answer.questionId);

  return NextResponse.json({ ok: true, answer: updated });
}

async function auditAnswerModeration(
  request: Request,
  adminId: string,
  beforeSnapshot: AnswerModerationAuditState,
  afterSnapshot: AnswerModerationAuditState,
  action: string
) {
  await Promise.all([
    logAdminAudit({
      request,
      adminId,
      action: `ANSWER_${action.toUpperCase()}`,
      entityType: "Answer",
      entityId: afterSnapshot.id,
      actorRole: "ADMIN",
      beforeSnapshot: answerModerationSnapshot(beforeSnapshot, "previous"),
      afterSnapshot: answerModerationSnapshot(afterSnapshot, "new")
    }),
    logModeration({
      request,
      moderatorId: adminId,
      action: action.toUpperCase(),
      entityType: "Answer",
      entityId: afterSnapshot.id,
      actorRole: "ADMIN",
      reason: `ANSWER_${action.toUpperCase()}`,
      beforeSnapshot: answerModerationSnapshot(beforeSnapshot, "previous"),
      afterSnapshot: answerModerationSnapshot(afterSnapshot, "new")
    })
  ]);
}

type AnswerModerationAuditState = {
  id: string;
  status: string;
  qualityStatus: string;
  isModerated: boolean;
  containsContactAttempt: boolean;
};

function answerModerationSnapshot(snapshot: AnswerModerationAuditState, prefix: "previous" | "new") {
  return prefix === "previous"
    ? {
        previousStatus: snapshot.status,
        previousQualityStatus: snapshot.qualityStatus,
        previousIsModerated: snapshot.isModerated,
        previousContainsContactAttempt: snapshot.containsContactAttempt
      }
    : {
        newStatus: snapshot.status,
        newQualityStatus: snapshot.qualityStatus,
        newIsModerated: snapshot.isModerated,
        newContainsContactAttempt: snapshot.containsContactAttempt
      };
}

async function logAnswerChange(
  answerId: string,
  actorUserId: string,
  oldStatus: string | null,
  newStatus: string | null,
  action: string,
  comment: string | null
) {
  await prisma.answerAuditLog.create({
    data: {
      answerId,
      actorUserId,
      oldStatus: oldStatus as "DRAFT" | "MODERATION" | "PUBLISHED" | "REJECTED" | null,
      newStatus: newStatus as "DRAFT" | "MODERATION" | "PUBLISHED" | "REJECTED" | null,
      action,
      comment: safeAuditCode(comment)
    }
  });
}

function safeAuditCode(value: string | null) {
  return value && /^[A-Z0-9_:-]{1,80}$/.test(value) ? value : null;
}

function qualityStatusFromReview(quality: ReturnType<typeof analyzeLawyerAnswerQuality>) {
  if (quality.containsContactAttempt) return "PERSONAL_DATA" as const;
  if (quality.containsUnsupportedLegalClaim) return "LEGAL_RISK" as const;
  if (quality.containsFearPressure || quality.containsGenericLeadBait || quality.score < 60) return "LOW_QUALITY" as const;
  return "PENDING" as const;
}
