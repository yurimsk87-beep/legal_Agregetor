import assert from "node:assert/strict";
import { FAMILY_REVIEW_SERVICE_SLUGS, getFamilyReviewService, getFamilyReviewLawyers, normalizeFamilyReviewService, selectReviewLawyers } from "@/lib/legal-review-lawyers";
import type { Lawyer } from "@/lib/types";

assert.equal(getFamilyReviewService("/documents/vzyskanie-alimentov-na-rebenka/", "claim"), "alimenty");
assert.equal(getFamilyReviewService("/documents/ustanovlenie-otcovstva-cherez-sud/", "court"), "ustanovlenie-otcovstva");
assert.equal(getFamilyReviewService("/documents/osparivanie-otcovstva/", "court"), "osparivanie-otcovstva");
assert.equal(getFamilyReviewService("/documents/isk-o-lishenii-roditelskih-prav/", "court"), "lishenie-roditelskih-prav");
assert.equal(getFamilyReviewService("/documents/izmenenie-poryadka/", "change-residence"), "opredelenie-mesta-zhitelstva-rebenka");
assert.equal(getFamilyReviewService("/documents/izmenenie-poryadka/", "change-communication"), "poryadok-obshcheniya-s-rebenkom");
assert.equal(getFamilyReviewService("/documents/brachnyy-dogovor/", "during"), "braknyy-dogovor");
assert.equal(getFamilyReviewService("/documents/mezhdunarodnyy-semeynyy-spor/", "foreign"), "mezhdunarodnoe-pravo");
assert.equal(getFamilyReviewService("/documents/usynovlenie/", "domestic"), "semeynye-spory");
assert.equal(normalizeFamilyReviewService("invented-service"), "semeynye-spory");

function lawyer(id: string, overrides: Partial<Lawyer> = {}): Lawyer {
  return {
    id,
    firstName: id,
    lastName: "Юрист",
    slug: id,
    status: "LAWYER",
    experienceYears: 5,
    description: "",
    education: "",
    isVerified: false,
    active: true,
    blocked: false,
    profileStatus: "APPROVED",
    citySlugs: [],
    serviceSlugs: ["semeynye-spory"],
    cities: [],
    services: [],
    ...overrides
  };
}

const selected = selectReviewLawyers([
  lawyer("low", { rating: 3 }),
  lawyer("verified", { isVerified: true, rating: 4 }),
  lawyer("best", { isVerified: true, rating: 5, reviewCount: 20 }),
  lawyer("fourth", { rating: 4 }),
  lawyer("fifth", { rating: 4.5 }),
  lawyer("blocked", { isVerified: true, rating: 5, blocked: true })
]);
assert.equal(selected.length, 4);
assert.equal(selected[0].id, "best");
assert.equal(selected[1].id, "verified");
assert.ok(!selected.some((item) => item.id === "blocked"));
assert.deepEqual(selectReviewLawyers([]), []);

async function runFallbackTests() {
  const narrowLawyer = lawyer("narrow", { serviceSlugs: ["razvod"] });
  const genericLawyer = lawyer("generic");
  const calls: string[] = [];
  const fetcher = async ({ serviceSlug }: { serviceSlug: typeof FAMILY_REVIEW_SERVICE_SLUGS[number]; take: number }) => {
    calls.push(serviceSlug);
    return serviceSlug === "razvod" ? [narrowLawyer] : [genericLawyer];
  };
  const specificResult = await getFamilyReviewLawyers("razvod", fetcher);
  assert.equal(specificResult.service, "razvod");
  assert.deepEqual(calls, ["razvod"]);
  assert.deepEqual(specificResult.lawyers.map((item) => item.id), ["narrow"]);

  calls.length = 0;
  const fallbackResult = await getFamilyReviewLawyers("razvod", async ({ serviceSlug }) => {
    calls.push(serviceSlug);
    return serviceSlug === "semeynye-spory" ? [genericLawyer] : [];
  });
  assert.equal(fallbackResult.service, "semeynye-spory");
  assert.deepEqual(calls, ["razvod", "semeynye-spory"]);
  assert.deepEqual(fallbackResult.lawyers.map((item) => item.id), ["generic"]);

  calls.length = 0;
  const emptyResult = await getFamilyReviewLawyers("razvod", async ({ serviceSlug }) => {
    calls.push(serviceSlug);
    return [];
  });
  assert.equal(emptyResult.service, "semeynye-spory");
  assert.deepEqual(calls, ["razvod", "semeynye-spory"]);
  assert.deepEqual(emptyResult.lawyers, []);
}

runFallbackTests().then(() => console.log("legal review lawyer matching tests passed"));
