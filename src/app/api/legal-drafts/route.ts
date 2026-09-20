import { NextResponse } from "next/server";
import { generateLegalDraft, LegalDraftGenerationError } from "@/lib/deepseek-legal-draft";
import { legalDraftRequestSchema } from "@/lib/legal-draft-contract";
import { checkRateLimit, clientKey, readJsonWithLimit, rejectCrossOrigin, RequestPayloadTooLargeError } from "@/lib/request-security";

export const runtime = "nodejs";

const safeFailureMessage = "Не удалось сформировать текст документа. Собранные данные сохранены в текущей форме. Попробуйте ещё раз.";

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  const limited = checkRateLimit({ key: `legal-draft:${clientKey(request)}`, limit: 6, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  try {
    const body = await readJsonWithLimit(request, 96 * 1024);
    const parsed = legalDraftRequestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, message: "Проверьте данные документа." }, { status: 400 });
    const result = await generateLegalDraft(parsed.data);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof RequestPayloadTooLargeError) {
      return NextResponse.json({ ok: false, message: "Слишком большой объём данных документа." }, { status: 413 });
    }
    const status = error instanceof LegalDraftGenerationError && error.code === "configuration" ? 503 : 502;
    return NextResponse.json({ ok: false, message: safeFailureMessage }, { status });
  }
}
