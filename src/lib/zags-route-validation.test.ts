import assert from "node:assert/strict";
import { ZAGS_FEES, calculateAge, isZagsFieldVisible, validateZagsApplication } from "@/lib/zags-application-validator";

const today = new Date("2026-07-29T12:00:00+03:00");

assert.equal(calculateAge("2008-07-29", today), 18);
assert.equal(calculateAge("2012-07-30", today), 13);

const jointMarriage = validateZagsApplication("marriage", {
  mode: "joint",
  mutualConsent: "yes",
  legalObstacles: "none",
  person1BirthDate: "1990-01-01",
  person2BirthDate: "1992-01-01",
  region: "Регион вне справочника",
  office: "Орган ЗАГС, введённый вручную"
}, { today });
assert.equal(jointMarriage.allowed, true);
assert.deepEqual(jointMarriage.formNumbers, ["7"]);
assert.equal(jointMarriage.feeAmount, ZAGS_FEES.marriage);

const separateMarriage = validateZagsApplication("marriage", {
  mode: "separate",
  mutualConsent: "yes",
  legalObstacles: "none",
  person1BirthDate: "1990-01-01",
  person2BirthDate: "1992-01-01"
}, { today });
assert.deepEqual(separateMarriage.formNumbers, ["8"]);
assert.match(separateMarriage.notices.join(" "), /личное присутствие обоих лиц/);

const marriageWithObstacle = validateZagsApplication("marriage", {
  mode: "joint",
  mutualConsent: "yes",
  legalObstacles: "present",
  person1BirthDate: "1990-01-01",
  person2BirthDate: "1992-01-01"
}, { today });
assert.equal(marriageWithObstacle.allowed, false);
assert.equal(marriageWithObstacle.issues.some(({ field }) => field === "legalObstacles"), true);

const minorMarriageWithoutPermission = validateZagsApplication("marriage", {
  mode: "joint",
  mutualConsent: "yes",
  legalObstacles: "none",
  person1BirthDate: "2010-01-01",
  person2BirthDate: "1992-01-01"
}, { today });
assert.equal(minorMarriageWithoutPermission.allowed, false);
assert.equal(minorMarriageWithoutPermission.issues.some(({ field }) => field === "minorMarriagePermission"), true);
assert.equal(isZagsFieldVisible("marriage", "minorMarriagePermission", { person1BirthDate: "2010-01-01", person2BirthDate: "1992-01-01" }, today), true);

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
  result: "marriage-reference",
  referencePurpose: "other"
});
assert.equal(archiveReference.allowed, true);
assert.equal(archiveReference.feeAmount, ZAGS_FEES.archiveReference);

const pensionReference = validateZagsApplication("repeat-document", {
  marriageStatus: "divorced",
  result: "marriage-reference",
  referencePurpose: "pension-benefit"
});
assert.equal(pensionReference.allowed, true);
assert.equal(pensionReference.feeAmount, 0);
assert.match(pensionReference.feeLabel, /не уплачивается/);

const underFourteen = validateZagsApplication("name-change", {
  birthDate: "2013-01-01",
  maritalStatus: "never-married",
  hasMinorChildren: "no"
}, { today });
assert.equal(underFourteen.allowed, false);
assert.match(underFourteen.issues[0].message, /младше 14 лет/);

const minorWithoutBasis = validateZagsApplication("name-change", {
  birthDate: "2010-01-01",
  maritalStatus: "never-married",
  hasMinorChildren: "no"
}, { today });
assert.equal(minorWithoutBasis.allowed, false);
assert.equal(isZagsFieldVisible("name-change", "minorBasis", { birthDate: "2010-01-01" }, today), true);

const minorWithBasis = validateZagsApplication("name-change", {
  birthDate: "2010-01-01",
  minorBasis: "court",
  minorBasisDetails: "Решение суда",
  maritalStatus: "never-married",
  hasMinorChildren: "no"
}, { today });
assert.equal(minorWithBasis.allowed, true);

