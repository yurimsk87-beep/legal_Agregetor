import assert from "node:assert/strict";
import { LABOR_ADDITIVE_ROUTES } from "@/data/labor-additive-routes";
import { getAnyLaborRulesByIds } from "@/data/labor-legal-registry";
import { buildLaborDocumentPrompts, validateLaborDocumentModelResult } from "@/lib/labor-document-contract";

let checked = 0;
for (const route of LABOR_ADDITIVE_ROUTES) {
  for (const scenario of route.scenarios) {
    const rules = getAnyLaborRulesByIds(scenario.legalRuleIds ?? []);
    assert.ok(rules.length > 0, `${route.slug}:${scenario.key}: rules required`);
    const prompts = buildLaborDocumentPrompts({
      documentTitle: scenario.resultTitle,
      documentType: scenario.resultType,
      facts: [
        { key: "recipient", label: "Адресат", value: "Генеральному директору ООО «Пример»" },
        { key: "applicant", label: "Заявитель", value: "Иванова Анна Сергеевна" },
        { key: "circumstances", label: "Обстоятельства", value: "Подтвержденные обстоятельства изложены в приложенных документах." }
      ],
      rules,
      authority: scenario.authority,
      nextSteps: scenario.nextSteps
    });
    assert.match(prompts.system, /не включай анкетные формулировки/i);
    assert.match(prompts.system, /не обещай результат/i);

    const rule = rules[0];
    const article = rule.provisions.join(" ").match(/\d+(?:\.\d+)?/)?.[0];
    assert.ok(article, `${rule.id}: article number required for fixture`);
    const result = validateLaborDocumentModelResult({
      documentTitle: scenario.resultTitle,
      draftText: `Генеральному директору ООО «Пример»\nот Ивановой Анны Сергеевны\n\n${scenario.resultTitle.toUpperCase()}\n\nПодтвержденные обстоятельства изложены в приложенных документах. На основании статьи ${article} Трудового кодекса Российской Федерации прошу рассмотреть обращение и предоставить письменный ответ по существу.\n\nПриложения: копии подтверждающих документов.\nДата: [дата]\nПодпись: __________`,
      usedRuleIds: [rule.id],
      placeholders: ["дата"]
    }, { documentTitle: scenario.resultTitle, rules });
    assert.equal(result.documentTitle, scenario.resultTitle);
    assert.doesNotMatch(result.draftText, /(?:^|\n)\s*(?:Вопрос|Ответ|Вы указали)\s*:/i);
    checked += 1;
  }
}

assert.ok(checked >= 25, "all unique additive scenarios must be checked");
console.log(`Labor additive document fixtures validated: ${checked}.`);
