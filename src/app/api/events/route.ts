import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  hasAnalyticsConsent,
  normalizeAnalyticsRoute,
  sanitizeAnalyticsPayload,
  sanitizeAnalyticsToken
} from "@/lib/analytics-privacy";
import {
  checkRateLimit,
  clientKey,
  payloadTooLargeResponse,
  readJsonWithLimit,
  rejectCrossOrigin,
  RequestPayloadTooLargeError
} from "@/lib/request-security";

export const runtime = "nodejs";

const eventTypes = [
  "LEAD_CREATED",
  "QUESTION_FORM_OPENED",
  "QUESTION_FORM_OPENED_PUBLIC",
  "QUESTION_WIZARD_STARTED",
  "QUESTION_WIZARD_CLARIFICATIONS_SHOWN",
  "QUESTION_WIZARD_ENRICHED_CONFIRMED",
  "QUESTION_WIZARD_ANALYZING_STARTED",
  "QUESTION_WIZARD_PRELIMINARY_READY",
  "QUESTION_WIZARD_ANALYZING_TIMEOUT",
  "QUESTION_WIZARD_TRANSFER_TO_LAWYER_CLICKED",
  "QUESTION_WIZARD_LEAD_CREATED",
  "QUESTION_CREATED",
  "QUESTION_SUBMITTED",
  "QUESTION_PUBLISHED",
  "QUESTION_PAGE_VIEW",
  "ANSWER_READ",
  "LAWYER_PROFILE_OPENED_FROM_ANSWER",
  "SIMILAR_QUESTION_CLICKED",
  "SERVICE_CATEGORY_CLICKED_FROM_QUESTION",
  "BLOG_ARTICLE_READ",
  "DOCUMENT_PAGE_VIEW",
  "CALCULATOR_USED",
  "CALCULATOR_RESULT_VIEWED",
  "CITY_SELECTED",
  "CITY_AUTODETECTED",
  "LAWYER_PROFILE_VIEW",
  "LAWYER_PROFILE_FORM_OPENED",
  "LAWYER_PROFILE_LEAD_CREATED",
  "CONSULTATION_REQUEST_CREATED",
  "DOCUMENT_ORDER_CREATED",
  "CALCULATOR_COMPLETED",
  "CHECKLIST_DOWNLOADED",
  "DOCUMENT_REVIEW_REQUEST_CREATED",
  "CITY_SERVICE_LEAD_CREATED",
  "ARTICLE_CTA_CLICKED",
  "STICKY_CTA_CLICKED",
  "PLATFORM_PHONE_CLICKED",
  "PLATFORM_EMAIL_CLICKED",
  "PLATFORM_MESSENGER_CLICKED",
  "CONTACTS_PAGE_OPENED",
  "LAWYER_PROFILE_CLICK",
  "CTA_CLICK"
] as const;

const eventSchema = z.object({
  type: z.enum(eventTypes),
  url: z.string().min(1).max(500).optional(),
  sourcePage: z.string().max(500).optional(),
  targetType: z.string().max(80).optional(),
  targetId: z.string().max(120).optional(),
  payload: z.record(z.unknown()).optional()
}).strict();

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  if (!hasAnalyticsConsent(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false, message: "Analytics consent required." }, { status: 403 });
  }

  const limited = checkRateLimit({ key: `event:${clientKey(request)}`, limit: 80, windowMs: 60 * 1000 });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await readJsonWithLimit(request, 8_000);
  } catch (error) {
    if (error instanceof RequestPayloadTooLargeError) return payloadTooLargeResponse();
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const url = normalizeAnalyticsRoute(data.url ?? pathFromReferer(request.headers.get("referer"))) ?? "/";
  const sourcePage = normalizeAnalyticsRoute(data.sourcePage);
  const payload = sanitizeAnalyticsPayload(data.payload);

  try {
    const event = await prisma.analyticsEvent.create({
      data: {
        type: data.type,
        url,
        sourcePage,
        targetType: sanitizeAnalyticsToken(data.targetType),
        targetId: sanitizeAnalyticsToken(data.targetId),
        payload: payload as Prisma.InputJsonValue | undefined,
        userAgent: null,
        ipHash: null
      }
    });

    return NextResponse.json({ ok: true, id: event.id });
  } catch (error) {
    console.error("Analytics event create failed", error);
    return NextResponse.json({ ok: false, message: "Event was not stored." }, { status: 500 });
  }
}

function pathFromReferer(referer: string | null) {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    return url.pathname;
  } catch {
    return null;
  }
}
