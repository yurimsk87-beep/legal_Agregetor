import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteLeadPdfAttachment, isStoredLeadAttachment } from "@/lib/lead-attachments";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientKey, readJsonWithLimit, rejectCrossOrigin } from "@/lib/request-security";

const withdrawalSchema = z.object({ token: z.string().min(32).max(128) });

export async function DELETE(request: Request, context: { params: Promise<{ leadId: string }> }) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const limited = checkRateLimit({ key: `review-withdrawal:${clientKey(request)}`, limit: 5, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  const parsed = withdrawalSchema.safeParse(await readJsonWithLimit(request, 2_000).catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Некорректный запрос." }, { status: 400 });

  const { leadId } = await context.params;
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, sourceType: "DOCUMENT_REVIEW" },
    select: { structuredPayload: true }
  });
  const payload = asPayload(lead?.structuredPayload);
  const consent = asPayload(payload?.documentReviewConsent);
  const storedHash = typeof consent?.withdrawalTokenHash === "string" ? consent.withdrawalTokenHash : "";
  const suppliedHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  if (!storedHash || !safeEqual(storedHash, suppliedHash)) {
    return NextResponse.json({ ok: false, message: "Не удалось подтвердить отзыв согласия." }, { status: 403 });
  }

  const attachment = payload?.documentReviewAttachment;
  if (isStoredLeadAttachment(attachment)) await deleteLeadPdfAttachment(attachment.storageKey);
  const remainingPayload = { ...(payload ?? {}) };
  delete remainingPayload.documentReviewAttachment;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      contactTransferConsentAt: null,
      structuredPayload: {
        ...remainingPayload,
        reviewStatus: "CONSENT_WITHDRAWN",
        documentReviewConsent: {
          ...consent,
          withdrawnAt: new Date().toISOString(),
          withdrawalTokenHash: null
        }
      } as Prisma.InputJsonValue
    }
  });

  return NextResponse.json({ ok: true, message: "Согласие на передачу отозвано, закрытый PDF удалён." });
}

function asPayload(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
