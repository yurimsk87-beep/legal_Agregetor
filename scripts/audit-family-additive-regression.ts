import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { legalProblems } from "../src/data/legal-problems";

const REPORT_PATH = path.join(process.cwd(), "docs/family-additive-routes-regression-audit.json");
const BASELINE_HEAD = "5ec39dbf3ea564de29abf35df1200d70f9b59f37";
const ROOTS = ["src/data", "src/lib", "src/components/documents", "tests/e2e"];

const ROUTES = [
  ["brak-zags-i-smena-familii", "zags", "zags-route.ts"],
  ["razvod-i-razdel-imushchestva", "divorce-property", "divorce-property-route.ts"],
  ["opeka-i-popechitelstvo-nad-rebenkom", "guardianship", "guardianship-route.ts"],
  ["roditeli-i-rebenok-posle-razvoda", "parents-child", "parents-child-route.ts"],
  ["alimenty-na-rebenka", "child-support", "child-support-route.ts"],
  ["lishenie-roditelskih-prav", "parental-rights-deprivation", "parental-rights-deprivation-route.ts"],
  ["ogranichenie-roditelskih-prav", "parental-rights-restriction", "parental-rights-restriction-route.ts"],
  ["ustanovlenie-otcovstva", "paternity-establishment", "paternity-establishment-route.ts"],
  ["osparivanie-otcovstva", "paternity-contest", "paternity-contest-route.ts"],
  ["usynovlenie-rebenka", "adoption", "adoption-route.ts"],
  ["vyezd-rebenka-za-granitsu", "child-travel", "child-travel-route.ts"],
  ["imya-familiya-otchestvo-rebenka", "child-name", "child-name-route.ts"],
  ["vosstanovlenie-v-roditelskih-pravah", "parental-rights-restoration", "parental-rights-restoration-route.ts"],
  ["otmena-ogranicheniya-roditelskih-prav", "parental-rights-restriction-cancellation", "parental-rights-restriction-cancellation-route.ts"],
  ["raznoglasiya-roditeley-po-vospitaniyu-i-obrazovaniyu", "parental-disagreements", "parental-disagreements-route.ts"],
  ["dopolnitelnye-rashody-na-rebenka", "additional-child-expenses", "additional-child-expenses-route.ts"],
  ["soderzhanie-supruga-i-byvshego-supruga", "spousal-support", "spousal-support-route.ts"],
  ["brachnyy-dogovor", "prenuptial-agreement", "prenuptial-agreement-route.ts"],
  ["priznanie-braka-nedeystvitelnym", "invalid-marriage", "invalid-marriage-route.ts"],
  ["slozhnye-imushchestvennye-spory-suprugov", "complex-marital-property", "complex-marital-property-route.ts"],
  ["surrogatnoe-materinstvo-i-proiskhozhdenie-rebenka", "surrogacy-origin", "surrogacy-origin-route.ts"],
  ["mezhdunarodnye-semeynye-spory", "international-family-disputes", "international-family-disputes-route.ts"],
  ["obshchenie-rodstvennikov-s-rebenkom", "relative-child-contact", "relative-child-contact-route.ts"],
  ["emansipatsiya-nesovershennoletnego", "emancipation", "emancipation-route.ts"]
] as const;

type RouteSnapshot = {
  slug: string;
  problemHash: string;
  scenarioCount: number;
  scenarioKeys: string[];
  files: Record<string, string>;
};

type Report = {
  baselineHead: string;
  stage: string;
  existingFamilyRoutesBefore: number;
  existingFamilyRoutesModified: number;
  existingScenarioCountsUnchanged: boolean;
  existingScenarioKeysUnchanged: boolean;
  existingRouteSlugsUnchanged: boolean;
  baselineRouteSpecificFiles: RouteSnapshot[];
  modifiedRouteSpecificFiles: string[];
  newRoutes: string[];
  allowedCommonRegistryFiles: string[];
  stageResult: "PASS" | "FAIL";
};

async function main() {
  const current = await snapshot();
  if (process.argv.includes("--write-baseline")) {
    if (existsSync(REPORT_PATH)) throw new Error("Baseline already exists; delete it only when intentionally re-baselining.");
    const report = buildBaseline(current);
    writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    print(report);
    return;
  }
  if (!existsSync(REPORT_PATH)) throw new Error("Run with --write-baseline before implementation.");
  const previous = JSON.parse(readFileSync(REPORT_PATH, "utf8")) as Report;
  const report = compare(previous.baselineRouteSpecificFiles, current);
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  print(report);
  if (report.stageResult !== "PASS") process.exitCode = 1;
}

