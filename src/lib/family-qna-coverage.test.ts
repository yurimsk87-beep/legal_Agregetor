import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { legalProblems } from "@/data/legal-problems";
import { buildProblemQuestionContext, PROBLEM_QNA_CONTEXTS } from "@/data/related-questions-context";
import { getRelatedQuestions, scoreQuestion } from "@/lib/related-questions";
import { searchSite } from "@/lib/site-search";
import type { Question } from "@/lib/types";

const additiveSlugs = new Set([
  "alimenty-na-sovershennoletnego-rebenka",
  "prekrashchenie-i-osvobozhdenie-ot-alimentov",
  "alimenty-na-soderzhanie-roditeley",
  "otmena-usynovleniya",
  "dokumenty-o-rozhdenii-i-aktovaya-zapis"
]);
assert.equal(legalProblems.filter((problem) => !additiveSlugs.has(problem.slug)).length, 24, "Набор из 24 базовых семейных маршрутов изменился");
assert.equal(legalProblems.filter((problem) => additiveSlugs.has(problem.slug)).length, 5, "Должно быть пять additive-маршрутов");
assert.deepEqual(
  Object.keys(PROBLEM_QNA_CONTEXTS).sort(),
  legalProblems.map((problem) => problem.slug).sort(),
  "Каждый семейный маршрут должен иметь явный Q&A-контекст"
);

for (const problem of legalProblems) {
  assert.ok(problem.relatedQuestionTopics.length > 0, `${problem.slug}: relatedQuestionTopics не заполнены`);
  const context = buildProblemQuestionContext({
    slug: problem.slug,
    categoryTitle: "Семейное право",
    allowedCategories: ["Семейные дела"],
    primaryTags: problem.relatedQuestionTopics
  });
  assert.ok(context.primaryTags.length > 0, `${problem.slug}: отсутствуют темы и aliases`);
  assert.deepEqual(context.allowedCategories, ["Семейные дела"], `${problem.slug}: отсутствует строгий фильтр категории`);
  assert.equal(new Set(context.primaryTags.map((item) => item.toLowerCase())).size, context.primaryTags.length, `${problem.slug}: дубли тем`);
  const crossCategoryQuestion = {
    id: `cross-category-${problem.slug}`,
    slug: `cross-category-${problem.slug}`,
    title: context.primaryTags[0],
    text: context.primaryTags[0],
    category: "Защита прав потребителя",
    status: "PUBLISHED",
    answersCount: 1
  } as Question;
  assert.deepEqual(
    scoreQuestion(crossCategoryQuestion, context).reasons,
    ["category_not_allowed"],
    `${problem.slug}: вопрос из другой сферы права прошёл фильтр`
  );

  const alias = PROBLEM_QNA_CONTEXTS[problem.slug].aliases[0];
  const expectedHref = `/problems/${problem.categorySlug}/${problem.slug}/`;
  assert.ok(searchSite(alias).some((result) => result.href === expectedHref), `${problem.slug}: бытовой alias не ведёт к маршруту`);
}

const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/problems/[category]/[slug]/page.tsx"), "utf8");
assert.match(pageSource, /FamilyProblemQna questions=\{relatedQuestions\}/, "Общий блок похожих вопросов не подключён");
assert.match(pageSource, />Похожие вопросы</, "Заголовок блока похожих вопросов отсутствует");
assert.match(pageSource, /questions\.length \? \(/, "Пустой блок похожих вопросов не скрывается");

const documentPageSource = fs.readFileSync(path.join(process.cwd(), "src/app/documents/[documentSlug]/page.tsx"), "utf8");
assert.match(documentPageSource, /relatedQuestions\.length \? \(/, "Пустой блок похожих вопросов документа не скрывается");

function question(id: string, text: string): Question {
  return {
    id,
    slug: id,
    title: text,
    text,
    category: "Семейные дела",
    status: "PUBLISHED",
    answersCount: 1
  } as Question;
}

const context = buildProblemQuestionContext({
  slug: "alimenty-na-rebenka",
  categoryTitle: "Семейное право",
  allowedCategories: ["Семейные дела"],
  primaryTags: ["алименты"]
});
const emailQuestion = question("email", "Как взыскать алименты? Напишите на test@example.com");
const phoneQuestion = question("phone", "Не платит алименты, звоните +7 999 123-45-67");
const passportQuestion = question("passport", "Как взыскать алименты? Паспорт 4510 123456");
const addressQuestion = question("address", "Как взыскать алименты? Адрес: улица Тестовая, дом 15");
assert.deepEqual(scoreQuestion(emailQuestion, context).reasons, ["sensitive_personal_data"]);
assert.deepEqual(scoreQuestion(phoneQuestion, context).reasons, ["sensitive_personal_data"]);
assert.deepEqual(scoreQuestion(passportQuestion, context).reasons, ["sensitive_personal_data"]);
assert.deepEqual(scoreQuestion(addressQuestion, context).reasons, ["sensitive_personal_data"]);

const unrelatedCategoryQuestion = {
  ...question("consumer", "Можно ли вернуть деньги за некачественный товар и взыскать алименты?"),
  category: "Защита прав потребителя"
};
assert.deepEqual(scoreQuestion(unrelatedCategoryQuestion, context).reasons, ["category_not_allowed"]);

const ranked = getRelatedQuestions(context, [
  question("same", "Как взыскать алименты на ребёнка?"),
  question("same", "Бывший муж не платит алименты"),
  question("same-title", "Как взыскать задолженность по алиментам?"),
  question("other", "Как взыскать задолженность по алиментам?")
]);
assert.equal(new Set(ranked.map((item) => item.id)).size, ranked.length, "Похожие вопросы не должны повторяться");
assert.equal(
  new Set(ranked.map((item) => item.title.toLowerCase())).size,
  ranked.length,
  "Похожие вопросы с одинаковыми заголовками не должны повторяться"
);

console.log("Family Q&A coverage: 29/29 routes (24 base + 5 additive), aliases/search/block/privacy/duplicates PASS");
