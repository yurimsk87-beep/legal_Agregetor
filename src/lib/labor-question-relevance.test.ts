import assert from "node:assert/strict";
import { isSafeLaborQuestionForRoute } from "@/lib/labor-question-relevance";
import type { Question } from "@/lib/types";

function question(title: string, overrides: Partial<Question> = {}): Question {
  return {
    id: title,
    slug: title,
    title,
    text: "",
    userName: "Аноним",
    createdAt: "2026-01-01T00:00:00.000Z",
    answers: [],
    status: "PUBLISHED",
    isIndexable: true,
    category: "Трудовое право",
    service: { id: "labor", name: "Трудовое право", slug: "trudovoe-pravo", shortDescription: "", fullDescription: "", isActive: true },
    ...overrides
  } as Question;
}

const wageTopics = ["задержка заработной платы", "невыплата зарплаты", "удержание из зарплаты"];
const wageExclusions = ["расчет при увольнении", "компенсация отпуска при увольнении"];

assert.equal(isSafeLaborQuestionForRoute(question("Работодатель задерживает заработную плату два месяца"), wageTopics, wageExclusions), true);
assert.equal(isSafeLaborQuestionForRoute(question("Не выплатили окончательный расчет при увольнении"), wageTopics, wageExclusions), false);
assert.equal(isSafeLaborQuestionForRoute(question("Как вернуть деньги за товар", { category: "Защита прав потребителей", service: { id: "consumer", name: "Защита прав потребителей", slug: "zashchita-prav-potrebiteley", shortDescription: "", fullDescription: "", isActive: true } }), wageTopics, wageExclusions), false);
assert.equal(isSafeLaborQuestionForRoute(question("Не выплатили зарплату, напишите на worker@example.com"), wageTopics, wageExclusions), false);
assert.equal(isSafeLaborQuestionForRoute(question("Не выплатили зарплату, телефон +7 999 123-45-67"), wageTopics, wageExclusions), false);

console.log("Labor Q&A relevance fixtures validated.");
