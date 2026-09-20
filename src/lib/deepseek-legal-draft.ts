import { legalDraftModelResponseSchema, type LegalDraftRequest, type LegalDraftResponse } from "@/lib/legal-draft-contract";

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-flash";
const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 2;

type FetchLike = typeof fetch;

export class LegalDraftGenerationError extends Error {
  constructor(message: string, readonly code: "configuration" | "provider" | "timeout" | "invalid-output" | "unsafe-output") {
    super(message);
    this.name = "LegalDraftGenerationError";
  }
}

export async function generateLegalDraft(
  input: LegalDraftRequest,
  options: { fetchImpl?: FetchLike; apiKey?: string; baseUrl?: string; model?: string; timeoutMs?: number } = {}
): Promise<LegalDraftResponse> {
  const apiKey = options.apiKey ?? process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new LegalDraftGenerationError("DeepSeek API is not configured", "configuration");

  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = (options.baseUrl ?? process.env.DEEPSEEK_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const model = options.model ?? process.env.DEEPSEEK_MODEL ?? DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs ?? parsePositiveInteger(process.env.DEEPSEEK_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: buildSystemPrompt() },
            { role: "user", content: JSON.stringify(input) }
          ],
          response_format: { type: "json_object" },
          stream: false,
          temperature: 0.1,
          max_tokens: 8000
        }),
        signal: controller.signal
      });
      if (!response.ok) {
        if (response.status >= 500 && attempt < MAX_ATTEMPTS) continue;
        throw new LegalDraftGenerationError(`DeepSeek returned HTTP ${response.status}`, "provider");
      }

      const envelope = (await response.json()) as { choices?: Array<{ message?: { content?: string | null } }> };
      const raw = envelope.choices?.[0]?.message?.content;
      if (!raw) throw new LegalDraftGenerationError("DeepSeek returned an empty response", "invalid-output");
      const parsed = legalDraftModelResponseSchema.safeParse(parseJson(raw));
      if (!parsed.success) throw new LegalDraftGenerationError("DeepSeek response does not match the schema", "invalid-output");
      validateModelOutput(input, parsed.data);

      const marker = input.requiresLegalReview || !input.filingReady
        ? "ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ\nТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА\n\n"
        : "";
      return {
        ...parsed.data,
        draftText: marker + appendCanonicalLegalReferences(
          stripDuplicateSafetyMarker(parsed.data.draftText),
          input,
          parsed.data.usedRuleIds
        ),
        filingReady: input.filingReady,
        requiresLegalReview: input.requiresLegalReview,
        model
      };
    } catch (error) {
      lastError = error;
      if (error instanceof LegalDraftGenerationError && error.code !== "provider") throw error;
      if (isAbortError(error)) {
        if (attempt < MAX_ATTEMPTS) continue;
        throw new LegalDraftGenerationError("DeepSeek request timed out", "timeout");
      }
      if (attempt >= MAX_ATTEMPTS) break;
    } finally {
      clearTimeout(timeout);
    }
  }

  if (lastError instanceof LegalDraftGenerationError) throw lastError;
  throw new LegalDraftGenerationError("DeepSeek request failed", "provider");
}

function buildSystemPrompt() {
  return [
    "Сформируй связный юридический черновик на русском языке и верни только JSON.",
    "Используй исключительно verifiedFacts и allowedLegalRules из входа.",
    "Не меняй route, scenario, documentType, filingReady или requiresLegalReview.",
    "Не выбирай суд, подсудность, участников, доказательства, факты или нормы самостоятельно.",
    "Не пиши в draftText номера или названия статей, кодексов, законов, постановлений, приказов и URL.",
    "Правовые ссылки сервер добавит сам только по usedRuleIds; в тексте излагай лишь факты, просьбы и структуру документа.",
    "Если обязательного факта нет, используй квадратный placeholder и перечисли его в placeholders.",
    "usedRuleIds может содержать только id из allowedLegalRules.",
    "Не прогнозируй решение суда и не называй документ готовым к подаче.",
    "Структура JSON: {\"documentTitle\":string,\"draftText\":string,\"usedRuleIds\":string[],\"placeholders\":string[]}.",
    "Для иска, где применимо, включи адресата, стороны, обстоятельства, правовое обоснование, просительную часть, приложения, подпись и дату."
  ].join(" ");
}

