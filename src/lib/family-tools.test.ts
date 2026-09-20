import assert from "node:assert/strict";
import { calculateAlimonyShare, calculateClaimPrice, calculatePreliminaryAlimonyDebt, calculatePropertyStateDuty, determineAlimonyProcedure } from "./family-tools";

assert.equal(calculatePropertyStateDuty(100_000), 4_000);
assert.equal(calculatePropertyStateDuty(300_000), 10_000);
assert.equal(calculatePropertyStateDuty(1_000_000), 25_000);
assert.equal(calculatePropertyStateDuty(200_000_000), 464_000);
assert.equal(calculateClaimPrice([100_000, 25_500.5]), 125_500.5);
assert.deepEqual(calculateAlimonyShare(120_000, 1), { share: 0.25, amount: 30_000 });
assert.deepEqual(calculateAlimonyShare(120_000, 2), { share: 1 / 3, amount: 40_000 });
assert.equal(calculatePreliminaryAlimonyDebt(90_000, 25_000), 65_000);
assert.equal(determineAlimonyProcedure({ percentageOnly: true, hasPaternityDispute: false, hasOtherRecipients: false, hasOtherDispute: false }), "order");
assert.equal(determineAlimonyProcedure({ percentageOnly: true, hasPaternityDispute: true, hasOtherRecipients: false, hasOtherDispute: false }), "claim");

console.log("family tools tests passed");
