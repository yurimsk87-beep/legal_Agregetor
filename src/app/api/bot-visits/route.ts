import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  clientKey,
  payloadTooLargeResponse,
  readJsonWithLimit,
  RequestPayloadTooLargeError
} from "@/lib/request-security";

const botVisitSchema = z.object({
  botName: z.string().min(1),
  url: z.string().min(1),
  statusCode: z.number().int(),
  responseTime: z.number().int().nonnegative(),
  userAgent: z.string().min(1)
});

export async function POST(request: Request) {
  const secret = process.env.BOT_VISIT_SECRET;
  if (secret && request.headers.get("x-internal-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const limited = checkRateLimit({ key: `bot-visit:${clientKey(request)}`, limit: 120, windowMs: 60 * 1000 });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await readJsonWithLimit(request, 4_000);
  } catch (error) {
    if (error instanceof RequestPayloadTooLargeError) return payloadTooLargeResponse();
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = botVisitSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await prisma.botVisit.create({ data: parsed.data });
  } catch {
    return NextResponse.json({ ok: true, stored: false });
  }

  return NextResponse.json({ ok: true });
}
