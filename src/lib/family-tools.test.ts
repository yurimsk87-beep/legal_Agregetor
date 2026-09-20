import assert from "node:assert/strict";
import "./legal-review-lawyers.test";
import "./official-service-links.test";
import { calculateAlimonyShare, calculateClaimPrice, calculatePreliminaryAlimonyDebt, calculatePropertyStateDuty, determineAlimonyProcedure } from "./family-tools";
import { calculateFamilyStateDuty } from "./family-state-duty";
import { familyTools } from "@/data/family-tools";

assert.equal(calculatePropertyStateDuty(100_000), 4_000);
assert.equal(calculatePropertyStateDuty(300_000), 10_000);
assert.equal(calculatePropertyStateDuty(1_000_000), 25_000);
assert.equal(calculatePropertyStateDuty(200_000_000), 464_000);
assert.equal(calculatePropertyStateDuty(1_000_000_000), 900_000);
assert.equal(calculatePropertyStateDuty(0), null);

const divorce = calculateFamilyStateDuty("divorce");
assert.equal(divorce?.total, 5_000);
assert.match(divorce?.norm ?? "", /333\.19/);

const propertyAtBand = calculateFamilyStateDuty("property", 750_000);
assert.equal(propertyAtBand?.total, 20_000);
assert.match(propertyAtBand?.formula ?? "", /15 000 ₽ \+ 2%/);
assert.equal(calculateFamilyStateDuty("property", 100_000)?.total, 4_000);
assert.equal(calculateFamilyStateDuty("property", 300_000)?.total, 10_000);
assert.equal(calculateFamilyStateDuty("property", 100_000_000)?.total, 314_000);
assert.equal(calculateFamilyStateDuty("property", 1_000_000_000)?.total, 900_000);
assert.equal(calculateFamilyStateDuty("property", -1), null);

const alimony = calculateFamilyStateDuty("alimony");
assert.equal(alimony?.total, 0);
assert.match(alimony?.benefit ?? "", /освобождён/);
assert.match(alimony?.norm ?? "", /333\.36/);

assert.equal(calculateFamilyStateDuty("non-property")?.total, 3_000);
const mixed = calculateFamilyStateDuty("divorce-property", 500_000);
assert.equal(mixed?.total, 20_000);
assert.equal(mixed?.components.length, 2);
const unknownMixed = calculateFamilyStateDuty("other-mixed");
assert.equal(unknownMixed?.total, null);
assert.equal(unknownMixed?.requiresManualReview, true);

const dutyTool = familyTools.find((tool) => tool.slug === "family-state-duty");
assert.ok(dutyTool?.sources.some((source) => source.sourceType === "primary" && source.url.includes("publication.pravo.gov.ru")));
assert.ok(dutyTool?.sources.some((source) => source.sourceType === "secondary" && source.url.includes("consultant.ru")));
assert.equal(dutyTool?.sources.find((source) => source.url.includes("consultant.ru"))?.sourceType, "secondary");
assert.equal(calculateClaimPrice([100_000, 25_500.5]), 125_500.5);
assert.deepEqual(calculateAlimonyShare(120_000, 1), { share: 0.25, amount: 30_000 });
assert.deepEqual(calculateAlimonyShare(120_000, 2), { share: 1 / 3, amount: 40_000 });
assert.equal(calculatePreliminaryAlimonyDebt(90_000, 25_000), 65_000);
assert.equal(determineAlimonyProcedure({ percentageOnly: true, hasPaternityDispute: false, hasOtherRecipients: false, hasOtherDispute: false }), "order");
assert.equal(determineAlimonyProcedure({ percentageOnly: true, hasPaternityDispute: true, hasOtherRecipients: false, hasOtherDispute: false }), "claim");

console.log("family tools tests passed");