const fullyCapableMinor = validateZagsApplication("name-change", {
  birthDate: "2010-01-01",
  minorBasis: "full-capacity",
  minorBasisDetails: "Решение об эмансипации",
  maritalStatus: "never-married",
  hasMinorChildren: "no"
}, { today });
assert.equal(fullyCapableMinor.allowed, true);
assert.match(fullyCapableMinor.notices.join(" "), /отдельным основанием/);

const adultNameChange = validateZagsApplication("name-change", {
  birthDate: "1990-01-01",
  maritalStatus: "married",
  hasMinorChildren: "yes",
  childrenRecords: "Иванов Иван, 01.01.2020, запись N 1"
}, { today });
assert.equal(adultNameChange.allowed, true);
assert.equal(adultNameChange.feeAmount, ZAGS_FEES.nameChange);
assert.equal(adultNameChange.attachments.some((item) => item.includes("заключении брака")), true);
assert.equal(adultNameChange.attachments.some((item) => item.includes("каждого несовершеннолетнего")), true);
assert.equal(isZagsFieldVisible("name-change", "minorBasis", { birthDate: "1990-01-01" }, today), false);

const missingChildrenRecords = validateZagsApplication("name-change", {
  birthDate: "1990-01-01",
  maritalStatus: "never-married",
  hasMinorChildren: "yes"
}, { today });
assert.equal(missingChildrenRecords.allowed, false);
assert.equal(missingChildrenRecords.issues.some(({ field }) => field === "childrenRecords"), true);

const keptCertificate = validateZagsApplication("record-correction", {
  certificateState: "kept",
  hasDispute: "no",
  feeExemptionBasis: "none"
});
assert.equal(keptCertificate.allowed, false);
assert.equal(keptCertificate.issues.some(({ field }) => field === "exchangeDocument"), true);
assert.equal(isZagsFieldVisible("record-correction", "exchangeDocument", { certificateState: "kept" }), true);

const lostCertificate = validateZagsApplication("record-correction", {
  certificateState: "lost",
  hasDispute: "no",
  feeExemptionBasis: "none"
});
assert.equal(lostCertificate.allowed, true);
assert.match(lostCertificate.notices.join(" "), /повторное свидетельство специально.*не требуется/);
assert.equal(isZagsFieldVisible("record-correction", "exchangeDocument", { certificateState: "lost" }), false);

const confirmedWorkerError = validateZagsApplication("record-correction", {
  certificateState: "lost",
  hasDispute: "no",
  feeExemptionBasis: "zags-worker",
  feeExemptionDetails: "Письменный ответ органа ЗАГС"
});
assert.equal(confirmedWorkerError.allowed, true);
assert.equal(confirmedWorkerError.feeAmount, 0);

const unconfirmedWorkerError = validateZagsApplication("record-correction", {
  certificateState: "lost",
  hasDispute: "no",
  feeExemptionBasis: "zags-worker"
});
assert.equal(unconfirmedWorkerError.allowed, false);
assert.equal(unconfirmedWorkerError.feeAmount, ZAGS_FEES.recordCorrection);

const adoptionCorrection = validateZagsApplication("record-correction", {
  certificateState: "lost",
  hasDispute: "no",
  feeExemptionBasis: "adoption-birth",
  feeExemptionDetails: "Решение суда об усыновлении"
});
assert.equal(adoptionCorrection.allowed, true);
assert.equal(adoptionCorrection.feeAmount, 0);

const disputedCorrection = validateZagsApplication("record-correction", {
  certificateState: "lost",
  hasDispute: "yes",
  feeExemptionBasis: "none"
});
assert.equal(disputedCorrection.allowed, false);
assert.match(disputedCorrection.issues.find(({ field }) => field === "hasDispute")?.message ?? "", /судебное решение/);

console.log("zags route validation tests passed");
