import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { CHILD_SUPPORT_LEGAL_RULES } from "../src/data/child-support-legal-review";
import { CHILD_SUPPORT_SCENARIOS } from "../src/data/child-support-route";
import { PARENTAL_RIGHTS_DEPRIVATION_RULES } from "../src/data/parental-rights-deprivation-legal-review";
import { PARENTAL_RIGHTS_DEPRIVATION_SCENARIOS } from "../src/data/parental-rights-deprivation-route";
import { PARENTAL_RIGHTS_RESTRICTION_RULES } from "../src/data/parental-rights-restriction-legal-review";
import { PARENTAL_RIGHTS_RESTRICTION_SCENARIOS } from "../src/data/parental-rights-restriction-route";
import { PATERNITY_ESTABLISHMENT_RULES } from "../src/data/paternity-establishment-legal-review";
import { PATERNITY_ESTABLISHMENT_SCENARIOS } from "../src/data/paternity-establishment-route";
import { PATERNITY_CONTEST_RULES } from "../src/data/paternity-contest-legal-review";
import { PATERNITY_CONTEST_SCENARIOS } from "../src/data/paternity-contest-route";
import { ADOPTION_RULES } from "../src/data/adoption-legal-review";
import { ADOPTION_SCENARIOS } from "../src/data/adoption-route";
import { CHILD_TRAVEL_RULES } from "../src/data/child-travel-legal-review";
import { CHILD_TRAVEL_SCENARIOS } from "../src/data/child-travel-route";
import { CHILD_NAME_RULES } from "../src/data/child-name-legal-review";
import { CHILD_NAME_SCENARIOS } from "../src/data/child-name-route";
import { PARENTAL_RIGHTS_RESTORATION_RULES } from "../src/data/parental-rights-restoration-legal-review";
import { PARENTAL_RIGHTS_RESTORATION_SCENARIOS } from "../src/data/parental-rights-restoration-route";
import { PARENTAL_RIGHTS_RESTRICTION_CANCELLATION_RULES } from "../src/data/parental-rights-restriction-cancellation-legal-review";
import { PARENTAL_RIGHTS_RESTRICTION_CANCELLATION_SCENARIOS } from "../src/data/parental-rights-restriction-cancellation-route";
import { PARENTAL_DISAGREEMENTS_RULES } from "../src/data/parental-disagreements-legal-review";
import { PARENTAL_DISAGREEMENTS_SCENARIOS } from "../src/data/parental-disagreements-route";
import { ADDITIONAL_CHILD_EXPENSES_LEGAL_RULES } from "../src/data/additional-child-expenses-legal-review";
import { ADDITIONAL_CHILD_EXPENSES_SCENARIOS } from "../src/data/additional-child-expenses-route";
import { SPOUSAL_SUPPORT_LEGAL_RULES } from "../src/data/spousal-support-legal-review";
import { SPOUSAL_SUPPORT_SCENARIOS } from "../src/data/spousal-support-route";
import { PRENUPTIAL_AGREEMENT_LEGAL_RULES } from "../src/data/prenuptial-agreement-legal-review";
import { PRENUPTIAL_AGREEMENT_SCENARIOS } from "../src/data/prenuptial-agreement-route";
import { INVALID_MARRIAGE_LEGAL_RULES } from "../src/data/invalid-marriage-legal-review";
import { INVALID_MARRIAGE_SCENARIOS } from "../src/data/invalid-marriage-route";
import { COMPLEX_MARITAL_PROPERTY_LEGAL_RULES } from "../src/data/complex-marital-property-legal-review";
import { COMPLEX_MARITAL_PROPERTY_SCENARIOS } from "../src/data/complex-marital-property-route";
import { SURROGACY_ORIGIN_RULES } from "../src/data/surrogacy-origin-legal-review";
import { SURROGACY_ORIGIN_SCENARIOS } from "../src/data/surrogacy-origin-route";
import { INTERNATIONAL_FAMILY_DISPUTES_RULES } from "../src/data/international-family-disputes-legal-review";
import { INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS } from "../src/data/international-family-disputes-route";
import { RELATIVE_CHILD_CONTACT_RULES } from "../src/data/relative-child-contact-legal-review";
import { RELATIVE_CHILD_CONTACT_SCENARIOS } from "../src/data/relative-child-contact-route";
import { EMANCIPATION_RULES } from "../src/data/emancipation-legal-review";
import { EMANCIPATION_SCENARIOS } from "../src/data/emancipation-route";

type LegalRule = {
  id: string;
  statement: string;
  norm: string;
  officialSource: string;
  url: string;
  checkedAt: string;
  scenarios: readonly string[];
};

