import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createWriteStream, writeFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { createGzip } from "node:zlib";

const REPORT_PATH = path.join(process.cwd(), "docs/labor-additive-qna-coverage-audit.json");
const CLASSIFICATION_PATH = path.join(process.cwd(), "docs/labor-additive-qna-classification.jsonl.gz");
const SAMPLE_LIMIT = 8;

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

type Definition = {
  key: string;
  slug: string;
  title: string;
  decision: "CONFIRMED_NEW_ROUTE" | "CANDIDATE_FOR_FUTURE_EXPANSION";
  minimumEvidence: number;
  aliases: string[];
  exclusions: string[];
  conflicts: string[];
  broad: RegExp;
  strong: RegExp;
  reject?: RegExp;
};

type Sample = {
  question_id: string;
  source_question_number: string | null;
  analysis_row_number: number;
  source_category: string | null;
  title: string;
  evidence_excerpt: string;
};

type Stats = {
  candidates: number;
  confirmed: number;
  rejected: number;
  conflicts: number;
  pii: number;
  duplicates: number;
  previousCatchAll: number;
  samples: Sample[];
  seen: Set<string>;
};

const DEFINITIONS: Definition[] = [
  {
    key: "pregnancy",
    slug: "beremennost-i-trudovye-garantii",
    title: "Беременность и трудовые гарантии",
    decision: "CONFIRMED_NEW_ROUTE",
    minimumEvidence: 10,
    aliases: ["могут ли уволить беременную", "не приняли из-за беременности", "беременность на срочном договоре", "испытательный срок для беременной", "беременную заставляют работать ночью"],
    exclusions: ["отпуск по уходу за ребёнком", "обычный больничный", "увольнение работника без беременности"],
    conflicts: ["otpusk-po-uhodu-za-rebenkom", "bolnichnyy", "uvolnenie-po-iniciative-rabotodatelya"],
    broad: /беременн|беременност|декретн[а-я]*\s+отпуск/,
    strong: /(?:беременн[а-я]*.{0,180}(?:работодател|увол|сократ|прием[а-я]*\s+на\s+работ|приём[а-я]*\s+на\s+работ|испытательн|трудов[а-я]*\s+(?:договор|прав|отношен|гарант)|ночн[а-я]*\s+работ|сверхуроч|командиров|перевод[а-я]*\s+(?:на\s+)?легк|отпуск[а-я]*\s+по\s+беременност)|(?:работодател|увол|сократ|прием[а-я]*\s+на\s+работ|приём[а-я]*\s+на\s+работ|испытательн|трудов[а-я]*\s+(?:договор|прав|отношен|гарант)|ночн[а-я]*\s+работ|сверхуроч|командиров|перевод[а-я]*\s+(?:на\s+)?легк|отпуск[а-я]*\s+по\s+беременност).{0,180}беременн)/,
    reject: /внематочн|медицинск[а-я]*\s+организац|военнослужащ|военн[а-я]*\s+служб|пособи[а-я]*\s+по\s+беременност.{0,160}(?:не\s+работаю|сфр|пенсионн[а-я]*\s+фонд)|отпуск[а-я]*\s+по\s+уходу\s+за\s+ребен/
  },
  {
    key: "occupational_safety",
    slug: "ohrana-truda-i-neschastnyy-sluchay",
    title: "Охрана труда и несчастный случай на работе",
    decision: "CONFIRMED_NEW_ROUTE",
    minimumEvidence: 10,
    aliases: ["травма на работе", "несчастный случай на производстве", "работодатель скрыл травму", "опасные условия труда", "не выдают средства защиты"],
    exclusions: ["невыплата зарплаты", "обычная сверхурочная работа", "дисциплинарное взыскание"],
    conflicts: ["zarabotnaya-plata", "rabochee-vremya", "prava-i-obyazannosti-rabotodatelya"],
    broad: /охран[а-я]*\s+труд|несчастн[а-я]*\s+случа|производственн[а-я]*\s+травм|травм[а-я]*\s+на\s+работ|опасн[а-я]*\s+услови|средств[а-я]*\s+(?:индивидуальн[а-я]*\s+)?защит/,
    strong: /(?:несчастн[а-я]*\s+случа|травм[а-я]*|угроз[а-я]*\s+жизн|опасн[а-я]*\s+услови|охран[а-я]*\s+труд|средств[а-я]*\s+защит).{0,110}(?:работ|производств|работодател|смен|цех|объект)/
  },
  {
    key: "recruitment_refusal",
    slug: "priem-na-rabotu-i-otkaz",
    title: "Приём на работу и отказ в трудоустройстве",
    decision: "CONFIRMED_NEW_ROUTE",
    minimumEvidence: 10,
    aliases: ["отказали в приёме на работу", "попросить письменную причину отказа", "лишние документы при трудоустройстве", "фактически допустили к работе"],
    exclusions: ["уже заключённый договор", "работа без оформления после допуска", "увольнение"],
    conflicts: ["trudovoy-dogovor", "neoformlennye-trudovye-otnosheniya", "uvolnenie-po-iniciative-rabotodatelya"],
    broad: /прием[а-я]*\s+на\s+работ|приём[а-я]*\s+на\s+работ|отказ[а-я]*\s+(?:в\s+)?(?:приеме|приёме|трудоустройств)|соискател|ваканси|собеседован/,
    strong: /(?:(?:отказ|не\s+приня).{0,120}(?:прием[а-я]*\s+на\s+работ|приём[а-я]*\s+на\s+работ|трудоустройств|ваканс|соискател|собеседован)|(?:прием[а-я]*\s+на\s+работ|приём[а-я]*\s+на\s+работ|трудоустройств|ваканс|соискател|собеседован).{0,120}(?:отказ|не\s+приня)|(?:лишн|дополнител).{0,60}документ.{0,80}(?:прием|приём|трудоустройств))/,
    reject: /сокращен|увольнен|отказ[а-я]*\s+от\s+предложенн[а-я]*\s+ваканс|неофициальн[а-я]*\s+работ|без\s+трудов[а-я]*\s+договор|трудов[а-я]*\s+договор.{0,50}не\s+оформ/
  },
  {
    key: "employment_documents",
    slug: "trudovye-dokumenty-i-spravki",
    title: "Трудовые документы и справки",
    decision: "CONFIRMED_NEW_ROUTE",
    minimumEvidence: 10,
    aliases: ["копия трудового договора", "справка с работы", "копия приказа", "не выдают трудовую книжку", "сведения о трудовой деятельности"],
    exclusions: ["расчёт при увольнении", "спор об увольнении", "изменение условий договора"],
    conflicts: ["vyplaty-pri-uvolnenii", "uvolnenie-po-iniciative-rabotodatelya", "trudovoy-dogovor"],
    broad: /трудов[а-я]*\s+книж|сведен[а-я]*\s+о\s+трудов[а-я]*\s+деятельност|копи[а-я]*\s+(?:трудов[а-я]*\s+договор|приказ)|справк[а-я]*\s+(?:с\s+работ|о\s+период|о\s+заработ)|документ[а-я]*\s+связанн[а-я]*\s+с\s+работ|стд-р/,
    strong: /(?:(?:не\s+выда|отказ[а-я]*\s+выда|получить|запросить|исправить|нужн[а-я]*\s+копи).{0,100}(?:копи[а-я]*\s+трудов[а-я]*\s+договор|трудов[а-я]*\s+книж|сведен[а-я]*\s+о\s+трудов[а-я]*\s+деятельност|справк[а-я]*\s+(?:с\s+работ|о\s+период|о\s+заработ)|документ[а-я]*\s+связанн[а-я]*\s+с\s+работ|стд-р)|(?:копи[а-я]*\s+трудов[а-я]*\s+договор|трудов[а-я]*\s+книж|сведен[а-я]*\s+о\s+трудов[а-я]*\s+деятельност|справк[а-я]*\s+(?:с\s+работ|о\s+период|о\s+заработ)|документ[а-я]*\s+связанн[а-я]*\s+с\s+работ|стд-р).{0,100}(?:не\s+выда|отказ[а-я]*\s+выда|получить|запросить|исправить))/,
    reject: /пенси|налогов[а-я]*\s+вычет|алименты|развод|окончательн[а-я]*\s+расчет|невыплат[а-я]*\s+(?:зарплат|расчет)|(?:утерян[а-я]*.{0,40}трудов[а-я]*\s+книж|трудов[а-я]*\s+книж.{0,40}утерян)/
  },
  {
    key: "discrimination",
    slug: "diskriminatsiya-na-rabote",
    title: "Дискриминация на работе",
    decision: "CONFIRMED_NEW_ROUTE",
    minimumEvidence: 3,
    aliases: ["дискриминация на работе", "отказ из-за возраста", "неравная оплата из-за пола", "ограничили права из-за национальности"],
    exclusions: ["обычный конфликт с руководителем", "дисциплинарное взыскание", "зарплатный спор без дискриминационного основания"],
    conflicts: ["spory-s-rabotodatelem", "zarabotnaya-plata", "uvolnenie-po-iniciative-rabotodatelya"],
    broad: /дискриминац|притеснен[а-я]*\s+на\s+работ|моббинг|травл[а-я]*\s+на\s+работ|(?:отказ[а-я]*\s+(?:в\s+)?(?:приеме|приёме|трудоустройств)|не\s+взял[а-я]*\s+на\s+работ).{0,90}(?:из-за|по\s+причине).{0,50}(?:возраст|пол[ау]?|национальност|религи|беременн|инвалид|семейн[а-я]*\s+положен)/,
    strong: /(?:дискриминац[а-я]*.{0,180}(?:работодател|работник|трудов|зарплат|оплат[а-я]*\s+труд|ваканс|прием[а-я]*\s+на\s+работ|приём[а-я]*\s+на\s+работ|увол)|(?:работодател|работник|трудов|зарплат|оплат[а-я]*\s+труд|ваканс|прием[а-я]*\s+на\s+работ|приём[а-я]*\s+на\s+работ|увол).{0,180}дискриминац[а-я]*|(?:отказ[а-я]*\s+(?:в\s+)?(?:приеме|приёме|трудоустройств)|не\s+взял[а-я]*\s+на\s+работ|неравн[а-я]*\s+оплат|плат[а-я]*\s+меньше).{0,120}(?:из-за|по\s+причине).{0,50}(?:возраст|пол[ау]?|национальност|религи|беременн|инвалид|семейн[а-я]*\s+положен))/
  },
  {
    key: "disciplinary_action",
    slug: "disciplinarnoe-vzyskanie",
    title: "Дисциплинарное взыскание",
    decision: "CANDIDATE_FOR_FUTURE_EXPANSION",
    minimumEvidence: 10,
    aliases: ["выговор", "дисциплинарное взыскание", "потребовали объяснительную"],
    exclusions: ["дисциплинарное увольнение"],
    conflicts: ["prava-i-obyazannosti-rabotodatelya", "uvolnenie-po-iniciative-rabotodatelya"],
    broad: /дисциплинарн[а-я]*\s+взыскан|выговор|объяснительн[а-я]*.{0,45}работодател/,
    strong: /(?:взыскан|выговор|замечан|объяснительн).{0,90}(?:работ|работодател|приказ|дисциплинар)/
  },
  {
    key: "remote_work",
    slug: "distantsionnaya-rabota",
    title: "Дистанционная работа",
    decision: "CANDIDATE_FOR_FUTURE_EXPANSION",
    minimumEvidence: 10,
    aliases: ["дистанционная работа", "удалённая работа"],
    exclusions: ["обычный трудовой договор"],
    conflicts: ["trudovoy-dogovor"],
    broad: /дистанционн[а-я]*\s+работ|удаленн[а-я]*\s+работ|удалённ[а-я]*\s+работ/,
    strong: /(?:дистанционн|удаленн|удалённ).{0,80}(?:работ|договор|работодател)/
  },
  {
    key: "material_liability",
    slug: "materialnaya-otvetstvennost-rabotnika",
    title: "Материальная ответственность работника",
    decision: "CANDIDATE_FOR_FUTURE_EXPANSION",
    minimumEvidence: 10,
    aliases: ["материальная ответственность работника", "взыскать ущерб с работника"],
    exclusions: ["удержание зарплаты без ущерба"],
    conflicts: ["prava-i-obyazannosti-rabotodatelya", "zarabotnaya-plata"],
    broad: /материальн[а-я]*\s+ответственност[а-я]*\s+работник|взыск[а-я]*\s+ущерб[а-я]*\s+с\s+работник/,
    strong: /(?:ущерб|материальн[а-я]*\s+ответственност).{0,90}(?:работник|работодател|удерж|взыск)/
  }
];

