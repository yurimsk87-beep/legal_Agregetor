import assert from "node:assert/strict";
import { RELATIVE_CHILD_CONTACT_KEYS, RELATIVE_CHILD_CONTACT_SCENARIOS } from "@/data/relative-child-contact-route";
import { validateRelativeChildContact } from "@/lib/relative-child-contact-validator";
function answers(key: (typeof RELATIVE_CHILD_CONTACT_KEYS)[number]) { return Object.fromEntries(RELATIVE_CHILD_CONTACT_SCENARIOS[key].questions.map((field) => [field.name, field.options?.[0]?.value ?? `Ответ: ${field.label}`])); }
for (const key of RELATIVE_CHILD_CONTACT_KEYS) { const missing = validateRelativeChildContact(key, {}); assert.equal(missing.pdfAvailable, false); assert.equal(missing.filingReady, false); }
const agreement = validateRelativeChildContact("agreement", { ...answers("agreement"), childSafety: "no" }); assert.equal(agreement.allowed, true); assert.equal(agreement.resultKind, "agreement"); assert.match(agreement.draftText, /Проект договорённости/);
const parent = validateRelativeChildContact("agreement", { ...answers("agreement"), relation: "parent", childSafety: "no" }); assert.equal(parent.outcomeKey, "parent-neighbor-route"); assert.equal(parent.pdfAvailable, false);
const other = validateRelativeChildContact("agreement", { ...answers("agreement"), relation: "other", childSafety: "no" }); assert.equal(other.requiresLegalReview, true);
const guardianshipValues = { ...answers("guardianship"), childSafety: "no", region: "region-saint-petersburg", municipality: "spb-gagarinskoe", authorityName: "spb-gagarinskoe-guardianship" };
const guardianship = validateRelativeChildContact("guardianship", guardianshipValues); assert.equal(guardianship.filingReady, true); assert.match(guardianship.draftText, /Отдел опеки и попечительства/);
const unverifiedAuthority = validateRelativeChildContact("guardianship", { ...guardianshipValues, authorityName: "territory-not-found" }); assert.equal(unverifiedAuthority.pdfAvailable, false); assert.equal(unverifiedAuthority.filingReady, false);
const prematureCourt = validateRelativeChildContact("court", { ...answers("court"), guardianshipOrder: "no", childSafety: "no" }); assert.equal(prematureCourt.pdfAvailable, false);
const court = validateRelativeChildContact("court", { ...answers("court"), guardianshipOrder: "yes", childSafety: "no" }); assert.equal(court.resultKind, "courtDraft"); assert.equal(court.filingReady, false); assert.equal(court.requiresLegalReview, true);
const urgent = validateRelativeChildContact("agreement", { ...answers("agreement"), childSafety: "yes" }); assert.equal(urgent.outcomeKey, "urgent-child-safety"); assert.equal(urgent.pdfAvailable, false);
console.log("relative child contact validation tests passed");
