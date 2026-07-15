import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, copyFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { analyzeLawyerAnswerQuality } from "../src/lib/answer-quality";
import {
  buildEnrichedQuestion,
  classifyQuestion,
  generatePreliminaryAnswer,
  legalScenarios,
  matchScenario,
  selectClarificationQuestions
} from "../src/lib/question-wizard-engine";
import type { Service } from "../src/lib/types";

type FixtureRow = {
  rowNumber: number;
  rawCategory: string;
  rawTitle: string;
  rawQuestion: string;
  lawyerAnswer: string;
};

type PipelineCase = FixtureRow & {
  scenarioId: string;
  scenarioTitle: string;
  matchedScenarioId: string;
  legalStage: string;
  urgency: string;
  riskLevel: string;
  clarificationQuestionCount: number;
  enrichedTitle: string;
  enrichedTextLength: number;
  preliminaryAnswerStatus: string;
  preliminaryAnswerLength: number;
  answerQuality: ReturnType<typeof analyzeLawyerAnswerQuality> | null;
};

const root = process.cwd();
const defaultInput = join(root, "pravoved_parser", "outputs", "pravoved_100_questions.xlsx");
const defaultOutputDir = join(root, "pravoved_parser", "outputs", "qna_fixture_report");
const generalScenarioId = "general_legal_question";

assertDevelopmentOnly();

const args = parseArgs(process.argv.slice(2));
const inputPath = resolve(args.input ?? defaultInput);
const outputDir = resolve(args.outputDir ?? defaultOutputDir);

if (!existsSync(inputPath)) {
  throw new Error(`Fixture file not found: ${inputPath}`);
}

const fixtureRows = readFixtureRows(inputPath);
const cases = fixtureRows.map(runPipeline);
const report = buildReport(inputPath, cases);

mkdirSync(outputDir, { recursive: true });
const jsonPath = join(outputDir, "pravoved_qna_fixture_report.json");
const markdownPath = join(outputDir, "pravoved_qna_fixture_report.md");
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(markdownPath, renderMarkdownReport(report), "utf8");

console.log(`Pravoved Q&A fixture report created.`);
console.log(`Rows: ${report.summary.totalRows}`);
console.log(`With lawyer answers: ${report.summary.rowsWithLawyerAnswer}`);
console.log(`Generic lead bait answers: ${report.summary.genericLeadBaitAnswers}`);
console.log(`Contact attempt answers: ${report.summary.contactAttemptAnswers}`);
console.log(`Useful answers: ${report.summary.usefulAnswers}`);
console.log(`Markdown: ${markdownPath}`);
console.log(`JSON: ${jsonPath}`);

function assertDevelopmentOnly() {
  const env = process.env.NODE_ENV;
  if (env === "production" || process.env.NEXT_PHASE === "phase-production-build" || process.env.VERCEL === "1") {
    throw new Error("Pravoved Q&A fixture pipeline is development-only and must not run in production.");
  }
}

function parseArgs(argv: string[]) {
  const parsed: { input?: string; outputDir?: string } = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--input" && next) {
      parsed.input = next;
      i += 1;
    } else if (arg === "--output-dir" && next) {
      parsed.outputDir = next;
      i += 1;
    }
  }
  return parsed;
}

function readFixtureRows(inputPath: string): FixtureRow[] {
  const rows = readXlsxRows(inputPath);
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  const categoryIndex = findColumn(headers, ["категориявопроса", "категория", "rawcategory"]);
  const titleIndex = findColumn(headers, ["заголовоквопроса", "заголовок", "rawtitle"]);
  const questionIndex = findColumn(headers, ["вопрос", "текствопроса", "rawquestion"]);
  const answerIndex = findColumn(headers, ["ответюриста", "ответ", "lawyeranswer"]);

  for (const [name, index] of Object.entries({ rawCategory: categoryIndex, rawTitle: titleIndex, rawQuestion: questionIndex })) {
    if (index < 0) throw new Error(`Required fixture column not found: ${name}`);
  }

  return rows
    .slice(1)
    .map((row, index) => ({
      rowNumber: index + 2,
      rawCategory: valueAt(row, categoryIndex),
      rawTitle: valueAt(row, titleIndex),
      rawQuestion: valueAt(row, questionIndex),
      lawyerAnswer: answerIndex >= 0 ? valueAt(row, answerIndex) : ""
    }))
    .filter((row) => row.rawTitle || row.rawQuestion);
}

