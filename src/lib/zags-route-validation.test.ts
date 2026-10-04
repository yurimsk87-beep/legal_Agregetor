import assert from "node:assert/strict";
import { ZAGS_FEES, calculateAge, isZagsFieldVisible, validateZagsApplication } from "@/lib/zags-application-validator";

const today = new Date("2026-07-29T12:00:00+03:00");

assert.equal(calculateAge("2008-07-29", today), 18);
assert.equal(calculateAge("2012-07-30", today), 13);

const jointMarriage = validateZagsApplication("marriage", {
  mode: "joint",
  region: "Регион вне справочника",
  office: "Орган ЗАГС, введённый вручную"
});
assert.equal(jointMarriage.allowed, true);
assert.deepEqual(jointMarriage.formNumbers, ["7"]);
assert.equal(jointMarriage.feeAmount, ZAGS_FEES.marriage);

const separateMarriage = validateZagsApplication("marriage", { mode: "separate" });
assert.deepEqual(separateMarriage.formNumbers, ["8"]);
assert.match(separateMarriage.notices.join(" "), /личное присутствие обоих лиц/);

for (const marriageStatus of ["divorced", "invalid"]) {
  const decision = validateZagsApplication("repeat-document", {
    marriageStatus,
    result: "marriage-certificate"
  });
  assert.equal(decision.allowed, false);
  assert.match(decision.issues[0].message, /повторное свидетельство.*не выдаётся/);
}

const activeMarriage = validateZagsApplication("repeat-document", {
  marriageStatus: "active",
  result: "marriage-certificate"
});
assert.equal(activeMarriage.allowed, true);
assert.equal(activeMarriage.feeAmount, ZAGS_FEES.repeatCertificate);

const widowedMarriage = validateZagsApplication("repeat-document", {
  marriageStatus: "widowed",
  result: "marriage-certificate"
});
assert.equal(widowedMarriage.allowed, true);
assert.match(widowedMarriage.notices.join(" "), /не приравнивается к расторжению/);

const archiveReference = validateZagsApplication("repeat-document", {
  marriageStatus: "divorced",
  result: "marriage-reference"
});
assert.equal(archiveReference.allowed, true);
assert.equal(archiveReference.feeAmount, ZAGS_FEES.archiveReference);

const underFourteen = validateZagsApplication("name-change", { birthDate: "2013-01-01" }, { today });
assert.equal(underFourteen.allowed, false);
assert.match(underFourteen.issues[0].message, /младше 14 лет/);

const minorWithoutBasis = validateZagsApplication("name-change", { birthDate: "2010-01-01" }, { today });
assert.equal(minorWithoutBasis.allowed, false);
assert.equal(isZagsFieldVisible("name-change", "minorBasis", { birthDate: "2010-01-01" }, today), true);

const minorWithBasis = validateZagsApplication("name-change", {
  birthDate: "2010-01-01",
  minorBasis: "court",
  minorBasisDetails: "Решение суда"
}, { today });
assert.equal(minorWithBasis.allowed, true);

const fullyCapableMinor = validateZagsApplication("name-change", {
  birthDate: "2010-01-01",
  minorBasis: "full-capacity",
  minorBasisDetails: "Решение об эмансипации"
}, { today });
assert.equal(fullyCapableMinor.allowed, true);
assert.match(fullyCapableMinor.notices.join(" "), /отдельным основанием/);

const adultNameChange = validateZagsApplication("name-change", { birthDate: "1990-01-01" }, { today });
assert.equal(adultNameChange.allowed, true);
assert.equal(adultNameChange.feeAmount, ZAGS_FEES.nameChange);
assert.equal(isZagsFieldVisible("name-change", "minorBasis", { birthDate: "1990-01-01" }, today), false);

const keptCertificate = validateZagsApplication("record-correction", {
  certificateState: "kept",
  errorSource: "other"
});
assert.equal(keptCertificate.allowed, false);
assert.equal(keptCertificate.issues.some(({ field }) => field === "exchangeDocument"), true);
assert.equal(isZagsFieldVisible("record-correction", "exchangeDocument", { certificateState: "kept" }), true);

const lostCertificate = validateZagsApplication("record-correction", {
  certificateState: "lost",
  errorSource: "other"
});
assert.equal(lostCertificate.allowed, true);
assert.match(lostCertificate.notices.join(" "), /повторное свидетельство специально.*не требуется/);
assert.equal(isZagsFieldVisible("record-correction", "exchangeDocument", { certificateState: "lost" }), false);

const confirmedWorkerError = validateZagsApplication("record-correction", {
  certificateState: "lost",
  errorSource: "zags-worker",
  workerErrorConfirmed: "yes"
});
assert.equal(confirmedWorkerError.allowed, true);
assert.equal(confirmedWorkerError.feeAmount, 0);

const unconfirmedWorkerError = validateZagsApplication("record-correction", {
  certificateState: "lost",
  errorSource: "zags-worker",
  workerErrorConfirmed: "no"
});
assert.equal(unconfirmedWorkerError.allowed, true);
assert.equal(unconfirmedWorkerError.feeAmount, ZAGS_FEES.recordCorrection);

console.log("zags route validation tests passed");
