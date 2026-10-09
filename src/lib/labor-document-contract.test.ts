import assert from "node:assert/strict";
import { getLaborRulesForArea } from "@/data/labor-legal-sources";
import { getLaborDocumentScenario, LABOR_DOCUMENTS } from "@/data/labor-documents";
import { LABOR_ROUTES } from "@/data/labor-routes";
import { buildLaborDocumentExportText } from "@/lib/labor-document-export";
import { validateLaborDocumentModelResult } from "@/lib/labor-document-contract";

const laborScenarios = LABOR_ROUTES.flatMap((route) => route.scenarios);
assert.equal(laborScenarios.length, 50);
assert.equal(laborScenarios.filter((scenario) => !scenario.documentSlug).length, 0);
assert.equal(LABOR_DOCUMENTS.length, laborScenarios.length);
assert.equal(new Set(LABOR_DOCUMENTS.map((document) => document.slug)).size, laborScenarios.length);
for (const scenario of laborScenarios) {
  assert.ok(scenario.documentSlug && getLaborDocumentScenario(scenario.documentSlug));
}

for (const document of LABOR_DOCUMENTS) {
  const configured = getLaborDocumentScenario(document.slug);
  assert.ok(configured);
  const configuredRules = getLaborRulesForArea(configured.route.areaId);
  assert.ok(configuredRules.length > 0);
  const configuredRule = configuredRules[0];
  const article = configuredRule.provisions.join(" ").match(/\d+(?:\.\d+)?/)?.[0];
  assert.ok(article);
  const checked = validateLaborDocumentModelResult({
    documentTitle: configured.scenario.resultTitle,
    draftText: `Работодателю ООО «Пример»\nот Иванова Ивана Ивановича\n\n${configured.scenario.resultTitle.toUpperCase()}\n\nПодтвержденные обстоятельства изложены заявителем. На основании статьи ${article} Трудового кодекса Российской Федерации прошу рассмотреть обращение и предоставить письменный ответ.\n\nПриложения: подтверждающие документы.\nДата: 07.10.2026\nПодпись: __________`,
    usedRuleIds: [configuredRule.id],
    placeholders: []
  }, { documentTitle: configured.scenario.resultTitle, rules: configuredRules });
  assert.equal(checked.documentTitle, configured.scenario.resultTitle);
}

const selected = getLaborDocumentScenario("trebovanie-o-vyplate-zarplaty");
assert.ok(selected);
const rules = getLaborRulesForArea(selected.route.areaId);
const rule = rules.find((item) => item.provisions.some((provision) => provision.includes("236"))) ?? rules[0];
const valid = validateLaborDocumentModelResult({
  documentTitle: selected.scenario.resultTitle,
  draftText: `Работодателю ООО «Пример»\nот Иванова Ивана Ивановича\n\n${selected.scenario.resultTitle.toUpperCase()}\n\nЗаработная плата за подтвержденный период не выплачена. На основании статьи ${rule.provisions.join(" ").match(/\d+(?:\.\d+)?/)?.[0]} Трудового кодекса Российской Федерации прошу выплатить подтвержденную задолженность.\n\nПриложения: расчетный листок.\nДата: 05.10.2026\nПодпись: __________`,
  usedRuleIds: [rule.id],
  placeholders: []
}, { documentTitle: selected.scenario.resultTitle, rules });
assert.equal(valid.usedRuleIds[0], rule.id);

const localizedKeys = validateLaborDocumentModelResult({
  название: valid.documentTitle,
  текст: valid.draftText,
  использованные_правовые_основания: valid.usedRuleIds,
  placeholders: []
}, { documentTitle: selected.scenario.resultTitle, rules });
assert.equal(localizedKeys.documentTitle, valid.documentTitle);
assert.deepEqual(localizedKeys.usedRuleIds, valid.usedRuleIds);

assert.throws(() => validateLaborDocumentModelResult({ ...valid, draftText: `${valid.draftText}\nСтатья 999 ТК РФ.` }, { documentTitle: selected.scenario.resultTitle, rules }), /неподтвержденная статья/);
assert.throws(() => validateLaborDocumentModelResult({ ...valid, draftText: `${valid.draftText}\nОтвет: да.` }, { documentTitle: selected.scenario.resultTitle, rules }), /анкетный текст/);
assert.throws(() => validateLaborDocumentModelResult({ ...valid, draftText: `${valid.draftText}\nТекст создан моделью.` }, { documentTitle: selected.scenario.resultTitle, rules }), /технический текст/);

const exportText = buildLaborDocumentExportText({ statusLabel: "ПРОЕКТ — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", documentTitle: valid.documentTitle, documentText: valid.draftText, rules: [rule], nextSteps: selected.scenario.nextSteps, reviewedAt: rule.reviewedAt });
assert.match(exportText, new RegExp(valid.documentTitle));
assert.match(exportText, /Правовые основания/);
assert.match(exportText, /Что делать дальше/);

console.log("Labor document contract and export parity validated.");
