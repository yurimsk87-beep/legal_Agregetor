import assert from "node:assert/strict";
import { generateLegalDraft, LegalDraftGenerationError } from "@/lib/deepseek-legal-draft";
import type { LegalDraftRequest } from "@/lib/legal-draft-contract";

const input: LegalDraftRequest = {
  route: "family-route",
  scenario: "court",
  documentType: "исковое заявление",
  documentTitle: "Исковое заявление об определении порядка общения с ребёнком",
  verifiedFacts: { Истец: "Иванов Иван", Обстоятельства: "Подтверждённые обстоятельства" },
  allowedLegalRules: [{ id: "sk-66", norm: "статья 66 СК РФ", url: "https://pravo.gov.ru/family", statement: "Порядок общения" }],
  missingFacts: ["дата"],
  filingReady: false,
  requiresLegalReview: true,
  safetyFlags: ["court-review"],
  allowedResultType: "courtDraft"
};

function response(value: unknown) {
  return Promise.resolve(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(value) } }] }), { status: 200 }));
}

async function main() {
  const generated = await generateLegalDraft(input, {
    apiKey: "test-key",
    fetchImpl: () => response({ documentTitle: input.documentTitle, draftText: "В суд [указать суд]\n\nОбстоятельства дела изложены на основании подтверждённых данных.\n\nПросьба: [указать требование].\n\nПриложения: [указать приложения].\n\nДата: [указать дату]. Подпись: [подпись].", usedRuleIds: ["sk-66"], placeholders: ["указать суд", "указать дату"] })
  });
  assert.match(generated.draftText, /^ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ/);
  assert.equal(generated.filingReady, false);
  assert.equal(generated.requiresLegalReview, true);
  assert.match(generated.draftText, /статья 66 СК РФ/);
  assert.match(generated.draftText, /https:\/\/pravo\.gov\.ru\/family/);

  await assert.rejects(
    () => generateLegalDraft(input, { apiKey: "test-key", fetchImpl: () => response({ documentTitle: input.documentTitle, draftText: "Обстоятельства подробно изложены на основании подтверждённых данных. Просьба сформулирована пользователем. Приложения перечислены. Дата и подпись предусмотрены.", usedRuleIds: ["unknown"], placeholders: [] }) }),
    LegalDraftGenerationError
  );

  await assert.rejects(
    () => generateLegalDraft(input, { apiKey: "test-key", fetchImpl: () => response({ documentTitle: "Другой документ", draftText: "Достаточно длинный связный текст документа с обстоятельствами, просьбой, приложениями и местом для подписи пользователя.", usedRuleIds: ["sk-66"], placeholders: [] }) }),
    LegalDraftGenerationError
  );

  await assert.rejects(
    () => generateLegalDraft(input, { apiKey: "test-key", fetchImpl: () => response({ documentTitle: input.documentTitle, draftText: "На основании статьи 999 СК РФ обстоятельства подробно изложены. Просьба сформулирована пользователем. Приложения перечислены, дата и подпись предусмотрены.", usedRuleIds: ["sk-66"], placeholders: [] }) }),
    LegalDraftGenerationError
  );

  await assert.rejects(
    () => generateLegalDraft(input, { apiKey: "test-key", fetchImpl: () => response({ documentTitle: input.documentTitle, draftText: "Согласно Федеральному закону № 999-ФЗ обстоятельства подробно изложены. Просьба сформулирована пользователем. Приложения перечислены, дата и подпись предусмотрены.", usedRuleIds: ["sk-66"], placeholders: [] }) }),
    LegalDraftGenerationError
  );

  await assert.rejects(
    () => generateLegalDraft(input, { apiKey: "test-key", fetchImpl: () => response({ documentTitle: input.documentTitle, draftText: "Обстоятельства подробно изложены на основании подтверждённых данных. Источник https://example.com/law не разрешён. Просьба и приложения перечислены, дата и подпись предусмотрены.", usedRuleIds: ["sk-66"], placeholders: [] }) }),
    LegalDraftGenerationError
  );

  await assert.rejects(
    () => generateLegalDraft(input, { apiKey: "test-key", fetchImpl: () => response({ documentTitle: input.documentTitle, draftText: "Обстоятельства подробно изложены на основании подтверждённых данных. Просьба сформулирована пользователем. Приложения перечислены, дата и подпись предусмотрены.", usedRuleIds: ["sk-66"], placeholders: [], filingReady: true }) }),
    LegalDraftGenerationError
  );

  console.log("deepseek legal draft contract tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
