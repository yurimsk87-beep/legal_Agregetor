import { NextResponse } from "next/server";
import { legalDraftRequestSchema } from "@/lib/legal-draft-contract";
import { buildLegalDraftPrompts, validateLegalDraftModelResult } from "@/lib/legal-draft-generation";
import { verifyFamilyLegalDraftRequest } from "@/lib/family-draft-trusted-rules";
import { createFamilyAIDraftDocumentResult } from "@/lib/document-result-contract";
import { getLegalProblem } from "@/data/legal-problems";
import {
  checkRateLimit, clientKey, readJsonWithLimit, rejectCrossOrigin,
  payloadTooLargeResponse, RequestPayloadTooLargeError
} from "@/lib/request-security";

export const runtime = "nodejs";
const TIMEOUT_MS = 90_000;

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  const rateLimit = checkRateLimit({ key: "legal-drafts:" + clientKey(request), limit: 8, windowMs: 10 * 60 * 1000 });
  if (rateLimit) return rateLimit;

  let input: unknown;
  try {
    input = await readJsonWithLimit(request, 64_000);
  } catch (error) {
    if (error instanceof RequestPayloadTooLargeError) return payloadTooLargeResponse();
    return NextResponse.json({ ok: false, message: "Некорректный запрос." }, { status: 400 });
  }
  const parsed = legalDraftRequestSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Проверьте сведения и повторите попытку." }, { status: 400 });

  let trustedInput;
  try {
    trustedInput = verifyFamilyLegalDraftRequest(parsed.data);
  } catch {
    return NextResponse.json({ ok: false, message: "Сценарий и правовые основания не подтверждены серверным реестром." }, { status: 400 });
  }

  if (!process.env.AI_API_KEY || !process.env.AI_BASE_URL || !process.env.AI_MODEL) {
    return NextResponse.json({ ok: false, message: "Сервис подготовки текста временно недоступен. Ваши ответы сохранены в форме." }, { status: 503 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const prompts = buildLegalDraftPrompts(trustedInput);
    const base = process.env.AI_BASE_URL.replace(/\/+$/, "");
    const response = await fetch(base + "/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.AI_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL,
        messages: [{ role: "system", content: prompts.system }, { role: "user", content: prompts.user }],
        temperature: 0.1, max_tokens: 6000,
        response_format: { type: "json_object" }
      }),
      cache: "no-store",
      signal: controller.signal
    });
    if (!response.ok) throw new Error("model_http_" + response.status);
    const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = body.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("model_empty_response");
    const data = JSON.parse(text.replace(/^\x60\x60\x60(?:json)?\s*/i, "").replace(/\s*\x60\x60\x60$/i, ""));
    const draft = validateLegalDraftModelResult(data, trustedInput);
    const problem = getLegalProblem("semya-i-deti", trustedInput.verifiedRouteSlug);
    if (!problem?.lastReviewedAt) throw new Error("missing_legal_review_date");
    const documentResult = createFamilyAIDraftDocumentResult({
      routeSlug: trustedInput.verifiedRouteSlug,
      scenarioKey: trustedInput.scenario,
      documentSlug: trustedInput.verifiedDocumentSlug,
      documentTitle: draft.documentTitle,
      documentText: draft.draftText,
      usedRuleIds: draft.usedRuleIds,
      placeholders: draft.placeholders,
      legalReviewedAt: problem.lastReviewedAt
    });
    return NextResponse.json({
      ok: true,
      result: { ...draft, filingReady: false, requiresLegalReview: true, model: "configured-provider" },
      documentResult
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Не удалось сформировать полный документ. Ответы сохранены, повторите попытку." }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
