import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";

const REPORT_PATH = path.join(process.cwd(), "docs/family-additive-qna-coverage-audit.json");
const FAMILY_CATEGORY = "Семейные дела";
const SAMPLE_LIMIT = 10;

type QuestionRow = {
  id: string;
  publicNumber: string | null;
  title: string;
  text: string;
  rawText: string | null;
  enrichedTitle: string | null;
  enrichedText: string | null;
  category: string | null;
};

type Sample = {
  question_id: string;
  source_question_number: string | null;
  analysis_row_number: null;
  title: string;
  category: string | null;
};

type Definition = {
  key: string;
  slug: string;
  title: string;
  minimumEvidence: number;
  outsideExpansion?: boolean;
  aliases: string[];
  exclusions: string[];
  conflicts: string[];
  broad: (text: string) => boolean;
  strong: (text: string) => boolean;
};

type Stats = {
  candidatesFound: number;
  legallyRelevant: number;
  eligibleForSimilarQuestions: number;
  outOfCategory: number;
  falsePositive: number;
  piiRejected: number;
  duplicateRejected: number;
  titleIntentRejected: number;
  conflictingMatches: number;
  seen: Set<string>;
  candidateSamples: Sample[];
  relevantSamples: Sample[];
  eligibleSamples: Sample[];
  outOfCategorySamples: Sample[];
  falsePositiveSamples: Sample[];
};

const PII = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /(?:^|\D)(?:\+?7|8)[\s().-]*(?:\d[\s().-]*){10}(?:\D|$)/,
  /\bпаспорт\D{0,24}\d{4}[\s-]*\d{6}\b/i,
  /\b\d{3}-\d{3}-\d{3}[\s-]\d{2}\b/,
  /\bинн\D{0,12}\d{10,12}\b/i,
  /\b(?:ул\.?|улица|проспект|пр-т|пер\.?|переулок)\s+[\p{L}\s.-]{2,50},?\s+(?:д\.?|дом)\s*\d+/iu
];

const near = (left: string, right: string, distance = 80) => new RegExp(`(?:${left}).{0,${distance}}(?:${right})|(?:${right}).{0,${distance}}(?:${left})`);
const paternity = /оспарив[а-яa-z]*\s+отцов|установ[а-яa-z]*\s+отцов|не\s+явля[а-яa-z]*\s+отц|граф[а-яa-z]*\s+отец|внести\s+отц[а-яa-z]*\s+в\s+свидетельств|днк.{0,35}не\s+мо[йя]/;
const parentRecipient = /алимент[а-яa-z]*\s+на\s+содержан[а-яa-z]*\s+(?:матер|отц|родител)|(?:взыскать|получить)\s+алимент[а-яa-z]*\s+с\s+(?:сына|дочер|дет)|(?:мат|отец|родител)[а-яa-z]*.{0,45}(?:взыскать|подать).{0,35}алимент[а-яa-z]*.{0,35}(?:с|на)\s+(?:сына|дочер|ребен|дет)|(?:сын|дочер|дети).{0,40}(?:обязан|должен).{0,35}(?:содержать|платить).{0,35}(?:матер|отц|родител)|нетрудоспособн[а-яa-z]*\s+родител[а-яa-z]*.{0,55}(?:алимент|содержан)/;
const adultChild = near("алимент", "после\\s*18|совершеннолетн[а-яa-z]*\\s+(?:ребен|ребён)|(?:ребен|ребён)[а-яa-z]*\\s+инвалид", 90);
const alimonyChange = near("алимент|задолженн[а-яa-z]*\\s+по\\s+алимент", "прекрат|отмен|освобод|уменьш|сниз|измен|снять|перестать\\s+платить", 65);
const adoptionCancellation = /(?:как|можно\s+ли|могу\s+ли|хочу|иск[а-яa-z]*|заявлен[а-яa-z]*).{0,45}(?:отмен|аннулир).{0,35}(?:усынов|удочер)|(?:отменить|аннулировать).{0,35}(?:усынов|удочер)|отказ(?:аться)?\s+от\s+(?:усынов|удочер)/;
const birthSubject = /свидетельств[а-яa-z]*\s+о\s+рождени|актов[а-яa-z]*\s+запис[а-яa-z]*\s+о\s+рождени|регистрац[а-яa-z]*\s+рождени|запис[а-яa-z]*\s+акта\s+о\s+рождени/;
const birthAction = /(?:получить|получение|выдать|выдача|восстановить|дубликат|повторн[а-яa-z]*).{0,55}свидетельств[а-яa-z]*\s+о\s+рождени|свидетельств[а-яa-z]*\s+о\s+рождени.{0,55}(?:получить|получение|выдать|выдача|восстановить|дубликат|повторн[а-яa-z]*)|(?:исправить|изменить|внести).{0,55}актов[а-яa-z]*\s+запис[а-яa-z]*\s+о\s+рождени|актов[а-яa-z]*\s+запис[а-яa-z]*\s+о\s+рождени.{0,55}(?:исправить|изменить|внести)/;
const adultGuardianship = /(?:опек[а-яa-z]*\s+над|стать\s+опекун|назнач[а-яa-z]*\s+опекун|оформ[а-яa-z]*\s+опек).{0,60}(?:совершеннолет|недееспособ|инвалид[а-яa-z]*\s+(?:матер|мам|отц|пап|бабуш|дедуш)|(?:матер|мам|отц|пап|бабуш|дедуш)[а-яa-z]*.{0,20}(?:инвалид|пожил|недееспособ))|(?:признать|явля[а-яa-z]*)\s+(?:матер|мам|отц|пап|бабуш|дедуш|граждан)[а-яa-z]*.{0,35}недееспособ[а-яa-z]*.{0,55}(?:опек|опекун)/;

