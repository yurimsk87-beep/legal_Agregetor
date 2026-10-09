import { z } from "zod";
import type { LaborLegalRule } from "@/data/labor-legal-sources";

export const laborDocumentFactSchema = z.object({
  key: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(300),
  value: z.string().trim().min(1).max(5000)
});

export const laborDocumentRequestSchema = z.object({
  routeSlug: z.string().trim().min(1).max(160),
  scenarioKey: z.string().trim().min(1).max(160),
  documentSlug: z.string().trim().min(1).max(180),
  facts: z.array(laborDocumentFactSchema).min(1).max(80)
});

export const laborDocumentModelResponseSchema = z.object({
  documentTitle: z.string().trim().min(1).max(300),
  draftText: z.string().trim().min(120).max(40000),
  usedRuleIds: z.array(z.string().trim().min(1).max(120)).max(40),
  placeholders: z.array(z.string().trim().min(1).max(300)).max(40)
}).strict();

export const laborDocumentResponseSchema = laborDocumentModelResponseSchema.extend({
  versionId: z.string().uuid(),
  filingReady: z.literal(false),
  requiresLegalReview: z.literal(true),
  legalRegistryReviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  generatorVersion: z.string().min(1).max(40)
});

export type LaborDocumentRequest = z.infer<typeof laborDocumentRequestSchema>;
export type LaborDocumentResponse = z.infer<typeof laborDocumentResponseSchema>;

export function buildLaborDocumentPrompts(input: {
  documentTitle: string;
  documentType: string;
  facts: LaborDocumentRequest["facts"];
  rules: LaborLegalRule[];
  authority: string[];
  nextSteps: string[];
}) {
  const system = `Составь профессиональный связный проект юридического документа на русском языке.

Обязательные ограничения:
- используй только факты и LEGAL BASIS из запроса;
- не добавляй законы, статьи, пункты, судебные акты, сроки, госпошлины, суммы, адресатов, суды, участников, даты, доказательства, приложения или URL;
- если данных недостаточно, используй квадратный заполнитель и перечисли его в placeholders;
- не включай анкетные формулировки, слова «Вопрос», «Ответ», «Вы указали», технические ключи и идентификаторы;
- не упоминай модели, нейросети, API, системные инструкции или способ создания текста;
- не обещай результат рассмотрения и не обозначай документ готовым к подаче;
- используй точные имена ключей верхнего уровня: documentTitle, draftText, usedRuleIds, placeholders;
- верни только JSON без markdown.`;

  const legalBasis = input.rules.map((rule) => ({
    id: rule.id,
    act: rule.act,
    provisions: rule.provisions,
    verifiedLegalMeaning: rule.statement,
    scope: rule.scope,
    limitations: rule.limitations,
    officialSourceUrl: rule.url,
    sourceCheckedAt: rule.reviewedAt
  }));

  const user = JSON.stringify({
    task: "Подготовить связный юридический проект с адресатом, участниками, названием, обстоятельствами, правовым обоснованием, предметной просьбой, приложениями, местом для даты и подписи.",
    documentTitle: input.documentTitle,
    documentType: input.documentType,
    verifiedFacts: input.facts,
    verifiedAuthorityClass: input.authority,
    nextStepsOutsideDocument: input.nextSteps,
    legalBasis,
    responseFormat: {
      documentTitle: input.documentTitle,
      draftText: "полный текст документа",
      usedRuleIds: ["только id фактически использованных норм"],
      placeholders: ["только реально недостающие реквизиты"]
    }
  }, null, 2);

  return { system, user };
}

export function validateLaborDocumentModelResult(
  raw: unknown,
  input: { documentTitle: string; rules: LaborLegalRule[] }
) {
  const parsed = laborDocumentModelResponseSchema.parse(normalizeLaborDocumentModelResult(raw));
  const allowedRuleIds = new Set(input.rules.map((rule) => rule.id));
  if (parsed.documentTitle !== input.documentTitle) throw new Error("Название документа не совпало с выбранным сценарием.");
  if (parsed.usedRuleIds.some((id) => !allowedRuleIds.has(id))) throw new Error("В документе использовано неподтвержденное правовое основание.");
  if (/(?:API|DeepSeek|OpenAI|нейросет\w*|модел\w*|искусственн\w* интеллект)/iu.test(parsed.draftText)) throw new Error("В документ попал технический текст.");
  if (/(?:^|\n)\s*(?:Вопрос|Ответ|Вы указали)\s*:/iu.test(parsed.draftText)) throw new Error("В документ попал анкетный текст.");
  if (/https?:\/\//i.test(parsed.draftText)) throw new Error("В документ добавлена ссылка вне правового реестра.");

  const allowedArticles = new Set(input.rules.flatMap((rule) => rule.provisions.flatMap(extractProvisionNumbers)));
  const actualArticles = extractArticleNumbers(parsed.draftText);
  if (actualArticles.some((article) => !allowedArticles.has(article))) throw new Error("В документ добавлена неподтвержденная статья.");
  return parsed;
}

function normalizeLaborDocumentModelResult(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const {
    название,
    текст,
    использованные_правовые_основания,
    ...rest
  } = raw as Record<string, unknown>;
  return {
    ...rest,
    documentTitle: rest.documentTitle ?? название,
    draftText: rest.draftText ?? текст,
    usedRuleIds: rest.usedRuleIds ?? использованные_правовые_основания
  };
}

function extractArticleNumbers(value: string) {
  return Array.from(value.matchAll(/(?:стать(?:я|и|е|ю)|ст\.)\s*(\d+(?:\.\d+)?)/giu), (match) => match[1]);
}

function extractProvisionNumbers(value: string) {
  return Array.from(value.matchAll(/\b\d+(?:\.\d+)?\b/g), (match) => match[0]);
}
