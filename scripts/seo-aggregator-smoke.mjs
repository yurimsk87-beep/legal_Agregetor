import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const issues = [];

const requiredFiles = [
  "src/app/page.tsx",
  "src/app/questions/page.tsx",
  "src/app/questions/[questionSlug]/page.tsx",
  "src/app/questions/[questionSlug]/[categorySlug]/page.tsx",
  "src/app/lawyers/page.tsx",
  "src/app/lawyers/[lawyerSlug]/page.tsx",
  "src/app/lawyers/[lawyerSlug]/[categorySlug]/page.tsx",
  "src/app/cities/page.tsx",
  "src/app/specializations/page.tsx",
  "src/app/blog/page.tsx",
  "src/app/documents/page.tsx",
  "src/app/calculators/page.tsx",
  "src/app/proverka-advokata/page.tsx",
  "src/app/reestr-advokatov/page.tsx",
  "src/app/for-lawyers/page.tsx",
  "src/app/how-we-check-lawyers/page.tsx",
  "src/app/how-rating-works/page.tsx",
  "src/app/review-policy/page.tsx",
  "src/app/question-rules/page.tsx",
  "src/app/answer-rules/page.tsx",
  "src/app/privacy/page.tsx",
  "src/app/terms/page.tsx",
  "src/app/lawyer/profile/page.tsx",
  "src/app/lawyer/questions/page.tsx",
  "src/app/lawyer/answers/page.tsx",
  "src/app/lawyer/articles/page.tsx",
  "src/app/admin/questions/page.tsx",
  "src/app/admin/answers/page.tsx",
  "src/components/CitySelector.tsx",
  "src/components/QuestionForm.tsx",
  "src/components/QuestionWizard.tsx",
  "src/components/QuestionModal.tsx",
  "src/lib/question-wizard-engine.ts",
  "src/components/AdminAssistedAnswerForm.tsx",
  "src/app/api/questions/route.ts",
  "src/app/api/question-wizard/options/route.ts",
  "src/app/api/answers/route.ts",
  "src/app/api/admin/questions/[questionId]/route.ts",
  "src/app/api/admin/answers/[answerId]/route.ts",
  "src/app/api/reports/route.ts"
];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) add(file, "Required file is missing.");
}

const publicSource = readPublicSource();
for (const phrase of [
  "Получить консультацию",
  "Оставить заявку",
  "Заказать звонок",
  "Написать",
  "Подобрать юриста",
  "Заказать документ",
  "Получить расчет от юриста",
  "Связаться со специалистом"
]) {
  if (publicSource.includes(phrase)) add("public-source", `Forbidden public CTA found: ${phrase}`);
}

for (const token of ["lawyer.phone", "lawyer.email", "lawyer.whatsapp", "lawyer.telegram", "wa.me", "t.me"]) {
  if (read("src/components/LawyerCard.tsx").includes(token) || read("src/app/lawyers/[lawyerSlug]/page.tsx").includes(token)) {
    add("public-lawyer-profile", `Public lawyer contact leak token found: ${token}`);
  }
}

const schema = read("prisma/schema.prisma");
for (const token of [
  "enum QuestionStatus",
  "enum AnswerStatus",
  "enum AnswerAuthorType",
  "model QuestionTrustScore",
  "model AnswerAuditLog",
  "model ContentReport",
  "consentToAdminAssistedAnswers",
  "publishedByAdmin",
  "containsContactAttempt",
  "trustScore"
]) {
  if (!schema.includes(token)) add("prisma/schema.prisma", `Missing schema token: ${token}`);
}

const questionForm = read("src/components/QuestionForm.tsx");
const questionWizard = read("src/components/QuestionWizard.tsx");
for (const token of [
  "userName",
  "userEmail",
  "cityId",
  "serviceId",
  "title",
  "text",
  "personalDataConsent",
]) {
  if (!questionWizard.includes(token) && !questionForm.includes(token)) add("QuestionWizard", `Missing simple question form requirement: ${token}`);
}
for (const token of [
  "CLARIFICATIONS",
  "ENRICHED_PREVIEW",
  "ANALYZING",
  "PRELIMINARY_ANSWER",
  "TRANSFER_TO_LAWYER",
  "publicationConsent",
  "thirdPartyDataConsent",
  "contactTransferConsent",
  "Передать ситуацию юристу",
  "name=\"phone\"",
  "name=\"messenger\""
]) {
  if (questionWizard.includes(token)) add("QuestionWizard", `Removed wizard/contact behavior is still present in form UI: ${token}`);
}

const questionsApi = read("src/app/api/questions/route.ts");
for (const token of ["status", "MODERATION", "isIndexable: false", "rawText", "enrichedText", "preliminaryAnswer", "findSimilarQuestions", "attachmentNotAllowedMessage"]) {
  if (!questionsApi.includes(token)) add("Questions API", `Missing question create behavior: ${token}`);
}
if (questionsApi.includes("notifyLawyersAboutPublishedQuestion")) {
  add("Questions API", "Question creation must not notify lawyers before publication.");
}

const answersApi = read("src/app/api/answers/route.ts");
for (const token of ["ADMIN_ASSISTED", "publishedByAdmin", "consentToAdminAssistedAnswers", "containsContactAttempt", "answerAuditLog"]) {
  if (!answersApi.includes(token)) add("Answers API", `Missing answer behavior: ${token}`);
}

const robots = read("src/app/robots.ts");
for (const token of ["/admin", "/lawyer", "/search", "/*?sort=", "/*?filter=", "/*?page=", "/*?utm_"]) {
  if (!robots.includes(token)) add("robots", `Missing robots rule: ${token}`);
}

const repositories = read("src/lib/repositories.ts");
for (const token of ["/questions/", "/lawyers/", "/documents/", "/calculators/", "trustScore", "isIndexable"]) {
  if (!repositories.includes(token)) add("repositories", `Missing sitemap/indexability token: ${token}`);
}

if (issues.length) {
  console.error("SEO aggregator smoke failed");
  for (const issue of issues) console.error(`[error] ${issue.file}: ${issue.message}`);
  process.exit(1);
}

console.log("SEO aggregator smoke passed");
console.log(`Checked files: ${requiredFiles.length}`);

function read(file) {
  const path = join(root, file);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function readPublicSource() {
  const files = [
    "src/app",
    "src/components",
    "src/lib"
  ];
  return files.map((dir) => collect(dir)).flat().map(read).join("\n");
}

function collect(relativeDir) {
  const dir = join(root, relativeDir);
  const output = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const relative = full.slice(root.length + 1).replace(/\\/g, "/");
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (relative.includes("api/leads")) continue;
      output.push(...collect(relative));
    } else if (/\.(tsx|ts)$/.test(entry)) {
      output.push(relative);
    }
  }
  return output;
}

function add(file, message) {
  issues.push({ file, message });
}
