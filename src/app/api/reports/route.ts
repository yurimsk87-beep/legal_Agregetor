import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { markQuestionIndexability } from "@/lib/question-indexability";
import {
  checkRateLimit,
  clientKey,
  payloadTooLargeResponse,
  readJsonWithLimit,
  rejectCrossOrigin,
  RequestPayloadTooLargeError
} from "@/lib/request-security";

const reportSchema = z.object({
  targetType: z.enum(["QUESTION", "ANSWER", "LAWYER"]),
  targetId: z.string().min(1),
  reason: z.string().min(10).max(1000)
});

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const limited = checkRateLimit({ key: `report:${clientKey(request)}`, limit: 8, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await readJsonWithLimit(request, 8_000);
  } catch (error) {
    if (error instanceof RequestPayloadTooLargeError) return payloadTooLargeResponse();
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const exists = await reportTargetExists(data.targetType, data.targetId);
  if (!exists) {
    return NextResponse.json({ ok: false, message: "Report target not found." }, { status: 404 });
  }

  const report = await prisma.contentReport.create({
    data: {
      targetType: data.targetType,
      targetId: data.targetId,
      questionId: data.targetType === "QUESTION" ? data.targetId : null,
      answerId: data.targetType === "ANSWER" ? data.targetId : null,
      lawyerId: data.targetType === "LAWYER" ? data.targetId : null,
      reason: data.reason
    }
  });
  const questionId =
    data.targetType === "QUESTION"
      ? data.targetId
      : data.targetType === "ANSWER"
        ? (await prisma.answer.findUnique({ where: { id: data.targetId }, select: { questionId: true } }))?.questionId
        : null;
  if (questionId) {
    await markQuestionIndexability(questionId);
  }

  return NextResponse.json({ ok: true, id: report.id }, { status: 201 });
}

async function reportTargetExists(targetType: "QUESTION" | "ANSWER" | "LAWYER", targetId: string) {
  if (targetType === "QUESTION") {
    return Boolean(await prisma.question.findUnique({ where: { id: targetId }, select: { id: true } }));
  }
  if (targetType === "ANSWER") {
    return Boolean(await prisma.answer.findUnique({ where: { id: targetId }, select: { id: true } }));
  }
  return Boolean(await prisma.lawyer.findUnique({ where: { id: targetId }, select: { id: true } }));
}