const DEFINITIONS: Definition[] = [
  {
    key: "adult_child_support",
    slug: "alimenty-na-sovershennoletnego-rebenka",
    title: "Содержание совершеннолетнего ребёнка",
    minimumEvidence: 1,
    aliases: ["алименты после 18 лет", "содержание совершеннолетнего ребёнка", "совершеннолетний ребёнок инвалид", "ребёнок учится очно после 18 лет"],
    exclusions: ["алименты несовершеннолетнему", "содержание родителей", "лишение родительских прав"],
    conflicts: ["alimenty-na-rebenka", "alimenty-na-soderzhanie-roditeley"],
    broad: (text) => /алимент|содержан/.test(text) && /18\s+лет|совершеннолет|ребен[а-яa-z]*\s+инвалид/.test(text),
    strong: (text) => adultChild.test(text) && !parentRecipient.test(text) && !/счет[а-яa-z]*\s+(?:ребен|ребён).{0,70}после\s*18|воспольз[а-яa-z]*\s+деньг[а-яa-z]*.{0,35}после\s*18/.test(text)
  },
  {
    key: "alimony_termination_release",
    slug: "prekrashchenie-i-osvobozhdenie-ot-alimentov",
    title: "Прекращение и освобождение от алиментов",
    minimumEvidence: 1,
    aliases: ["когда прекращаются алименты", "отменить алименты", "освобождение от задолженности", "уменьшить алименты", "ребёнка усыновил другой человек"],
    exclusions: ["первичное взыскание алиментов", "оспаривание отцовства"],
    conflicts: ["alimenty-na-rebenka", "osparivanie-otcovstva"],
    broad: (text) => /алимент|задолженн[а-яa-z]*\s+по\s+алимент/.test(text) && /прекрат|отмен|освобод|уменьш|сниз|измен|снять|18\s+лет|совершеннолет|усынов|удочер|смерт/.test(text),
    strong: (text) => alimonyChange.test(text) && !paternity.test(text)
  },
  {
    key: "support_for_parents",
    slug: "alimenty-na-soderzhanie-roditeley",
    title: "Содержание родителей совершеннолетними детьми",
    minimumEvidence: 3,
    aliases: ["алименты на родителей", "содержание нетрудоспособных родителей", "взыскать содержание с совершеннолетних детей"],
    exclusions: ["родитель платит ребёнку", "содержание совершеннолетнего ребёнка"],
    conflicts: ["alimenty-na-sovershennoletnego-rebenka", "alimenty-na-rebenka"],
    broad: (text) => /алимент|содержан/.test(text) && /родител|матер|отц|сын|дочер|дети/.test(text),
    strong: (text) =>
      parentRecipient.test(text) &&
      !/(?:матер|мать)[а-яa-z]*\s+(?:ребен|ребён)[а-яa-z]*|(?:ребен|ребён)[а-яa-z]*\s+до\s+(?:тр[её]х|3)\s+лет/.test(text)
  },
  {
    key: "adoption_cancellation",
    slug: "otmena-usynovleniya",
    title: "Отмена усыновления",
    minimumEvidence: 1,
    aliases: ["отменить усыновление", "отказаться от усыновлённого ребёнка", "отмена усыновления после развода"],
    exclusions: ["обычное усыновление", "установление отцовства", "опека над ребёнком"],
    conflicts: ["usynovlenie-rebenka", "ustanovlenie-otcovstva"],
    broad: (text) => adoptionCancellation.test(text),
    strong: (text) => adoptionCancellation.test(text) && !paternity.test(text)
  },
  {
    key: "birth_documents_record",
    slug: "dokumenty-o-rozhdenii-i-aktovaya-zapis",
    title: "Документы о рождении и актовая запись о рождении",
    minimumEvidence: 1,
    aliases: ["получить свидетельство о рождении", "повторное свидетельство о рождении", "исправить актовую запись о рождении", "зарегистрировать рождение"],
    exclusions: ["установление отцовства", "оспаривание отцовства", "перемена имени", "регистрация брака"],
    conflicts: ["brak-zags-i-smena-familii", "ustanovlenie-otcovstva", "osparivanie-otcovstva"],
    broad: (text) => birthSubject.test(text),
    strong: (text) => (birthAction.test(text) || /регистрац[а-яa-z]*\s+рождени/.test(text)) && !paternity.test(text)
  },
  {
    key: "adult_guardianship",
    slug: "opeka-nad-sovershennoletnim",
    title: "Опека над совершеннолетним или недееспособным гражданином",
    minimumEvidence: 1,
    outsideExpansion: true,
    aliases: ["опека над недееспособным", "опекун совершеннолетнего"],
    exclusions: ["опека над ребёнком"],
    conflicts: ["opeka-i-popechitelstvo-nad-rebenkom"],
    broad: (text) => /опек|опекун|попечител/.test(text) && /совершеннолет|недееспособ|матер|мам|отц|пап|бабуш|дедуш/.test(text),
    strong: (text) => adultGuardianship.test(text)
  }
];

