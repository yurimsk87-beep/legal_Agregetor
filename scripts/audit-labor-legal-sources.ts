import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { LABOR_AREA_IDS, LABOR_LEGAL_REVIEWED_AT, LABOR_LEGAL_RULES } from "../src/data/labor-legal-sources";

const allowedHosts = new Set(["pravo.gov.ru", "www.vsrf.ru", "sfr.gov.ru"]);
const ids = new Set<string>();
const areaCoverage = new Map(LABOR_AREA_IDS.map((area) => [area, 0]));
const failures: string[] = [];

for (const item of LABOR_LEGAL_RULES) {
  if (ids.has(item.id)) failures.push(`Duplicate rule id: ${item.id}`);
  ids.add(item.id);
  if (item.verificationStatus !== "VERIFIED_OFFICIAL") failures.push(`${item.id}: official confirmation missing`);
  if (!item.provisions.length || !item.statement || !item.scope || !item.limitations) failures.push(`${item.id}: incomplete traceability`);
  if (item.reviewedAt !== LABOR_LEGAL_REVIEWED_AT) failures.push(`${item.id}: stale review date`);
  try {
    const url = new URL(item.url);
    if (url.protocol !== "https:" || !allowedHosts.has(url.hostname)) failures.push(`${item.id}: non-official URL ${item.url}`);
  } catch {
    failures.push(`${item.id}: invalid URL ${item.url}`);
  }
  for (const area of item.areas) areaCoverage.set(area, (areaCoverage.get(area) ?? 0) + 1);
}

for (const [area, count] of areaCoverage) if (!count) failures.push(`${area}: no legal rules`);

const claimCounts = (claim: "deadline" | "payment" | "state-duty" | "jurisdiction" | "authority") =>
  LABOR_LEGAL_RULES.filter((item) => item.verifiedClaims.includes(claim)).length;

const report = {
  generatedAt: new Date().toISOString(),
  reviewedAt: LABOR_LEGAL_REVIEWED_AT,
  rules: LABOR_LEGAL_RULES.length,
  officialHosts: [...allowedHosts],
  areaCoverage: Object.fromEntries(areaCoverage),
  verifiedClaimCounts: {
    deadlines: claimCounts("deadline"),
    payments: claimCounts("payment"),
    stateDuties: claimCounts("state-duty"),
    jurisdiction: claimCounts("jurisdiction"),
    competentAuthorities: claimCounts("authority")
  },
  acceptance: {
    rulesWithoutOfficialConfirmation: LABOR_LEGAL_RULES.filter((item) => item.verificationStatus !== "VERIFIED_OFFICIAL").length,
    brokenRequiredOfficialUrls: LABOR_LEGAL_RULES.filter((item) => {
      try { const url = new URL(item.url); return url.protocol !== "https:" || !allowedHosts.has(url.hostname); } catch { return true; }
    }).length,
    unverifiedDeadlines: LABOR_LEGAL_RULES.filter((item) => item.verifiedClaims.includes("deadline") && item.verificationStatus !== "VERIFIED_OFFICIAL").length,
    unverifiedPayments: LABOR_LEGAL_RULES.filter((item) => item.verifiedClaims.includes("payment") && item.verificationStatus !== "VERIFIED_OFFICIAL").length,
    unverifiedStateDuties: LABOR_LEGAL_RULES.filter((item) => item.verifiedClaims.includes("state-duty") && item.verificationStatus !== "VERIFIED_OFFICIAL").length,
    unverifiedJurisdiction: LABOR_LEGAL_RULES.filter((item) => item.verifiedClaims.includes("jurisdiction") && item.verificationStatus !== "VERIFIED_OFFICIAL").length,
    unverifiedCompetentAuthorities: LABOR_LEGAL_RULES.filter((item) => item.verifiedClaims.includes("authority") && item.verificationStatus !== "VERIFIED_OFFICIAL").length,
    outdatedRules: LABOR_LEGAL_RULES.filter((item) => item.reviewedAt !== LABOR_LEGAL_REVIEWED_AT).length,
    traceabilityViolations: failures.length,
    result: failures.length ? "FAIL" : "PASS"
  },
  failures
};

const outputPath = resolve(process.cwd(), "docs", "labor-legal-source-audit.json");
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputPath, ...report.acceptance, rules: report.rules, areaCoverage: report.areaCoverage }, null, 2));
if (failures.length) process.exitCode = 1;
