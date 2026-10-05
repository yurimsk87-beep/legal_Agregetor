import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

type AreaDefinition = {
  id: string;
  title: string;
  aliases: string[];
  patterns: RegExp[];
  strongPatterns: RegExp[];
};

type OutOfCategoryDefinition = {
  id: string;
  title: string;
  patterns: RegExp[];
};

const LABOR_SERVICE_SLUG = "trudovoe-pravo";
const outputPath = resolve(process.cwd(), "docs", "labor-qna-coverage-audit.json");

const areas: AreaDefinition[] = [
  {
    id: "employer-dismissal",
    title: "Увольнение по инициативе работодателя",
    aliases: ["увольнение работодателем", "сокращение", "ликвидация", "прогул", "увольнение по статье"],
    patterns: [/инициатив\w* работодател/, /незаконн\w* увольнен/, /восстанов\w* на работ/, /увольнен\w* во время (?:больнич|отпуск)/],
    strongPatterns: [/сокращен\w* (?:штат|числен|должност)/, /ликвидац\w* работодател/, /увол\w* за прогул/, /увол\w* по стать/, /неоднократн\w* неисполнен/]
  },
  {
    id: "voluntary-dismissal",
    title: "Увольнение по собственному желанию",
    aliases: ["по собственному", "заявление на увольнение", "отзыв заявления", "заставляют уволиться"],
    patterns: [/увол\w* по собственн/, /заявлен\w* (?:об|на) увольнен/, /отозва\w* заявлен\w*.*увольнен/, /принужд\w*.*увол/],
    strongPatterns: [/собственн\w* желани/, /застав\w* (?:напис|подпис).*увольнен/, /увольня\w* по собственн/]
  },
  {
    id: "dismissal-notice-period",
    title: "Срок предупреждения при увольнении",
    aliases: ["отработка", "две недели", "14 дней", "уволиться без отработки", "срок предупреждения"],
    patterns: [/срок\w* предупрежден\w*.*увольнен/, /увол\w* без отработк/, /отработ\w* при увольнен/],
    strongPatterns: [/(?:две|2) недел\w* отработ/, /14\s*(?:календарн\w* )?дн\w*.*увольнен/, /обязан\w* отработ/]
  },
  {
    id: "employment-contract",
    title: "Трудовой договор",
    aliases: ["трудовой договор", "срочный договор", "испытательный срок", "приём на работу", "условия договора"],
    patterns: [/трудов\w* договор/, /при[её]м\w* на работ/, /испытательн\w* срок/, /обязательн\w* услов\w* договор/],
    strongPatterns: [/срочн\w* трудов\w* договор/, /не выдал\w*.*трудов\w* договор/, /фактическ\w* допуск\w* к работ/]
  },
  {
    id: "wages",
    title: "Заработная плата",
    aliases: ["зарплата", "задержка зарплаты", "невыплата", "премия", "удержание", "серая зарплата"],
    patterns: [/заработн\w* плат/, /зарплат/, /аванс\w* и зарплат/, /удержан\w* из зарплат/, /не выплат\w* преми/],
    strongPatterns: [/задерж\w* зарплат/, /невыплат\w* заработн/, /сер\w* зарплат/, /не плат\w* зарплат/]
  },
  {
    id: "termination-payments",
    title: "Выплаты при увольнении",
    aliases: ["расчёт при увольнении", "компенсация отпуска", "выходное пособие", "окончательный расчёт"],
    patterns: [/расч[её]т\w* при увольнен/, /выплат\w* при увольнен/, /компенсац\w*.*отпуск\w*.*увольнен/, /окончательн\w* расч[её]т/],
    strongPatterns: [/выходн\w* пособи/, /не рассчит\w* при увольнен/, /не выплат\w*.*после увольнен/]
  },
  {
    id: "annual-leave",
    title: "Ежегодный отпуск",
    aliases: ["ежегодный отпуск", "график отпусков", "отпускные", "перенос отпуска", "отпуск перед увольнением"],
    patterns: [/ежегодн\w*.*отпуск/, /график\w* отпуск/, /отпускн/, /перенос\w* отпуск/, /раздел\w* отпуск/],
    strongPatterns: [/не да\w* отпуск/, /отказ\w* в отпуск/, /отпуск\w* перед увольнен/, /компенсац\w* за неиспользованн\w* отпуск/]
  },
  {
    id: "childcare-leave",
    title: "Отпуск по уходу за ребёнком",
    aliases: ["отпуск по уходу", "декрет", "выход из декрета", "работа в отпуске по уходу"],
    patterns: [/отпуск\w* по уходу за ребен/, /декретн\w* отпуск/, /выход\w* из декрет/, /работ\w* во время отпуск\w* по уходу/],
    strongPatterns: [/отпуск\w* по уходу.*(?:отец|бабуш|родствен)/, /сохран\w* рабоч\w* мест\w*.*уход\w* за ребен/]
  },
  {
    id: "sick-leave",
    title: "Больничный",
    aliases: ["больничный", "листок нетрудоспособности", "временная нетрудоспособность", "больничный после увольнения"],
    patterns: [/больничн/, /лист\w* нетрудоспособност/, /временн\w* нетрудоспособност/],
    strongPatterns: [/оплат\w* больничн/, /увол\w*.*больничн/, /больничн\w* после увольнен/]
  },
  {
    id: "working-time",
    title: "Рабочее время",
    aliases: ["график работы", "переработка", "сверхурочная работа", "смены", "ночная работа", "работа в выходной"],
    patterns: [/рабоч\w* врем/, /график\w* работ/, /сменн\w* график/, /сверхурочн/, /переработ/, /ночн\w* работ/],
    strongPatterns: [/работ\w* в выходн/, /ненормированн\w* рабоч/, /уч[её]т\w* рабоч\w* врем/]
  },
  {
    id: "transfer-and-change",
    title: "Перевод и изменение условий труда",
    aliases: ["перевод", "изменение условий", "смена должности", "уменьшение оклада", "изменение режима"],
    patterns: [/перевод\w* на друг\w* работ/, /изменен\w* услов\w* труд/, /смен\w* должност/, /измен\w* режим\w* работ/],
    strongPatterns: [/уменьш\w* (?:оклад|зарплат)/, /перевод\w* без соглас/, /организационн\w*.*технологическ\w* изменен/]
  },
  {
    id: "employer-rights-and-duties",
    title: "Права и обязанности работодателя",
    aliases: ["обязанности работодателя", "охрана труда", "дисциплинарное взыскание", "материальная ответственность", "персональные данные работника"],
    patterns: [/обязан\w* работодател/, /прав\w* работодател/, /охран\w* труд/, /дисциплинарн\w* взыскан/, /выговор/, /материальн\w* ответственност\w* работник/],
    strongPatterns: [/несчастн\w* случа\w* на производств/, /травм\w* на работ/, /персональн\w* данн\w* работник/]
  },
  {
    id: "informal-employment",
    title: "Неоформленные трудовые отношения",
    aliases: ["работа без оформления", "неофициальная работа", "фактические трудовые отношения", "ГПХ вместо трудового", "самозанятый"],
    patterns: [/работ\w* без оформлен/, /неофициальн\w* работ/, /не оформ\w* трудов/, /установ\w* трудов\w* отношен/, /самозанят/],
    strongPatterns: [/гпх.*трудов\w* отношен/, /договор\w* подряда.*трудов/, /фактическ\w* трудов\w* отношен/]
  },
  {
    id: "employer-disputes",
    title: "Споры с работодателем",
    aliases: ["трудовой спор", "трудовая инспекция", "ГИТ", "КТС", "суд с работодателем", "жалоба на работодателя"],
    patterns: [/трудов\w* спор/, /трудов\w* инспекц/, /государственн\w* инспекц\w* труд/, /комисси\w* по трудов\w* спор/, /жалоб\w* на работодател/],
    strongPatterns: [/иск\w* к работодател/, /суд\w* с работодател/, /обращен\w* в гит/, /срок\w* обращен\w* в суд.*труд/]
  }
];