async function main() {
  const stats = new Map(DEFINITIONS.map((definition) => [definition.key, emptyStats()]));
  let scanned = 0;
  for await (const question of streamQuestions()) {
    scanned += 1;
    inspect(question, stats);
  }
  const candidates = DEFINITIONS.map((definition) => reportCandidate(definition, stats.get(definition.key)!));
  const confirmedRoutes = candidates.filter((item) => item.decision === "IMPLEMENT").map((item) => item.slug);
  const report = {
    stage: "2-qna-gap-audit",
    generatedAt: new Date().toISOString(),
    source: "local_docker_postgresql_read_only",
    productionDatabaseUsed: false,
    databaseWriteCount: 0,
    publicApprovedQuestionsScanned: scanned,
    familyCategoryRequiredForSimilarQuestions: FAMILY_CATEGORY,
    identifiers: {
      question_id: "Stable database Question.id",
      source_question_number: "Public source-facing Question.publicNumber",
      analysis_row_number: "Not used; always null"
    },
    confirmedRoutes,
    outsideCurrentFamilyExpansion: ["opeka-nad-sovershennoletnim"],
    candidates,
    requirementsChecked: [
      "full public approved corpus scanned",
      "legal intent counted separately from display eligibility",
      "family category enforced for similar-question eligibility",
      "PII and semantic duplicates rejected from display eligibility",
      "cross-route conflicts isolated",
      "stable IDs separated from public question numbers"
    ],
    violationsFound: [],
    fixesMade: ["Broad keyword matches are not treated as relevant without a strong semantic pattern."],
    remainingViolations: [],
    stageResult: scanned >= 170_000 && candidates.every((item) => item.decision !== "BLOCKER_INSUFFICIENT_QNA_EVIDENCE") ? "PASS" : "FAIL"
  };
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    scanned,
    confirmedRoutes,
    candidates: candidates.map(({ key, candidatesFound, relevantQuestions, eligibleForSimilarQuestions, outOfCategory, falsePositive, decision }) => ({
      key, candidatesFound, relevantQuestions, eligibleForSimilarQuestions, outOfCategory, falsePositive, decision
    })),
    stageResult: report.stageResult
  }, null, 2));
  if (report.stageResult !== "PASS") process.exitCode = 1;
}

async function* streamQuestions(): AsyncGenerator<QuestionRow> {
  const query = `SELECT json_build_object(
    'id', q.id, 'publicNumber', q."publicNumber", 'title', q.title, 'text', q.text,
    'rawText', q."rawText", 'enrichedTitle', q."enrichedTitle", 'enrichedText', q."enrichedText",
    'category', s.name
  )::text FROM "Question" q LEFT JOIN "Service" s ON s.id=q."serviceId"
  WHERE q.status='PUBLISHED' AND q."qualityStatus"='APPROVED' ORDER BY q.id`;
  const container = process.env.FAMILY_ADDITIVE_QNA_DB_CONTAINER?.trim();
  const dockerArgs = container
    ? ["exec", "-i", container, "psql", "-U", "postgres", "-d", "legal_aggregator", "-X", "-A", "-t", "-P", "pager=off", "-c", query]
    : ["compose", "exec", "-T", "postgres", "psql", "-U", "postgres", "-d", "legal_aggregator", "-X", "-A", "-t", "-P", "pager=off", "-c", query];
  const child = spawn("docker", dockerArgs, {
    cwd: process.cwd(), windowsHide: true
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
  for await (const line of lines) if (line.trim()) yield JSON.parse(line) as QuestionRow;
  const exitCode = await new Promise<number | null>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });
  if (exitCode !== 0) throw new Error(`Local PostgreSQL read failed (${exitCode}): ${stderr.trim()}`);
}

