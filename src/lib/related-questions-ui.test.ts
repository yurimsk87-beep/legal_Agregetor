import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getRelatedQuestionsViewState } from "@/components/questions/QuestionsList";

const one = getRelatedQuestionsViewState(1, 3);
assert.deepEqual(one, { visibleCount: 1, remaining: 0, canShowMore: false, nextVisibleCount: 1 });

const three = getRelatedQuestionsViewState(3, 3);
assert.deepEqual(three, { visibleCount: 3, remaining: 0, canShowMore: false, nextVisibleCount: 3 });

const fourInitial = getRelatedQuestionsViewState(4, 3);
assert.deepEqual(fourInitial, { visibleCount: 3, remaining: 1, canShowMore: true, nextVisibleCount: 4 });
assert.equal(getRelatedQuestionsViewState(4, fourInitial.nextVisibleCount).canShowMore, false);

const sixInitial = getRelatedQuestionsViewState(6, 3);
assert.equal(sixInitial.visibleCount, 3);
assert.equal(sixInitial.nextVisibleCount, 6);
assert.equal(getRelatedQuestionsViewState(6, sixInitial.nextVisibleCount).canShowMore, false);

const sevenInitial = getRelatedQuestionsViewState(7, 3);
const sevenAfterFirstClick = getRelatedQuestionsViewState(7, sevenInitial.nextVisibleCount);
const sevenAfterSecondClick = getRelatedQuestionsViewState(7, sevenAfterFirstClick.nextVisibleCount);
assert.deepEqual(
  [sevenInitial.visibleCount, sevenAfterFirstClick.visibleCount, sevenAfterSecondClick.visibleCount],
  [3, 6, 7],
  "Каждое раскрытие должно добавлять не более трёх вопросов"
);
assert.equal(sevenAfterFirstClick.canShowMore, true);
assert.equal(sevenAfterSecondClick.canShowMore, false);

const source = fs.readFileSync(path.join(process.cwd(), "src/components/questions/QuestionsList.tsx"), "utf8");
assert.match(source, /<button[\s\S]*?type="button"[\s\S]*?>\s*Показать ещё\s*<\/button>/, "Нужна доступная нативная кнопка с пользовательской подписью");
assert.match(source, /min-h-11 w-full[\s\S]*sm:w-auto/, "Кнопка должна иметь удобную область нажатия и не переполнять мобильный экран");

console.log("Related questions UI: 1/3/4/6/7+ visibility and accessibility PASS");
