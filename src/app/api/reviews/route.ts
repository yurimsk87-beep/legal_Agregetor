import { NextResponse } from "next/server";
import { z } from "zod";
import { hasForbiddenContact, redactForbiddenContacts } from "@/lib/contact-safety";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  clientKey,
  payloadTooLargeResponse,
  readJsonWithLimit,
  rejectCrossOrigin,
  RequestPayloadTooLargeError
} from "@/lib/request-security";

const DEFAULT_REVIEW_LIMIT = 4;
const MAX_REVIEW_LIMIT = 10;

const reviewSchema = z.object({
  lawyerId: z.string().min(1),
  serviceId: z.string().optional().or(z.literal("")),
  cityId: z.string().optional().or(z.literal("")),
  userName: z.string().min(2),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(30),
  hasRealExperienceConsent: z.literal(true)
});

const saveErrorMessage = "Не удалось сохранить отзыв. Проверьте данные и попробуйте еще раз.";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lawyerId = searchParams.get("lawyerId")?.trim();
  const cursor = searchParams.get("cursor")?.trim();
  const limit = parseReviewLimit(searchParams.get("limit"));

  if (!lawyerId) {
    return NextResponse.json({ ok: false, message: "lawyerId is required." }, { status: 400 });
  }

  const lawyer = await prisma.lawyer.findFirst({
    where: { id: lawyerId, active: true, blocked: false, profileStatus: "APPROVED" },
    select: { id: true }
  });
  if (!lawyer) {
    return NextResponse.json({ ok: false, message: "Lawyer not found." }, { status: 404 });
  }

  const rows = await prisma.review.findMany({
    where: {
      lawyerId,
      isModerated: true,
      qualityStatus: "APPROVED"
    },
    select: {
      id: true,
      lawyerId: true,
      serviceId: true,
      cityId: true,
      userName: true,
      rating: true,
      text: true,
      qualityStatus: true,
      isModerated: true,
      createdAt: true
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    take: limit + 1
  });

  const items = rows.slice(0, limit).map((review) => ({
    id: review.id,
    lawyerId: review.lawyerId,
    serviceId: review.serviceId,
    cityId: review.cityId,
    userName: redactForbiddenContacts(review.userName),
    rating: review.rating,
    text: redactForbiddenContacts(review.text),
    qualityStatus: review.qualityStatus,
    isModerated: review.isModerated,
    createdAt: review.createdAt.toISOString()
  }));

  return NextResponse.json({
    ok: true,
    items,
    nextCursor: rows.length > limit ? items.at(-1)?.id ?? null : null
  });
}

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const limited = checkRateLimit({ key: `review:${clientKey(request)}`, limit: 4, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await readJsonWithLimit(request, 16_000);
  } catch (error) {
    if (error instanceof RequestPayloadTooLargeError) return payloadTooLargeResponse();
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const lawyer = await prisma.lawyer.findFirst({
    where: { id: data.lawyerId, active: true, blocked: false, profileStatus: "APPROVED" },
    select: { id: true }
  });
  if (!lawyer) {
    return NextResponse.json({ ok: false, message: "Lawyer not found." }, { status: 404 });
  }

  const needsReview = hasForbiddenContact(`${data.text}\n${data.userName}`);

  try {
    const review = await prisma.review.create({
      data: {
        lawyerId: data.lawyerId,
        serviceId: data.serviceId || null,
        cityId: data.cityId || null,
        userName: redactForbiddenContacts(data.userName),
        rating: data.rating,
        text: redactForbiddenContacts(data.text),
        hasRealExperienceConsent: true,
        realExperienceConsentAt: new Date(),
        qualityStatus: needsReview ? "NEEDS_REVIEW" : "PENDING",
        isModerated: false
      }
    });

    return NextResponse.json({ ok: true, id: review.id, qualityStatus: review.qualityStatus });
  } catch (error) {
    console.error("Review create failed", error);
    return NextResponse.json({ ok: false, qualityStatus: "PENDING", message: saveErrorMessage }, { status: 500 });
  }
}

function parseReviewLimit(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_REVIEW_LIMIT;
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_REVIEW_LIMIT);
}
