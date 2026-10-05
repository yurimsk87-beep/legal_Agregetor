import assert from "node:assert/strict";
import { COURT_FEE_AMENDMENT_SOURCE } from "@/data/family-legal-sources";

assert.equal(COURT_FEE_AMENDMENT_SOURCE.sourceType, "primary");
assert.match(COURT_FEE_AMENDMENT_SOURCE.norm, /259-ФЗ/);
assert.equal(COURT_FEE_AMENDMENT_SOURCE.url, "https://publication.pravo.gov.ru/document/0001202408080089");
assert.doesNotMatch(COURT_FEE_AMENDMENT_SOURCE.norm, /176-ФЗ/);

console.log("family legal source tests passed");
