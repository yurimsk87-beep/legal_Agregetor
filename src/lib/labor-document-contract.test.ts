import assert from "node:assert/strict";
import { getLaborRulesForArea } from "@/data/labor-legal-sources";
import { getLaborDocumentScenario, LABOR_DOCUMENTS } from "@/data/labor-documents";
import { buildLaborDocumentExportText } from "@/lib/labor-document-export";
import { validateLaborDocumentModelResult } from "@/lib/labor-document-contract";

assert.equal(LABOR_DOCUMENTS.length, 28);
assert.equal(new Set(LABOR_DOCUMENTS.map((document) => document.slug)).size, 28);

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

assert.throws(() => validateLaborDocumentModelResult({ ...valid, draftText: `${valid.draftText}\nСтатья 999 ТК РФ.` }, { documentTitle: selected.scenario.resultTitle, rules }), /неподтвержденная статья/);
assert.throws(() => validateLaborDocumentModelResult({ ...valid, draftText: `${valid.draftText}\nОтвет: да.` }, { documentTitle: selected.scenario.resultTitle, rules }), /анкетный текст/);
assert.throws(() => validateLaborDocumentModelResult({ ...valid, draftText: `${valid.draftText}\nТекст создан моделью.` }, { documentTitle: selected.scenario.resultTitle, rules }), /технический текст/);

const exportText = buildLaborDocumentExportText({ statusLabel: "ПРОЕКТ — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", documentTitle: valid.documentTitle, documentText: valid.draftText, rules: [rule], nextSteps: selected.scenario.nextSteps, reviewedAt: rule.reviewedAt });
assert.match(exportText, new RegExp(valid.documentTitle));
assert.match(exportText, /Правовые основания/);
assert.match(exportText, /Что делать дальше/);

console.log("Labor document contract and export parity validated.");