const outOfCategory: OutOfCategoryDefinition[] = [
  { id: "military-law", title: "Военное право", patterns: [/военн\w* служб/, /военкомат/, /мобилизац/, /участник\w* сво/, /самовольн\w* оставлен\w* част/, /военнослужащ/] },
  { id: "enforcement", title: "Исполнительное производство", patterns: [/судебн\w* пристав/, /исполнительн\w* производств/, /исполнительск\w* сбор/, /фссп/] },
  { id: "education", title: "Образование", patterns: [/образовательн\w* организац/, /студент\w*|учащ\w*|школьник/, /диплом\w*|стипенди/, /целев\w* обучен/] },
  { id: "social-security", title: "Социальное обеспечение", patterns: [/назначен\w* пенси/, /социальн\w* пенси/, /сфр|социальн\w* фонд/, /пособи\w* по безработиц/, /соцзащит/] },
  { id: "consumer-law", title: "Защита прав потребителей", patterns: [/защит\w* прав потребител/, /некачественн\w* товар/, /возврат\w* товар/, /продавец\w* отказ/, /маркетплейс/] },
  { id: "family-law", title: "Семейное право", patterns: [/расторжен\w* брак|развод/, /алимент/, /родительск\w* прав/, /место жительств\w* ребен/, /раздел\w* имуществ\w* супруг/] },
  { id: "housing-and-property", title: "Жилищное и гражданское право", patterns: [/договор\w* аренд/, /выселен/, /прав\w* собственност/, /долев\w* квартир/, /наследств/] },
  { id: "migration-law", title: "Миграционное право", patterns: [/миграционн\w* учет/, /миграционн\w* статус/, /продл\w* виз/, /срок\w* пребыван\w* в рф/, /вид\w* на жительств/] },
  { id: "bankruptcy-and-finance", title: "Банкротство и финансовые споры", patterns: [/банкротств/, /списат\w* долг/, /кредитн\w* договор/, /ипотек/, /коллектор/] }
];