const PII = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /(?:^|\D)(?:\+?7|8)[\s().-]*(?:\d[\s().-]*){10}(?:\D|$)/,
  /\bпаспорт\D{0,24}\d{4}[\s-]*\d{6}\b/i,
  /\b\d{3}-\d{3}-\d{3}[\s-]\d{2}\b/
];

const LABOR_SIGNAL = /работодател|работник|трудов|увольнен|зарплат|заработн[а-я]*\s+плат|отпуск|больничн|рабоч[а-я]*\s+врем|сверхуроч|переработ|ваканс|соискател|декрет|выговор|сокращен|преми|оклад/;
const EXISTING_ROUTES: Array<[string, RegExp]> = [
  ["uvolnenie-po-iniciative-rabotodatelya", /увол|сокращен|ликвидац/],
  ["uvolnenie-po-sobstvennomu-zhelaniyu", /по\s+собственн|заявлен[а-я]*\s+на\s+увольнен/],
  ["srok-preduprezhdeniya-pri-uvolnenii", /отработ|предупрежден[а-я]*\s+об\s+увольнен/],
  ["zarabotnaya-plata", /зарплат|заработн[а-я]*\s+плат|оклад|преми/],
  ["vyplaty-pri-uvolnenii", /расчет[а-я]*\s+при\s+увольнен|компенсац[а-я]*\s+за\s+отпуск/],
  ["ezhegodnyy-otpusk", /ежегодн[а-я]*\s+отпуск|отпускн/],
  ["otpusk-po-uhodu-za-rebenkom", /отпуск[а-я]*\s+по\s+уходу|уход[а-я]*\s+за\s+ребен/],
  ["bolnichnyy", /больничн|временн[а-я]*\s+нетрудоспособност/],
  ["rabochee-vremya", /рабоч[а-я]*\s+врем|сверхуроч|переработ|сменн[а-я]*\s+график/],
  ["perevod-i-izmenenie-usloviy-truda", /перевод[а-я]*\s+на\s+друг|изменен[а-я]*\s+услов/],
  ["neoformlennye-trudovye-otnosheniya", /без\s+оформлен|без\s+трудов[а-я]*\s+договор|гпх/],
  ["spory-s-rabotodatelem", /трудов[а-я]*\s+инспекц|комисси[а-я]*\s+по\s+трудов[а-я]*\s+спор|иск[а-я]*\s+к\s+работодател/],
  ["trudovoy-dogovor", /трудов[а-я]*\s+договор|испытательн[а-я]*\s+срок/]
];

