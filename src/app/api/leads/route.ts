import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminUser } from "@/lib/server-auth";
import {
  checkRateLimit,
  clientKey,
  logAdminAudit,
  payloadTooLargeResponse,
  readJsonWithLimit,
  rejectCrossOrigin,
  RequestPayloadTooLargeError
} from "@/lib/request-security";

const leadSourceTypes = [
  "GENERAL",
  "LAWYER_PROFILE",
  "LAWYER_ANSWER",
  "SERVICE_PAGE",
  "CITY_PAGE",
  "CITY_SERVICE_PAGE",
  "ARTICLE",
  "QUESTION",
  "DOCUMENT",
  "CALCULATOR",
  "CITY_SERVICE",
  "CHECKLIST",
  "CONTACTS",
  "DOCUMENT_REVIEW"
] as const;

type LeadSourceTypeInput = (typeof leadSourceTypes)[number];

const leadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  cityId: z.string().optional().or(z.literal("")),
  serviceId: z.string().optional().or(z.literal("")),
  lawyerId: z.string().trim().optional().or(z.literal("")),
  questionId: z.string().trim().optional().or(z.literal("")),
  message: z.string().min(10),
  messenger: z.string().trim().max(80).optional().or(z.literal("")),
  availableTime: z.string().trim().max(160).optional().or(z.literal("")),
  documentsNote: z.string().trim().max(1200).optional().or(z.literal("")),
  leadScore: z.number().int().min(0).max(100).optional(),
  structuredPayload: z.record(z.unknown()).optional(),
  contactTransferConsent: z.boolean().optional(),
  format: z.enum(["online", "phone", "office", "court"]).optional(),
  sourceType: z.enum(leadSourceTypes).optional(),
  sourcePage: z.string().min(1),
  consent: z.literal(true)
});

const formatMap = {
  online: "ONLINE",
  phone: "PHONE",
  office: "OFFICE",
  court: "COURT"
} as const;

const successMessage =
  "Ваша ситуация передана через платформу. Администратор обработает заявку, а контакты не будут опубликованы в Q&A.";
const errorMessage = "Не удалось сохранить обращение. Проверьте данные и попробуйте еще раз.";

export async function GET(request: Request) {
  const admin = await getCurrentAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      message: true,
      messenger: true,
      availableTime: true,
      documentsNote: true,
      structuredPayload: true,
      leadScore: true,
      contactTransferConsentAt: true,
      sourcePage: true,
      sourceType: true,
      desiredFormat: true,
      status: true,
      outcome: true,
      adminComment: true,
      createdAt: true,
      question: { select: { id: true, title: true, slug: true, enrichedText: true, rawText: true } },
      city: { select: { name: true } },
      service: { select: { name: true } },
      lawyer: { select: { firstName: true, lastName: true, middleName: true, slug: true } }
    }
  });

  await logAdminAudit({
    request,
    adminId: admin.id,
    action: "LEADS_API_VIEWED",
    entityType: "Lead",
    afterSnapshot: { count: leads.length }
  });

  return NextResponse.json({ ok: true, items: leads });
}

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const limited = checkRateLimit({ key: `lead:${clientKey(request)}`, limit: 5, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await readJsonWithLimit(request, 24_000);
  } catch (error) {
    if (error instanceof RequestPayloadTooLargeError) return payloadTooLargeResponse();
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const sourceType = normalizeSourceType(data.sourceType);
  const lawyerId = data.lawyerId || null;
  const questionId = data.questionId || null;

  if ((sourceType === "QUESTION" || questionId) && data.contactTransferConsent !== true) {
    return NextResponse.json(
      { ok: false, message: "Нужно отдельное согласие на передачу контактов юристу по этой ситуации." },
      { status: 400 }
    );
  }

  try {
    const [lawyer, question] = await Promise.all([
      lawyerId
        ? prisma.lawyer.findFirst({
            where: {
              id: lawyerId,
              active: true,
              blocked: false,
              profileStatus: "APPROVED"
            },
            select: { id: true }
          })
        : Promise.resolve(null),
      questionId ? prisma.question.findUnique({ where: { id: questionId }, select: { id: true } }) : Promise.resolve(null)
    ]);

    if (lawyerId && !lawyer) {
      return NextResponse.json({ ok: false, message: "Выбранный юрист недоступен для обращения." }, { status: 400 });
    }

    if (questionId && !question) {
      return NextResponse.json({ ok: false, message: "Связанный вопрос не найден." }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        cityId: data.cityId || null,
        serviceId: data.serviceId || null,
        lawyerId: lawyer?.id ?? null,
        questionId: question?.id ?? null,
        message: data.message,
        messenger: data.messenger || null,
        availableTime: data.availableTime || null,
        documentsNote: data.documentsNote || null,
        structuredPayload: data.structuredPayload as Prisma.InputJsonValue | undefined,
        leadScore: data.leadScore ?? 0,
        contactTransferConsentAt: data.contactTransferConsent ? new Date() : null,
        desiredFormat: data.format ? formatMap[data.format] : null,
        sourceType,
        sourcePage: data.sourcePage
      }
    });

    return NextResponse.json({
      ok: true,
      id: lead.id,
      message: successMessage
    });
  } catch (error) {
    console.error("Lead create failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: errorMessage
      },
      { status: 500 }
    );
  }
}

function normalizeSourceType(sourceType: LeadSourceTypeInput | undefined) {
  if (!sourceType) return "LAWYER_PROFILE";
  if (sourceType === "CITY_SERVICE") return "CITY_SERVICE_PAGE";
  if (sourceType === "CONTACTS" || sourceType === "CHECKLIST") return "GENERAL";
  return sourceType;
}
