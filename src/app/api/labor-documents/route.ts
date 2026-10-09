import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getLaborDocumentScenario } from "@/data/labor-documents";
import { getLaborRulesForArea, LABOR_LEGAL_REVIEWED_AT } from "@/data/labor-legal-sources";
import {
  buildLaborDocumentPrompts,
  laborDocumentRequestSchema,
  validateLaborDocumentModelResult
} from "@/lib/labor-document-contract";
import { checkRateLimit, clientKey, rejectCrossOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

const GENERATOR_VERSION = "labor-1";
const REQUEST_TIMEOUT_MS = 120_000;

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  const limited = checkRateLimit({ key: `labor-document:${clientKey(request)}`, limit: 8, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  const parsed = laborDocumentRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Проверьте заполненные сведения." }, { status: 400 });

  const selected = getLaborDocumentScenario(parsed.data.documentSlug);
  if (!selected || selected.route.slug !== parsed.data.routeSlug || selected.scenario.key !== parsed.data.scenarioKey) {
    return NextResponse.json({ ok: false, message: "Выбранный документ не соответствует трудовому сценарию." }, { status: 400 });
  }

  if (!process.env.AI_API_KEY || !process.env.AI_BASE_URL || !process.env.AI_MODEL) {
    return NextResponse.json({ ok: false, message: "Сервис подготовки текста временно недоступен. Введенные данные сохранены." }, { status: 503 });
  }

  const rules = getLaborRulesForArea(selected.route.areaId);
  const prompts = buildLaborDocumentPrompts({
    documentTitle: selected.scenario.resultTitle,
    documentType: selected.scenario.resultType,
    facts: parsed.data.facts,
    rules,
    authority: selected.scenario.authority,
    nextSteps: selected.scenario.nextSteps
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const baseUrl = process.env.AI_BASE_URL.replace(/\/+$/, "");
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.AI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.AI_MODEL,
        messages: [{ role: "system", content: prompts.system }, { role: "user", content: prompts.user }],
        temperature: 0.1,
        max_tokens: 5000,
        response_format: { type: "json_object" }
      }),
      cache: "no-store",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`model_http_${response.status}`);
    const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = body.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("model_empty_response");
    const raw = JSON.parse(content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, ""));
    const result = validateLaborDocumentModelResult(raw, { documentTitle: selected.scenario.resultTitle, rules });

    return NextResponse.json({
      ok: true,
      result: {
        ...result,
        versionId: crypto.randomUUID(),
        filingReady: false,
        requiresLegalReview: true,
        legalRegistryReviewedAt: LABOR_LEGAL_REVIEWED_AT,
        generatorVersion: GENERATOR_VERSION
      }
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Labor document generation failed:", error instanceof Error ? error.message : "unknown_error");
    }
    return NextResponse.json({ ok: false, message: "Не удалось сформировать полный документ. Данные сохранены, повторите попытку." }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
