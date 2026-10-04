import assert from "node:assert/strict";
import { INTERNATIONAL_FAMILY_DISPUTES_KEYS, INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS } from "@/data/international-family-disputes-route";
import { buildInternationalFamilyDisputesPdfText } from "@/lib/international-family-disputes-pdf";
import { validateInternationalFamilyDisputes } from "@/lib/international-family-disputes-validator";

for (const key of INTERNATIONAL_FAMILY_DISPUTES_KEYS) {
  const missing = validateInternationalFamilyDisputes(key, {});
  assert.equal(missing.allowed, false);
  assert.equal(missing.pdfAvailable, false);
  assert.equal(missing.filingReady, false);
  assert.equal(missing.requiresLegalReview, true);
  const answers = Object.fromEntries(INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS[key].questions.map((field) => [field.name, field.options?.[0]?.value ?? `Ответ: ${field.label}`]));
  if (key === "child") answers.childSafety = "no";
  const ready = validateInternationalFamilyDisputes(key, answers);
  assert.equal(ready.allowed, true);
  assert.equal(ready.pdfAvailable, true);
  assert.equal(ready.filingReady, false);
  const text = buildInternationalFamilyDisputesPdfText(ready);
  assert.match(text, /Готово к подаче: нет/);
  assert.match(text, /Подготовленные сведения/);
  assert.match(text, /не определяет применимое право/);
}

const urgentAnswers = Object.fromEntries(INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS.child.questions.map((field) => [field.name, field.options?.[0]?.value ?? "Россия и Франция"]));
urgentAnswers.childSafety = "yes";
const urgent = validateInternationalFamilyDisputes("child", urgentAnswers);
assert.equal(urgent.outcomeKey, "urgent-child-safety-abroad");
assert.equal(urgent.pdfAvailable, false);
assert.equal(urgent.allowed, false);

const recognitionAnswers = Object.fromEntries(INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS.recognition.questions.map((field) => [field.name, field.options?.[0]?.value ?? "Данные решения"]));
recognitionAnswers.effective = "unsure";
recognitionAnswers.notice = "no";
const recognition = validateInternationalFamilyDisputes("recognition", recognitionAnswers);
assert.equal(recognition.filingReady, false);
assert.ok(recognition.notices.some((notice) => notice.includes("извещение")));

console.log("international family disputes validation tests passed");
