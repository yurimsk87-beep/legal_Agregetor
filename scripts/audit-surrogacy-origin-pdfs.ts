import assert from "node:assert/strict";
import { SURROGACY_ORIGIN_KEYS, SURROGACY_ORIGIN_SCENARIOS } from "../src/data/surrogacy-origin-route";
import { buildSurrogacyOriginPdfText, createSurrogacyOriginPdfBlob } from "../src/lib/surrogacy-origin-pdf";
import { validateSurrogacyOrigin } from "../src/lib/surrogacy-origin-validator";

async function run() {
  for (const key of SURROGACY_ORIGIN_KEYS) {
    const answers = Object.fromEntries(SURROGACY_ORIGIN_SCENARIOS[key].questions.map((field) => [field.name, field.name === "childSafety" ? "no" : field.options?.[0]?.value ?? "Подтверждённые сведения"]));
    const result = validateSurrogacyOrigin(key, answers);
    assert.equal(result.filingReady, false);
    assert.equal(result.requiresLegalReview, true);
    assert.match(buildSurrogacyOriginPdfText(result), /Готово к подаче: нет/);
    const pdf = await createSurrogacyOriginPdfBlob(result);
    assert.ok(pdf.size > 1000, key);
  }
  console.log("Surrogacy-origin PDF audit passed: five personalized nonfiling results.");
}
void run();
