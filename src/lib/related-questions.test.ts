import assert from "node:assert/strict";
import { buildDocumentQuestionContext, buildProblemQuestionContext } from "../data/related-questions-context";
import { questions as sampleQuestions } from "./sample-data";
import { getRelatedQuestions, scoreQuestion, type RelatedQuestionsContext } from "./related-questions";
import type { Question } from "./types";

function q(overrides: Partial<Question> & { id: string; title: string }): Question {
  return {
    slug: overrides.id,
    text: "",
    userName: "Аноним",
    isIndexable: true,
    createdAt: "2020-01-01T00:00:00.000Z", // old → no freshness bonus, deterministic
    answers: [],
    status: "PUBLISHED",
    ...overrides
  } as Question;
}

const problemContext: RelatedQuestionsContext = {
  contextType: "problem",
  categoryName: "Семья и дети",
  primaryTags: ["взыскать алименты", "судебный приказ на алименты", "алименты без развода"],
  excludedTopics: ["долг по алиментам", "раздел имущества", "порядок общения"]
};

// 1. Primary tag match clears the threshold.
{
  const question = q({ id: "p1", title: "Как взыскать алименты на ребенка через суд", category: "Семья и дети" });
  const { score } = scoreQuestion(question, problemContext);
  assert.ok(score >= 40, `primary match should score >= 40, got ${score}`);
}

// 2. Category-only does NOT clear the threshold.
{
  const question = q({ id: "p2", title: "Вопрос про наследство после смерти отца", category: "Семья и дети" });
  const { score } = scoreQuestion(question, problemContext);
  assert.ok(score < 35, `category-only must stay below threshold, got ${score}`);
}

// 3. Excluded topic kills a question even when a primary tag matches.
{
  const question = q({ id: "p3", title: "Бывший муж не платит алименты, большой долг по алиментам", category: "Семья и дети" });
  const { score, reasons } = scoreQuestion(question, problemContext);
  assert.ok(score < 0, `excluded topic must drive score negative, got ${score}`);
  assert.ok(reasons.some((r) => r.startsWith("excluded_topic_matches")), "should record exclusion reason");
}

// 4. Not-published questions are rejected outright.
{
  const question = q({ id: "p4", title: "Как взыскать алименты", status: "MODERATION" });
  const { score } = scoreQuestion(question, problemContext);
  assert.equal(score, -999, "non-published must be hard-rejected");
}

// 5. Two relevant questions are returned, sorted by score (more matches first).
{
  const single = q({ id: "s1", title: "Как взыскать алименты" });
  const double = q({ id: "s2", title: "Нужен судебный приказ на алименты, можно ли взыскать алименты без развода" });
  const result = getRelatedQuestions(problemContext, [single, double]);
  assert.deepEqual(result.map((r) => r.id), ["s2", "s1"], "more primary matches should rank first");
}

// 6. A single relevant question is preferable to filling the block with noise.
{
  const relevant = q({ id: "h1", title: "Как взыскать алименты" });
  const noise = q({ id: "h2", title: "Как оформить наследство", category: "Семья и дети" });
  const result = getRelatedQuestions(problemContext, [relevant, noise]);
  assert.deepEqual(result.map((item) => item.id), ["h1"], "single relevant question must remain visible");
}

// 7. excludeQuestionIds are never shown.
{
  const a = q({ id: "e1", title: "Как взыскать алименты" });
  const b = q({ id: "e2", title: "Судебный приказ на алименты" });
  const result = getRelatedQuestions({ ...problemContext, excludeQuestionIds: ["e1"] }, [a, b]);
  assert.ok(!result.some((r) => r.id === "e1"), "excluded id must not appear");
}

// 8. Pinned question opens the block even if it alone is below threshold.
{
  const pinned = q({ id: "pin1", title: "Общий вопрос про семейное право", category: "Семья и дети" });
  const result = getRelatedQuestions({ ...problemContext, pinnedQuestionIds: ["pin1"] }, [pinned]);
  assert.deepEqual(result.map((r) => r.id), ["pin1"], "pinned question must force the block open");
}

// 9. Pinned cannot override a hard exclusion.
{
  const pinnedExcluded = q({ id: "pin2", title: "Долг по алиментам и раздел имущества" });
  const result = getRelatedQuestions({ ...problemContext, pinnedQuestionIds: ["pin2"] }, [pinnedExcluded]);
  assert.deepEqual(result, [], "hard-excluded pinned question must not appear");
}

