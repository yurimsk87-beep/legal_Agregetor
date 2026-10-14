import assert from "node:assert/strict";
import { PARENTS_CHILD_LEGAL_RULES } from "@/data/parents-child-legal-review";
import { verifyFamilyLegalDraftRequest } from "@/lib/family-draft-trusted-rules";
import type { LegalDraftRequest } from "@/lib/legal-draft-contract";

const rule = PARENTS_CHILD_LEGAL_RULES.find((item) => item.scenarios.includes("residence"));
assert.ok(rule);
const input: LegalDraftRequest = {
  route: "/documents/mesto-zhitelstva-rebenka-posle-razvoda/",
  scenario: "residence",
  documentType: "courtDraft",
  documentTitle: "Проект определения места жительства ребёнка",
  verifiedFacts: { childName: "Тестовое значение" },
  allowedLegalRules: [{
    id: rule.id, norm: rule.norm, url: rule.url,
    statement: "Поддельное содержание нормы от клиента",
    scope: "Поддельная область действия нормы"
  }],
  missingFacts: [],
  filingReady: false,
  requiresLegalReview: true,
  safetyFlags: [],
  allowedResultType: "courtDraft"
};
const trusted = verifyFamilyLegalDraftRequest(input);
assert.equal(trusted.allowedLegalRules.length, 1);
assert.equal(trusted.allowedLegalRules[0].id, rule.id);
assert.equal(trusted.allowedLegalRules[0].statement, rule.statement, "server must replace attacker-supplied text");
assert.equal(trusted.allowedLegalRules[0].norm, rule.norm);
assert.equal(trusted.filingReady, false);
assert.equal(trusted.requiresLegalReview, true);
assert.throws(() => verifyFamilyLegalDraftRequest({ ...input, route: "/documents/unknown/" }));
assert.throws(() => verifyFamilyLegalDraftRequest({ ...input, scenario: "enforcement" }));
assert.throws(() => verifyFamilyLegalDraftRequest({ ...input, allowedLegalRules: [{ ...input.allowedLegalRules[0], norm: "ст. 999 ГПК РФ" }] }));
assert.throws(() => verifyFamilyLegalDraftRequest({ ...input, allowedLegalRules: [{ ...input.allowedLegalRules[0], id: "invented" }] }));
assert.throws(() => verifyFamilyLegalDraftRequest({ ...input, allowedLegalRules: [input.allowedLegalRules[0], input.allowedLegalRules[0]] }));
assert.throws(() => verifyFamilyLegalDraftRequest({ ...input, filingReady: true }));
assert.throws(() => verifyFamilyLegalDraftRequest({ ...input, requiresLegalReview: false }));
console.log("Family AI legal-source validation passed: provenance, scenario and forged-rule rejection.");
