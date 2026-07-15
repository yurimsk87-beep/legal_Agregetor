import { NextResponse } from "next/server";
import { z } from "zod";
import { hasForbiddenContact, redactForbiddenContacts } from "@/lib/contact-safety";
import { prisma } from "@/lib/prisma";
import { getQuestions, searchPublicQuestions } from "@/lib/repositories";
import { findSimilarQuestions } from "@/lib/questions-similarity";
import {
  checkRateLimit,
  clientKey,
  payloadTooLargeResponse,
  readJsonWithLimit,
  rejectCrossOrigin,
  RequestPayloadTooLargeError
} from "@/lib/request-security";
import { storeQuestionAttachment, validateQuestionAttachment } from "@/lib/question-attachments";

export const runtime = "nodejs";

const questionSchema = z.object({
  title: z.string().trim().min(5).max(120),
  text: z.string().trim().min(40),
  rawText: z.string().trim().min(10).max(8000).optional(),
  enrichedTitle: z.string().trim().min(5).max(120).optional(),
  enrichedText: z.string().trim().min(40).max(8000).optional(),
  enrichmentStatus: z.string().trim().max(40).optional(),
  preliminaryAnswer: z.string().trim().max(8000).optional(),
  preliminaryAnswerStatus: z.string().trim().max(40).optional(),
  scenarioId: z.string().trim().max(120).optional(),
  legalStage: z.string().trim().max(80).optional(),
  urgency: z.string().trim().max(40).optional(),
  riskLevel: z.string().trim().max(40).optional(),
  facts: z.array(z.string().trim().max(500)).max(20).optional(),
  missingFacts: z.array(z.string().trim().max(200)).max(20).optional(),
  clarificationAnswers: z.record(z.string().trim().max(1200)).optional(),
  leadScore: z.number().int().min(0).max(100).optional(),
  seoQualityScore: z.number().int().min(0).max(100).optional(),
  userConfirmedEnrichment: z.boolean().default(false),
  aiAssisted: z.boolean().default(false),
  userName: z.string().trim().min(2),
  userEmail: z.string().trim().email(),
  cityId: z.string().trim().min(1),
  serviceId: z.string().trim().min(1),
  sourcePage: z.string().trim().max(500).optional(),
  isAnonymous: z.boolean().default(false),
  notificationsEnabled: z.boolean().default(true),
  personalDataConsent: z.literal(true),
  publicationConsent: z.boolean().optional(),
  thirdPartyDataConsent: z.boolean().optional()
});

const moderationSuccessMessage =
  "Вопрос сохранен и отправлен на модерацию. Публичная версия появится только после проверки и качественного ответа юриста.";
const validationErrorMessage = "Проверьте обязательные поля формы.";
const saveErrorMessage = "Не удалось сохранить вопрос. Проверьте, что PostgreSQL запущен, и попробуйте еще раз.";

type QuestionRequestBody = {
  data: unknown;
  attachment: File | null;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const offset = parsePaginationNumber(url.searchParams.get("offset"), 0, 0, 5000);
  const limit = parsePaginationNumber(url.searchParams.get("limit"), 24, 1, 48);
  const serviceId = emptyToUndefined(url.searchParams.get("serviceId"));
  const serviceIds = parseServiceIds(url.searchParams.get("serviceIds"));
  const cityId = emptyToUndefined(url.searchParams.get("cityId"));
  const searchQuery = emptyToUndefined(url.searchParams.get("q"));
  const items = searchQuery
    ? await searchPublicQuestions(searchQuery, { skip: offset, take: limit + 1 })
    : await getQuestions(serviceId, cityId, { skip: offset, take: limit + 1, serviceIds });
  const questions = items.slice(0, limit);

  return NextResponse.json({
    ok: true,
    questions,
    nextOffset: offset + questions.length,
    hasMore: items.length > limit
  });
}

