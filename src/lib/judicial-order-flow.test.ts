import assert from "node:assert/strict";
import { getJudicialOrderProblemHref, isJudicialOrderDebtQuery, judicialOrderDebtRoute } from "@/lib/judicial-order-flow";

assert.equal(isJudicialOrderDebtQuery("Пришел судебный приказ по долгу"), true);
assert.equal(isJudicialOrderDebtQuery("судебный приказ банк кредит"), true);
assert.equal(getJudicialOrderProblemHref("Пришёл судебный приказ по долгу"), judicialOrderDebtRoute.canonicalUrl);
assert.equal(getJudicialOrderProblemHref("не платит алименты"), null);

console.log("judicial-order-flow tests passed");