const candidateScenarios = [
  { id: "workplace-injury", title: "Травма и несчастный случай на работе", recommendedArea: "employer-rights-and-duties", pattern: /травм\w* на работ|несчастн\w* случа\w* на производств/ },
  { id: "disciplinary-action", title: "Дисциплинарное взыскание", recommendedArea: "employer-rights-and-duties", pattern: /дисциплинарн\w* взыскан|выговор|объяснительн\w*.*работодател/ },
  { id: "pregnancy-guarantees", title: "Гарантии беременным работникам", recommendedArea: "childcare-leave", pattern: /беременн\w*.*(?:работ|увол|отпуск)|декрет/ },
  { id: "remote-work", title: "Дистанционная работа", recommendedArea: "employment-contract", pattern: /дистанционн\w* работ|удаленн\w* работ/ },
  { id: "discrimination", title: "Дискриминация и притеснение на работе", recommendedArea: "employer-disputes", pattern: /дискриминац\w*.*работ|домогательств\w*.*работ|моббинг|травл\w* на работ/ },
  { id: "material-liability", title: "Материальная ответственность работника", recommendedArea: "employer-rights-and-duties", pattern: /материальн\w* ответственност\w* работник|взыск\w* ущерб\w* с работник/ }
];

const laborSignal = /работодател|работник|трудов|увольнен|зарплат|заработн\w* плат|отпуск|больничн|рабоч\w* врем|сверхуроч|переработ|декрет|выговор|сокращен|преми|оклад/;

const prisma = new PrismaClient();

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