type RouteAuditConfig = {
  route: string;
  scenarios: Record<string, unknown>;
  rules: readonly LegalRule[];
  resultKinds: readonly string[];
  reviewPolicy: "always" | "conditional";
};

const routes: RouteAuditConfig[] = [
  { route: "alimenty-na-rebenka", scenarios: CHILD_SUPPORT_SCENARIOS, rules: CHILD_SUPPORT_LEGAL_RULES, resultKinds: ["agreement", "courtDraft", "applicationDraft", "checklist", "legalReviewOnly"], reviewPolicy: "conditional" },
  { route: "lishenie-roditelskih-prav", scenarios: PARENTAL_RIGHTS_DEPRIVATION_SCENARIOS, rules: PARENTAL_RIGHTS_DEPRIVATION_RULES, resultKinds: ["checklist", "courtDraft", "legalReviewOnly", "emergency"], reviewPolicy: "conditional" },
  { route: "ogranichenie-roditelskih-prav", scenarios: PARENTAL_RIGHTS_RESTRICTION_SCENARIOS, rules: PARENTAL_RIGHTS_RESTRICTION_RULES, resultKinds: ["checklist", "courtDraft", "legalReviewOnly", "emergency"], reviewPolicy: "conditional" },
  { route: "ustanovlenie-otcovstva", scenarios: PATERNITY_ESTABLISHMENT_SCENARIOS, rules: PATERNITY_ESTABLISHMENT_RULES, resultKinds: ["dataSheet", "courtDraft", "checklist", "legalReviewOnly"], reviewPolicy: "conditional" },
  { route: "osparivanie-otcovstva", scenarios: PATERNITY_CONTEST_SCENARIOS, rules: PATERNITY_CONTEST_RULES, resultKinds: ["courtDraft", "checklist", "legalReviewOnly"], reviewPolicy: "always" },
  { route: "usynovlenie-rebenka", scenarios: ADOPTION_SCENARIOS, rules: ADOPTION_RULES, resultKinds: ["checklist", "legalReviewOnly"], reviewPolicy: "conditional" },
  { route: "vyezd-rebenka-za-granitsu", scenarios: CHILD_TRAVEL_SCENARIOS, rules: CHILD_TRAVEL_RULES, resultKinds: ["checklist", "dataSheet", "courtDraft", "legalReviewOnly"], reviewPolicy: "conditional" },
  { route: "imya-familiya-otchestvo-rebenka", scenarios: CHILD_NAME_SCENARIOS, rules: CHILD_NAME_RULES, resultKinds: ["checklist", "dataSheet", "legalReviewOnly"], reviewPolicy: "conditional" },
  { route: "vosstanovlenie-v-roditelskih-pravah", scenarios: PARENTAL_RIGHTS_RESTORATION_SCENARIOS, rules: PARENTAL_RIGHTS_RESTORATION_RULES, resultKinds: ["courtDraft", "legalReviewOnly"], reviewPolicy: "always" },
  { route: "otmena-ogranicheniya-roditelskih-prav", scenarios: PARENTAL_RIGHTS_RESTRICTION_CANCELLATION_SCENARIOS, rules: PARENTAL_RIGHTS_RESTRICTION_CANCELLATION_RULES, resultKinds: ["courtDraft", "legalReviewOnly"], reviewPolicy: "always" },
  { route: "raznoglasiya-roditeley-po-vospitaniyu-i-obrazovaniyu", scenarios: PARENTAL_DISAGREEMENTS_SCENARIOS, rules: PARENTAL_DISAGREEMENTS_RULES, resultKinds: ["agreementDraft", "applicationDraft", "courtDraft", "legalReviewOnly"], reviewPolicy: "conditional" },
  { route: "dopolnitelnye-rashody-na-rebenka", scenarios: ADDITIONAL_CHILD_EXPENSES_SCENARIOS, rules: ADDITIONAL_CHILD_EXPENSES_LEGAL_RULES, resultKinds: ["checklist", "agreementDraft", "courtDraft", "legalReviewOnly"], reviewPolicy: "conditional" },
  { route: "soderzhanie-supruga-i-byvshego-supruga", scenarios: SPOUSAL_SUPPORT_SCENARIOS, rules: SPOUSAL_SUPPORT_LEGAL_RULES, resultKinds: ["checklist", "agreementDraft", "courtDraft", "legalReviewOnly"], reviewPolicy: "conditional" },
  { route: "brachnyy-dogovor", scenarios: PRENUPTIAL_AGREEMENT_SCENARIOS, rules: PRENUPTIAL_AGREEMENT_LEGAL_RULES, resultKinds: ["agreementDraft", "courtDraft", "legalReviewOnly"], reviewPolicy: "always" },
  { route: "priznanie-braka-nedeystvitelnym", scenarios: INVALID_MARRIAGE_SCENARIOS, rules: INVALID_MARRIAGE_LEGAL_RULES, resultKinds: ["courtDraft", "legalReviewOnly"], reviewPolicy: "always" },
  { route: "slozhnye-imushchestvennye-spory-suprugov", scenarios: COMPLEX_MARITAL_PROPERTY_SCENARIOS, rules: COMPLEX_MARITAL_PROPERTY_LEGAL_RULES, resultKinds: ["courtDraft", "legalReviewOnly"], reviewPolicy: "always" },
  { route: "surrogatnoe-materinstvo-i-proiskhozhdenie-rebenka", scenarios: SURROGACY_ORIGIN_SCENARIOS, rules: SURROGACY_ORIGIN_RULES, resultKinds: ["checklist", "legalReviewOnly"], reviewPolicy: "always" },
  { route: "mezhdunarodnye-semeynye-spory", scenarios: INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS, rules: INTERNATIONAL_FAMILY_DISPUTES_RULES, resultKinds: ["legalReviewOnly"], reviewPolicy: "always" },
  { route: "obshchenie-rodstvennikov-s-rebenkom", scenarios: RELATIVE_CHILD_CONTACT_SCENARIOS, rules: RELATIVE_CHILD_CONTACT_RULES, resultKinds: ["agreement", "applicationDraft", "courtDraft", "checklist"], reviewPolicy: "conditional" },
  { route: "emansipatsiya-nesovershennoletnego", scenarios: EMANCIPATION_SCENARIOS, rules: EMANCIPATION_RULES, resultKinds: ["checklist", "dataSheet", "courtDraft"], reviewPolicy: "conditional" }
];

