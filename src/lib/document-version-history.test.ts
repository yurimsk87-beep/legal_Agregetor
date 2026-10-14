import assert from "node:assert/strict";
import {
  addDocumentVersion,
  MAX_OPEN_TAB_DOCUMENT_VERSIONS
} from "@/lib/document-version-history";
import { createFamilyAIDraftDocumentResult } from "@/lib/document-result-contract";

const make = (index: number) => createFamilyAIDraftDocumentResult({
  routeSlug: "roditeli-i-rebenok-posle-razvoda",
  scenarioKey: "residence",
  documentSlug: "mesto-zhitelstva-rebenka-posle-razvoda",
  documentTitle: "Проект по семейному делу",
  documentText: `Сведения пользователя ${index}.`,
  usedRuleIds: [],
  placeholders: [],
  legalReviewedAt: "2026-10-09"
});

let history: Array<{ documentResult: ReturnType<typeof make>; payload: { text: string } }> = [];
for (let i = 0; i < MAX_OPEN_TAB_DOCUMENT_VERSIONS + 3; i++) {
  const result = make(i);
  history = addDocumentVersion(history, { documentResult: result, payload: { text: result.documentText } });
}
assert.equal(history.length, MAX_OPEN_TAB_DOCUMENT_VERSIONS);
assert.equal(history[0].payload.text, `Сведения пользователя ${MAX_OPEN_TAB_DOCUMENT_VERSIONS + 2}.`);
assert.equal(history.at(-1)?.payload.text, "Сведения пользователя 3.");
const same = addDocumentVersion(history, history[3]);
assert.equal(same.length, history.length, "reopening a prior snapshot must not duplicate its UUID");
assert.equal(same[0].documentResult.versionId, history[3].documentResult.versionId);
assert.equal(same[0].payload.text, history[3].payload.text);
assert.equal(new Set(same.map((item) => item.documentResult.versionId)).size, same.length);
console.log("In-tab document version history validated without persistent PII storage.");