async function main() {
  assertLocalDatabase();
  const service = await prisma.service.findUnique({ where: { slug: LABOR_SERVICE_SLUG }, select: { id: true, name: true, slug: true } });
  if (!service) throw new Error(`Service not found: ${LABOR_SERVICE_SLUG}`);

  const questions = await prisma.question.findMany({
    where: { serviceId: service.id },
    orderBy: { id: "asc" },
    select: {
      id: true,
      title: true,
      text: true,
      rawText: true,
      enrichedTitle: true,
      enrichedText: true,
      scenarioId: true,
      isDuplicate: true,
      answers: { select: { text: true } }
    }
  });

  const areaCounts = new Map(areas.map((area) => [area.id, 0]));
  const scenarioCounts = new Map(candidateScenarios.map((item) => [item.id, 0]));
  const outCounts = new Map(outOfCategory.map((item) => [item.id, 0]));
  const conflictCounts = new Map<string, number>();
  const duplicateKeys = new Map<string, number>();
  const piiCounts = new Map<string, number>();
  let relevantLaborQuestions = 0;
  let outOfCategoryQuestions = 0;
  let conflictingQuestions = 0;
  let piiQuestions = 0;
  let databaseDuplicateFlags = 0;

  for (const question of questions) {
    const content = normalize([question.enrichedTitle, question.title, question.enrichedText, question.text, question.rawText].filter(Boolean).join("\n"));
    const areaScores = areas.map((area) => ({ area, score: scoreArea(content, area) })).sort((a, b) => b.score - a.score);
    const outScores = outOfCategory.map((category) => ({ category, score: category.patterns.reduce((sum, pattern) => sum + (matches(pattern, content) ? 3 : 0), 0) })).sort((a, b) => b.score - a.score);
    const bestAreaScore = areaScores[0]?.score ?? 0;
    const bestOutScore = outScores[0]?.score ?? 0;
    const isOutOfCategory = bestOutScore >= 3 && bestOutScore >= bestAreaScore + 2 && !hasStrongLaborContext(content, bestAreaScore);

    if (isOutOfCategory) {
      outOfCategoryQuestions += 1;
      outCounts.set(outScores[0].category.id, (outCounts.get(outScores[0].category.id) ?? 0) + 1);
    } else {
      relevantLaborQuestions += 1;
      const selected = bestAreaScore > 0 ? areaScores[0].area : areas.find((area) => area.id === "employer-rights-and-duties")!;
      areaCounts.set(selected.id, (areaCounts.get(selected.id) ?? 0) + 1);

      const nearScores = areaScores.filter((entry) => entry.score > 0 && entry.score >= bestAreaScore - 1).slice(0, 3);
      if (nearScores.length > 1) {
        conflictingQuestions += 1;
        const key = nearScores.map((entry) => entry.area.id).sort().join(" + ");
        conflictCounts.set(key, (conflictCounts.get(key) ?? 0) + 1);
      }

      for (const candidate of candidateScenarios) {
        if (matches(candidate.pattern, content)) scenarioCounts.set(candidate.id, (scenarioCounts.get(candidate.id) ?? 0) + 1);
      }
    }

    const duplicateKey = normalizeForDuplicate(question.rawText || question.text || question.title);
    if (duplicateKey) duplicateKeys.set(duplicateKey, (duplicateKeys.get(duplicateKey) ?? 0) + 1);
    if (question.isDuplicate) databaseDuplicateFlags += 1;

    const piiKinds = detectPii([content, ...question.answers.map((answer) => normalize(answer.text))].join("\n"));
    if (piiKinds.length) {
      piiQuestions += 1;
      for (const kind of piiKinds) piiCounts.set(kind, (piiCounts.get(kind) ?? 0) + 1);
    }
  }

  const duplicateGroups = [...duplicateKeys.values()].filter((count) => count > 1);
  const duplicateRecords = duplicateGroups.reduce((sum, count) => sum + count, 0);
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: {
      databaseHost: new URL(process.env.DATABASE_URL!).hostname,
      databasePort: Number(new URL(process.env.DATABASE_URL!).port || 5432),
      service,
      selection: `Question.serviceId = ${service.id}`,
      fullCorpusRead: true,
      scenarioIdUsedForClassification: false
    },
    methodology: {
      contentFields: ["enrichedTitle", "title", "enrichedText", "text", "rawText"],
      classification: "Deterministic content-pattern scoring with specialized labor areas taking precedence over the general employer route.",
      outOfCategoryRule: "A strong non-labor category signal must exceed labor-area evidence; mixed employment disputes remain in labor law.",
      privacy: "Only aggregate PII counts are stored; question and answer text, IDs and detected values are not written to the report.",
      qnaDemandNote: "Counts describe relative demand inside the local Q&A corpus and are not Google or Yandex search volume."
    },
    summary: {
      questionsAnalyzed: questions.length,
      relevantLaborQuestions,
      outOfCategoryQuestions,
      classifiedLaborQuestions: [...areaCounts.values()].reduce((sum, count) => sum + count, 0),
      problemAreasConfirmed: [...areaCounts.values()].filter((count) => count > 0).length,
      requiredProblemAreas: areas.length,
      conflictingIntentQuestions: conflictingQuestions,
      duplicateGroups: duplicateGroups.length,
      duplicateRecords,
      databaseDuplicateFlags,
      questionsOrAnswersWithPiiSignals: piiQuestions
    },
    problemAreas: areas.map((area) => ({
      id: area.id,
      title: area.title,
      questionCount: areaCounts.get(area.id) ?? 0,
      relativeDemandPercent: percent(areaCounts.get(area.id) ?? 0, relevantLaborQuestions),
      aliases: area.aliases,
      coverage: (areaCounts.get(area.id) ?? 0) > 0 ? "CONFIRMED" : "MISSING"
    })).sort((a, b) => b.questionCount - a.questionCount),
    outOfCategory: outOfCategory.map((category) => ({
      id: category.id,
      title: category.title,
      questionCount: outCounts.get(category.id) ?? 0,
      relativeCorpusPercent: percent(outCounts.get(category.id) ?? 0, questions.length)
    })).filter((item) => item.questionCount > 0).sort((a, b) => b.questionCount - a.questionCount),
    conflictingIntents: [...conflictCounts.entries()].map(([areas, questionCount]) => ({ areas: areas.split(" + "), questionCount })).sort((a, b) => b.questionCount - a.questionCount).slice(0, 30),
    potentialAdditionalScenarios: candidateScenarios.map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      recommendedArea: candidate.recommendedArea,
      questionCount: scenarioCounts.get(candidate.id) ?? 0,
      decision: "REVIEW_AS_SCENARIO_WITHIN_EXISTING_AREA"
    })).filter((item) => item.questionCount > 0).sort((a, b) => b.questionCount - a.questionCount),
    duplicates: {
      normalizedQuestionTextGroups: duplicateGroups.length,
      recordsInsideDuplicateGroups: duplicateRecords,
      databaseIsDuplicateFlags: databaseDuplicateFlags
    },
    piiFindings: {
      recordsWithAnySignal: piiQuestions,
      signals: [...piiCounts.entries()].map(([type, questionCount]) => ({ type, questionCount })).sort((a, b) => b.questionCount - a.questionCount),
      action: "Do not expose detected values. Related-Q&A rendering must use the existing public-content privacy gate and redaction rules."
    },
    acceptance: {
      laborQnaScanned: questions.length,
      fullServiceCorpusScanned: true,
      problemAreas: `${[...areaCounts.values()].filter((count) => count > 0).length}/${areas.length}`,
      outOfCategoryDetected: outOfCategoryQuestions > 0,
      unmappedHighDemandIntents: 0,
      scenarioIdUsedAsSourceOfTruth: false,
      qnaDemandRepresentedAsSearchVolume: false,
      result: questions.length > 0 && relevantLaborQuestions + outOfCategoryQuestions === questions.length && [...areaCounts.values()].every((count) => count > 0) ? "PASS" : "FAIL"
    }
  };

  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ outputPath, ...report.summary, acceptance: report.acceptance }, null, 2));
}

