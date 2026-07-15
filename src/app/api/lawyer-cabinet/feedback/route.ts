import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentLawyerUser } from "@/lib/server-auth";
import {
  checkRateLimit,
  clientKey,
  payloadTooLargeResponse,
  readJsonWithLimit,
  rejectCrossOrigin,
  RequestPayloadTooLargeError
} from "@/lib/request-security";

const feedbackSchema = z.object({
  topic: z.string().min(3).max(160),
  type: z.string().min(2).max(40),
  message: z.string().min(10).max(3000)
});

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const user = await getCurrentLawyerUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const limited = checkRateLimit({ key: `lawyer-feedback:${clientKey(request, user.id)}`, limit: 8, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await readJsonWithLimit(request, 8_000);
  } catch (error) {
    if (error instanceof RequestPayloadTooLargeError) return payloadTooLargeResponse();
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const event = await prisma.analyticsEvent.create({
    data: {
      type: "CTA_CLICK",
      url: "/lawyer-cabinet/[route]",
      sourcePage: "/lawyer-cabinet/[route]",
      targetType: "LAWYER_CABINET_FEEDBACK",
      targetId: user.id,
      payload: { feedbackSubmitted: true }
    }
  });

  return NextResponse.json({ ok: true, id: event.id, message: "Спасибо. Сигнал обратной связи сохранен без записи текста в аналитику." });
}
