import assert from "node:assert/strict";
import { SURROGACY_ORIGIN_KEYS, SURROGACY_ORIGIN_SCENARIOS } from "@/data/surrogacy-origin-route";
import { buildSurrogacyOriginPdfText } from "@/lib/surrogacy-origin-pdf";
import { validateSurrogacyOrigin } from "@/lib/surrogacy-origin-validator";

for (const key of SURROGACY_ORIGIN_KEYS) {
  const missing = validateSurrogacyOrigin(key, {});
  assert.equal(missing.pdfAvailable, false);
  assert.equal(missing.filingReady, false);
  const answers = Object.fromEntries(SURROGACY_ORIGIN_SCENARIOS[key].questions.map((field) => [field.name, field.name === "childSafety" ? "no" : field.options?.[0]?.value ?? "Сведения из документа"]));
  const result = validateSurrogacyOrigin(key, answers);
  assert.equal(result.allowed, true);
  assert.equal(result.pdfAvailable, true);
  assert.equal(result.filingReady, false);
  assert.equal(result.requiresLegalReview, true);
  assert.match(buildSurrogacyOriginPdfText(result), /Готово к подаче: нет/);
  assert.ok(result.preparedData.length);
}
assert.match(validateSurrogacyOrigin("registration", { childBorn: "yes", applicants: "spouses", birthRecord: "no", medicalProof: "yes", surrogateConsent: "no" }).notices.join(" "), /не подтверждено/);
const urgent = validateSurrogacyOrigin("dispute", { disputeSubject: "record", childBorn: "yes", birthRecord: "yes", courtAct: "no", childSafety: "yes" });
assert.equal(urgent.outcomeKey, "urgent-child-safety");
assert.equal(urgent.pdfAvailable, false);
assert.equal(urgent.allowed, false);
assert.match(urgent.nextSteps.join(" "), /112/);
assert.equal(validateSurrogacyOrigin("foreign", { countries: "Россия, Германия", citizenship: "РФ, ФРГ", childLocation: "Германия", foreignRecord: "yes", contractDate: "2021" }).resultKind, "legalReviewOnly");
console.log("Surrogacy-origin validation passed: five outcomes and critical safety checks.");