function runPipeline(row: FixtureRow): PipelineCase {
  const questionText = [row.rawTitle, row.rawQuestion].filter(Boolean).join("\n");
  const service = serviceFromCategory(row.rawCategory);
  const classification = classifyQuestion({ text: questionText, service });
  const matchedScenario = matchScenario(questionText, service);
  const clarificationQuestions = selectClarificationQuestions(classification);
  const enrichedQuestion = buildEnrichedQuestion({
    rawText: row.rawQuestion || row.rawTitle,
    city: null,
    service,
    classification,
    answers: {}
  });
  const preliminaryAnswer = generatePreliminaryAnswer({ enrichedQuestion, classification });
  const answerQuality = row.lawyerAnswer ? analyzeLawyerAnswerQuality(row.lawyerAnswer) : null;

  return {
    ...row,
    scenarioId: classification.scenario.scenarioId,
    scenarioTitle: classification.scenario.title,
    matchedScenarioId: matchedScenario.scenarioId,
    legalStage: classification.legalStage,
    urgency: classification.urgency,
    riskLevel: classification.riskLevel,
    clarificationQuestionCount: clarificationQuestions.length,
    enrichedTitle: enrichedQuestion.title,
    enrichedTextLength: enrichedQuestion.text.length,
    preliminaryAnswerStatus: preliminaryAnswer.status,
    preliminaryAnswerLength: preliminaryAnswer.text.length,
    answerQuality
  };
}

function buildReport(inputPath: string, cases: PipelineCase[]) {
  const rowsWithLawyerAnswer = cases.filter((item) => item.lawyerAnswer.trim()).length;
  const genericLeadBait = cases.filter((item) => item.answerQuality?.containsGenericLeadBait);
  const contactAttempts = cases.filter((item) => item.answerQuality?.containsContactAttempt);
  const usefulAnswers = cases.filter(isUsefulAnswer);
  const categories = groupBy(cases, (item) => item.rawCategory || "Без категории");
  const scenarios = groupBy(cases, (item) => item.scenarioId);
  const uncoveredScenarioIds = legalScenarios
    .filter((scenario) => scenario.scenarioId !== generalScenarioId)
    .filter((scenario) => !scenarios.has(scenario.scenarioId))
    .map((scenario) => ({
      scenarioId: scenario.scenarioId,
      title: scenario.title,
      serviceSlug: scenario.serviceSlug ?? null
    }));
  const generalCases = cases.filter((item) => item.scenarioId === generalScenarioId);
  const needsLegalScenario = summarizeNeedsLegalScenario(generalCases);

  return {
    generatedAt: new Date().toISOString(),
    developmentOnly: true,
    sourceFile: inputPath,
    summary: {
      totalRows: cases.length,
      rowsWithLawyerAnswer,
      rowsWithoutLawyerAnswer: cases.length - rowsWithLawyerAnswer,
      recognizedCategories: categories.size,
      recognizedScenarios: scenarios.size,
      genericLeadBaitAnswers: genericLeadBait.length,
      contactAttemptAnswers: contactAttempts.length,
      usefulAnswers: usefulAnswers.length,
      generalScenarioRows: generalCases.length
    },
    categoriesRecognized: Array.from(categories.entries())
      .map(([category, items]) => ({
        category,
        count: items.length,
        scenarioBreakdown: countBy(items, (item) => item.scenarioId),
        riskBreakdown: countBy(items, (item) => item.riskLevel)
      }))
      .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category)),
    scenarioCoverage: Array.from(scenarios.entries())
      .map(([scenarioId, items]) => ({
        scenarioId,
        title: items[0]?.scenarioTitle ?? scenarioId,
        count: items.length,
        categoryBreakdown: countBy(items, (item) => item.rawCategory || "Без категории")
      }))
      .sort((a, b) => b.count - a.count || a.scenarioId.localeCompare(b.scenarioId)),
    uncoveredScenarioIds,
    needsLegalScenario,
    answerQuality: {
      genericLeadBait: summarizeAnswerList(genericLeadBait),
      contactAttempts: summarizeAnswerList(contactAttempts),
      useful: summarizeAnswerList(usefulAnswers)
    },
    cases: cases.map((item) => ({
      rowNumber: item.rowNumber,
      rawCategory: item.rawCategory,
      rawTitle: item.rawTitle,
      scenarioId: item.scenarioId,
      legalStage: item.legalStage,
      urgency: item.urgency,
      riskLevel: item.riskLevel,
      clarificationQuestionCount: item.clarificationQuestionCount,
      enrichedTextLength: item.enrichedTextLength,
      preliminaryAnswerStatus: item.preliminaryAnswerStatus,
      answerQuality: item.answerQuality
    }))
  };
}

