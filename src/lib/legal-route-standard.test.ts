import assert from "node:assert/strict";
import { getLegalRouteGroups, LEGAL_ROUTE_GROUPS } from "@/data/legal-route-groups";
import {
  getLegalRouteRegistry,
  getLegalRouteV1,
  LEGACY_FAMILY_ROUTE_SLUGS,
  LEGAL_ROUTE_STANDARD_VERSION
} from "@/data/legal-route-standard";
import { legalCategories } from "@/data/legal-categories";
import { getNavigatorDocument } from "@/data/documents";

const routes = getLegalRouteRegistry();
const identifiers = routes.map((route) => `${route.categorySlug}/${route.problemSlug}`);
const categories = new Set(legalCategories.map((category) => category.slug));

assert.ok(routes.length >= 43, "migration baseline must retain the original 29 family and 14 labor situations; new compliant routes are allowed");
assert.equal(new Set(identifiers).size, identifiers.length, "canonical category/problem URL must be unique");
assert.equal(new Set(LEGACY_FAMILY_ROUTE_SLUGS).size, LEGACY_FAMILY_ROUTE_SLUGS.length);

for (const route of routes) {
  assert.equal(route.version, LEGAL_ROUTE_STANDARD_VERSION);
  assert.ok(categories.has(route.categorySlug), `${route.problemSlug}: unknown category`);
  assert.equal(route.problemUrl, `/problems/${route.categorySlug}/${route.problemSlug}/`);
  assert.match(route.legalReviewedAt ?? "", /^\d{4}-\d{2}-\d{2}$/, `${route.problemSlug}: missing source review date`);
  assert.equal(getLegalRouteV1(route.categorySlug, route.problemSlug)?.problemSlug, route.problemSlug);

  if (route.source === "legacy-family") {
    assert.equal(route.categorySlug, "semya-i-deti");
    assert.equal(route.migrationStatus, "ADAPTED_V1");
    assert.ok(LEGACY_FAMILY_ROUTE_SLUGS.includes(route.problemSlug as (typeof LEGACY_FAMILY_ROUTE_SLUGS)[number]));
  }

  assert.ok(route.scenarios.length > 0, `${route.problemSlug}: scenarios required`);
  assert.equal(new Set(route.scenarios.map((scenario) => scenario.key)).size, route.scenarios.length);
  for (const scenario of route.scenarios) {
    assert.ok(scenario.title.trim(), `${route.problemSlug}/${scenario.key}: empty scenario title`);
    assert.equal(
      scenario.scenarioUrl,
      `${route.problemUrl}?scenario=${encodeURIComponent(scenario.key)}`
    );
    assert.ok(scenario.inputs.every((input) => input.key.trim() && input.label.trim()));
    if (route.source === "labor") {
      assert.ok(scenario.inputs.every((input, index) => input.key === `scenario-${index + 1}`), `${route.problemSlug}/${scenario.key}: input keys must match the existing labor generator`);
    }
    if (scenario.documentSlug) {
      assert.equal(scenario.documentUrl, `/documents/${scenario.documentSlug}/`);
      assert.ok(getNavigatorDocument(scenario.documentSlug), `${route.problemSlug}/${scenario.key}: document not registered`);
    } else {
      assert.equal(scenario.documentUrl, null);
      assert.notEqual(scenario.outcome, "DRAFT", `${route.problemSlug}/${scenario.key}: document draft without a document`);
    }
  }
}

const legacy = routes.filter((route) => route.source === "legacy-family");
assert.equal(routes.filter((route) => route.migrationStatus === "LEGACY").length, 0, "All legacy routes must have an explicit scenario map");
assert.deepEqual(new Set(legacy.map((route) => route.problemSlug)), new Set(LEGACY_FAMILY_ROUTE_SLUGS));
assert.equal(routes.filter((route) => route.source === "labor").length, 14);
assert.equal(routes.filter((route) => route.source === "family-additive").length, 5);
assert.equal(legacy.length, 24);
assert.equal(routes.filter((route) => route.migrationStatus === "ADAPTED_V1").length, routes.length);
assert.equal(routes.filter((route) => route.migrationStatus === "SCENARIO_MAPPED_V1").length, 0);

for (const category of legalCategories) {
  const problems = routes.filter((route) => route.categorySlug === category.slug);
  const groups = getLegalRouteGroups(category.slug);
  assert.ok(groups.length > 0, `${category.slug}: missing navigation groups`);
  const assigned = groups.flatMap((group) => {
    assert.ok(group.title.trim() && group.description.trim());
    assert.ok(group.problemSlugs.length);
    return group.problemSlugs;
  });
  assert.equal(new Set(assigned).size, assigned.length, `${category.slug}: duplicate situation in navigation groups`);
  assert.deepEqual(
    new Set(assigned),
    new Set(problems.map((route) => route.problemSlug)),
    `${category.slug}: every situation must appear in exactly one group`
  );
}
assert.equal(Object.keys(LEGAL_ROUTE_GROUPS).length, categories.size);
assert.equal(getLegalRouteV1("semya-i-deti", "route-does-not-exist"), null);

console.log(
  `LEGAL_ROUTE_STANDARD_V1: ${routes.length} routes, ${routes.filter((route) => route.migrationStatus === "ADAPTED_V1").length} adapted, ${legacy.length} original family routes now adapted. Category coverage and scenario/document references verified.`
);
