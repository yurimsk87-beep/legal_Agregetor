import assert from "node:assert/strict";
import { FAMILY_ADDITIVE_DOCUMENTS } from "@/data/family-additive-documents";
import {
  getDocumentCardCtaLabel,
  getDocumentOnlineFillCtaLabel,
  getDocumentSampleCtaLabel,
  getDocumentSeoBlocks,
  getGeneratorFaqs,
  getGeneratorLead,
  getGeneratorSeoBlocks,
  getGeneratorPageTitle
} from "@/lib/document-seo";

const guidedKinds = new Set(["officialForm", "checklist", "legalReviewOnly", "preparedData"]);
const guided = FAMILY_ADDITIVE_DOCUMENTS.filter((document) => guidedKinds.has(document.resultKind ?? ""));
assert.ok(guided.length > 0);
assert.ok(guided.some((document) => document.resultKind === "officialForm"));
assert.ok(guided.some((document) => document.resultKind === "checklist"));

for (const document of guided) {
  const pageText = [
    getGeneratorPageTitle(document),
    getGeneratorLead(document),
    ...getDocumentSeoBlocks(document).flatMap((block) => [block.title, block.text]),
    ...getGeneratorSeoBlocks(document).flatMap((block) => [block.title, block.text]),
    ...getGeneratorFaqs(document).flatMap((item) => [item.question, item.answer])
  ].join("\n");
  assert.doesNotMatch(pageText, /сохраните текст и используйте его для подачи/i, document.slug);
  assert.doesNotMatch(pageText, /готовый образец и заполнить документ онлайн/i, document.slug);
  assert.match(getDocumentCardCtaLabel(document), /Проверить порядок/);
  assert.match(getDocumentOnlineFillCtaLabel(document), /подготовить сведения/);
  if (document.resultKind === "officialForm") {
    assert.match(getDocumentSampleCtaLabel(document), /официальную форму/);
    assert.match(getGeneratorLead(document), /утверждённый официальный бланк/);
  } else {
    assert.match(getDocumentSampleCtaLabel(document), /результат PDF/);
  }
}
console.log(`Outcome-aware document SEO validated: ${guided.length} non-draft documents.`);
