import { NextResponse } from "next/server";
import { z } from "zod";
import { redactForbiddenContacts } from "@/lib/contact-safety";
import { notifyLawyersAboutPublishedQuestion } from "@/lib/notification-service";
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
  params: Promise<{ questionId: string }>;
};

const updateSchema = z.object({
  action: z.enum(["publish", "reject", "spam", "duplicate", "noindex", "redact"]),
  title: z.string().max(90).optional(),
  slug: z.string().max(120).optional(),
  text: z.string().optional(),
  cityId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
  moderationComment: z.string().optional().nullable()
});

export async function PATCH(request: Request, { params }: RouteProps) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const { questionId } = await params;
  const admin = await getCurrentAdminUser();
  if (!admin) {
    await logAdminAudit({
      request,
      action: "QUESTION_MODERATION_PERMISSION_DENIED",
      entityType: "Question",
      entityId: questionId,
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

  const data = parsed.data;
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    return NextResponse.json({ ok: false, message: "Question not found." }, { status: 404 });
  }

  if (data.action === "publish") {
    const slug = data.slug || question.slug;
    if (await isReservedQuestionCategorySlug(slug)) {
      return NextResponse.json({ ok: false, message: "Question slug conflicts with a city or service category." }, { status: 409 });
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        title: data.title ? redactForbiddenContacts(data.title).slice(0, 90) : question.title,
        slug,
        text: data.text ? redactForbiddenContacts(data.text) : question.text,
        cityId: data.cityId === undefined ? question.cityId : data.cityId,
        serviceId: data.serviceId === undefined ? question.serviceId : data.serviceId,
        status: "PUBLISHED",
        qualityStatus: "APPROVED",
        moderationComment: data.moderationComment ?? question.moderationComment,
        publishedAt: question.publishedAt ?? new Date(),
        isIndexable: false,
        isDuplicate: false,
        trustScore: Math.max(question.trustScore, 50)
      }
    });

    const notification = await notifyLawyersAboutPublishedQuestion(updated.id);
    await markQuestionIndexability(updated.id);
    await auditQuestionModeration(request, admin.id, question, updated, data.action);
    return NextResponse.json({ ok: true, question: updated, notification });
  }

  if (data.action === "redact") {
    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        title: data.title ? redactForbiddenContacts(data.title).slice(0, 90) : redactForbiddenContacts(question.title),
        text: data.text ? redactForbiddenContacts(data.text) : redactForbiddenContacts(question.text),
        moderationComment: data.moderationComment ?? question.moderationComment,
        qualityStatus: "PENDING"
      }
    });
    await auditQuestionModeration(request, admin.id, question, updated, data.action);
    return NextResponse.json({ ok: true, question: updated });
  }

  const statusByAction = {
    reject: "REJECTED",
    spam: "SPAM",
    duplicate: "DUPLICATE",
    noindex: question.status
  } as const;
  const qualityByAction = {
    reject: "LOW_QUALITY",
    spam: "SPAM",
    duplicate: "DUPLICATE",
    noindex: question.qualityStatus
  } as const;

  const updated = await prisma.question.update({
    where: { id: questionId },
    data: {
      status: statusByAction[data.action as keyof typeof statusByAction],
      qualityStatus: qualityByAction[data.action as keyof typeof qualityByAction],
      moderationComment: data.moderationComment ?? question.moderationComment,
      isDuplicate: data.action === "duplicate" ? true : data.action === "noindex" ? question.isDuplicate : false,
      isIndexable: false
    }
  });

  await auditQuestionModeration(request, admin.id, question, updated, data.action);
  return NextResponse.json({ ok: true, question: updated });
}

async function auditQuestionModeration(
  request: Request,
  adminId: string,
  beforeSnapshot: QuestionModerationAuditState,
  afterSnapshot: QuestionModerationAuditState,
  action: string
) {
  await Promise.all([
    logAdminAudit({
      request,
      adminId,
      action: `QUESTION_${action.toUpperCase()}`,
      entityType: "Question",
      entityId: afterSnapshot.id,
      actorRole: "ADMIN",
      beforeSnapshot: questionModerationSnapshot(beforeSnapshot, "previous"),
      afterSnapshot: questionModerationSnapshot(afterSnapshot, "new")
    }),
    logModeration({
      request,
      moderatorId: adminId,
      action: action.toUpperCase(),
      entityType: "Question",
      entityId: afterSnapshot.id,
      actorRole: "ADMIN",
      reason: `QUESTION_${action.toUpperCase()}`,
      beforeSnapshot: questionModerationSnapshot(beforeSnapshot, "previous"),
      afterSnapshot: questionModerationSnapshot(afterSnapshot, "new")
    })
  ]);
}

type QuestionModerationAuditState = {
  id: string;
  status: string;
  qualityStatus: string;
  isIndexable: boolean;
  isDuplicate: boolean;
};

function questionModerationSnapshot(snapshot: QuestionModerationAuditState, prefix: "previous" | "new") {
  return prefix === "previous"
    ? {
        previousStatus: snapshot.status,
        previousQualityStatus: snapshot.qualityStatus,
        previousIsIndexable: snapshot.isIndexable,
        previousIsDuplicate: snapshot.isDuplicate
      }
    : {
        newStatus: snapshot.status,
        newQualityStatus: snapshot.qualityStatus,
        newIsIndexable: snapshot.isIndexable,
        newIsDuplicate: snapshot.isDuplicate
      };
}

async function isReservedQuestionCategorySlug(slug: string) {
  const [city, service] = await Promise.all([
    prisma.city.findUnique({ where: { slug }, select: { id: true } }),
    prisma.service.findUnique({ where: { slug }, select: { id: true } })
  ]);

  return Boolean(city || service);
}
