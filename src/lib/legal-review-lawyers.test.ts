import assert from "node:assert/strict";
import { getFamilyReviewService, normalizeFamilyReviewService, selectReviewLawyers } from "@/lib/legal-review-lawyers";
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

console.log("legal review lawyer matching tests passed");

