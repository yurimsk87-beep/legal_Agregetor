import assert from "node:assert/strict";
import { legalProblems } from "@/data/legal-problems";
import { buildProblemQuestionContext } from "@/data/related-questions-context";
import { getRelatedQuestions } from "@/lib/related-questions";
import type { Question } from "@/lib/types";

type RouteFixture = {
  text: string;
  expected?: string[];
  forbidden: string[];
};

const fixtures: RouteFixture[] = [
  {
    text: "Как подать на алименты на ребёнка, если отец не платит?",
    expected: ["alimenty-na-rebenka"],
    forbidden: ["soderzhanie-supruga-i-byvshego-supruga", "dopolnitelnye-rashody-na-rebenka"]
  },
  {
    text: "Как взыскать алименты с бывшей жены на своё содержание?",
    expected: ["soderzhanie-supruga-i-byvshego-supruga"],
    forbidden: ["alimenty-na-rebenka"]
  },
  {
    text: "Как установить отцовство через суд и внести сведения об отце?",
    expected: ["ustanovlenie-otcovstva"],
    forbidden: ["osparivanie-otcovstva"]
  },
  {
    text: "Как оспорить запись об отце в свидетельстве о рождении?",
    expected: ["osparivanie-otcovstva"],
    forbidden: ["ustanovlenie-otcovstva"]
  },
  {
    text: "Как лишить отца родительских прав, если он не участвует в жизни ребёнка?",
    expected: ["lishenie-roditelskih-prav"],
    forbidden: ["ogranichenie-roditelskih-prav", "vosstanovlenie-v-roditelskih-pravah", "otmena-ogranicheniya-roditelskih-prav"]
  },
  {
    text: "Как ограничить отца в родительских правах, если ребёнка опасно оставлять с ним?",
    expected: ["ogranichenie-roditelskih-prav"],
    forbidden: ["lishenie-roditelskih-prav", "vosstanovlenie-v-roditelskih-pravah", "otmena-ogranicheniya-roditelskih-prav"]
  },
  {
    text: "Как восстановиться в родительских правах после лишения?",
    expected: ["vosstanovlenie-v-roditelskih-pravah"],
    forbidden: ["lishenie-roditelskih-prav", "ogranichenie-roditelskih-prav", "otmena-ogranicheniya-roditelskih-prav"]
  },
  {
    text: "Как снять ограничение родительских прав и вернуть ребёнка?",
    expected: ["otmena-ogranicheniya-roditelskih-prav"],
    forbidden: ["lishenie-roditelskih-prav", "ogranichenie-roditelskih-prav", "vosstanovlenie-v-roditelskih-pravah"]
  },
  {
    text: "Как оформить опеку над ребёнком у родственника?",
    expected: ["opeka-i-popechitelstvo-nad-rebenkom"],
    forbidden: ["usynovlenie-rebenka"]
  },
  {
    text: "Как оформить опеку над недееспособной матерью?",
    forbidden: ["opeka-i-popechitelstvo-nad-rebenkom"]
  },
  {
    text: "Какие документы нужны, чтобы усыновить ребёнка жены?",
    expected: ["usynovlenie-rebenka"],
    forbidden: ["opeka-i-popechitelstvo-nad-rebenkom"]
  },
  {
    text: "Как отменить усыновление ребёнка?",
    forbidden: ["usynovlenie-rebenka"]
  },
  {
    text: "Отец не даёт матери видеть ребёнка после развода, как изменить порядок общения?",
    expected: ["roditeli-i-rebenok-posle-razvoda"],
    forbidden: ["obshchenie-rodstvennikov-s-rebenkom", "raznoglasiya-roditeley-po-vospitaniyu-i-obrazovaniyu"]
  },
  {
    text: "Как бабушке установить порядок общения с внуком?",
    expected: ["obshchenie-rodstvennikov-s-rebenkom"],
    forbidden: ["roditeli-i-rebenok-posle-razvoda"]
  },
  {
    text: "Может ли мать сменить школу ребёнку без согласия отца?",
    expected: ["raznoglasiya-roditeley-po-vospitaniyu-i-obrazovaniyu"],
    forbidden: ["roditeli-i-rebenok-posle-razvoda"]
  },
  {
    text: "Нужно ли согласие второго родителя, чтобы вывезти ребёнка за границу в отпуск?",
    expected: ["vyezd-rebenka-za-granitsu"],
    forbidden: ["mezhdunarodnye-semeynye-spory"]
  },
  {
    text: "Как признать иностранное решение по семейному делу, если ребёнок находится за границей?",
    expected: ["mezhdunarodnye-semeynye-spory"],
    forbidden: ["vyezd-rebenka-za-granitsu"]
  },
  {
    text: "Как подать на развод через суд, если супруг не согласен?",
    expected: ["razvod-i-razdel-imushchestva"],
    forbidden: ["slozhnye-imushchestvennye-spory-suprugov", "brachnyy-dogovor"]
  },
  {
    text: "Как разделить ипотеку при разводе и общие долги супругов?",
    expected: ["slozhnye-imushchestvennye-spory-suprugov"],
    forbidden: ["razvod-i-razdel-imushchestva", "brachnyy-dogovor"]
  },
  {
    text: "Как составить брачный договор о квартире супругов?",
    expected: ["brachnyy-dogovor"],
    forbidden: ["razvod-i-razdel-imushchestva", "slozhnye-imushchestvennye-spory-suprugov"]
  },
  {
    text: "Как подать заявление в ЗАГС для регистрации брака?",
    expected: ["brak-zags-i-smena-familii"],
    forbidden: ["imya-familiya-otchestvo-rebenka"]
  },
  {
    text: "Как поменять фамилию ребёнку без согласия отца?",
    expected: ["imya-familiya-otchestvo-rebenka"],
    forbidden: ["brak-zags-i-smena-familii", "ustanovlenie-otcovstva"]
  }
];

const contexts = new Map(
  legalProblems.map((problem) => [
    problem.slug,
    buildProblemQuestionContext({
      slug: problem.slug,
      categoryTitle: "Семейное право",
      allowedCategories: ["Семейные дела"],
      primaryTags: problem.relatedQuestionTopics
    })
  ])
);

function makeQuestion(index: number, text: string): Question {
  return {
    id: `fixture-${index}`,
    slug: `fixture-${index}`,
    title: text,
    text,
    category: "Семейные дела",
    status: "PUBLISHED",
    answersCount: 1,
    userName: "Аноним",
    isIndexable: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    answers: []
  };
}

const failures: string[] = [];

for (const [index, fixture] of fixtures.entries()) {
  const candidate = makeQuestion(index, fixture.text);
  for (const route of fixture.expected ?? []) {
    const context = contexts.get(route);
    assert.ok(context, `Не найден Q&A-контекст ожидаемого маршрута ${route}`);
    if (getRelatedQuestions(context, [candidate]).length !== 1) failures.push(`EXPECTED ${route}: ${fixture.text}`);
  }
  for (const route of fixture.forbidden) {
    const context = contexts.get(route);
    assert.ok(context, `Не найден Q&A-контекст запрещённого маршрута ${route}`);
    if (getRelatedQuestions(context, [candidate]).length !== 0) failures.push(`FORBIDDEN ${route}: ${fixture.text}`);
  }
}

assert.deepEqual(failures, [], `Ошибки независимой маршрутной проверки:\n${failures.join("\n")}`);

console.log(`Family Q&A relevance fixtures: ${fixtures.length} independent cases PASS`);