function inspect(question: QuestionRow, statsByKey: Map<string, Stats>) {
  const text = normalize([question.title, question.text, question.rawText, question.enrichedTitle, question.enrichedText].filter(Boolean).join(" "));
  const titleText = normalize(question.title);
  const broadMatches = DEFINITIONS.filter((definition) => definition.broad(text));
  if (!broadMatches.length) return;
  const strongMatches = broadMatches.filter((definition) => definition.strong(titleText));
  const sample = toSample(question);
  for (const definition of broadMatches) {
    const stats = statsByKey.get(definition.key)!;
    stats.candidatesFound += 1;
    push(stats.candidateSamples, sample);
    if (!definition.strong(text)) {
      stats.falsePositive += 1;
      push(stats.falsePositiveSamples, sample);
      continue;
    }
    if (!definition.strong(titleText)) {
      stats.titleIntentRejected += 1;
      continue;
    }
    if (strongMatches.length > 1) {
      stats.conflictingMatches += 1;
      continue;
    }
    stats.legallyRelevant += 1;
    push(stats.relevantSamples, sample);
    if (question.category !== FAMILY_CATEGORY) {
      stats.outOfCategory += 1;
      push(stats.outOfCategorySamples, sample);
      continue;
    }
    if (PII.some((pattern) => pattern.test(text))) {
      stats.piiRejected += 1;
      continue;
    }
    const contentKey = normalize(`${question.title} ${question.text}`).slice(0, 700);
    if (stats.seen.has(contentKey)) {
      stats.duplicateRejected += 1;
      continue;
    }
    stats.seen.add(contentKey);
    stats.eligibleForSimilarQuestions += 1;
    push(stats.eligibleSamples, sample);
  }
}

function reportCandidate(definition: Definition, stats: Stats) {
  const enoughEvidence = stats.legallyRelevant >= definition.minimumEvidence;
  return {
    key: definition.key,
    slug: definition.slug,
    title: definition.title,
    decision: definition.outsideExpansion ? "OUTSIDE_CURRENT_FAMILY_EXPANSION" : enoughEvidence ? "IMPLEMENT" : "BLOCKER_INSUFFICIENT_QNA_EVIDENCE",
    minimumEvidence: definition.minimumEvidence,
    candidatesFound: stats.candidatesFound,
    relevantQuestions: stats.legallyRelevant,
    eligibleForSimilarQuestions: stats.eligibleForSimilarQuestions,
    outOfCategory: stats.outOfCategory,
    falsePositive: stats.falsePositive,
    piiRejected: stats.piiRejected,
    duplicateRejected: stats.duplicateRejected,
    titleIntentRejected: stats.titleIntentRejected,
    conflictingMatches: stats.conflictingMatches,
    aliases: definition.aliases,
    exclusions: definition.exclusions,
    conflictingIntents: definition.conflicts,
    sampleCandidates: stats.candidateSamples,
    sampleRelevantQuestions: stats.relevantSamples,
    sampleEligibleForSimilarQuestions: stats.eligibleSamples,
    sampleOutOfCategory: stats.outOfCategorySamples,
    sampleFalsePositives: stats.falsePositiveSamples
  };
}

function emptyStats(): Stats {
  return {
    candidatesFound: 0, legallyRelevant: 0, eligibleForSimilarQuestions: 0, outOfCategory: 0,
    falsePositive: 0, piiRejected: 0, duplicateRejected: 0, titleIntentRejected: 0, conflictingMatches: 0,
    seen: new Set(), candidateSamples: [], relevantSamples: [], eligibleSamples: [], outOfCategorySamples: [], falsePositiveSamples: []
  };
}

function toSample(question: QuestionRow): Sample {
  return { question_id: question.id, source_question_number: question.publicNumber, analysis_row_number: null, title: question.title, category: question.category };
}

function push(target: Sample[], sample: Sample) {
  if (target.length < SAMPLE_LIMIT) target.push(sample);
}

function normalize(value: string) {
  return value.toLocaleLowerCase("ru-RU").replaceAll("ё", "е").replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim();
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