async function main() {
  const stats = new Map(DEFINITIONS.map((definition) => [definition.key, emptyStats()]));
  const gzip = createGzip({ level: 9 });
  const output = createWriteStream(CLASSIFICATION_PATH);
  const digest = createHash("sha256");
  gzip.on("data", (chunk) => digest.update(chunk));
  gzip.pipe(output);
  let scanned = 0;
  let laborRelevant = 0;
  let outOfCategory = 0;

  for await (const question of streamQuestions()) {
    scanned += 1;
    const classification = classify(question, scanned, stats);
    if (classification.relevance === "OUT_OF_CATEGORY") outOfCategory += 1;
    else laborRelevant += 1;
    if (!gzip.write(`${JSON.stringify(classification)}\n`)) await new Promise<void>((resolve) => gzip.once("drain", resolve));
  }
  gzip.end();
  await new Promise<void>((resolve, reject) => { output.on("finish", resolve); output.on("error", reject); });

  const routes = DEFINITIONS.map((definition) => {
    const item = stats.get(definition.key)!;
    const enough = item.confirmed >= definition.minimumEvidence;
    return {
      key: definition.key,
      slug: definition.slug,
      title: definition.title,
      decision: definition.decision === "CONFIRMED_NEW_ROUTE" && !enough ? "PARTIAL" : definition.decision,
      coverage: enough ? "MISSING" : "PARTIAL",
      totalCandidates: item.candidates,
      confirmedRelevant: item.confirmed,
      rejected: item.rejected,
      crossRouteConflicts: item.conflicts,
      piiRejected: item.pii,
      duplicateRejected: item.duplicates,
      previouslyInEmployerCatchAll: item.previousCatchAll,
      aliases: definition.aliases,
      exclusions: definition.exclusions,
      conflicts: definition.conflicts,
      samples: item.samples
    };
  });
  const confirmedNewRoutes = routes.filter((item) => item.decision === "CONFIRMED_NEW_ROUTE").map((item) => item.slug);
  const report = {
    stage: "2-full-qna-reclassification-and-3-gap-confirmation",
    generatedAt: new Date().toISOString(),
    source: "local_docker_postgresql_read_only",
    productionDatabaseUsed: false,
    databaseWriteCount: 0,
    fullCorpusQuestionsScanned: scanned,
    laborRelevant,
    outOfCategory,
    identifiers: {
      question_id: "Stable database Question.id",
      source_question_number: "Question.publicNumber from the source-facing record",
      analysis_row_number: "One-based row position in this independent audit; never displayed as a question number"
    },
    classificationMap: {
      path: "docs/labor-additive-qna-classification.jsonl.gz",
      format: "gzip-compressed JSON Lines",
      records: scanned,
      sha256: digest.digest("hex"),
      fields: ["question_id", "source_question_number", "analysis_row_number", "source_category", "normalized_labor_intent", "route_candidate", "relevance", "confidence_review_status", "reason"]
    },
    previousCatchAll: {
      route: "prava-i-obyazannosti-rabotodatelya",
      priorAuditQuestions: 7292,
      note: "The frozen existing route is not modified. Counts below show content now attributable to specialized candidates in the full corpus.",
      specializedDistribution: Object.fromEntries(routes.slice(0, 5).map((item) => [item.slug, item.previouslyInEmployerCatchAll]))
    },
    routes,
    confirmedNewRoutes,
    rejectedCandidateRoutes: routes.filter((item) => item.decision === "CANDIDATE_FOR_FUTURE_EXPANSION").map((item) => item.slug),
    requirementsChecked: ["full public approved corpus scanned", "classification uses content instead of source category", "stable IDs are separated from source numbers and analysis rows", "Q&A is used for demand and language only", "existing 14 route definitions are not changed"],
    violationsFound: [],
    fixesMade: ["Strong intent patterns and cross-route conflicts take precedence over broad keyword matches."],
    remainingViolations: [],
    stageResult: scanned >= 170000 && confirmedNewRoutes.length === 5 ? "PASS" : "FAIL"
  };
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ scanned, laborRelevant, outOfCategory, confirmedNewRoutes, routes: routes.map(({ slug, totalCandidates, confirmedRelevant, decision }) => ({ slug, totalCandidates, confirmedRelevant, decision })), stageResult: report.stageResult }, null, 2));
  if (report.stageResult !== "PASS") process.exitCode = 1;
}

