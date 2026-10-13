import assert from "node:assert/strict";
import { buildLegalDraftPrompts, validateLegalDraftModelResult } from "./legal-draft-generation";
import type { LegalDraftRequest } from "./legal-draft-contract";

const input: LegalDraftRequest = {
  route: "/documents/test/", scenario: "civil", documentType: "courtDraft",
  documentTitle: "Исковое заявление",
  verifiedFacts: { claimant: "Тестовый истец", circumstances: "Задолженность по договору" },
  allowedLegalRules: [{ id: "gpk131", norm: "ст. 131 ГПК РФ", url: "https://www.consultant.ru/document/cons_doc_LAW_39570/", statement: "Форма и содержание иска" }],
  missingFacts: [], filingReady: false, requiresLegalReview: true,
  safetyFlags: [], allowedResultType: "courtDraft"
};
const draftText = "В суд: [наименование суда]\nИстец: Тестовый истец\n\nИСКОВОЕ ЗАЯВЛЕНИЕ\nОбстоятельства: задолженность по договору.\nВ соответствии со ст. 131 ГПК РФ прошу рассмотреть исковое заявление.\nПриложения: [перечень].\nДата: [дата]\nПодпись: [подпись]";
const valid = {
  documentTitle: input.documentTitle, draftText, usedRuleIds: ["gpk131"],
  placeholders: ["наименование суда", "перечень", "дата", "подпись"]
};
assert.equal(validateLegalDraftModelResult(valid, input).draftText, draftText);
assert.match(buildLegalDraftPrompts(input).system, /не придумывай/iu);
assert.throws(() => validateLegalDraftModelResult({ ...valid, usedRuleIds: ["invented"] }, input));
assert.throws(() => validateLegalDraftModelResult({ ...valid, draftText: draftText + "\nСогласно ст. 999 ГПК РФ ..." }, input));
assert.throws(() => validateLegalDraftModelResult({ ...valid, draftText: draftText + "\nhttps://example.com" }, input));
assert.throws(() => validateLegalDraftModelResult({ ...valid, placeholders: ["несуществующее поле"] }, input));
console.log("Legal draft generation contract tests passed");