function isUsefulAnswer(item: PipelineCase) {
  return Boolean(
    item.answerQuality &&
      item.answerQuality.score >= 60 &&
      item.answerQuality.reviewStatus === "APPROVED" &&
      !item.answerQuality.containsContactAttempt &&
      !item.answerQuality.containsGenericLeadBait &&
      !item.answerQuality.containsFearPressure
  );
}

function summarizeNeedsLegalScenario(items: PipelineCase[]) {
  return Array.from(groupBy(items, (item) => item.rawCategory || "Без категории").entries())
    .map(([category, categoryItems]) => ({
      category,
      count: categoryItems.length,
      examples: categoryItems.slice(0, 5).map((item) => ({
        rowNumber: item.rowNumber,
        title: item.rawTitle,
        excerpt: excerpt(item.rawQuestion, 180)
      }))
    }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
}

function summarizeAnswerList(items: PipelineCase[]) {
  return items.slice(0, 50).map((item) => ({
    rowNumber: item.rowNumber,
    category: item.rawCategory,
    title: item.rawTitle,
    score: item.answerQuality?.score ?? 0,
    reviewStatus: item.answerQuality?.reviewStatus ?? null,
    reviewReason: item.answerQuality?.reviewReason ?? null,
    answerExcerpt: excerpt(item.lawyerAnswer, 240)
  }));
}

function renderMarkdownReport(report: ReturnType<typeof buildReport>) {
  const lines = [
    "# Pravoved Q&A fixture enrichment report",
    "",
    "> Development-only report. This fixture must not be imported or exposed in production.",
    "",
    `Source: ${report.sourceFile}`,
    `Generated at: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Rows: ${report.summary.totalRows}`,
    `- Rows with lawyer answer: ${report.summary.rowsWithLawyerAnswer}`,
    `- Recognized categories: ${report.summary.recognizedCategories}`,
    `- Recognized scenarios: ${report.summary.recognizedScenarios}`,
    `- General scenario rows: ${report.summary.generalScenarioRows}`,
    `- Generic lead bait answers: ${report.summary.genericLeadBaitAnswers}`,
    `- Contact attempt answers: ${report.summary.contactAttemptAnswers}`,
    `- Useful answers: ${report.summary.usefulAnswers}`,
    "",
    "## Categories recognized",
    "",
    "| Category | Count | Scenario breakdown | Risk breakdown |",
    "|---|---:|---|---|",
    ...report.categoriesRecognized.map(
      (item) =>
        `| ${escapeMd(item.category)} | ${item.count} | ${escapeMd(formatBreakdown(item.scenarioBreakdown))} | ${escapeMd(formatBreakdown(item.riskBreakdown))} |`
    ),
    "",
    "## Scenario coverage",
    "",
    "| Scenario | Title | Count | Top categories |",
    "|---|---|---:|---|",
    ...report.scenarioCoverage.map(
      (item) =>
        `| ${escapeMd(item.scenarioId)} | ${escapeMd(item.title)} | ${item.count} | ${escapeMd(formatBreakdown(item.categoryBreakdown))} |`
    ),
    "",
    "## Scenarios not covered by fixture",
    "",
    report.uncoveredScenarioIds.length ? "| Scenario | Title | Service slug |\n|---|---|---|" : "All non-general LegalScenario items were hit by this fixture.",
    ...report.uncoveredScenarioIds.map((item) => `| ${escapeMd(item.scenarioId)} | ${escapeMd(item.title)} | ${escapeMd(item.serviceSlug ?? "")} |`),
    "",
    "## Where LegalScenario coverage is missing",
    "",
    report.needsLegalScenario.length ? "| Category | Count | Example rows |\n|---|---:|---|" : "No general-scenario rows found.",
    ...report.needsLegalScenario.map(
      (item) =>
        `| ${escapeMd(item.category)} | ${item.count} | ${escapeMd(item.examples.map((example) => `#${example.rowNumber}: ${example.title}`).join("; "))} |`
    ),
    "",
    "## Generic lead bait answers",
    "",
    renderAnswerTable(report.answerQuality.genericLeadBait),
    "",
    "## Contact attempt answers",
    "",
    renderAnswerTable(report.answerQuality.contactAttempts),
    "",
    "## Useful answers",
    "",
    renderAnswerTable(report.answerQuality.useful)
  ];

  return `${lines.join("\n")}\n`;
}

function renderAnswerTable(items: ReturnType<typeof summarizeAnswerList>) {
  if (!items.length) return "None found.";
  return [
    "| Row | Category | Score | Status | Reason | Title |",
    "|---:|---|---:|---|---|---|",
    ...items.map(
      (item) =>
        `| ${item.rowNumber} | ${escapeMd(item.category)} | ${item.score} | ${escapeMd(item.reviewStatus ?? "")} | ${escapeMd(item.reviewReason ?? "")} | ${escapeMd(item.title)} |`
    )
  ].join("\n");
}

function serviceFromCategory(rawCategory: string): Service {
  const normalized = rawCategory.toLowerCase();
  const slug =
    /наслед/i.test(normalized)
      ? "nasledstvo"
      : /семейн|алимент|дет/i.test(normalized)
        ? "alimenty"
        : /жилищ|недвиж|земел|собствен|коммун/i.test(normalized)
          ? "zhilishchnye-spory"
          : /кредит|долг|банкрот|пристав|исполнитель/i.test(normalized)
            ? "kredity-i-dolgi"
            : slugify(rawCategory || "pravoved-category");

  return {
    id: `fixture-${slug}`,
    name: rawCategory || "Правовой вопрос",
    slug,
    shortDescription: "Dev fixture service",
    fullDescription: "Development-only Pravoved fixture service",
    isActive: true,
    parentId: null
  };
}

function readXlsxRows(inputPath: string) {
  const tempRoot = join(tmpdir(), `pravoved-fixture-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const zipPath = join(tempRoot, `${basename(inputPath)}.zip`);
  const unzipDir = join(tempRoot, "xlsx");

  mkdirSync(tempRoot, { recursive: true });
  try {
    mkdirSync(unzipDir, { recursive: true });
    copyFileSync(inputPath, zipPath);
    expandArchive(zipPath, unzipDir);
    const sharedStrings = readSharedStrings(unzipDir);
    const sheetPath = firstWorksheetPath(unzipDir);
    return readWorksheetRows(sheetPath, sharedStrings);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

function expandArchive(zipPath: string, destination: string) {
  try {
    execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        "& { param($zip, $dest) Expand-Archive -LiteralPath $zip -DestinationPath $dest -Force }",
        zipPath,
        destination
      ],
      { stdio: "pipe" }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not unpack XLSX fixture via PowerShell Expand-Archive: ${message}`);
  }
}

function firstWorksheetPath(unzipDir: string) {
  const workbookXml = readFileSync(join(unzipDir, "xl", "workbook.xml"), "utf8");
  const relsXml = readFileSync(join(unzipDir, "xl", "_rels", "workbook.xml.rels"), "utf8");
  const firstSheetMatch = workbookXml.match(/<sheet\b[^>]*r:id="([^"]+)"/);
  if (!firstSheetMatch?.[1]) return join(unzipDir, "xl", "worksheets", "sheet1.xml");
  const relId = firstSheetMatch[1];
  const relMatch = relsXml.match(new RegExp(`<Relationship\\b[^>]*Id="${escapeRegex(relId)}"[^>]*Target="([^"]+)"`));
  const target = relMatch?.[1] ?? "worksheets/sheet1.xml";
  return join(unzipDir, "xl", target.replace(/^\//, ""));
}

function readSharedStrings(unzipDir: string) {
  const path = join(unzipDir, "xl", "sharedStrings.xml");
  if (!existsSync(path)) return [];
  const xml = readFileSync(path, "utf8");
  return Array.from(xml.matchAll(/<si\b[\s\S]*?<\/si>/g)).map((match) => extractTextFromXml(match[0]));
}

function readWorksheetRows(sheetPath: string, sharedStrings: string[]) {
  const xml = readFileSync(sheetPath, "utf8");
  const rows: string[][] = [];
  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const rowValues: string[] = [];
    let fallbackColumnIndex = 0;
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attributes = cellMatch[1];
      const body = cellMatch[2];
      const reference = attribute(attributes, "r");
      const type = attribute(attributes, "t");
      const columnIndex = reference ? columnNameToIndex(reference.replace(/\d+/g, "")) : fallbackColumnIndex;
      const rawValue = body.match(/<v[^>]*>([\s\S]*?)<\/v>/)?.[1] ?? "";
      const value = type === "s" ? sharedStrings[Number(rawValue)] ?? "" : type === "inlineStr" ? extractTextFromXml(body) : decodeXml(rawValue);
      rowValues[columnIndex] = value.trim();
      fallbackColumnIndex = columnIndex + 1;
    }
    rows.push(rowValues.map((value) => value ?? ""));
  }
  return rows;
}

