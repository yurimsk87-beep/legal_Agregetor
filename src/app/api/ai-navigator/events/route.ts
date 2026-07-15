import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { readJsonWithLimit, RequestPayloadTooLargeError, rejectCrossOrigin } from "@/lib/request-security";

// Публичный приём событий ИИ-навигатора. НЕ требует admin-авторизации, но
// безопасен: валидирует payload, ограничивает размеры, пишет только переданные
// поля (без headers/cookies/IP).

export const dynamic = "force-dynamic";

const ALLOWED_EVENTS = new Set([
  "ai_navigator_shown",
  "ai_navigator_clicked",
  "ai_search_performed",
  "ai_clarification_question_shown",
  "ai_clarification_answer_submitted",
  "ai_dialog_started",
  "ai_dialog_completed",
  "ai_dialog_low_confidence",
  "ai_dialog_max_steps_reached",
  "ai_repeated_question_filtered",
  "ai_fallback_used",
  "ai_llm_error",
  "ai_route_selected",
  "ai_navigator_view",
  "ai_navigator_error",
  "ai_navigator_low_confidence",
  "ai_navigator_primary_click",
  "ai_navigator_result_click",
  "ai_navigator_question_view",
  "ai_navigator_clarification_submit",
  "ai_navigator_clarification_success",
  "ai_navigator_clarification_error",
  "ai_navigator_dropdown_view",
  "ai_navigator_dropdown_primary_click",
  "ai_navigator_dropdown_result_click"
]);

const META_MAX_BYTES = 5120; // 5 KB после JSON.stringify

function trimField(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s ? s.slice(0, max) : null;
}

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  let body: Record<string, unknown> | null;
  try {
    body = await readJsonWithLimit<Record<string, unknown> | null>(request, 16_384);
  } catch (error) {
    if (error instanceof RequestPayloadTooLargeError) {
      return NextResponse.json({ error: "META_TOO_LARGE", message: "Слишком большой запрос." }, { status: 413 });
    }
    return NextResponse.json({ error: "BAD_JSON", message: "Некорректный JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "BAD_JSON", message: "Ожидается JSON-объект." }, { status: 400 });
  }

  const event = typeof body.event === "string" ? body.event : "";
  if (!ALLOWED_EVENTS.has(event)) {
    return NextResponse.json({ error: "INVALID_EVENT", message: "Неизвестный тип события." }, { status: 400 });
  }

  let meta: Prisma.InputJsonValue | undefined;
  const structuredMeta: Record<string, string | number | boolean> = {};
  const stringMetaFields = ["domain", "routeId", "userAction", "timestamp"] as const;
  for (const field of stringMetaFields) {
    const value = trimField(body[field], field === "routeId" ? 500 : 100);
    if (value) structuredMeta[field] = value;
  }
  if (typeof body.confidenceScore === "number" && Number.isFinite(body.confidenceScore)) {
    structuredMeta.confidenceScore = Math.max(0, Math.min(1, body.confidenceScore));
  }
  if (typeof body.clarificationStep === "number" && Number.isFinite(body.clarificationStep)) {
    structuredMeta.clarificationStep = Math.max(0, Math.min(3, Math.trunc(body.clarificationStep)));
  }
  if (typeof body.hasQuestions === "boolean") structuredMeta.hasQuestions = body.hasQuestions;
  if (typeof body.questionCount === "number" && Number.isFinite(body.questionCount)) {
    structuredMeta.questionCount = Math.max(0, Math.min(20, Math.trunc(body.questionCount)));
  }

  if (body.meta !== undefined && body.meta !== null) {
    try {
      const serialized = JSON.stringify(body.meta);
      if (serialized && Buffer.byteLength(serialized, "utf8") > META_MAX_BYTES) {
        return NextResponse.json({ error: "META_TOO_LARGE", message: "Поле meta слишком большое." }, { status: 413 });
      }
      meta =
        typeof body.meta === "object" && !Array.isArray(body.meta)
          ? ({ ...(body.meta as Prisma.InputJsonObject), ...structuredMeta } as Prisma.InputJsonObject)
          : (structuredMeta as Prisma.InputJsonObject);
    } catch {
      meta = undefined;
    }
  }
  if (!meta && Object.keys(structuredMeta).length) meta = structuredMeta as Prisma.InputJsonObject;

  try {
    await prisma.aiNavigatorEvent.create({
      data: {
        event,
        query: trimField(body.query, 300),
        page: trimField(body.page, 50),
        confidence: trimField(body.confidence, 20),
        riskLevel: trimField(body.riskLevel, 20),
        urgency: trimField(body.urgency, 30),
        targetType: trimField(body.targetType, 50),
        targetHref: trimField(body.targetHref, 500),
        targetTitle: trimField(body.targetTitle, 300),
        meta: meta ?? undefined
      }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ai-navigator/events] log failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "EVENT_LOG_FAILED", message: "Не удалось записать событие." }, { status: 500 });
  }
}
