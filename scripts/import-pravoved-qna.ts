import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { PrismaClient } from "@prisma/client";
import { analyzeLawyerAnswerQuality } from "../src/lib/answer-quality";
import { redactForbiddenContacts } from "../src/lib/contact-safety";
import {
  getHarantSpecializationAliases,
  HARANT_QUESTION_CATEGORIES,
  harantQuestionCategorySet,
  normalizeHarantCategoryName
} from "../src/lib/harant-question-categories";
import {
  buildEnrichedQuestion,
  calculateSeoQualityScore,
  classifyQuestion
} from "../src/lib/question-wizard-engine";
import { classifyLegalQuestion } from "./lib/classify-legal-question";
import type { Service } from "../src/lib/types";

type FixtureRow = {
  rowNumber: number;
  rawCategory: string;
  rawTitle: string;
  rawQuestion: string;
  lawyerAnswer: string;
};

type ImportArgs = {
  input?: string;
  limit?: number;
  requirePublicAnswer?: boolean;
  allowAllFixtureAnswers?: boolean;
  append?: boolean;
};

type ImportOptions = {
  requirePublicAnswer?: boolean;
  allowAllFixtureAnswers?: boolean;
  targetLimit?: number;
  sourceFileName?: string;
  append?: boolean;
};

type ImportService = Awaited<ReturnType<typeof prisma.service.findMany>>[number];
type ImportLawyer = Awaited<ReturnType<typeof getImportLawyers>>[number];

const prisma = new PrismaClient();
const root = process.cwd();
const defaultInput = join(root, "pravoved_parser", "outputs", "pravoved_100_questions.xlsx");
const fixtureQuestionAuthors = [
  { firstName: "Анна", patronymic: "Сергеевна", lastName: "Кузнецова" },
  { firstName: "Мария", patronymic: "Игоревна", lastName: "Петрова" },
  { firstName: "Елена", patronymic: "Викторовна", lastName: "Соколова" },
  { firstName: "Ольга", patronymic: "Андреевна", lastName: "Смирнова" },
  { firstName: "Наталья", patronymic: "Алексеевна", lastName: "Морозова" },
  { firstName: "Ирина", patronymic: "Павловна", lastName: "Новикова" },
  { firstName: "Светлана", patronymic: "Дмитриевна", lastName: "Волкова" },
  { firstName: "Татьяна", patronymic: "Михайловна", lastName: "Федорова" },
  { firstName: "Алексей", patronymic: "Сергеевич", lastName: "Иванов" },
  { firstName: "Дмитрий", patronymic: "Андреевич", lastName: "Козлов" },
  { firstName: "Сергей", patronymic: "Владимирович", lastName: "Орлов" },
  { firstName: "Михаил", patronymic: "Алексеевич", lastName: "Васильев" },
  { firstName: "Андрей", patronymic: "Игоревич", lastName: "Павлов" },
  { firstName: "Евгений", patronymic: "Петрович", lastName: "Зайцев" },
  { firstName: "Николай", patronymic: "Дмитриевич", lastName: "Белов" },
  { firstName: "Владимир", patronymic: "Михайлович", lastName: "Громов" }
];

// main() вызывается в конце файла — после всех объявлений модуля (const/let),
// иначе async main стартует синхронно и обращается к ещё не инициализированным
// const (TDZ: "Cannot access 'excludeSampleLawyers' before initialization").

async function main() {
  assertDevelopmentOnly();

  const args = parseArgs(process.argv.slice(2));
  const inputPath = resolve(args.input ?? defaultInput);

  if (!existsSync(inputPath)) {
    throw new Error(`Fixture file not found: ${inputPath}`);
  }

  const rows = readFixtureRows(inputPath).filter((row) => row.lawyerAnswer.trim());
  if (!rows.length) {
    throw new Error(`No fixture rows with lawyer answers found in ${inputPath}.`);
  }

  const result = await importQuestions(rows, {
    requirePublicAnswer: Boolean(args.requirePublicAnswer),
    allowAllFixtureAnswers: Boolean(args.allowAllFixtureAnswers),
    targetLimit: args.limit,
    sourceFileName: basename(inputPath),
    append: Boolean(args.append)
  });
  console.log(`Deleted questions: ${result.deletedQuestions}`);
  console.log(`Imported questions: ${result.importedQuestions}`);
  console.log(`Imported answers: ${result.importedAnswers}`);
  console.log(`Skipped empty fixture answers: ${result.skippedEmptyAnswers}`);
  console.log(`Skipped low-quality fixture answers: ${result.skippedLowQualityAnswers}`);
  console.log(`Skipped duplicate questions: ${result.skippedDuplicateQuestions}`);
  console.log(`Created missing categories: ${result.createdServices}`);
  console.log(`Deleted unused fixture categories: ${result.deletedUnusedFixtureServices}`);
  console.log(`Answers distributed across lawyers: ${result.usedLawyers}`);
}

async function importQuestions(rows: FixtureRow[], options: ImportOptions = {}) {
  const [cities, services, lawyers] = await Promise.all([
    prisma.city.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    getImportLawyers()
  ]);

  if (!cities.length) throw new Error("No active cities found. Seed cities before import.");
  if (!lawyers.length) throw new Error("No existing lawyer profiles found. Seed lawyers before import.");

  const deletedQuestions = options.append ? 0 : await clearCurrentQa();
  const existingIndex = options.append ? await loadExistingQuestionIndex() : emptyQuestionIndex();
  const startingPublicNumber = existingIndex.nextPublicNumber;
  const existingQuestionKeys = existingIndex.questionKeys;
  const existingTitleKeys = existingIndex.titleKeys;
  const lawyerOrder = deterministicShuffle(lawyers, "pravoved-lawyers");
  const usedLawyerIds = new Set<string>();
  let createdServices = await ensureHarantQuestionServices(services);
  let importedQuestions = 0;
  let importedAnswers = 0;
  let skippedEmptyAnswers = 0;
  let skippedLowQualityAnswers = 0;
  let skippedDuplicateQuestions = 0;

  for (const [index, row] of rows.entries()) {
    if (options.targetLimit && importedQuestions >= options.targetLimit) break;
    const sourceNumber = index + 1;
    const dedupeKey = questionDedupeKey(row.rawQuestion || row.rawTitle);
    if (options.append && dedupeKey && existingQuestionKeys.has(dedupeKey)) {
      skippedDuplicateQuestions += 1;
      continue;
    }
    const serviceResult = await findOrCreateService(row, services);
    const service = serviceResult.service;
    if (serviceResult.created) createdServices += 1;
    const city = deterministicPick(cities, `${row.rawTitle}:${sourceNumber}:city`);
    const classification = classifyQuestion({ text: `${row.rawTitle}\n${row.rawQuestion}`, service: toWizardService(service) });
    const enriched = buildEnrichedQuestion({
      rawText: row.rawQuestion || row.rawTitle,
      city: {
        id: city.id,
        name: city.name,
        namePrepositional: city.namePrepositional ?? city.name,
        slug: city.slug,
        region: city.region,
        federalDistrict: city.federalDistrict,
        isActive: city.isActive,
        seoText: city.seoText
      },
      service: toWizardService(service),
      classification,
      answers: {}
    });
    const title = enrichTitle(row, enriched.title);
    const titleKey = questionDedupeKey(title);
    if (options.append && titleKey && existingTitleKeys.has(titleKey)) {
      skippedDuplicateQuestions += 1;
      continue;
    }
    const text = enrichQuestionText(row.rawQuestion);
    const lawyer = pickLawyerForService(lawyerOrder, service, importedQuestions);
    const fixtureAnswer = cleanImportedAnswer(row.lawyerAnswer);
    const answerQuality = fixtureAnswer ? analyzeLawyerAnswerQuality(fixtureAnswer) : null;
    const canPublishFixtureAnswer = Boolean(
      fixtureAnswer && answerQuality && (options.allowAllFixtureAnswers || isPublicImportAnswer(answerQuality))
    );
    const answerCreate =
      fixtureAnswer && answerQuality && canPublishFixtureAnswer
        ? {
            lawyerId: lawyer.id,
            text: fixtureAnswer,
            authorType: "ADMIN_ASSISTED" as const,
            publishedByAdmin: true,
            status: "PUBLISHED" as const,
            qualityStatus: "APPROVED" as const,
            containsContactAttempt: options.allowAllFixtureAnswers ? false : answerQuality.containsContactAttempt,
            containsUnsupportedLegalClaim: options.allowAllFixtureAnswers ? false : answerQuality.containsUnsupportedLegalClaim,
            containsFearPressure: options.allowAllFixtureAnswers ? false : answerQuality.containsFearPressure,
            containsGenericLeadBait: options.allowAllFixtureAnswers ? false : answerQuality.containsGenericLeadBait,
            legalReferencesVerified: answerQuality.legalReferencesVerified,
            answerReviewStatus: answerQuality.reviewStatus,
            answerReviewReason: answerQuality.reviewReason,
            editorReviewedAt: new Date(),
            moderationComment: "Imported from fixture and assigned to an existing lawyer profile by dev import.",
            answerQualityScore: options.allowAllFixtureAnswers ? Math.max(answerQuality.score, 70) : answerQuality.score,
            isModerated: true,
            publishedAt: new Date()
          }
        : undefined;

    if (!fixtureAnswer) {
      skippedEmptyAnswers += 1;
      if (options.requirePublicAnswer) continue;
    } else if (!answerCreate) {
      skippedLowQualityAnswers += 1;
      if (options.requirePublicAnswer) continue;
    } else {
      usedLawyerIds.add(lawyer.id);
    }

    const number = startingPublicNumber + importedQuestions;
    const question = await prisma.question.create({
      data: {
        publicNumber: String(number),
        title,
        slug: slugify(`q-${number}-${title}`),
        text,
        rawText: row.rawQuestion || row.rawTitle,
        enrichedTitle: title,
        enrichedText: text,
        enrichmentStatus: "FIXTURE_ENRICHED",
        preliminaryAnswer: null,
        preliminaryAnswerStatus: "NOT_REQUESTED",
        scenarioId: classification.scenario.scenarioId,
        legalStage: classification.legalStage,
        urgency: classification.urgency,
        riskLevel: classification.riskLevel,
        facts: [],
        missingFacts: enriched.missingFacts,
        clarificationAnswers: {},
        leadScore: 0,
        seoQualityScore: calculateSeoQualityScore({ title, text, confirmed: true }),
        userConfirmedEnrichmentAt: new Date(),
        aiAssisted: false,
        editorReviewedAt: new Date(),
        indexabilityReason: "Imported from local Pravoved fixture. Public in Q&A, noindex until separate SEO review.",
        userName: generateQuestionAuthorName(row, number, fixtureAnswer),
        userEmail: null,
        isAnonymous: true,
        notificationsEnabled: false,
        cityId: city.id,
        serviceId: service.id,
        sourcePage: options.sourceFileName ?? "pravoved_fixture.xlsx",
        summary: null,
        status: "PUBLISHED",
        qualityStatus: "APPROVED",
        moderationComment: "Imported from local Pravoved fixture and enriched in development.",
        hasAttachments: false,
        trustScore: 0,
        isDuplicate: false,
        isIndexable: false,
        publishedAt: new Date(),
        answers: answerCreate ? { create: answerCreate } : undefined
      }
    });

    if (question.id) {
      importedQuestions += 1;
      if (dedupeKey) existingQuestionKeys.add(dedupeKey);
      if (titleKey) existingTitleKeys.add(titleKey);
    }
    if (question.id && answerCreate) importedAnswers += 1;
  }

  const deletedUnusedFixtureServices = options.append ? 0 : await cleanupUnusedFixtureServices();

  return {
    deletedQuestions,
    importedQuestions,
    importedAnswers,
    skippedEmptyAnswers,
    skippedLowQualityAnswers,
    skippedDuplicateQuestions,
    createdServices,
    deletedUnusedFixtureServices,
    usedLawyers: usedLawyerIds.size
  };
}