function extractTextFromXml(xml: string) {
  return Array.from(xml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g))
    .map((match) => decodeXml(match[1]))
    .join("");
}

function decodeXml(value: string) {
  return value
    .replace(/_x000D_/g, "\n")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function attribute(source: string, name: string) {
  return source.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? "";
}

function columnNameToIndex(columnName: string) {
  return columnName
    .toUpperCase()
    .split("")
    .reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function findColumn(headers: string[], names: string[]) {
  return headers.findIndex((header) => names.includes(header));
}

function valueAt(row: string[], index: number) {
  return index >= 0 ? (row[index] ?? "").trim() : "";
}

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/g, "")
    .trim();
}

function groupBy<T>(items: T[], key: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const groupKey = key(item);
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), item]);
  }
  return groups;
}

function countBy<T>(items: T[], key: (item: T) => string) {
  return Object.fromEntries(
    Array.from(groupBy(items, key).entries())
      .map(([name, groupedItems]) => [name, groupedItems.length] as const)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  );
}

function formatBreakdown(value: Record<string, number>) {
  return Object.entries(value)
    .map(([key, count]) => `${key}: ${count}`)
    .join(", ");
}

function excerpt(value: string, limit: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, limit - 3)}...` : normalized;
}

function escapeMd(value: string | number) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "pravoved-category";
}
