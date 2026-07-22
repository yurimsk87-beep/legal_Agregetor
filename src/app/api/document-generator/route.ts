import { NextResponse } from "next/server";
import { z } from "zod";

const MAX_COMMENT_LENGTH = 2_000;
const MAX_DRAFT_LENGTH = 16_000;
const LLM_TIMEOUT_MS = Number(process.env.AI_DOCUMENT_GENERATOR_TIMEOUT_MS) || 18_000;

const schema = z.object({
  templateSlug: z.string().min(1).max(120),
  templateTitle: z.string().min(1).max(240),
  draftText: z.string().min(50).max(MAX_DRAFT_LENGTH),
  userComment: z.string().max(MAX_COMMENT_LENGTH).optional().or(z.literal("")),
  values: z.record(z.union([z.string(), z.boolean()])).optional()
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  if (!isDocumentLlmEnabled()) {
    return NextResponse.json({ ok: true, text: mergeCommentFallback(data.draftText, data.userComment), llmStatus: "disabled" });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(`${(process.env.AI_BASE_URL ?? "").replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "pravopoisk-document-generator/1.0"
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "Ты помогаешь улучшить готовый юридический документ ПравоПоиска. Не выдумывай факты, суды, суммы, даты, статьи и гарантии результата. Используй только черновик, поля формы и комментарий пользователя. Верни только полный текст документа без markdown."
          },
          {
            role: "user",
            content: buildPrompt(data)
          }
        ],
        temperature: 0.15,
        max_tokens: 2600
      }),
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      console.error(`[document-generator] LLM HTTP ${response.status}`);
      return NextResponse.json({ ok: true, text: mergeCommentFallback(data.draftText, data.userComment), llmStatus: "error" });
    }

    const result = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = result.choices?.[0]?.message?.content?.trim();
    if (!text) return NextResponse.json({ ok: true, text: mergeCommentFallback(data.draftText, data.userComment), llmStatus: "empty" });

    return NextResponse.json({ ok: true, text, llmStatus: "success" });
  } catch (error) {
    if (controller.signal.aborted) console.error("[document-generator] LLM timeout");
    else console.error("[document-generator] LLM error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: true, text: mergeCommentFallback(data.draftText, data.userComment), llmStatus: "error" });
  } finally {
    clearTimeout(timer);
  }
}

function isDocumentLlmEnabled() {
  return Boolean(process.env.AI_API_KEY && process.env.AI_BASE_URL && process.env.AI_MODEL);
}

function buildPrompt(data: z.infer<typeof schema>) {
  return `Документ: ${data.templateTitle}
Шаблон: ${data.templateSlug}

Поля формы:
${JSON.stringify(data.values ?? {}, null, 2)}

Комментарий пользователя, который нужно аккуратно учесть, если он не противоречит полям:
${data.userComment?.trim() || "Нет дополнительного комментария."}

Текущий черновик:
${data.draftText}

Задача:
1. Составь полный готовый текст документа.
2. Сохрани процессуальную структуру и реквизиты из черновика.
3. Встрой полезные факты из комментария в мотивировочную часть простым юридическим языком.
4. Не добавляй новые факты, суммы, даты, документы или нормы права, которых нет в данных.
5. Не добавляй пояснения вне документа.`;
}

function mergeCommentFallback(draftText: string, userComment = "") {
  const comment = userComment.trim();
  if (!comment) return draftText;
  if (draftText.includes("Дополнительно сообщаю:")) return draftText;
  return draftText.replace("\n\nПРОШУ:", `\n\nДополнительно сообщаю: ${comment}\n\nПРОШУ:`);
}