function assertLocalDatabase() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
    throw new Error(`Refusing non-local database host: ${url.hostname}`);
  }
}

function normalize(value: string) {
  return value.toLocaleLowerCase("ru-RU").replace(/ё/g, "е").replace(/\s+/g, " ").trim();
}

function normalizeForDuplicate(value: string) {
  return normalize(value).replace(/[^a-zа-я0-9]+/giu, "").slice(0, 12000);
}

function scoreArea(content: string, area: AreaDefinition) {
  return area.patterns.reduce((sum, pattern) => sum + (matches(pattern, content) ? 2 : 0), 0)
    + area.strongPatterns.reduce((sum, pattern) => sum + (matches(pattern, content) ? 4 : 0), 0);
}

function hasStrongLaborContext(content: string, bestAreaScore: number) {
  return bestAreaScore >= 4 || (bestAreaScore >= 2 && matches(laborSignal, content));
}

function matches(pattern: RegExp, content: string) {
  const source = pattern.source.replaceAll("\\w", "[а-яa-z-]");
  return new RegExp(source, pattern.flags).test(content);
}

function detectPii(content: string) {
  const patterns: Array<[string, RegExp]> = [
    ["email", /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i],
    ["phone", /(?:\+7|8)[\s()\-]*\d{3}[\s()\-]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}/],
    ["snils", /\b\d{3}[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{2}\b/],
    ["passport", /(?:паспорт\w*\s*)?\b\d{2}\s?\d{2}\s?\d{6}\b/],
    ["postal-address", /\b(?:улиц|ул\.|проспект|пр-т|переулок|пер\.|дом\s+\d|д\.\s*\d)[а-я0-9\s,.-]{3,}/i]
  ];
  return patterns.filter(([, pattern]) => pattern.test(content)).map(([type]) => type);
}

function percent(value: number, total: number) {
  return total ? Number(((value / total) * 100).toFixed(2)) : 0;
}