async function clearCurrentQa() {
  const deletedQuestions = await prisma.question.count();
  await prisma.lead.updateMany({ where: { questionId: { not: null } }, data: { questionId: null } });
  await prisma.contentReport.deleteMany({ where: { OR: [{ questionId: { not: null } }, { answerId: { not: null } }] } });
  await prisma.question.deleteMany();
  return deletedQuestions;
}

function emptyQuestionIndex() {
  return {
    nextPublicNumber: 1,
    questionKeys: new Set<string>(),
    titleKeys: new Set<string>()
  };
}

async function loadExistingQuestionIndex() {
  const questions = await prisma.question.findMany({
    select: { publicNumber: true, rawText: true, text: true, title: true }
  });
  const index = emptyQuestionIndex();
  const maxNumber = questions.reduce((max, question) => {
    const value = Number.parseInt(question.publicNumber ?? "", 10);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  index.nextPublicNumber = maxNumber + 1;
  for (const question of questions) {
    const key = questionDedupeKey(question.rawText || question.text || question.title);
    const titleKey = questionDedupeKey(question.title);
    if (key) index.questionKeys.add(key);
    if (titleKey) index.titleKeys.add(titleKey);
  }
  return index;
}

function questionDedupeKey(value: string) {
  return normalizeHeader(cleanText(value)).slice(0, 500);
}

// Dev/sample lawyers are hidden from public surfaces, so answers assigned to them
// vanish from the public Q&A. Never assign imported answers to them.
const SAMPLE_LAWYER_SLUG_PREFIXES = ["demo-lawyer", "sample-lawyer"];
const excludeSampleLawyers = { NOT: SAMPLE_LAWYER_SLUG_PREFIXES.map((prefix) => ({ slug: { startsWith: prefix } })) };

async function getImportLawyers() {
  const approved = await prisma.lawyer.findMany({
    where: { active: true, blocked: false, profileStatus: "APPROVED", ...excludeSampleLawyers },
    include: { services: { include: { service: true } }, cities: { include: { city: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
  });
  if (approved.length) return approved;

  return prisma.lawyer.findMany({
    where: { ...excludeSampleLawyers },
    include: { services: { include: { service: true } }, cities: { include: { city: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
  });
}

function pickLawyerForService(lawyerOrder: ImportLawyer[], service: ImportService, questionIndex: number) {
  const specializationNames = new Set(
    [service.name, ...getHarantSpecializationAliases(service.name)].map((name) => normalizeHarantCategoryName(name))
  );
  const candidates = lawyerOrder.filter((lawyer) =>
    lawyer.services.some(({ service: lawyerService }) => {
      return (
        lawyerService.id === service.id ||
        (service.parentId ? lawyerService.id === service.parentId : false) ||
        specializationNames.has(normalizeHarantCategoryName(lawyerService.name))
      );
    })
  );
  const matchedLawyers = candidates.length ? candidates : lawyerOrder;
  return matchedLawyers[questionIndex % matchedLawyers.length];
}

async function findOrCreateService(row: FixtureRow, services: ImportService[]) {
  const categoryName = cleanCategoryName(row);
  const category = normalize(categoryName);
  const existing = services.find((service) => normalize(service.name) === category);
  if (existing) return { service: existing, created: false };

  const service = await prisma.service.create({
    data: {
      name: categoryName,
      slug: await uniqueServiceSlug(slugify(categoryName)),
      shortDescription: `Вопросы по теме: ${categoryName}`,
      fullDescription: `Юридические вопросы по теме "${categoryName}" из локального dev fixture.`,
      isActive: true
    }
  });
  services.push(service);
  return { service, created: true };
}

async function ensureHarantQuestionServices(services: ImportService[]) {
  let created = 0;
  for (const categoryName of HARANT_QUESTION_CATEGORIES) {
    const category = normalize(categoryName);
    if (services.some((service) => normalize(service.name) === category)) continue;

    const service = await prisma.service.create({
      data: {
        name: categoryName,
        slug: await uniqueServiceSlug(slugify(categoryName)),
        shortDescription: `Вопросы по теме: ${categoryName}`,
        fullDescription: `Категория вопросов из фильтра Harant: "${categoryName}".`,
        isActive: true
      }
    });
    services.push(service);
    created += 1;
  }
  return created;
}

function cleanCategoryName(row: FixtureRow) {
  // The scraped source category (pravoved breadcrumb) reflects the ANSWERING
  // LAWYER's specialization, not the question topic — so it routinely mislabels
  // (credit questions under "Военное право", etc.). Classify by question CONTENT
  // first; only fall back to the (unreliable) source category when the text gives
  // no signal at all. See scripts/lib/classify-legal-question.ts.
  const byContent = classifyLegalQuestion(row.rawTitle, row.rawQuestion);
  if (byContent.score > 0) return byContent.category;

  const cleaned = cleanText(row.rawCategory).replace(/[.。]+$/g, "").trim();
  if (cleaned && !isQuestionLikeCategory(cleaned, row) && !isBrokenParsedCategory(cleaned)) {
    return canonicalQuestionCategoryName(cleaned);
  }
  return "Гражданские дела";
}

function canonicalQuestionCategoryName(category: string) {
  const normalized = normalize(category);
  const directAliases: Record<string, string> = {
    "семейное право": "Семейные дела",
    "семейные споры": "Семейные дела",
    "заключение и расторжение брака": "Заключение и расторжение брака",
    "развод": "Заключение и расторжение брака",
    "наследственное право": "Наследство",
    "трудовое право": "Трудовое право",
    "трудовые споры": "Трудовое право",
    "защита прав работников": "Трудовое право",
    "жилищное право": "Жилищные вопросы",
    "жилищные споры": "Жилищные вопросы",
    "жкх": "ЖКХ",
    "земельное право": "Земельные вопросы",
    "земельные споры": "Земельные вопросы",
    "автомобильное право": "Автоюристы",
    "автоюрист": "Автоюристы",
    "дтп гибдд пдд": "Автоюристы",
    "осаго каско": "Споры со страховыми компаниями",
    "лишение водительских прав": "Автоюристы",
    "банкротство": "Банкротство физических лиц",
    "защита прав потребителей": "Защита прав потребителя",
    "военное право": "Военное право",
    "защита прав призывников": "Военное право",
    "миграционное право": "Миграционные вопросы",
    "миграционные вопросы": "Миграционные вопросы",
    "гражданство": "Миграционные вопросы",
    "налоговое право": "Налоговое право",
    "налоговые споры": "Налоговое право",
    "арбитраж": "Арбитраж",
    "арбитражные споры": "Арбитраж",
    "предпринимательское право": "Обслуживание бизнеса",
    "бизнес и договоры": "Обслуживание бизнеса",
    "договорное право": "Гражданские дела",
    "гражданское право": "Гражданские дела",
    "уголовное право": "Уголовные дела",
    "административное право": "Административное право",
    "административные дела": "Административное право",
    "пенсии и пособия": "Пенсии и пособия",
    "пенсионные споры": "Пенсии и пособия",
    "социальное обеспечение": "Социальное обеспечение",
    "социальные выплаты": "Социальное обеспечение",
    "гарантии льготы компенсации": "Социальное обеспечение",
    "получение образования": "Прочие",
    "медицинское право": "Медицинское право",
    "интеллектуальная собственность": "Интеллектуальная собственность",
    "таможенное право": "Таможенное право",
    "доверенностинотариуса": "Составление документов",
    "нотариат": "Составление документов",
    "тендеры": "Тендеры и госзакупки",
    "тендерыизакупки": "Тендеры и госзакупки",
    "тендерыконтрактнаясистемавсферезакупок": "Тендеры и госзакупки",
    "контрактнаясистемавсферезакупок": "Тендеры и госзакупки",
    "страхование": "Споры со страховыми компаниями",
    "кредитование": "Кредитные вопросы и споры",
    "банковское право": "Банковское право",
    "исполнительное производство": "Исполнительное производство",
    "конституционное право": "Конституционное право",
    "международное право": "Международное право",
    "интернет и право": "Интернет-право",
    "интернет право": "Интернет-право",
    "взыскание задолженности": "Взыскание задолженности",
    "материнский капитал": "Социальное обеспечение",
    "произвол чиновников": "Правонарушения должностных лиц"
  };

  const direct = directAliases[normalized] ?? Object.entries(directAliases).find(([alias]) => normalize(alias) === normalized)?.[1] ?? category;
  if (harantQuestionCategorySet.has(direct)) return direct;
  if (/^онбыл$|^онабыла$|^онобыло$/.test(normalized)) return "Прочие";
  if (/доверенност|нотариус|нотариаль/.test(normalized)) return "Составление документов";
  if (/тендер|закупк|контрактнаясистема/.test(normalized)) return "Тендеры и госзакупки";
  if (/опек|усынов/.test(normalized)) return "Усыновление, опека, попечительство";
  if (/семейн|ребен|ребён/.test(normalized)) return "Семейные дела";
  if (/алимент/.test(normalized)) return "Алименты";
  if (/развод|расторжен.*брак/.test(normalized)) return "Заключение и расторжение брака";
  if (/раздел.*имуществ/.test(normalized)) return "Раздел имущества";
  if (/наслед/.test(normalized)) return "Наследство";
  if (/ипотек/.test(normalized)) return "Ипотека";
  if (/недвиж|собственност|ипотек/.test(normalized)) return "Недвижимость";
  if (/жкх|коммун/.test(normalized)) return "ЖКХ";
  if (/жилищ/.test(normalized)) return "Жилищные вопросы";
  if (/труд|работник|работодатель|зарплат|увольнен/.test(normalized)) return "Трудовое право";
  if (/банкрот.*юр|банкротствоюрид/.test(normalized)) return "Банкротство юридических лиц";
  if (/банкрот/.test(normalized)) return "Банкротство физических лиц";
  if (/авто|гибдд|дтп|водител/.test(normalized)) return "Автоюристы";
  if (/осаго|каско|страх/.test(normalized)) return "Споры со страховыми компаниями";
  if (/потребител|возврат|товар|услуг/.test(normalized)) return "Защита прав потребителя";
  if (/военн|призыв|мобилиз|сво/.test(normalized)) return "Военное право";
  if (/миграц|гражданств|внж|рвп/.test(normalized)) return "Миграционные вопросы";
  if (/налог/.test(normalized)) return "Налоговое право";
  if (/земел/.test(normalized)) return "Земельные вопросы";
  if (/арбитраж/.test(normalized)) return "Арбитраж";
  if (/бизнес|предприним/.test(normalized)) return "Обслуживание бизнеса";
  if (/договор|граждан/.test(normalized)) return "Гражданские дела";
  if (/наркот/.test(normalized)) return "Дела по наркотикам";
  if (/мошеннич/.test(normalized)) return "Мошенничество";
  if (/уголов|побои|хищен/.test(normalized)) return "Уголовные дела";
  if (/административ|штраф|коап/.test(normalized)) return "Административное право";
  if (/пенси/.test(normalized)) return "Пенсии и пособия";
  if (/социал|пособ|выплат|льгот|компенсац/.test(normalized)) return "Социальное обеспечение";
  if (/медицин|здоров|больниц/.test(normalized)) return "Медицинское право";
  if (/кредит/.test(normalized)) return "Кредитные вопросы и споры";
  if (/банк|банков/.test(normalized)) return "Банковское право";
  if (/исполнител/.test(normalized)) return "Исполнительное производство";
  if (/интернет/.test(normalized)) return "Интернет-право";
  if (/авторск/.test(normalized)) return "Защита авторских прав";
  if (/интеллект/.test(normalized)) return "Интеллектуальная собственность";
  if (/ущерб|возмещ/.test(normalized)) return "Возмещение ущерба";
  if (/строител/.test(normalized)) return "Строительство";
  if (/тамож/.test(normalized)) return "Таможенное право";
  if (/туризм|турист/.test(normalized)) return "Туризм";
  if (/эколог/.test(normalized)) return "Экологическое право";
  if (/финанс/.test(normalized)) return "Финансовое право";
  if (/международ/.test(normalized)) return "Международное право";
  if (/конституц/.test(normalized)) return "Конституционное право";
  if (/чиновник|должност/.test(normalized)) return "Правонарушения должностных лиц";
  if (/нематериал/.test(normalized)) return "Нематериальные блага";
  if (/документ|заявлен|жалоб/.test(normalized)) return "Составление документов";
  if (/экспертиз/.test(normalized)) return "Юридическая экспертиза";
  return "Прочие";
}

function isBrokenParsedCategory(category: string) {
  return /^онбыл$|^онабыла$|^онобыло$|^этобыло$|^какбыть$|^чтоделать$/i.test(normalize(category));
}

function isQuestionLikeCategory(category: string, row: FixtureRow) {
  const normalized = category.toLowerCase();
  const title = cleanText(row.rawTitle).toLowerCase();
  const question = cleanText(row.rawQuestion).toLowerCase();
  const significantPart = normalized.slice(0, Math.min(normalized.length, 45));

  return (
    category.length > 55 ||
    category.includes("?") ||
    /^(здравствуйте|добрый день|подскажите|скажите|можно ли|имею ли|что делать|хочу|у меня)\b/i.test(category) ||
    (significantPart.length > 20 && (title.includes(significantPart) || question.includes(significantPart)))
  );
}

async function uniqueServiceSlug(slugBase: string) {
  const base = slugBase || "pravovye-voprosy";
  let slug = base.slice(0, 80);
  let index = 2;
  while (await prisma.service.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base.slice(0, 74)}-${index}`;
    index += 1;
  }
  return slug;
}

async function cleanupUnusedFixtureServices() {
  const candidates = await prisma.service.findMany({
    where: { fullDescription: { contains: "локального dev fixture" } },
    select: { id: true }
  });
  let deleted = 0;
  for (const service of candidates) {
    const questionCount = await prisma.question.count({ where: { serviceId: service.id } });
    if (questionCount > 0) continue;
    try {
      await prisma.service.delete({ where: { id: service.id } });
      deleted += 1;
    } catch {
      // Keep dev-created categories if another local fixture object references them.
    }
  }
  return deleted;
}

function isPublicImportAnswer(answerQuality: ReturnType<typeof analyzeLawyerAnswerQuality>) {
  return (
    answerQuality.score >= 60 &&
    !answerQuality.containsContactAttempt &&
    !answerQuality.containsUnsupportedLegalClaim &&
    !answerQuality.containsFearPressure &&
    !answerQuality.containsGenericLeadBait
  );
}

function enrichTitle(row: FixtureRow, fallbackTitle: string) {
  const preparedTitle = normalizePreparedSeoTitle(row.rawTitle);
  if (preparedTitle) {
    return finalizeSeoTitle(truncateTitle(preparedTitle, 115));
  }

  const questionTitle = buildSeoProblemTitle("", row.rawQuestion, fallbackTitle, row.rawCategory);
  const problemTitle = !isLowQualitySeoTitle(questionTitle)
    ? questionTitle
    : buildSeoProblemTitle(row.rawTitle, row.rawQuestion, fallbackTitle, row.rawCategory);

  return finalizeSeoTitle(truncateTitle(problemTitle, 115));
}

function normalizePreparedSeoTitle(value: string) {
  const title = normalizeRawTitleCandidate(normalizeTitleSource(value));
  if (!title || isLowQualitySeoTitle(title)) return "";
  return title.endsWith("?") ? title : `${title}?`;
}

function buildSeoProblemTitle(rawTitle: string, rawQuestion: string, fallbackTitle: string, rawCategory = "") {
  const title = normalizeTitleSource(rawTitle);
  const question = normalizeTitleSource(rawQuestion);
  const normalized = [title, question].filter(Boolean).join(" ");
  const lower = normalized.toLowerCase();

  const focused = matchFocusedSeoTitle(lower);
  if (focused) return focused;

  const thematic = matchThematicSeoTitle(lower, rawCategory);
  if (thematic) return thematic;

  const titleQuestion = extractDirectQuestionPhrase(title);
  if (titleQuestion && !isLowQualitySeoTitle(titleQuestion)) return titleQuestion;

  const directQuestion = extractDirectQuestionPhrase(normalized);
  if (directQuestion && !isLowQualitySeoTitle(directQuestion)) return directQuestion;

  const titleCandidate = normalizeRawTitleCandidate(title);
  if (titleCandidate && !isLowQualitySeoTitle(titleCandidate)) return titleCandidate;

  const sentence = extractTitleSentence(question) || extractTitleSentence(title);
  const sentenceQuestion = extractDirectQuestionPhrase(sentence);
  if (sentenceQuestion && !isLowQualitySeoTitle(sentenceQuestion)) return sentenceQuestion;

  const questionLike = normalizeQuestionLikeTitle(sentence);
  if (isLowQualitySeoTitle(questionLike)) {
    return fallbackTitleByCategory(rawCategory, normalized);
  }
  if (questionLike) return questionLike;

  const fallback = normalizeRawTitleCandidate(normalizeTitleSource(fallbackTitle));
  if (fallback && !isLowQualitySeoTitle(fallback)) return fallback;

  return fallbackTitleByCategory(rawCategory, normalized);
}

function normalizeRawTitleCandidate(value: string) {
  return value
    .replace(/[?!.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchFocusedSeoTitle(lower: string) {
  if (/(виновник.*скрыл|скрылся).*(гаи|гибдд|каско|постановлен|страхов)|каско.*(гаи|гибдд|постановлен)|постановлен.*(гаи|гибдд).*страхов/.test(lower)) {
    return "Что делать, если ГИБДД долго не выносит постановление после ДТП";
  }
  if (/нбки|кредитн.*истор|ки.*просроч|мфо.*закрыт|организац.*закрыл|чеков.*документ.*не осталось/.test(lower)) {
    return "Как исправить запись в НБКИ после погашения долга без документов";
  }
  if (/алиментн.*соглашен|недействительн.*сделк|реституц|исполнительн.*лист.*алимент/.test(lower)) {
    return "Как исполняется решение суда о возврате алиментов по недействительному соглашению";
  }
  if (/(снимал|снимала|снимаю|аренд).*квартир|квартир.*без договор|арендодател/.test(lower) && /(холодильник|бытов.*техник|сломал|сломался|требует деньги|пугает.*полици|пугает.*суд)/.test(lower)) {
    return "Что делать, если арендодатель требует компенсацию за сломанный холодильник без договора";
  }
  if (/налог|ндфл/.test(lower) && /(супруг|развод|раздел.*имуществ|квартир)/.test(lower)) {
    return "Возникнет ли НДФЛ при разделе денег от продажи квартиры супругами";
  }
  if (/незаконн.*уголовн.*преслед/.test(lower)) {
    return "Что делать при незаконном уголовном преследовании";
  }
  if (/комендат|курсант/.test(lower) && /лирик|прегабалин|наркот|психотроп/.test(lower)) {
    return "Как доложить в комендатуру, если курсант употребил Лирику";
  }
  if (/(вышла|вышел).*больничн|продолжительн.*больничн|вместо.*приняли.*сотрудник|работы.*нет/.test(lower)) {
    return "Что делать, если после больничного место занял другой сотрудник";
  }
  if (/(сгорел|пожар)/.test(lower) && /(аварийн.*дом|маневренн.*жиль|общежит|администрац)/.test(lower)) {
    return "Что делать, если сгорел аварийный дом и предлагают общежитие";
  }
  if (/штраф.*эвакуац|эвакуац.*штраф|делимобил|каршеринг/.test(lower)) {
    return "Можно ли уменьшить штраф каршеринга за эвакуацию автомобиля";
  }
  if (/(верификац|веренцификац|вериф|вывести деньги|вывод.*денег)/.test(lower) && /(без оплаты|бнз оплаты|обойти|както|как-то)/.test(lower)) {
    return "Можно ли вывести деньги без прохождения верификации";
  }
  if (/стоянк/.test(lower) && /(вещдок|веществен|264\.?1|уголовн)/.test(lower)) {
    return "Кто оплачивает стоянку автомобиля, признанного вещественным доказательством";
  }
  if (/(номерн.*знак|госномер|регистрационн.*знак)/.test(lower) && /(наслед|смерт|умер|умерл)/.test(lower)) {
    return "Как оформить наследство на автомобильные номера после смерти владельца";
  }
  if (/(коз|животн|навоз)/.test(lower) && /(сосед|жалоб|огород|участок)/.test(lower)) {
    return "Что делать, если соседи жалуются на содержание коз";
  }
  if (/(сизо|колони|лагер|исправительн)/.test(lower) && /(нет связи|не выходит на связь|телефон|перевели|перевод)/.test(lower)) {
    return "Что делать, если нет связи с осужденным после перевода в колонию";
  }
  if (/(сизо|колони|осужден)/.test(lower) && /(контракт|сво|военн)/.test(lower) && /(выплат|денег|компенсац)/.test(lower)) {
    return "Положены ли выплаты семье осужденного, заключившего контракт";
  }
  if (/(ребенок|дочь|подрост|несовершеннолет)/.test(lower) && /(абхаз|поедет|отдых|тет|тёт|оставить)/.test(lower) && /доверенн/.test(lower)) {
    return "Нужна ли доверенность для поездки несовершеннолетней дочери в Абхазию";
  }
  if (/(подрост|15 лет|несовершеннолет)/.test(lower) && /(тет|тёт|оставить|10 дней)/.test(lower)) {
    return "Можно ли оставить подростка с родной тетей без доверенности";
  }
  if (/(брат|родственник)/.test(lower) && /(безвест|пропал|пропавш)/.test(lower) && /(сво|армии|военн)/.test(lower) && /(увол|служб)/.test(lower)) {
    return "Можно ли уволиться из армии, если брат пропал без вести на СВО";
  }
  if (/(нис|накопительно|ипотек)/.test(lower) && /(возвращать|вернуть|средств|досроч)/.test(lower)) {
    return "Нужно ли возвращать средства НИС после досрочного погашения военной ипотеки";
  }
  if (/(ходатайств|срок.*давност)/.test(lower) && /(264|ук рф|уголов)/.test(lower)) {
    return "Как подать ходатайство о сроке давности по статье 264 УК РФ";
  }
  if (/(безвест|погибш|отец)/.test(lower) && /(выплат|признать|отсутствующ)/.test(lower)) {
    return "Как признать отца погибшим и получить выплаты";
  }
  if (/участник.*сво|сво/.test(lower) && /(арест|исполнительн.*производ|ип)/.test(lower) && /(банк|счет|счёт)/.test(lower)) {
    return "Как снять арест со счета участника СВО после приостановления исполнительного производства";
  }
  if (/(бывш.*муж|бывш.*супруг)/.test(lower) && /(выпис|квартир|не проживает)/.test(lower)) {
    return "Как выписать бывшего мужа из квартиры, если он давно не проживает";
  }
  if (/(гос\s*номер|госномер|регистрационн.*номер)/.test(lower) && /(архив|восстанов)/.test(lower)) {
    return "Можно ли восстановить госномер автомобиля после передачи в архив";
  }
  if (/адм\.?комисс|административн.*комисс/.test(lower) && /(ущерб|уведомл|обвиняем)/.test(lower)) {
    return "Может ли административная комиссия определять ущерб без уведомления стороны";
  }
  if (/(мобилиз|военнослуж|сво)/.test(lower) && /(минно|взрывн|травм|перелом|палец|плюснев)/.test(lower)) {
    return "Как пройти ВВК после минно-взрывной травмы у мобилизованного";
  }
  if (/(обжал|оспор)/.test(lower) && /(решени|отказ|постановлен|заключен|ввк|комисс)/.test(lower)) {
    return "Как обжаловать решение или отказ по правовой ситуации";
  }
  if (/(переул|темн|ночью|камер)/.test(lower) && /(16 лет|несовершеннолет|друг)/.test(lower)) {
    return "Что грозит несовершеннолетним за конфликт ночью без камер";
  }
  if (/(выехать из россии|выезд из россии|покинуть россию)/.test(lower) && /(вернуться|комисс|военкомат|медкомисс)/.test(lower)) {
    return "Можно ли выехать из России и вернуться перед комиссией";
  }
  if (/(казахстан|гражданин казахстана)/.test(lower) && /(доминикан|90 дней|срок пребыван|въезд|выезд)/.test(lower)) {
    return "Как считать срок пребывания гражданина Казахстана за границей";
  }
  if (/(минобороны|\bмо\b|военнослуж|военн)/.test(lower) && /(нуждающ.*жиль|статус.*нуждающ|жилье|жильё)/.test(lower)) {
    return "Какие условия признания военнослужащего нуждающимся в жилье";
  }
  if (/(материнск|маткапитал|мат капитал)/.test(lower) && /(несовершеннолет|ребен|ребён|дол)/.test(lower) && /(квартир|покуп|сделк)/.test(lower)) {
    return "Как проверить покупку квартиры с маткапиталом и долей несовершеннолетнего";
  }
  if (/(полиц|участков|заявлен|объяснен|протокол)/.test(lower) && /(писать|довериться|самому|прибывш)/.test(lower)) {
    return "Как правильно написать заявление или объяснение полиции";
  }
  if (/(судебн.*письм|письм.*суд|извещен.*суд|повестк)/.test(lower) && /(пропис|фактическ.*адрес|вернул|вернулась|другом городе)/.test(lower)) {
    return "Что делать, если судебное письмо пришло по месту прописки";
  }
  if (/(как вам написать|с вами связаться|написать в макс|срочно.*связаться)/.test(lower)) {
    return "Как получить юридическую консультацию по военному вопросу";
  }
  if (/(перевезти вещи|перевозк|частник|залог|паспорт)/.test(lower) && /(другой город|гаранти|вещ)/.test(lower)) {
    return "Как безопасно оформить перевозку вещей частным перевозчиком";
  }
  if (/(удо|условно-досроч|поселен)/.test(lower) && /(срок|3\/4|три четверти|когда)/.test(lower)) {
    return "Когда можно подать на УДО после перевода в колонию-поселение";
  }
  if (/(подписк|списыв|im-gpt|gpt|каждый месяц|599|отписаться)/.test(lower) && /(деньг|карта|отмен|списывает|отписаться)/.test(lower)) {
    return "Как отменить списание 599 рублей за подписку IM-GPT";
  }
  if (/(запрет.*мвд|мвд.*запрет|запрет.*въезд|реестр.*контролируемых)/.test(lower)) {
    return "Как узнать причину запрета МВД и оспорить ограничение";
  }
  if (/(модель|окрашиван|волос)/.test(lower) && /(требуют|доплат|16000|материал)/.test(lower)) {
    return "Законно ли требовать доплату за окрашивание у модели";
  }
  if (/(второй котел|второй котёл|газов|бассейн|проект)/.test(lower) && /(нежил|служб|согласован|подключить)/.test(lower)) {
    return "Можно ли подключить второй газовый котел без согласования";
  }
  if (/(авто|автомобил|машин)/.test(lower) && /(грузии|грузинск|пмж грузии|временно ввез)/.test(lower)) {
    return "Можно ли временно ввезти автомобиль из Грузии без обеспечительного взноса";
  }
  if (/(отключить воду|воду отключ|водоснабжен)/.test(lower) && /(многодет|сельсовет|договора нет|село)/.test(lower)) {
    return "Имеют ли право отключить воду многодетной семье без договора";
  }
  if (/(паев|сельхоз|земл)/.test(lower) && /(налог|пенсионер|уведомлен)/.test(lower)) {
    return "Должен ли пенсионер платить налог за паевые земли сельхозназначения";
  }
  if (/(земельн.*участ|участок)/.test(lower) && /(вид разрешенного использования|домклик|садоводств|классификатор)/.test(lower)) {
    return "Что проверить перед покупкой участка с несоответствием вида разрешенного использования";
  }
  if (/соч|самовольн.*част|сбежал.*част|самовольно.*остав|оставлен.*част/.test(lower)) {
    return "Что грозит военнослужащему за самовольное оставление части";
  }
  if (/наслед/.test(lower) && /(не вступ|пропуст|срок)/.test(lower)) {
    return /сво|военн/.test(lower)
      ? "Как вступить в наследство, если срок пропущен из-за СВО"
      : "Как вступить в наследство, если срок пропущен";
  }
  if (/материнск|маткапитал|материнский капитал/.test(lower) && /земельн|участ/.test(lower)) {
    return "Можно ли продать земельный участок, купленный на материнский капитал";
  }
  if (/дарствен|подарить|дарени/.test(lower) && /(доч|дет|реб[её]н)/.test(lower) && /(бывш.*муж|соглас)/.test(lower)) {
    return "Можно ли подарить доли в квартире дочерям без согласия бывшего мужа";
  }
  if (/пенсионер.*80|80 лет/.test(lower) && /одиноко проживающ|льгот/.test(lower)) {
    return "Может ли пенсионер старше 80 лет получить льготы как одиноко проживающий";
  }
  if (/платн.*парков|штраф.*парков|парков.*штраф/.test(lower)) {
    return "Как оспорить штраф за платную парковку и судебные расходы";
  }
  if (/мобилиз|сво|военнослуж/.test(lower) && /демоб|увольн|вернуть/.test(lower)) {
    return "Можно ли уволиться с военной службы по семейным обстоятельствам";
  }
  if (/мобилиз|сво/.test(lower) && /жена.*развест|развод/.test(lower) && /дет/.test(lower)) {
    return "Что делать при разводе с мобилизованным супругом и споре о детях";
  }
  if (/военнослуж|контракт/.test(lower) && /(новую часть|другую часть|перевод|командировк)/.test(lower)) {
    return "Можно ли оспорить перевод военнослужащего в другую часть";
  }
  if (/гражданин.*кыргыз|кыргызстан|миграц|рвп|внж/.test(lower) && /(жена|дет|семь|документ)/.test(lower)) {
    return "Какие документы нужны, чтобы перевезти семью в Россию";
  }
  if (/доверен/.test(lower) && /(почт|выплат|деньг|пенси|пособ)/.test(lower)) {
    return "Можно ли получить выплату по доверенности на родственника";
  }
  if (/освидетельств|каннабиноид|наркот|опьян/.test(lower)) {
    return "Какой показатель нужен для признания наркотического опьянения";
  }
  if (/купил.*машин|автомобил/.test(lower) && /(не у собствен|переоформ|реальн.*владельц)/.test(lower)) {
    return "Что делать, если купил автомобиль не у собственника";
  }
  if (/нанимател|заказчик/.test(lower) && /(не плат|отказывается платить|выполнен.*работ)/.test(lower)) {
    return "Как взыскать оплату за выполненные работы";
  }
  if (/отменить подписк|подписк/.test(lower)) {
    return "Как отменить подписку и вернуть списанные деньги";
  }
  if (/отправила деньги|отправил деньги/.test(lower) && /юрист/.test(lower)) {
    return "Что делать, если деньги за юридическую услугу отправлены ошибочно";
  }
  if (/(снимаю квартиру|арендодател|арендатор)/.test(lower) && /(залог|вымогательств)/.test(lower)) {
    return "Куда обратиться, если арендодатель требует залог вне договора";
  }
  if (
    /(онлайн[-\s]*(курс|школ|обуч)|интернет[-\s]*(курс|школ|обуч)|образовательн[а-яё\s]+платформ|платформ[а-яё\s]+обуч|курс[а-яё\s]{0,24}(онлайн|обучени|рассрочк)|договор[а-яё\s]{0,32}онлайн[-\s]*курс)/.test(lower) &&
    /(возврат|стоимост|оплат|договор|расторг|отказ)/.test(lower)
  ) {
    return "Можно ли отказаться от онлайн-курса и уменьшить оплату по договору";
  }
  if (/шантаж|интимн.*фот/.test(lower)) {
    return "Что делать при шантаже интимными фотографиями";
  }
  if (/документ.*смерт|смерт.*документ|гибел.*муж|гибел.*сын/.test(lower) && /(воинск|сво|военнослуж|част)/.test(lower)) {
    return "Сколько ждать документы о смерти военнослужащего";
  }
  if (/наркодиспансер|справк.*амине|бумажн.*регистрац/.test(lower)) {
    return "Что делать, если наркодиспансер отказывает в выдаче справки";
  }
  if (/реестр\w*\s+контролируемых\s+лиц/.test(lower) && /реб[её]н/.test(lower)) {
    return "Что делать, если ребенок попал в реестр контролируемых лиц";
  }
  if (
    /(иск.*суд|обратиться.*суд|обратится.*суд|признани.*сделк|признать.*сделк)/.test(lower) &&
    /(дом|жил.*дом|квартир|дол.*собствен|маткапитал)/.test(lower) &&
    /(незакон|не закон|недействител|сделк)/.test(lower)
  ) {
    return "Можно ли признать сделку с домом недействительной через суд";
  }
  if (/гпк/.test(lower) && /истц/.test(lower) && /переписк.*ответчик/.test(lower)) {
    return "Есть ли по ГПК РФ обязанность истца вести переписку с ответчиком";
  }
  if (/побои|избил|избиени|травмпункт|участков/.test(lower)) {
    return "Что делать, если после побоев потерпевший отказался от заявления";
  }
  if (/общедомов.*имуществ|кондиционер|наружн.*блок/.test(lower) && /сосед/.test(lower)) {
    return "Как убрать кондиционер соседа с общедомового имущества";
  }
  if (/судебн.*приказ/.test(lower) && /(мкк|пко|долг|взыскател)/.test(lower)) {
    return "Что делать, если долг передан другому взыскателю после судебного приказа";
  }
  if (/алим/.test(lower) && /(взыск|подать|ребен|дет)/.test(lower)) {
    return "Как взыскать алименты на ребенка и какие документы нужны";
  }
  if (/(бывш.*жен|бывш.*муж|развод)/.test(lower) && /кредит.*машин|машин.*кредит/.test(lower)) {
    return "Должен ли бывший супруг платить кредит за машину после развода";
  }
  if (/долг|кредит|банкрот|пристав|исполнительн/.test(lower) && /(спис|взыск|арест|плат)/.test(lower)) {
    return "Что делать с долгом, кредитом или исполнительным производством";
  }
  if (/увольн|работодател|зарплат|трудов/.test(lower)) {
    return "Что делать при нарушении трудовых прав работником или работодателем";
  }
  return null;
}

function matchThematicSeoTitle(lower: string, rawCategory = "") {
  const category = rawCategory.toLocaleLowerCase("ru-RU");

  if (/(пристав|исполнительн|судебн.*приказ|арест.*счет|арест.*счёт|взыскан|коллектор)/.test(lower) && !/(работодатель|зарплат|трудов|увольн)/.test(lower)) {
    return "Как действовать при взыскании долга через приставов";
  }
  if (/(банкрот|мфо|микрозайм|кредитн.*карт|долг)/.test(lower) && /(спис|процедур|задолжен|платить|банк)/.test(lower)) {
    return "Как решить вопрос с долгами и банкротством";
  }
  if (/(ипотечн.*квартир|квартир.*ипотек|ипотек)/.test(lower) && /(банкрот|раздел|реализац|сохран|что будет)/.test(lower)) {
    return "Что будет с ипотечной квартирой при банкротстве или споре";
  }
  if (/алимент/.test(lower)) {
    return "Как взыскать или изменить алименты на ребенка";
  }
  if (/(развод|расторжен.*брак)/.test(lower) && /(дет|ребен|ребён|супруг|муж|жена)/.test(lower)) {
    return "Как оформить развод и решить спор о детях";
  }
  if (/(раздел.*имуществ|совместно.*нажит|имущество супруг|доля супруг)/.test(lower)) {
    return "Как разделить имущество супругов после развода";
  }
  if (/(супруг|муж|жена|бывш)/.test(lower) && /(подар|перевод|деньг|вернуть|взыск)/.test(lower)) {
    return "Может ли супруг взыскать подарки и переводы после брака";
  }
  if (/(материнск|маткапитал|мат капитал)/.test(lower) && /(квартир|дом|дол|ребен|ребён|несовершеннолет)/.test(lower)) {
    return "Как проверить сделку с маткапиталом и долей ребенка";
  }
  if (/наслед|завещан|нотариус|умер|смерт/.test(lower)) {
    return "Как оформить наследство и защитить свои права";
  }
  if (/(выпис|снять с регистрац|регистрац)/.test(lower) && /(квартир|жиль|пропис)/.test(lower)) {
    return "Как выписать человека из квартиры через суд";
  }
  if (/(аренд|снимал|снимаю|нанимател|залог|съемн|съёмн)/.test(lower) && /(квартир|жиль|договор|собственник)/.test(lower)) {
    return "Как решить спор по аренде квартиры";
  }
  if (/(покуп|продаж|сделк|договор)/.test(lower) && /(квартир|дом|участок|недвижим|дол)/.test(lower)) {
    return "Как проверить сделку с недвижимостью перед покупкой";
  }
  if (/(жкх|коммунал|управляющ|капремонт|снт|сосед|общедомов)/.test(lower)) {
    return "Как решить жилищный спор или вопрос ЖКХ";
  }
  if (/(земельн|участок|межеван|границ|кадастр)/.test(lower)) {
    return "Как решить спор по земельному участку";
  }
  if (/(сво|мобилиз|военнослуж|контракт|воинск|рапорт|част[ьи]|армии)/.test(lower) && /(выплат|компенсац|пособ|ранен|гибел|погиб|увольн)/.test(lower)) {
    return "Какие выплаты положены военнослужащему или семье участника СВО";
  }
  if (/(жена|супруга)/.test(lower) && /(участник|муж|человек)/.test(lower) && /(сво|военн|фсин|част)/.test(lower)) {
    return "Какие действия может предпринять жена участника СВО";
  }
  if (/(ввк|категор.*годност|комиссова|комисс|годен|годности)/.test(lower) && /(воен|служб|мобилиз|призыв|сво)/.test(lower)) {
    return "Как оспорить решение ВВК и категорию годности";
  }
  if (/(увол|рапорт|расторг.*контракт|перевод)/.test(lower) && /(военнослуж|контракт|сво|част[ьи]|армии)/.test(lower)) {
    return "Как подать рапорт по вопросу военной службы";
  }
  if (/(призыв|военкомат|повестк|отсрочк)/.test(lower)) {
    return "Как действовать при вопросах призыва и военкомата";
  }
  if (/(патент|внж|рвп|гражданств|миграц|запрет.*въезд|выдворен|иностранн|казахстан|кыргыз|азербайджан|туркменистан)/.test(lower)) {
    return "Как решить вопрос с гражданством и миграционными документами";
  }
  if (/(поездк|поехать|въезд|выезд|границ|запрет)/.test(lower) && /(последнее время|ограничен|росси|абхаз|симферопол|крым)/.test(lower)) {
    return "Можно ли выехать или въехать при действующих ограничениях";
  }
  if (/(возврат|вернуть деньги|подписк|курс|услуг|товар|покупк|заказ|продавец|исполнитель)/.test(lower)) {
    return "Как защитить права потребителя и вернуть деньги";
  }
  if (/(увольн|работодатель|зарплат|больничн|отпуск|трудов|декрет|сокращен|компенсац)/.test(lower)) {
    return "Как защитить трудовые права работника";
  }
  if (/(налог|ндфл|деклараци|фнс|самозанят|ип|доход)/.test(lower)) {
    return "Как разобраться с налогом и декларацией";
  }
  if (/(штраф|коап|постановлен|административн|комисс)/.test(lower)) {
    return "Как оспорить штраф или административное постановление";
  }
  if (/(дтп|гибдд|водител|лишен.*прав|осаго|каско|автомобил|машин|эвакуац|штрафстоян)/.test(lower)) {
    return "Как решить спор по автомобилю, ДТП или штрафам";
  }
  if (/(полици|следств|уголовн|ук рф|побои|мошеннич|краж|наркот|заявлен|протокол|проверка)/.test(lower)) {
    return "Как действовать по уголовному делу или проверке";
  }
  if (/(доверенн|нотариаль|нотариус|документ|заявлен|жалоб)/.test(lower)) {
    return "Как правильно оформить юридический документ";
  }
  if (/(школ|учеб|студент|институт|егэ|образован|пмпк|аттестат)/.test(lower)) {
    return "Как решить спор по учебе или образованию";
  }
  if (/(пенси|пособ|социальн|льгот|инвалид|выплат)/.test(lower)) {
    return "Как получить пенсию, пособие или социальную выплату";
  }
  if (/(медицин|больниц|врач|операц|здоров|справк)/.test(lower)) {
    return "Как защитить права пациента в медицинском вопросе";
  }
  if (/(тендер|закупк|44-фз|223-фз|контрактн.*систем)/.test(lower)) {
    return "Как решить спор по тендеру или госзакупке";
  }
  if (/семейн|алимент|брак|развод|дет/.test(category)) {
    return "Как решить семейный спор и защитить права ребенка";
  }
  if (/военн|призыв|сво|мобилиз/.test(category)) {
    return "Как действовать по вопросу военной службы";
  }
  if (/жилищ|жкх|недвиж|земел/.test(category)) {
    return "Как решить спор с жильем или недвижимостью";
  }
  return null;
}

function isLowQualitySeoTitle(title: string) {
  const normalized = title.toLocaleLowerCase("ru-RU");
  return (
    !title ||
    title.length > 105 ||
    /\[контакт скрыт платформой\]|материалах на сайте|личн(ой|ая|ую)\s+переписк|с уважением/.test(normalized) ||
    /что делать, если (как|что|какой|какие|где|почему|есть|нужна|можно|могу)\b/.test(normalized) ||
    /(сколько по времени ждать|сколько ждать должна|сколько ждать должен|какие мои действия|какие дальнейшие действия)/.test(normalized) ||
    /\b(в данном случае|в этом случае)\b/.test(normalized) ||
    /\b(что б|какой исход|следующий вопрос|подскажите|скажите|нужна консультация|как это правильно|пожалуйста|как-то|как то)\b/.test(normalized) ||
    /^(я|мы|у меня|у нас|мой|моя|мои|сын|дочь|муж|жена|отец|мама|соседи|сотрудник|ребенок|квартира|машина)(\s|$)/i.test(normalized) ||
    /^(и|или)(\s|$)/i.test(normalized) ||
    /\b(которые|который|которая|что|чтобы|если|без|но|и|как|в|на|с|по|о|об|от|для|при|г)$/i.test(normalized) ||
    /^(какие документы нужны|какие выплаты положены|как отменить арест|как правильно поступить|можно ли восстановить|сколько это законно|обязана ли платить|мне срочно нужно.*|как решить правовой.*)$/i.test(normalized) ||
    /,\s*$/.test(title)
  );
}

function fallbackTitleByCategory(rawCategory: string, source: string) {
  const category = rawCategory.toLocaleLowerCase("ru-RU");
  const lower = source.toLocaleLowerCase("ru-RU");

  if (/военн|призыв|сво|мобилиз/.test(category) || /сво|военнослуж|контракт|част[ьи]|рапорт|ввк/.test(lower)) {
    return "Как действовать по вопросу военной службы и выплат";
  }
  if (/труд|увольн|работ/.test(category) || /работодатель|увольн|больничн|зарплат|отпуск/.test(lower)) {
    return "Как защитить трудовые права работника";
  }
  if (/семейн|алимент|брак|развод|дет/.test(category) || /реб[её]нок|дети|развод|алимент|супруг/.test(lower)) {
    return "Как решить семейный спор и защитить права ребенка";
  }
  if (/наслед/.test(category) || /наслед|завещан|нотариус/.test(lower)) {
    return "Как оформить наследство и защитить свои права";
  }
  if (/миграц|гражданств|внж|патент/.test(category) || /гражданств|внж|патент|миграцион/.test(lower)) {
    return "Как решить вопрос с гражданством и миграционными документами";
  }
  if (/долг|кредит|банкрот|исполнител/.test(category) || /долг|кредит|пристав|банкрот|исполнительн/.test(lower)) {
    return "Что делать с долгом, кредитом или исполнительным производством";
  }
  if (/недвиж|жилищ|земел|жкх/.test(category) || /квартир|дом|жкх|участок|сосед/.test(lower)) {
    return "Как решить спор с недвижимостью или жильем";
  }
  if (/административ|штраф|коап/.test(category) || /штраф|коап|постановлен/.test(lower)) {
    return "Как оспорить штраф или административное постановление";
  }
  if (/уголов|побои|хищен/.test(category) || /уголов|полици|следств|побои|мошен/.test(lower)) {
    return "Как действовать по уголовному делу или проверке";
  }
  if (/налог/.test(category) || /налог|деклараци/.test(lower)) {
    return "Как разобраться с налогом и декларацией";
  }
  return "Юридическая консультация по ситуации";
}

function normalizeTitleSource(value: string) {
  return cleanText(value)
    .replace(/\s+/g, " ")
    .replace(/(^|[\s,!.])(приветствую вас|здравствуйте|добрый день|добрый вечер|привет)[,!. ]*/gi, " ")
    .replace(/(^|[\s,!.])(подскажите пожалуйста|скажите пожалуйста|подскажите|скажите|уточните|помогите разобраться с вопросом|прошу помощи)[, ]*/gi, " ")
    .replace(/(^|[\s,!.])(пожалуйста|приватный вопрос|нужна правовая оценка ситуации и возможного порядка действий|прошу оценить возможные действия, сроки, документы и риски)[,. ]*/gi, " ")
    .replace(/(^|[\s,!.])вопрос[,:\s]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDirectQuestionPhrase(value: string) {
  const source = value.replace(/\s+/g, " ").trim();
  const lower = source.toLowerCase();
  const markers = [
    "что делать",
    "что можно сделать",
    "как быть",
    "как поступить",
    "как действовать",
    "как правильно",
    "как получить",
    "как оформить",
    "как привлечь",
    "как взыскать",
    "как отменить",
    "как оспорить",
    "как вернуть",
    "какие меры",
    "кто оплачивает",
    "кто должен",
    "где узнать",
    "почему",
    "куда обратиться",
    "какие документы нужны",
    "какие расходы",
    "какой расчетный счет",
    "какой показатель",
    "какая ответственность",
    "каковы пути",
    "сколько ждать",
    "сколько это",
    "когда подходит",
    "можно ли",
    "могу ли",
    "имею ли право",
    "имеют ли право",
    "обязана ли",
    "обязан ли",
    "полагается ли",
    "положена ли",
    "положено ли",
    "возникнет ли",
    "будет ли",
    "вправе ли",
    "придется ли",
    "должны ли",
    "какие выплаты",
    "нужно ли",
    "должен ли",
    "должна ли",
    "может ли",
    "есть ли",
    "стоит ли",
    "правомерно ли",
    "законно ли",
    "подпадает ли",
    "проводится ли",
    "проводиться ли",
    "существует ли"
  ];

  const match = markers
    .map((marker) => ({ marker, index: lower.indexOf(marker) }))
    .filter((item) => item.index >= 0)
    .sort((a, b) => a.index - b.index)[0];

  if (!match) return "";

  const phrase = cleanupSeoPhrase(source.slice(match.index));
  if (isGenericQuestionPhrase(phrase)) return "";
  return phrase.length >= 18 ? capitalizeFirst(truncateTitle(phrase, 95)) : "";
}

function cleanupSeoPhrase(value: string) {
  return removeRepeatedSeoFragments(value)
    .split(/[?!.]\s+/)[0]
    .replace(/[?!.]+$/g, "")
    .replace(/\s+(приветствую вас|здравствуйте|добрый день|добрый вечер|привет).*$/i, "")
    .replace(/\s+(нужна правовая оценка|прошу оценить).*$/i, "")
    .replace(/\s+(подскажите|объясните|уточните|скажите).*$/i, "")
    .replace(/\s+(какой исход|чем может закончиться|чем может закончится|может можно|что бы|что б|как правильно|как)\b.*$/i, "")
    .replace(/\s+(мне|нам|ему|ей|их|это|такое|в такой ситуации|в данной ситуации)\s*$/i, "")
    .replace(/\s+и\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isGenericQuestionPhrase(value: string) {
  return /^(что делать|что можно сделать|как быть|как поступить|что делать дальше|что делать в данной ситуации|что можно сделать в такой ситуации)$/i.test(
    value.trim()
  );
}

function extractTitleSentence(value: string) {
  const chunks = value
    .split(/(?<=[?!.])\s+|\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  const preferred = chunks.find((chunk) => chunk.length >= 28 && /[?]|^(как|можно ли|имею ли|какие|куда|что делать|нужно ли|законно ли|правомерно ли)\b/i.test(chunk));
  return preferred ?? chunks.find((chunk) => chunk.length >= 20) ?? chunks[0] ?? "";
}

function normalizeQuestionLikeTitle(value: string) {
  const withoutTrailing = value.replace(/[.?!]+$/g, "").trim();
  if (!withoutTrailing) return "";

  const directQuestion = extractDirectQuestionPhrase(withoutTrailing);
  if (directQuestion) return directQuestion;

  const declarative = withoutTrailing
    .replace(/^(если|что делать если)\s+/i, "")
    .replace(/^(я|мы)\s+/i, "")
    .replace(/^(у меня|у нас)\s+/i, "есть ")
    .trim();

  if (/^(есть|был|была|было|имеется|получил|получила|подан|купил|купила|муж|жена|ребенок|человек)\b/i.test(declarative)) {
    return `Что делать, если ${lowercaseFirst(declarative)}`;
  }

  return `Что делать, если ${lowercaseFirst(declarative)}`;
}

function capitalizeFirst(value: string) {
  return value ? `${value[0].toLocaleUpperCase("ru-RU")}${value.slice(1)}` : value;
}

function lowercaseFirst(value: string) {
  return value ? `${value[0].toLocaleLowerCase("ru-RU")}${value.slice(1)}` : value;
}

function finalizeSeoTitle(value: string) {
  const corrected = removeRepeatedSeoFragments(value)
    .replace(/\bобратится\b/gi, "обратиться")
    .replace(/\bне законн/gi, "незаконн")
    .replace(/\bбезвести\b/gi, "без вести")
    .replace(/\bпо больше\b/gi, "побольше")
    .replace(/\bпреватезировать\b/gi, "приватизировать")
    .replace(/\bпроводиться ли\b/gi, "проводится ли")
    .replace(/\bбки\b/gi, "БКИ")
    .replace(/\bдкп\b/gi, "ДКП")
    .replace(/\bудо\b/gi, "УДО")
    .replace(/\bсво\b/gi, "СВО")
    .replace(/\bвнж\b/gi, "ВНЖ")
    .replace(/\bогэ\b/gi, "ОГЭ")
    .replace(/\bпоо\s+гпк\s+рф\b/gi, "по ГПК РФ")
    .replace(/\bгк рф\b/gi, "ГК РФ")
    .replace(/\bгпк рф\b/gi, "ГПК РФ")
    .replace(/\bмвд\b/gi, "МВД")
    .replace(/\bжкх\b/gi, "ЖКХ")
    .replace(/\bрф\b/gi, "РФ")
    .replace(/\bвыплоту\b/gi, "выплату")
    .replace(/\bщаписаны\b/gi, "записаны")
    .replace(/\bбублично\b/gi, "публично")
    .replace(/\bоскорбид\b/gi, "оскорбил")
    .replace(/\bберенка\b/gi, "ребенка")
    .replace(/\bточь\b/gi, "дочь")
    .replace(/\bдола\b/gi, "дала")
    .replace(/\bсегоднешний\b/gi, "сегодняшний")
    .replace(/\bсмэ\b/gi, "СМЭ")
    .replace(/\s+т\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return ensureQuestionTitle(corrected, 115);
}

function ensureQuestionTitle(value: string, maxLength: number) {
  const normalized = value.replace(/[.!?]+$/g, "").replace(/\s+/g, " ").trim();
  const questionStart =
    /^(как|можно ли|могу ли|можем ли|имею ли|имеют ли|что|что делать|кто|куда|где|нужно ли|нужно|положены ли|положена ли|положен ли|полагается ли|полагаются ли|законно ли|правомерно ли|могут ли|может ли|сможет ли|смогу ли|имеет ли|должен ли|должна ли|должны ли|обязан ли|обязана ли|обязаны ли|какие|какой|какая|какова|каков|каким образом|сколько|возникнет ли|будет ли|будут ли|будем ли|придется ли|нужна ли|есть ли|стоит ли|когда|чем|почему|допускается ли|следует ли)([\s,]|$)/i.test(
      normalized.toLocaleLowerCase("ru-RU")
    );
  const question = questionStart
    ? normalized
    : normalized.toLocaleLowerCase("ru-RU").startsWith("юридическая консультация")
      ? "Как получить юридическую консультацию по ситуации"
      : `Как действовать, если ${lowercaseFirst(normalized)}`;
  return `${truncateTitle(question, maxLength - 1).replace(/[.!?]+$/g, "").trim()}?`;
}

function removeRepeatedSeoFragments(value: string) {
  let words = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  for (let size = Math.min(8, Math.floor(words.length / 2)); size >= 3; size -= 1) {
    const head = words.slice(0, size).join(" ").toLocaleLowerCase("ru-RU");
    const tail = words.slice(-size).join(" ").toLocaleLowerCase("ru-RU");
    if (head === tail) {
      words = words.slice(0, -size);
      break;
    }
  }
  return words.join(" ");
}

function truncateTitle(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const truncated = normalized.slice(0, maxLength + 1).replace(/\s+\S*$/, "").trim();
  return truncated || normalized.slice(0, maxLength).trim();
}

function enrichQuestionText(rawQuestion: string) {
  const cleaned = removeQuestionMetaLines(cleanText(rawQuestion));
  const focusedText = matchFocusedQuestionText(cleaned);
  return focusedText ?? (cleaned.length >= 40 ? cleaned : `${cleaned} Нужна правовая оценка ситуации.`);
}

function matchFocusedQuestionText(value: string) {
  const lower = value.toLocaleLowerCase("ru-RU");
  if (/комендат|курсант/.test(lower) && /лирик|прегабалин|наркот|психотроп/.test(lower)) {
    return "Курсант употребил препарат Лирика. Нужно понять, как правильно зафиксировать ситуацию и доложить об этом в комендатуру, какие документы оформить и какие риски могут возникнуть.";
  }
  if (/(вышла|вышел).*больничн|продолжительн.*больничн|вместо.*приняли.*сотрудник|работы.*нет/.test(lower)) {
    return "После продолжительного больничного сотрудник вышел на работу, но на его место уже приняли другого человека и сообщили, что работы больше нет. Нужно понять, какие действия доступны и как защитить трудовые права.";
  }
  return null;
}

function removeQuestionMetaLines(value: string) {
  return value
    .split("\n")
    .filter((line) => {
      const normalized = line.trim().toLowerCase();
      return !normalized.startsWith("категория права:") && !normalized.startsWith("город:") && !/^\d{1,2}:\d{2}$/.test(normalized);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanImportedAnswer(rawAnswer: string) {
  const normalized = cleanText(rawAnswer)
    .replace(/напишите\s+в\s+чат\s+поддержки\s+госуслуг/gi, "обратитесь в поддержку Госуслуг")
    .replace(/напишите\s+в\s+чат\s*:/gi, "направьте обращение в службу поддержки:")
    .replace(/напишите\s+в\s+чат\s+поддержки/gi, "направьте обращение в службу поддержки");
  return removeLeadBaitPhrases(normalized);
}

function removeLeadBaitPhrases(value: string) {
  return stripLeadBaitTail(value)
    .replace(/обращайтесь в личн\w*/gi, "")
    .replace(/пишите мне/gi, "")
    .replace(/звоните/gi, "")
    .replace(/контакты в профиле/gi, "")
    .replace(/свяжитесь напрямую/gi, "")
    .replace(/\[контакт скрыт платформой\]/gi, "")
    .replace(/\s+/g, " ")
    .replace(/[\s,;:.-]+$/g, "")
    .trim();
}

function stripLeadBaitTail(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const lower = normalized.toLocaleLowerCase("ru-RU");
  const tailMarkers = [
    "если вам нужна очень подробная консультация",
    "если вам нужна подробная консультация",
    "если вам требуется подробная консультация",
    "если вам потребуется подробная консультация",
    "если вам необходима подробная консультация",
    "если потребуется более подробная консультация",
    "если нужна платная консультация",
    "если вам необходима дополнительная консультация",
    "если вам необходима консультация",
    "если вам необходимо разобрать ваш вопрос детально",
    "если вам необходимо разобрать вопрос детально",
    "если вам необходимо разобрать ваш вопрос",
    "если нужна помощь",
    "для получения подробной консультации",
    "для получения квалифицированной юридической помощи",
    "для получения квалифицированной помощи",
    "для входа в чат",
    "вот ссылка для перехода",
    "зайдите в мой профиль",
    "можете зайти в мой профиль",
    "перейти в мой профиль",
    "перейдите в мой профиль",
    "рекомендую обратиться ко мне в чат",
    "рекомендую обратиться в чат",
    "обратиться ко мне в чат",
    "обратитесь ко мне в чат",
    "обращайтесь ко мне в чат",
    "обратиться к юристу",
    "обращения к юристу",
    "нажмите кнопку",
    "нажать кнопку",
    "кликните на кнопку",
    "кнопку «обратиться к юристу»",
    "кнопку \"обратиться к юристу\"",
    "в личное сообщение",
    "личное сообщение (чат)",
    "личный чат",
    "в личный чат",
    "общаться в чате",
    "пишите в чат",
    "напишите в чат",
    "если мой ответ вам помог",
    "если вам помог мой ответ",
    "если мой ответ помог",
    "если ответ помог",
    "если мой ответ был полезен",
    "если мой ответ оказался полезным",
    "если ответ оказался полезным",
    "если ответ был полезен",
    "если мой ответ был вам полезен",
    "если мой ответ был полезен вам",
    "если вам был полезен мой ответ",
    "ответ был полезен",
    "помог вам разобраться",
    "если вам потребуется помощь с составлением",
    "если потребуется помощь с составлением",
    "если остались дополнительные вопросы",
    "нужна консультация или документы",
    "обращайтесь через платформу",
    "переходите по ссылке",
    "обсудим задачу и стоимость",
    "рекомендую воспользоваться кнопкой",
    "получите подробную приватную",
    "можете оставить отзыв",
    "оставьте отзыв",
    "положительный отзыв",
    "поставьте +",
    "поставить оценку",
    "поставьте оценку",
    "прошу его оценить",
    "прошу оценить",
    "оцените ответ",
    "оценить мой ответ",
    "отблагодарить юриста",
    "поблагодарить юриста",
    "буду благодар",
    "буду искренне благодар",
    "благодарность здесь",
    "выразить свою благодарность",
    "отправить донат",
    "донат по ссылке",
    "платную консультацию",
    "платная консультация",
    "услуги в чате платные",
    "могу подготовить",
    "готов помочь",
    "готова помочь",
    "готов изучить",
    "готова изучить",
    "готов оказать",
    "готова оказать",
    "при необходимости готов",
    "при необходимости готова",
    "готова подготовить",
    "готов подготовить",
    "готова взять ваше дело",
    "готов взять ваше дело",
    "готова взять дело",
    "готов взять дело",
    "могу взять ваше дело",
    "можем взять ваше дело",
    "все мои консультации являются",
    "не пользуюсь нейросетями",
    "с уважением,",
    "с уважением!",
    "[контакт скрыт платформой]"
  ];
  const firstMarkerIndex = tailMarkers
    .map((marker) => lower.indexOf(marker))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0];

  if (firstMarkerIndex === undefined) return normalized;

  return normalized.slice(0, firstMarkerIndex).replace(/[\s,;:.-]+$/g, "").trim();
}

function cleanText(value: string) {
  return redactForbiddenContacts(value)
    .replace(/\r/g, "\n")
    .replace(/_x000D_/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([.!?])(?=[А-ЯЁA-Z])/g, "$1 ")
    .replace(/(^|\n)[\s:;,-]+/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toWizardService(service: Awaited<ReturnType<typeof prisma.service.findMany>>[number]): Service {
  return {
    id: service.id,
    name: service.name,
    slug: service.slug,
    shortDescription: service.shortDescription,
    fullDescription: service.fullDescription,
    isActive: service.isActive,
    parentId: service.parentId
  };
}

function generateQuestionAuthorName(row: FixtureRow, number: number, answer = "") {
  const addressedName = extractAddressedNameFromAnswer(answer);
  if (addressedName) return addressedName;

  const seed = `${number}:${row.rawTitle}:${row.rawQuestion}`;
  const person = fixtureQuestionAuthors[hashString(`${seed}:person`) % fixtureQuestionAuthors.length];
  const format = hashString(`${seed}:format`) % 3;

  if (format === 0) return person.firstName;
  if (format === 1) return `${person.firstName} ${person.patronymic}`;
  return `${person.lastName} ${person.firstName}`;
}

function extractAddressedNameFromAnswer(answer: string) {
  const intro = cleanText(answer).replace(/\s+/g, " ").slice(0, 240);
  const namePattern = "([А-ЯЁ][а-яё]+(?:[-\\s][А-ЯЁ][а-яё]+){0,2})";
  const patterns = [
    new RegExp(`^(?:Здравствуйте|Добрый день|Добрый вечер|Приветствую)\\s*,?\\s+${namePattern}(?=[!,.])`, "u"),
    new RegExp(`^Уважаем(?:ый|ая)\\s+${namePattern}(?=[!,.])`, "u"),
    new RegExp(`^${namePattern}\\s*,\\s*(?:здравствуйте|добрый день|добрый вечер)`, "u")
  ];

  for (const pattern of patterns) {
    const match = intro.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && isLikelyPersonName(candidate)) return candidate;
  }

  return "";
}

function isLikelyPersonName(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const words = normalized.split(" ");
  const blocked = new Set(["Вопрос", "Клиент", "Пользователь", "Коллега", "Уважаемый", "Уважаемая"]);
  return (
    words.length >= 1 &&
    words.length <= 3 &&
    words.every((word) => /^[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?$/u.test(word)) &&
    !blocked.has(words[0])
  );
}

function deterministicPick<T>(items: T[], seed: string) {
  return items[hashString(seed) % items.length];
}

function deterministicShuffle<T extends { id: string }>(items: T[], seed: string) {
  return [...items].sort((a, b) => hashString(`${seed}:${a.id}`) - hashString(`${seed}:${b.id}`));
}

function hashString(value: string) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function assertDevelopmentOnly() {
  const env = process.env.NODE_ENV;
  if (env === "production" || process.env.NEXT_PHASE === "phase-production-build" || process.env.VERCEL === "1") {
    throw new Error("Pravoved Q&A import is development-only and must not run in production.");
  }
}

function parseArgs(argv: string[]): ImportArgs {
  const parsed: ImportArgs = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--input" && next) {
      parsed.input = next;
      i += 1;
    } else if (arg === "--limit" && next) {
      const value = Number(next);
      if (!Number.isInteger(value) || value < 1) throw new Error(`Invalid --limit value: ${next}`);
      parsed.limit = value;
      i += 1;
    } else if (arg === "--require-public-answer") {
      parsed.requirePublicAnswer = true;
    } else if (arg === "--allow-all-fixture-answers") {
      parsed.allowAllFixtureAnswers = true;
    } else if (arg === "--append") {
      parsed.append = true;
    }
  }
  return parsed;
}

function readFixtureRows(inputPath: string): FixtureRow[] {
  if (inputPath.toLowerCase().endsWith(".json")) {
    return readFixtureJsonRows(inputPath);
  }

  const rows = readXlsxRows(inputPath);
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  const categoryIndex = findColumn(headers, ["категорияправа", "категориявопроса", "категория", "rawcategory"]);
  const titleIndex = findColumn(headers, ["seoзаголовок", "seotitle", "заголовоквопроса", "заголовок", "rawtitle"]);
  const questionIndex = findColumn(headers, ["вопрос", "текствопроса", "rawquestion"]);
  const answerIndex = findColumn(headers, [
    "улучшенныйответюриста",
    "improvedlawyeranswer",
    "ответюриста",
    "ответ",
    "lawyeranswer"
  ]);

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

function readFixtureJsonRows(inputPath: string): FixtureRow[] {
  const payload = JSON.parse(readFileSync(inputPath, "utf8")) as unknown;
  const records = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { rows?: unknown }).rows)
      ? (payload as { rows: unknown[] }).rows
      : [];

  return records
    .map((record, index) => {
      const row = record && typeof record === "object" ? (record as Record<string, unknown>) : {};
      return {
        rowNumber: index + 2,
        rawCategory: objectValue(row, ["категорияправа", "категориявопроса", "категория", "rawcategory"]),
        rawTitle: objectValue(row, ["seoзаголовок", "seotitle", "заголовоквопроса", "заголовок", "rawtitle"]),
        rawQuestion: objectValue(row, ["вопрос", "текствопроса", "rawquestion"]),
        lawyerAnswer: objectValue(row, ["улучшенныйответюриста", "improvedlawyeranswer", "ответюриста", "ответ", "lawyeranswer"])
      };
    })
    .filter((row) => row.rawTitle || row.rawQuestion);
}

function objectValue(record: Record<string, unknown>, names: string[]) {
  const wanted = new Set(names);
  const entry = Object.entries(record).find(([key]) => wanted.has(normalizeHeader(key)));
  const value = entry?.[1];
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function readXlsxRows(inputPath: string) {
  const tempRoot = join(tmpdir(), `pravoved-import-${Date.now()}-${Math.random().toString(16).slice(2)}`);
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

function normalize(value: string) {
  return normalizeHeader(value);
}

function slugify(value: string) {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "j",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "c",
    ч: "ch",
    ш: "sh",
    щ: "shch",
    ы: "y",
    э: "e",
    ю: "yu",
    я: "ya",
    ь: "",
    ъ: ""
  };

  const slug = value
    .toLowerCase()
    .split("")
    .map((char) => map[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

  return slug || `question-${Date.now()}`;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
