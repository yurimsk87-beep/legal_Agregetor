import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  deleteLeadPdfAttachment,
  LeadAttachmentValidationError,
  storeLeadPdfAttachment,
  validateLeadPdfAttachment
} from "@/lib/lead-attachments";
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
  let attachment: File | null = null;
  try {
    const parsedRequest = await readLeadRequest(request);
    json = parsedRequest.json;
    attachment = parsedRequest.attachment;
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

  if ((sourceType === "QUESTION" || sourceType === "DOCUMENT_REVIEW" || questionId) && data.contactTransferConsent !== true) {
    return NextResponse.json(
      { ok: false, message: "Нужно отдельное согласие на передачу контактов юристу по этой ситуации." },
      { status: 400 }
    );
  }

  if (sourceType === "DOCUMENT_REVIEW") {
    if (!attachment) {
      return NextResponse.json({ ok: false, message: "Для проверки необходимо приложить сформированный PDF." }, { status: 400 });
    }
    const attachmentError = validateLeadPdfAttachment(attachment);
    if (attachmentError) {
      return NextResponse.json({ ok: false, message: attachmentError }, { status: 400 });
    }
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

    if (sourceType === "DOCUMENT_REVIEW" && attachment) {
      let storedAttachment: Awaited<ReturnType<typeof storeLeadPdfAttachment>> | null = null;
      try {
        storedAttachment = await storeLeadPdfAttachment(lead.id, attachment);
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            structuredPayload: {
              ...(data.structuredPayload ?? {}),
              documentReviewAttachment: storedAttachment
            } as Prisma.InputJsonValue
          }
        });
      } catch (error) {
        if (storedAttachment) await deleteLeadPdfAttachment(storedAttachment.storageKey).catch(() => undefined);
        await prisma.lead.delete({ where: { id: lead.id } }).catch(() => undefined);
        if (error instanceof LeadAttachmentValidationError) {
          return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
        }
        throw error;
      }
    }

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

async function readLeadRequest(request: Request): Promise<{ json: unknown; attachment: File | null }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return { json: await readJsonWithLimit(request, 24_000), attachment: null };
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 5.25 * 1024 * 1024) throw new RequestPayloadTooLargeError();

  const formData = await request.formData();
  const attachmentEntry = formData.get("attachment");
  const structuredPayload = parseStructuredPayload(formData.get("structuredPayload"));
  return {
    attachment: attachmentEntry instanceof File && attachmentEntry.size > 0 ? attachmentEntry : null,
    json: {
      name: textValue(formData, "name"),
      phone: textValue(formData, "phone"),
      email: textValue(formData, "email"),
      cityId: textValue(formData, "cityId"),
      serviceId: textValue(formData, "serviceId"),
      lawyerId: textValue(formData, "lawyerId"),
      questionId: textValue(formData, "questionId"),
      message: textValue(formData, "message"),
      messenger: textValue(formData, "messenger"),
      availableTime: textValue(formData, "availableTime"),
      documentsNote: textValue(formData, "documentsNote"),
      sourcePage: textValue(formData, "sourcePage"),
      sourceType: textValue(formData, "sourceType"),
      format: textValue(formData, "format") || undefined,
      consent: formData.get("consent") === "true",
      contactTransferConsent: formData.get("contactTransferConsent") === "true",
      structuredPayload
    }
  };
}

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseStructuredPayload(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) return undefined;
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid structured payload.");
  return parsed as Record<string, unknown>;
}
