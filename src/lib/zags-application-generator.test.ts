import assert from "node:assert/strict";
import {
  getZagsScenario,
  ZAGS_SCENARIO_CHOICES,
  ZAGS_SCENARIO_KEYS,
  ZAGS_SCENARIOS
} from "../data/zags-route";

assert.deepEqual(
  ZAGS_SCENARIO_KEYS,
  ["marriage", "name-change", "repeat-document", "record-correction"],
  "the route must expose exactly four supported scenarios"
);
assert.equal(ZAGS_SCENARIO_CHOICES.length, 4, "the initial screen must contain four choices");
assert.equal(getZagsScenario("zags-refusal"), null, "refusal must not become a fifth base scenario");
assert.equal(getZagsScenario("unknown"), null, "unknown variants must not select a scenario");

const marriage = ZAGS_SCENARIOS.marriage;
assert.deepEqual(marriage.forms.map((form) => form.number), ["7", "8"]);
assert.match(marriage.mainDocument, /только/i, "form 8 limitation must be explicit");
assert.match(marriage.warning ?? "", /подпись/i, "signature authentication must be explained");
assert.match(marriage.term, /12 месяцев/);
assert.match(marriage.fee, /350 руб/);

const nameChange = ZAGS_SCENARIOS["name-change"];
assert.deepEqual(nameChange.forms.map((form) => form.number), ["20"]);
assert.match(nameChange.warning ?? "", /младше 14 лет/);
assert.match(nameChange.filing, /лично в письменной форме/);
assert.doesNotMatch(nameChange.filing, /МФЦ|электрон/i, "unverified filing methods must not be suggested");
assert.match(nameChange.term, /не более чем на два месяца/);
assert.match(nameChange.fee, /5000 руб/);

const repeatDocument = ZAGS_SCENARIOS["repeat-document"];
assert.deepEqual(repeatDocument.forms.map((form) => form.number), ["26"]);
assert.match(repeatDocument.mainDocument, /только/i, "form 26 must not be presented as universal");
assert.match(repeatDocument.description.join(" "), /расторгнувшему брак.*не выдаётся/i);
assert.match(repeatDocument.fee, /500 руб/);
assert.match(repeatDocument.fee, /350 руб/);

const correction = ZAGS_SCENARIOS["record-correction"];
assert.deepEqual(correction.forms.map((form) => form.number), ["23"]);
assert.match(correction.description.join(" "), /отсутствии спора/);
assert.match(correction.warning ?? "", /решение суда/);
assert.match(correction.fee, /700 руб/);
assert.match(correction.fee, /не уплачивается/);
assert.match(correction.term, /не более чем на два месяца/);

for (const scenario of Object.values(ZAGS_SCENARIOS)) {
  assert.ok(scenario.steps.length >= 3 && scenario.steps.length <= 5, `${scenario.key}: use 3-5 steps`);
  assert.ok(scenario.documents.length > 0, `${scenario.key}: documents are required`);
  assert.ok(scenario.helperFields.some((field) => field.required), `${scenario.key}: helper needs required fields`);
  assert.ok(scenario.legalSources.some((source) => source.href.includes("publication.pravo.gov.ru")), `${scenario.key}: official order source is required`);
  assert.ok(scenario.legalSources.every((source) => source.href.startsWith("https://")), `${scenario.key}: all sources must use HTTPS`);
}

console.log("zags-application-generator.test.ts: all assertions passed");
