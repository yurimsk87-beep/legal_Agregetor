import assert from "node:assert/strict";
import { INTERNATIONAL_FAMILY_DISPUTES_KEYS, INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS } from "../src/data/international-family-disputes-route";
import { buildInternationalFamilyDisputesPdfText, createInternationalFamilyDisputesPdfBlob } from "../src/lib/international-family-disputes-pdf";
import { validateInternationalFamilyDisputes } from "../src/lib/international-family-disputes-validator";

async function main() {
  for (const key of INTERNATIONAL_FAMILY_DISPUTES_KEYS) {
    const answers = Object.fromEntries(INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS[key].questions.map((field) => [field.name, field.options?.[0]?.value ?? `Проверочное значение: ${field.label}`]));
    if (key === "child") answers.childSafety = "no";
    const result = validateInternationalFamilyDisputes(key, answers);
    assert.equal(result.pdfAvailable, true);
    assert.equal(result.filingReady, false);
    assert.match(buildInternationalFamilyDisputesPdfText(result), /международного договора/);
    const blob = await createInternationalFamilyDisputesPdfBlob(result);
    assert.ok(blob.size > 1000);
    console.log(`PASS ${key}: ${blob.size} bytes`);
  }
  console.log("international family disputes PDF audit passed");
}

main().catch((error) => { console.error(error); process.exit(1); });