// 10. Document mode applies the stricter threshold but a full primary match passes.
{
  const docContext: RelatedQuestionsContext = {
    contextType: "document",
    primaryTags: ["иск о разводе", "куда подавать иск о разводе", "госпошлина за развод"],
    excludedTopics: ["раздел имущества", "порядок общения"]
  };
  const good = q({ id: "d1", title: "Куда подавать иск о разводе с детьми" });
  const better = q({ id: "d2", title: "Госпошлина за развод и куда подавать иск о разводе" });
  const result = getRelatedQuestions(docContext, [good, better]);
  assert.deepEqual(result.map((r) => r.id), ["d2", "d1"], "document mode should rank and return primary matches");

  const propertyNoise = q({ id: "d3", title: "Как разделить имущество и поделить квартиру при разводе" });
  const filtered = getRelatedQuestions(docContext, [good, better, propertyNoise]);
  assert.ok(!filtered.some((r) => r.id === "d3"), "property question must be excluded on the divorce-claim document");
}

// 11. Candidate-only phrases may widen the DB query but cannot establish relevance.
{
  const context: RelatedQuestionsContext = {
    contextType: "problem",
    primaryTags: ["сменить школу без согласия отца"],
    candidatePhrases: ["сменить школу"],
    requiredTopicGroups: [["без согласия отца", "несогласие родителей"]]
  };
  const noise = q({ id: "c1", title: "Можно ли сменить школу по программе земского учителя?" });
  const relevant = q({ id: "c2", title: "Может ли мать сменить школу ребёнку без согласия отца?" });
  assert.equal(scoreQuestion(noise, context).score, -999, "candidate-only phrase must not make a question relevant");
  assert.ok(scoreQuestion(relevant, context).score >= 35, "required family context must allow the relevant question");
}

// 12. A divorce document must not accept questions that only describe life after divorce.
{
  const context = buildDocumentQuestionContext({
    documentSlug: "isk-o-rastorzhenii-braka",
    relatedPrimaryTags: [],
    relatedExcludedTopics: []
  });
  const benefitNoise = q({ id: "divorce-noise-1", title: "Как оформить пособие после развода" });
  const childNoise = q({ id: "divorce-noise-2", title: "Может ли бывший муж забрать ребёнка после развода" });
  const relevant = q({ id: "divorce-relevant", title: "Как подать на развод через суд, если супруг не согласен" });

  assert.equal(scoreQuestion(benefitNoise, context).score, -999, "post-divorce benefits must be excluded");
  assert.equal(scoreQuestion(childNoise, context).score, -999, "post-divorce child dispute must be excluded");
  assert.ok(scoreQuestion(relevant, context).score >= 40, "court-divorce filing question must remain relevant");
}

// 13. Family pages must reject questions from every non-family category.
{
  const context: RelatedQuestionsContext = {
    ...problemContext,
    allowedCategories: ["Семейные дела"]
  };
  const familyQuestion = q({ id: "family-category", title: "Как взыскать алименты на ребёнка", category: "Семейные дела" });
  const consumerQuestion = q({ id: "consumer-category", title: "Как взыскать алименты при возврате товара", category: "Защита прав потребителя" });

  assert.ok(scoreQuestion(familyQuestion, context).score >= 35, "family-category question must remain eligible");
  assert.deepEqual(scoreQuestion(consumerQuestion, context).reasons, ["category_not_allowed"]);
}

// 14. A family question that merely mentions former spouses is not a divorce/property match.
{
  const context = buildProblemQuestionContext({
    slug: "razvod-i-razdel-imushchestva",
    categoryTitle: "Семейное право",
    allowedCategories: ["Семейные дела"],
    primaryTags: ["развод", "раздел имущества"]
  });
  const alimonyNoise = q({
    id: "divorce-route-noise",
    title: "Должна ли сестра бывшего мужа помогать его ребёнку?",
    text: "Бывшая жена просит родственников помогать деньгами дочери и платить алименты.",
    category: "Семейные дела"
  });
  const divorceQuestion = q({
    id: "divorce-route-relevant",
    title: "Как подать на развод через суд, если супруг не согласен?",
    category: "Семейные дела"
  });

  assert.deepEqual(scoreQuestion(alimonyNoise, context).reasons, ["missing_required_topic_group"]);
  assert.ok(scoreQuestion(divorceQuestion, context).score >= 35, "explicit divorce question must remain eligible");

  const productionSnapshotNoise = sampleQuestions.find((question) => question.slug.startsWith("q-30991-"));
  assert.ok(productionSnapshotNoise, "production snapshot regression question is missing");
  assert.equal(scoreQuestion(productionSnapshotNoise, context).score, -999, "alimony snapshot must not appear on the divorce route");
}

console.log("related-questions.test.ts: all assertions passed");