function parseServiceIds(value: string | null) {
  return value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const limited = checkRateLimit({ key: `question:${clientKey(request)}`, limit: 4, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 12 * 1024 * 1024) {
    return payloadTooLargeResponse();
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  let body: QuestionRequestBody;

  try {
    body = contentType.includes("multipart/form-data") ? await readMultipartQuestion(request) : await readJsonQuestion(request);
  } catch (error) {
    if (error instanceof RequestPayloadTooLargeError) return payloadTooLargeResponse();
    return NextResponse.json({ ok: false, message: validationErrorMessage }, { status: 400 });
  }

  const attachment = body.attachment && body.attachment.size > 0 ? body.attachment : null;
  if (attachment) {
    const attachmentError = validateQuestionAttachment(attachment);
    if (attachmentError) {
      return NextResponse.json({ ok: false, message: attachmentError }, { status: 400 });
    }
  }

  const parsed = questionSchema.safeParse(body.data);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten(), message: questionValidationMessage(parsed.error) }, { status: 400 });
  }

  const data = parsed.data;
  const rawText = data.rawText || data.text;
  const publicTextInput = data.enrichedText || data.text;
  const publicTitleInput = data.enrichedTitle || data.title || titleFromText(publicTextInput);
  const hasContacts = hasForbiddenContact(`${publicTitleInput}\n${publicTextInput}\n${data.userName}`);
  const rawHasContacts = hasForbiddenContact(`${rawText}\n${data.userName}`);
  const safeTitle = redactForbiddenContacts(publicTitleInput).slice(0, 120);
  const safeText = redactForbiddenContacts(publicTextInput);
  const safeRawText = rawText.slice(0, 8000);
  const safeUserName = redactForbiddenContacts(data.userName);
  const baseSlug = slugify(safeTitle);
  const preliminaryAnswerStatus = normalizePreliminaryAnswerStatus(Boolean(data.preliminaryAnswer), data.preliminaryAnswerStatus);

  try {
    const question = await withQuestionDatabaseTimeout(async () => {
      const [exactDuplicate, reservedCitySlug, reservedServiceSlug] = await Promise.all([
        prisma.question.findFirst({
          where: {
            OR: [{ slug: baseSlug }, { title: { equals: safeTitle, mode: "insensitive" } }]
          }
        }),
        prisma.city.findUnique({ where: { slug: baseSlug }, select: { id: true } }),
        prisma.service.findUnique({ where: { slug: baseSlug }, select: { id: true } })
      ]);
      const similarQuestions = await findSimilarQuestions({
        title: safeTitle,
        text: safeText,
        cityId: data.cityId,
        serviceId: data.serviceId,
        limit: 1
      });
      const duplicate = exactDuplicate || similarQuestions.find((item) => item.similarity >= 0.72);
      const reservedCategorySlug = Boolean(reservedCitySlug || reservedServiceSlug);
      const slug = duplicate || reservedCategorySlug ? `${baseSlug}-${Date.now()}` : baseSlug;
      const qualityStatus = duplicate ? "DUPLICATE" : hasContacts || rawHasContacts ? "PERSONAL_DATA" : "PENDING";
      const moderationComment =
        hasContacts || rawHasContacts
          ? "В вопросе обнаружены контакты или персональные данные. Нужна ручная проверка публичной формулировки."
          : "Вопрос создан через простую форму и ожидает модерации перед публикацией.";

      return prisma.question.create({
        data: {
          title: safeTitle,
          slug,
          text: safeText,
          rawText: safeRawText,
          enrichedTitle: data.enrichedTitle ? safeTitle : null,
          enrichedText: data.enrichedText ? safeText : null,
          enrichmentStatus: data.userConfirmedEnrichment ? "USER_CONFIRMED" : data.enrichedText ? "AUTO_DRAFT" : data.enrichmentStatus || "RAW",
          preliminaryAnswer: data.preliminaryAnswer ? redactForbiddenContacts(data.preliminaryAnswer).slice(0, 8000) : null,
          preliminaryAnswerStatus,
          scenarioId: data.scenarioId || null,
          legalStage: data.legalStage || null,
          urgency: data.urgency || null,
          riskLevel: data.riskLevel || null,
          facts: data.facts ?? [],
          missingFacts: data.missingFacts ?? [],
          clarificationAnswers: data.clarificationAnswers ?? {},
          leadScore: data.leadScore ?? 0,
          seoQualityScore: data.seoQualityScore ?? 0,
          userConfirmedEnrichmentAt: data.userConfirmedEnrichment ? new Date() : null,
          aiAssisted: false,
          editorReviewedAt: null,
          indexabilityReason: "Ожидает ручной модерации, ответа юриста и quality gate.",
          userName: safeUserName,
          userEmail: data.userEmail,
          isAnonymous: data.isAnonymous,
          notificationsEnabled: data.notificationsEnabled,
          cityId: data.cityId,
          serviceId: data.serviceId,
          sourcePage: data.sourcePage || null,
          summary: null,
          status: "MODERATION",
          qualityStatus,
          moderationComment,
          hasAttachments: Boolean(attachment),
          trustScore: 0,
          isDuplicate: Boolean(duplicate),
          isIndexable: false
        }
      });
    });

    if (attachment) {
      try {
        const stored = await storeQuestionAttachment(question.id, attachment);
        if (stored) {
          await prisma.questionAttachment.create({
            data: {
              questionId: question.id,
              fileName: stored.fileName,
              fileType: stored.fileType,
              fileSize: stored.fileSize,
              storageKey: stored.storageKey
            }
          });
        } else {
          await prisma.question.update({ where: { id: question.id }, data: { hasAttachments: false } });
        }
      } catch (attachmentError) {
        console.error("Question attachment store failed", attachmentError);
        await prisma.question.update({ where: { id: question.id }, data: { hasAttachments: false } }).catch(() => undefined);
      }
    }

    return NextResponse.json(
      {
        ok: true,
        id: question.id,
        status: question.status,
        qualityStatus: question.qualityStatus,
        preliminaryAnswerStatus: question.preliminaryAnswerStatus,
        isIndexable: false,
        message: moderationSuccessMessage
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Question create failed", error);
    return NextResponse.json(
      { ok: false, isIndexable: false, qualityStatus: "PENDING", message: saveErrorMessage },
      { status: 500 }
    );
  }
}

function parsePaginationNumber(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function emptyToUndefined(value: string | null) {
  return value && value.trim() ? value.trim() : undefined;
}

function questionValidationMessage(error: z.ZodError) {
  const fields = error.flatten().fieldErrors;
  const names: Record<string, string> = {
    title: "заголовок",
    text: "текст вопроса от 40 символов",
    rawText: "исходный вопрос",
    userName: "имя",
    userEmail: "email",
    cityId: "город",
    serviceId: "категорию",
    personalDataConsent: "согласие на обработку данных"
  };
  const failed = Object.keys(fields).map((field) => names[field] ?? field);
  return failed.length ? `Проверьте поля: ${failed.join(", ")}.` : validationErrorMessage;
}

function normalizePreliminaryAnswerStatus(hasPreliminaryAnswer: boolean, status?: string) {
  if (!hasPreliminaryAnswer) return "NOT_REQUESTED";
  return status === "FALLBACK" ? "FALLBACK" : "SCENARIO_STUB";
}

async function readJsonQuestion(request: Request) {
  const json = await readJsonWithLimit<Record<string, unknown>>(request, 24_000);
  return {
    data: {
      ...json,
      isAnonymous: Boolean(json.isAnonymous),
      notificationsEnabled: json.notificationsEnabled !== false,
      userConfirmedEnrichment: Boolean(json.userConfirmedEnrichment),
      aiAssisted: Boolean(json.aiAssisted),
      personalDataConsent: json.personalDataConsent ?? json.consent
    },
    attachment: null
  };
}

async function readMultipartQuestion(request: Request) {
  const formData = await request.formData();
  const attachment = formData.get("attachment");

  return {
    data: {
      title: String(formData.get("title") ?? ""),
      text: String(formData.get("text") ?? ""),
      userName: String(formData.get("userName") ?? ""),
      userEmail: String(formData.get("userEmail") ?? ""),
      cityId: String(formData.get("cityId") ?? ""),
      serviceId: String(formData.get("serviceId") ?? ""),
      sourcePage: String(formData.get("sourcePage") ?? ""),
      isAnonymous: formData.get("isAnonymous") === "on",
      notificationsEnabled: String(formData.get("notificationsEnabled") ?? "true") !== "false",
      personalDataConsent: formData.get("personalDataConsent") === "on"
    },
    attachment: isUploadFile(attachment) ? attachment : null
  };
}

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "arrayBuffer" in value &&
      "size" in value &&
      "type" in value &&
      typeof value.arrayBuffer === "function"
  );
}

function withQuestionDatabaseTimeout<T>(query: () => Promise<T>): Promise<T> {
  return Promise.race([
    query(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Question database timeout")), Number(process.env.QUESTION_FORM_DB_TIMEOUT_MS || 5000));
    })
  ]);
}

function titleFromText(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const firstSentence = normalized.split(/[.!?]/)[0] ?? normalized;
  return (firstSentence.length >= 5 ? firstSentence : normalized).slice(0, 90) || `question-${Date.now()}`;
}

function slugify(value: string) {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "j",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "c",
    ч: "ch",
    ш: "sh",
    щ: "shch",
    ы: "y",
    э: "e",
    ю: "yu",
    я: "ya",
    ь: "",
    ъ: ""
  };

  const slug = value
    .toLowerCase()
    .split("")
    .map((char) => map[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || `question-${Date.now()}`;
}