function validateModelOutput(input: LegalDraftRequest, output: { documentTitle: string; draftText: string; usedRuleIds: string[] }) {
  if (output.documentTitle !== input.documentTitle) {
    throw new LegalDraftGenerationError("The model changed the document title", "unsafe-output");
  }
  const allowedIds = new Set(input.allowedLegalRules.map((rule) => rule.id));
  if (output.usedRuleIds.some((id) => !allowedIds.has(id))) {
    throw new LegalDraftGenerationError("The model used a legal rule outside the allowlist", "unsafe-output");
  }
  const allowedUrls = new Set(input.allowedLegalRules.map((rule) => rule.url));
  const urls = output.draftText.match(/https?:\/\/[^\s)\]}]+/g) ?? [];
  if (urls.some((url) => !allowedUrls.has(url.replace(/[.,;:]$/, "")))) {
    throw new LegalDraftGenerationError("The model added an unapproved source", "unsafe-output");
  }
  if (containsModelLegalReference(output.draftText)) {
    throw new LegalDraftGenerationError("The model added a legal reference instead of using an allowlisted rule id", "unsafe-output");
  }
  if (/(?:гарантированно|суд\s+обязательно\s+удовлетворит|точно\s+выигра)/i.test(output.draftText)) {
    throw new LegalDraftGenerationError("The model added a prohibited prediction", "unsafe-output");
  }
}

const modelLegalReferencePatterns = [
  /(?:статья|статьи|статье|статью|статьёй|статьей)\s+\d+(?:\.\d+)*/iu,
  /(?:^|[\s(])ст\.\s*\d+(?:\.\d+)*/iu,
  /(?:часть|части|пункт|пункта|подпункт|подпункта)\s+\d+(?:\.\d+)*(?:\s+(?:статьи|статье)\s+\d+(?:\.\d+)*)?/iu,
  /(?:федеральный|федерального|федеральному|федеральным|федеральном|конституционный|конституционного)\s+закон[а-яё]*(?:\s+от\s+\d{1,2}\.\d{1,2}\.\d{4})?\s*(?:№|N)\s*[\d-]+/iu,
  /\b\d+-(?:ФЗ|ФКЗ)\b/iu,
  /\b(?:СК|ГПК|НК|ГК|КАС|АПК|КоАП|УК)\s+РФ\b/u,
  /(?:постановление|постановления|определение|определения|приказ|приказа)\s+(?:Пленума|Правительства|Верховного|Конституционного|Минюста)/iu
];

function containsModelLegalReference(value: string) {
  return modelLegalReferencePatterns.some((pattern) => pattern.test(value));
}

function appendCanonicalLegalReferences(draftText: string, input: LegalDraftRequest, usedRuleIds: string[]) {
  const rulesById = new Map(input.allowedLegalRules.map((rule) => [rule.id, rule]));
  const rules = [...new Set(usedRuleIds)].map((id) => rulesById.get(id)).filter((rule) => rule !== undefined);
  if (!rules.length) return draftText;

  const references = rules.map((rule, index) => [
    `${index + 1}. ${rule.norm}.`,
    rule.statement ? rule.statement : null,
    `Источник: ${rule.url}`
  ].filter(Boolean).join("\n")).join("\n\n");

  return `${draftText}\n\nПРАВОВЫЕ ОСНОВАНИЯ\n${references}`;
}

function parseJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    throw new LegalDraftGenerationError("DeepSeek returned invalid JSON", "invalid-output");
  }
}

function stripDuplicateSafetyMarker(value: string) {
  return value.replace(/^(?:ЧЕРНОВИК[^\n]*\n|ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА\n)+/i, "").trim();
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}
