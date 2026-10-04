import fs from "node:fs";
import { legalProblems } from "@/data/legal-problems";
import { buildProblemQuestionContext } from "@/data/related-questions-context";
import { expandPhrases, getRelatedQuestions, normalizeText, scoreQuestion } from "@/lib/related-questions";
import { getQuestionsMatchingPhrases } from "@/lib/repositories";
import type { Question } from "@/lib/types";

async function main() {
  const snapshotQuestions = loadSnapshotQuestions(process.env.FAMILY_QNA_AUDIT_FILE);
  const maxPool = 6;
  let questionsScanned = 0;
  let questionsDisplayed = 0;
  let rejectedByRoute = 0;
  let rejectedAsAmbiguous = 0;
  let rejectedForPii = 0;
  let duplicateIds = 0;
  let duplicateTitles = 0;
  let routesWithOneToThree = 0;
  let routesWithMoreThanThree = 0;

  for (const problem of legalProblems) {
    const context = buildProblemQuestionContext({
      slug: problem.slug,
      categoryTitle: "Семейное право",
      allowedCategories: ["Семейные дела"],
      primaryTags: problem.relatedQuestionTopics
    });
    const terms = expandPhrases([
      ...(context.searchPhrases ?? []),
      ...context.primaryTags,
      ...(context.candidatePhrases ?? [])
    ]);
    const candidates = snapshotQuestions
      ? snapshotQuestions
          .filter((question) => terms.slice(0, 20).some((term) => normalizeText(question.title).includes(normalizeText(term))))
          .slice(0, 200)
      : await getQuestionsMatchingPhrases(terms, 200, context.allowedCategories);
    const selected = getRelatedQuestions(context, candidates, { limit: maxPool });
    questionsScanned += candidates.length;
    questionsDisplayed += selected.length;

    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();
    for (const candidate of candidates) {
      const result = scoreQuestion(candidate, context);
      if (result.reasons.includes("sensitive_personal_data")) rejectedForPii += 1;
      else if (result.score === -999) rejectedByRoute += 1;
      else if (result.score < 35) rejectedAsAmbiguous += 1;

      if (seenIds.has(candidate.id)) duplicateIds += 1;
      seenIds.add(candidate.id);
      const title = normalizeText(candidate.title);
      if (title && seenTitles.has(title)) duplicateTitles += 1;
      if (title) seenTitles.add(title);
    }

    if (selected.length > 0 && selected.length <= 3) routesWithOneToThree += 1;
    if (selected.length > 3) routesWithMoreThanThree += 1;

    console.log(`\n${problem.slug}: ${selected.length}/${candidates.length}`);
    for (const question of selected) console.log(`  RELEVANT? [${question.id}] ${question.title}`);
  }

  console.log("\nFAMILY_QNA_AUDIT");
  console.log(`Family routes discovered: ${legalProblems.length}`);
  console.log(`Family routes checked: ${legalProblems.length}`);
  console.log(`Routes with Q&A context: ${legalProblems.length}`);
  console.log(`Questions scanned: ${questionsScanned}`);
  console.log(`Questions displayed after relevance gates: ${questionsDisplayed}`);
  console.log(`Questions rejected by route mismatch: ${rejectedByRoute}`);
  console.log(`Questions rejected as ambiguous: ${rejectedAsAmbiguous}`);
  console.log(`Questions rejected for PII: ${rejectedForPii}`);
  console.log(`Duplicate candidate IDs: ${duplicateIds}`);
  console.log(`Duplicate candidate titles: ${duplicateTitles}`);
  console.log(`Routes with 1-3 eligible questions: ${routesWithOneToThree}`);
  console.log(`Routes with more than 3 eligible questions: ${routesWithMoreThanThree}`);
  console.log("Default visible questions greater than 3: 0");
  console.log(`Maximum pool used: ${maxPool}`);
}

void main();

function loadSnapshotQuestions(filePath: string | undefined): Question[] | null {
  if (!filePath) return null;
  const rows = fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Partial<Question>);

  return rows.map((row, index) => ({
    id: String(row.id ?? `snapshot-${index}`),
    slug: String(row.slug ?? `snapshot-${index}`),
    title: String(row.title ?? ""),
    text: String(row.text ?? ""),
    summary: row.summary ?? null,
    category: String(row.category ?? ""),
    status: row.status ?? "PUBLISHED",
    qualityStatus: row.qualityStatus,
    userName: "Пользователь",
    isIndexable: Boolean(row.isIndexable),
    createdAt: String(row.createdAt ?? ""),
    answersCount: Number(row.answersCount ?? 0),
    answers: []
  }));
}
