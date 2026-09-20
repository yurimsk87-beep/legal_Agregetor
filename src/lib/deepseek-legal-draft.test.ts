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

  await assert.rejects(
    () => generateLegalDraft(input, { apiKey: "test-key", fetchImpl: () => response({ documentTitle: input.documentTitle, draftText: "Недостаточно длинный текст", usedRuleIds: ["unknown"], placeholders: [] }) }),
    LegalDraftGenerationError
  );

  await assert.rejects(
    () => generateLegalDraft(input, { apiKey: "test-key", fetchImpl: () => response({ documentTitle: "Другой документ", draftText: "Достаточно длинный связный текст документа с обстоятельствами, просьбой, приложениями и местом для подписи пользователя.", usedRuleIds: ["sk-66"], placeholders: [] }) }),
    LegalDraftGenerationError
  );

  console.log("deepseek legal draft contract tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