async function snapshot(): Promise<RouteSnapshot[]> {
  const snapshots: RouteSnapshot[] = [];
  for (const [slug, prefix, routeFile] of ROUTES) {
    const problem = legalProblems.find((item) => item.slug === slug);
    if (!problem) throw new Error(`Existing route is missing: ${slug}`);
    const modulePath = path.join(process.cwd(), "src/data", routeFile);
    const routeModule = await import(`${pathToFileURL(modulePath).href}?audit=${Date.now()}`) as Record<string, unknown>;
    const scenarios = Object.entries(routeModule).find(([key, value]) => key.endsWith("_SCENARIOS") && value && typeof value === "object")?.[1] as Record<string, unknown> | undefined;
    if (!scenarios) throw new Error(`Scenario registry not found: ${routeFile}`);
    const files = Object.fromEntries(
      allFiles(ROOTS)
        .filter((file) => path.basename(file).startsWith(prefix))
        .sort()
        .map((file) => [slash(file), hash(readFileSync(file))])
    );
    snapshots.push({
      slug,
      problemHash: hash(JSON.stringify(problem)),
      scenarioCount: Object.keys(scenarios).length,
      scenarioKeys: Object.keys(scenarios).sort(),
      files
    });
  }
  return snapshots;
}

function buildBaseline(routes: RouteSnapshot[]): Report {
  return {
    baselineHead: BASELINE_HEAD,
    stage: "1-pre-flight-baseline-freeze",
    existingFamilyRoutesBefore: routes.length,
    existingFamilyRoutesModified: 0,
    existingScenarioCountsUnchanged: true,
    existingScenarioKeysUnchanged: true,
    existingRouteSlugsUnchanged: routes.length === 24,
    baselineRouteSpecificFiles: routes,
    modifiedRouteSpecificFiles: [],
    newRoutes: [],
    allowedCommonRegistryFiles: [
      "src/data/legal-problems.ts",
      "src/data/related-questions-context.ts",
      "src/app/sitemap.ts",
      "src/lib/site-search.ts"
    ],
    stageResult: routes.length === 24 ? "PASS" : "FAIL"
  };
}

function compare(baseline: RouteSnapshot[], current: RouteSnapshot[]): Report {
  const baselineBySlug = new Map(baseline.map((route) => [route.slug, route]));
  const modified: string[] = [];
  let countsUnchanged = true;
  let keysUnchanged = true;
  for (const route of current) {
    const before = baselineBySlug.get(route.slug);
    if (!before) continue;
    if (before.scenarioCount !== route.scenarioCount) countsUnchanged = false;
    if (JSON.stringify(before.scenarioKeys) !== JSON.stringify(route.scenarioKeys)) keysUnchanged = false;
    if (before.problemHash !== route.problemHash) modified.push(`${route.slug}:problem`);
    const fileNames = new Set([...Object.keys(before.files), ...Object.keys(route.files)]);
    for (const file of fileNames) if (before.files[file] !== route.files[file]) modified.push(file);
  }
  const slugsUnchanged = baseline.length === current.length && baseline.every((route) => current.some((item) => item.slug === route.slug));
  const pass = modified.length === 0 && countsUnchanged && keysUnchanged && slugsUnchanged;
  return {
    baselineHead: BASELINE_HEAD,
    stage: "14-existing-route-regression-audit",
    existingFamilyRoutesBefore: baseline.length,
    existingFamilyRoutesModified: new Set(modified.map((item) => item.split(":")[0])).size,
    existingScenarioCountsUnchanged: countsUnchanged,
    existingScenarioKeysUnchanged: keysUnchanged,
    existingRouteSlugsUnchanged: slugsUnchanged,
    baselineRouteSpecificFiles: baseline,
    modifiedRouteSpecificFiles: modified,
    newRoutes: legalProblems.map((item) => item.slug).filter((slug) => !baselineBySlug.has(slug)),
    allowedCommonRegistryFiles: buildBaseline([]).allowedCommonRegistryFiles,
    stageResult: pass ? "PASS" : "FAIL"
  };
}

function allFiles(roots: string[]) {
  const files: string[] = [];
  const visit = (entry: string) => {
    if (!existsSync(entry)) return;
    if (statSync(entry).isDirectory()) for (const child of readdirSync(entry)) visit(path.join(entry, child));
    else files.push(entry);
  };
  roots.forEach(visit);
  return files;
}

function hash(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function slash(value: string) {
  return value.replaceAll("\\", "/");
}

function print(report: Report) {
  console.log(JSON.stringify({
    stage: report.stage,
    existingFamilyRoutesBefore: report.existingFamilyRoutesBefore,
    existingFamilyRoutesModified: report.existingFamilyRoutesModified,
    existingScenarioCountsUnchanged: report.existingScenarioCountsUnchanged,
    existingScenarioKeysUnchanged: report.existingScenarioKeysUnchanged,
    existingRouteSlugsUnchanged: report.existingRouteSlugsUnchanged,
    stageResult: report.stageResult
  }, null, 2));
}

void main();