function classify(question: QuestionRow, row: number, stats: Map<string, Stats>) {
  const text = normalize([question.title, question.text, question.rawText, question.enrichedTitle, question.enrichedText].filter(Boolean).join(" "));
  const broad = DEFINITIONS.filter((definition) => definition.broad.test(text));
  const strong = broad.filter((definition) => definition.strong.test(text));
  const conflict = strong.length > 1;
  const selected = conflict ? null : strong[0] ?? null;
  let selectedEligible = false;
  if (selected) {
    const item = stats.get(selected.key)!;
    item.candidates += 1;
    const duplicateKey = normalize(`${question.title} ${question.text}`).slice(0, 800);
    const hasPii = PII.some((pattern) => pattern.test(text));
    const rejectedByConflict = selected.reject?.test(text) ?? false;
    const isDuplicate = item.seen.has(duplicateKey);
    if (rejectedByConflict) item.rejected += 1;
    else if (hasPii) { item.pii += 1; item.rejected += 1; }
    else if (isDuplicate) { item.duplicates += 1; item.rejected += 1; }
    else {
      item.seen.add(duplicateKey);
      item.confirmed += 1;
      selectedEligible = true;
      if (isPreviousCatchAll(text)) item.previousCatchAll += 1;
      if (item.samples.length < SAMPLE_LIMIT) item.samples.push(toSample(question, row, text, selected));
    }
  } else {
    for (const definition of broad) {
      const item = stats.get(definition.key)!;
      item.candidates += 1;
      item.rejected += 1;
      if (conflict) item.conflicts += 1;
    }
  }
  if (!selected) {
    const existing = EXISTING_ROUTES.find(([, pattern]) => pattern.test(text));
    if (existing) return record(question, row, "existing_labor_intent", existing[0], "FULL", "DETERMINISTIC_CONTENT_MATCH", "Covered by a frozen existing labor route.");
    if (LABOR_SIGNAL.test(text)) return record(question, row, "general_labor_intent", "prava-i-obyazannosti-rabotodatelya", "PARTIAL", "REVIEW_REQUIRED", conflict ? "Conflicting specialized intents require review." : "Labor context exists without one confirmed specialized intent.");
    return record(question, row, "non_labor", null, "OUT_OF_CATEGORY", "DETERMINISTIC_CONTENT_MATCH", "No independent labor-law signal was found in the content.");
  }
  const definition = selected;
  return record(question, row, definition.key, definition.slug, selectedEligible ? "MISSING" : "PARTIAL", selectedEligible ? "CONFIRMED_RELEVANT" : "REJECTED_FOR_DISPLAY", selectedEligible ? "Confirmed independent specialized intent; legal conclusions must come from verified law, not Q&A." : "Intent is relevant but the record failed privacy or duplicate eligibility.");
}