const allowedHosts = ["pravo.gov.ru", "publication.pravo.gov.ru", "vsrf.ru", "www.vsrf.ru", "www.nalog.gov.ru", "notariat.ru", "www.kdmid.ru", "www.hcch.net", "csoor.organizations.mchs.gov.ru"];
const weakSourcePattern = /consultant|консультант|garant|гарант|fallback|резервн|архивный текст|копия 20\d{2}/i;

const sourceAudit = routes.flatMap(({ route, rules }) => rules.map((rule) => {
  const host = new URL(rule.url).hostname;
  const verified = rule.checkedAt === "2026-09-18" && allowedHosts.includes(host) && !weakSourcePattern.test(`${rule.officialSource} ${rule.url}`);
  return {
    ruleId: rule.id,
    route,
    statement: rule.statement,
    norm: rule.norm,
    primarySource: { name: rule.officialSource, url: rule.url },
    actualVersionDate: rule.checkedAt,
    verified,
    action: verified ? "verified-primary-source" : "requires-legal-review"
  };
}));

const filingAudit = routes.flatMap(({ route, scenarios, rules, resultKinds, reviewPolicy }) => Object.keys(scenarios).map((scenario) => ({
  route,
  scenario,
  resultKind: resultKinds,
  filingReady: route === "obshchenie-rodstvennikov-s-rebenkom" && scenario === "guardianship" ? "conditional" : false,
  requiresLegalReview: reviewPolicy,
  legalRulesUsed: rules.filter((rule) => rule.scenarios.includes(scenario)).map((rule) => rule.id)
})));

const failures = sourceAudit.filter((item) => !item.verified);
if (routes.length !== 20) throw new Error(`Expected 20 routes, found ${routes.length}`);
if (sourceAudit.length !== 144) throw new Error(`Expected 144 verified rules, found ${sourceAudit.length}`);
if (filingAudit.length !== 83) throw new Error(`Expected 83 scenarios, found ${filingAudit.length}`);
if (failures.length) throw new Error(`Unverified legal sources: ${failures.map((item) => `${item.route}/${item.ruleId}`).join(", ")}`);

if (process.argv.includes("--write")) {
  const outputs = [
    ["docs/analytics/family-routes-legal-source-audit.json", sourceAudit],
    ["docs/analytics/family-routes-filing-readiness-audit.json", filingAudit]
  ] as const;
  for (const [path, data] of outputs) {
    const absolute = resolve(path);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }
}

console.log(JSON.stringify({ routes: routes.length, legalRules: sourceAudit.length, scenarios: filingAudit.length, unverifiedSources: failures.length }, null, 2));
