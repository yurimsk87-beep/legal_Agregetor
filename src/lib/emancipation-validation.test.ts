import assert from "node:assert/strict";
import { EMANCIPATION_KEYS, EMANCIPATION_SCENARIOS } from "@/data/emancipation-route";
import { validateEmancipation } from "@/lib/emancipation-validator";
function answers(key: (typeof EMANCIPATION_KEYS)[number]) { return Object.fromEntries(EMANCIPATION_SCENARIOS[key].questions.map((field) => [field.name, field.options?.[0]?.value ?? `Ответ: ${field.label}`])); }
for (const key of EMANCIPATION_KEYS) { const missing = validateEmancipation(key, {}); assert.equal(missing.pdfAvailable, false); assert.equal(missing.filingReady, false); }
const ageOnly = validateEmancipation("eligibility", { ...answers("eligibility"), workBasis: "none" }); assert.equal(ageOnly.pdfAvailable, false); assert.match(ageOnly.issues.map((item) => item.message).join(" "), /основание занятости/);
const tooYoung = validateEmancipation("eligibility", { ...answers("eligibility"), age: "under16" }); assert.equal(tooYoung.pdfAvailable, false);
const eligible = validateEmancipation("eligibility", { ...answers("eligibility"), age: "16", workBasis: "employment", consent: "all" }); assert.equal(eligible.pdfAvailable, true); assert.equal(eligible.filingReady, false);
const territoryValues = { ...answers("guardianship"), age: "17", workBasis: "employment", consent: "all", region: "region-saint-petersburg", municipality: "spb-gagarinskoe", authorityName: "spb-gagarinskoe-guardianship" };
const guardianship = validateEmancipation("guardianship", territoryValues); assert.equal(guardianship.pdfAvailable, true); assert.equal(guardianship.requiresLegalReview, true); assert.match(guardianship.draftText, /Отдел опеки и попечительства/);
const noConsent = validateEmancipation("guardianship", { ...territoryValues, consent: "missing" }); assert.equal(noConsent.pdfAvailable, false);
const unverified = validateEmancipation("guardianship", { ...territoryValues, authorityName: "territory-not-found" }); assert.equal(unverified.pdfAvailable, false);
const court = validateEmancipation("court", { ...answers("court"), age: "16", workBasis: "business", consent: "missing" }); assert.equal(court.resultKind, "courtDraft"); assert.equal(court.filingReady, false); assert.equal(court.requiresLegalReview, true);
const courtWithConsent = validateEmancipation("court", { ...answers("court"), consent: "all" }); assert.equal(courtWithConsent.pdfAvailable, false);
const noDecision = validateEmancipation("consequences", { ...answers("consequences"), decisionBasis: "none" }); assert.equal(noDecision.pdfAvailable, false);
console.log("emancipation validation tests passed");
