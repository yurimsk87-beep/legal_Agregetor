import fs from "node:fs";
import path from "node:path";
import { navigatorDocuments } from "@/data/documents";
import { getLaborDocumentScenario } from "@/data/labor-documents";
import { getFamilyAdditiveScenarioByDocumentSlug } from "@/data/family-additive-routes";

type GateName = "scenario" | "fullDraft" | "pdf" | "editAnswers" | "immutableVersion" |
  "lawyerReceivesSamePdf" | "relatedQuestions" | "legalArticleUrls" | "seoPromises";
type Gate = "NOT_TESTED" | "PASS" | "FAIL";
const gates: GateName[] = ["scenario", "fullDraft", "pdf", "editAnswers", "immutableVersion",
  "lawyerReceivesSamePdf", "relatedQuestions", "legalArticleUrls", "seoPromises"];

function resultKind(document: { slug: string; documentType: string }) {
  if (document.slug === "zayavlenie-v-zags") return "PREPARED_DATA";
  if (/чек-лист|памятк/iu.test(document.documentType)) return "CHECKLIST";
  if (/лист данных|подготовленн.*сведени/iu.test(document.documentType)) return "PREPARED_DATA";
  return "DRAFT_OR_OTHER_UNCONFIRMED";
}

function escapeCsv(value: unknown) {
  return '"' + String(value ?? "").replaceAll('"', '""') + '"';
}

const rows = navigatorDocuments.map((document) => {
  const labor = getLaborDocumentScenario(document.slug);
  const additive = getFamilyAdditiveScenarioByDocumentSlug(document.slug);
  const generatorFamily = labor ? "LABOR_AI" : additive ? "FAMILY_ADDITIVE" : "OTHER_FAMILY_OR_SPECIAL";
  const checks = Object.fromEntries(gates.map((name) => [name, "NOT_TESTED" as Gate])) as Record<GateName, Gate>;
  return {
    slug: document.slug,
    path: "/documents/" + document.slug + "/",
    title: document.title,
    documentType: document.documentType,
    declaredResultKind: resultKind(document),
    engine: generatorFamily,
    legalReferenceKeys: document.legalReferenceKeys,
    checks,
    legalProfessionalReview: "NOT_VERIFIED",
    acceptance: "NOT_VERIFIED",
    evidence: [] as string[],
    blocker: "Результат не проходил сквозную генерацию с контрольными фактическими данными."
  };
}).sort((a, b) => a.slug.localeCompare(b.slug));

const slugs = new Set(rows.map((row) => row.slug));
if (slugs.size !== rows.length) throw new Error("Duplicate document slugs found");
const report = {
  auditedAt: new Date().toISOString(),
  source: "navigatorDocuments",
  count: rows.length,
  passed: 0,
  notVerified: rows.length,
  evidenceBased: false,
  note: "Static inventory only. No document may receive PASS before real API, file, UI and legal-review evidence is attached.",
  rows
};
const outDir = path.resolve("docs/acceptance-generated");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "document-matrix.json"), JSON.stringify(report, null, 2) + "\n");
const headers = ["slug", "path", "title", "declaredResultKind", "engine",
  ...gates, "legalProfessionalReview", "acceptance", "blocker"];
const csv = [headers.map(escapeCsv).join(","),
  ...rows.map((r) => headers.map((key) =>
    escapeCsv(key in r.checks ? r.checks[key as GateName] : r[key as keyof typeof r])
  ).join(","))].join("\n") + "\n";
fs.writeFileSync(path.join(outDir, "document-matrix.csv"), csv);
console.log("Document inventory:", rows.length, "PASS: 0, NOT_VERIFIED:", rows.length);
console.log("Saved JSON and CSV to docs/acceptance-generated/");