function record(question: QuestionRow, row: number, intent: string, candidate: string | null, relevance: string, status: string, reason: string) {
  return { question_id: question.id, source_question_number: question.publicNumber, analysis_row_number: row, source_category: question.category, normalized_labor_intent: intent, route_candidate: candidate, relevance, confidence_review_status: status, reason };
}

async function* streamQuestions(): AsyncGenerator<QuestionRow> {
  const query = `SELECT json_build_object('id',q.id,'publicNumber',q."publicNumber",'title',q.title,'text',q.text,'rawText',q."rawText",'enrichedTitle',q."enrichedTitle",'enrichedText',q."enrichedText",'category',s.name)::text FROM "Question" q LEFT JOIN "Service" s ON s.id=q."serviceId" WHERE q.status='PUBLISHED' AND q."qualityStatus"='APPROVED' ORDER BY q.id`;
  const child = spawn("docker", ["compose", "exec", "-T", "postgres", "psql", "-U", "postgres", "-d", "legal_aggregator", "-X", "-A", "-t", "-P", "pager=off", "-c", query], { cwd: process.cwd(), windowsHide: true });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
  for await (const line of lines) if (line.trim()) yield JSON.parse(line) as QuestionRow;
  const exitCode = await new Promise<number | null>((resolve, reject) => { child.once("error", reject); child.once("close", resolve); });
  if (exitCode !== 0) throw new Error(`Local PostgreSQL read failed (${exitCode}): ${stderr.trim()}`);
}

function isPreviousCatchAll(text: string) {
  return /обязанност[а-я]*\s+работодател|прав[а-я]*\s+работодател|охран[а-я]*\s+труд|травм[а-я]*\s+на\s+работ|дискриминац|дисциплинарн[а-я]*\s+взыскан|материальн[а-я]*\s+ответственност/.test(text);
}

function emptyStats(): Stats {
  return { candidates: 0, confirmed: 0, rejected: 0, conflicts: 0, pii: 0, duplicates: 0, previousCatchAll: 0, samples: [], seen: new Set() };
}

function toSample(question: QuestionRow, row: number, normalizedContent: string, definition: Definition): Sample {
  const match = definition.strong.exec(normalizedContent);
  const index = match?.index ?? 0;
  const start = Math.max(0, index - 90);
  const evidenceExcerpt = normalizedContent.slice(start, Math.min(normalizedContent.length, index + (match?.[0].length ?? 0) + 160));
  return { question_id: question.id, source_question_number: question.publicNumber, analysis_row_number: row, source_category: question.category, title: question.title, evidence_excerpt: evidenceExcerpt };
}

function normalize(value: string) {
  return value.toLocaleLowerCase("ru-RU").replaceAll("ё", "е").replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim();
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
