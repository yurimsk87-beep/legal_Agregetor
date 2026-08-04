import assert from "node:assert/strict";
import {
  calculateNotaryAgreementTariff,
  calculatePropertyAssets,
  calculatePropertyClaimDuty,
  resolveCourtLevel,
  validateDivorcePropertyApplication
} from "@/lib/divorce-property-validator";
import { isDivorcePropertyLegalReviewCurrent } from "@/data/divorce-property-legal-review";

const magistrateCourtBase = {
  courtRegion: "Москва",
  territorialBasis: "defendant",
  territorialAddress: "г. Москва, ул. Тестовая, д. 1",
  courtSearchConfirmed: "yes",
  courtName: "Судебный участок мирового судьи N 1",
  courtAddress: "г. Москва, ул. Судебная, д. 1",
  courtWebsite: "https://example.sudrf.ru/",
  appealCourtName: "Тестовый районный суд города Москвы"
};

const districtCourtBase = {
  ...magistrateCourtBase,
  courtName: "Тестовый районный суд города Москвы",
  appealCourtName: ""
};

function propertyAssetRows(fullValue = "1000000", claimedSharePercent = "100") {
  return JSON.stringify([{
    id: "asset-1",
    description: "Квартира",
    identifier: "кадастровый номер 77:01:0000000:1",
    acquisitionBasis: "договор купли-продажи в период брака",
    registeredOwner: "Ответчик",
    fullValue,
    claimedSharePercent,
    requestedResult: "plaintiff",
    compensationDirection: "none",
    compensationAmount: ""
  }]);
}

const registryBase = {
  applicantData: "Заявитель",
  spouseData: "Супруг",
  contactPhone: "+7 900 000-00-00",
  zagsOffice: "Тверской отдел ЗАГС города Москвы",
  marriageRecord: "Запись N 1",
  selectedSurnames: "Фамилии указаны",
  registryStatistics: "Высшее образование; брак первый; общих несовершеннолетних детей нет"
};

const mutual = validateDivorcePropertyApplication("registry-divorce", {
  ...registryBase,
  registryGround: "mutual",
  mutualConsent: "yes",
  commonMinorChildren: "no"
});
assert.equal(mutual.allowed, true);
assert.deepEqual(mutual.formNumbers, ["9"]);
assert.equal(mutual.feeAmount, 5000);

const separate = validateDivorcePropertyApplication("registry-divorce", {
  ...registryBase,
  registryGround: "separate",
  mutualConsent: "yes",
  commonMinorChildren: "no",
  absentSignature: "Подпись удостоверена нотариусом"
});
assert.equal(separate.allowed, true);
assert.deepEqual(separate.formNumbers, ["9", "10"]);

const separateWithoutSignature = validateDivorcePropertyApplication("registry-divorce", {
  ...registryBase,
  registryGround: "separate",
  mutualConsent: "yes",
  commonMinorChildren: "no"
});
assert.equal(separateWithoutSignature.allowed, false);

for (const specialBasis of ["missing", "incapable", "imprisoned"]) {
  const result = validateDivorcePropertyApplication("registry-divorce", {
    ...registryBase,
    registryGround: "special",
    specialBasis,
    basisDocument: "Вступивший в силу судебный акт",
    specialNoticeRecipient: "Получатель извещения, полный почтовый адрес"
  });
  assert.equal(result.allowed, true, specialBasis);
  assert.deepEqual(result.formNumbers, ["11"]);
  assert.equal(result.feeAmount, 350);
}

const mutualWithChildren = validateDivorcePropertyApplication("registry-divorce", {
  ...registryBase,
  registryGround: "mutual",
  mutualConsent: "yes",
  commonMinorChildren: "yes"
});
assert.equal(mutualWithChildren.allowed, false);

const judicialRegistry = validateDivorcePropertyApplication("registry-divorce", {
  ...registryBase,
  registryGround: "court-decision",
  basisDocument: "Решение суда вступило в силу 01.08.2026",
  foreignCourtDecision: "no",
  courtRegistryAction: "registration",
  authorizedRepresentative: "no"
});
assert.equal(judicialRegistry.allowed, true);
assert.deepEqual(judicialRegistry.formNumbers, ["12"]);
assert.equal(validateDivorcePropertyApplication("registry-divorce", {
  ...registryBase,
  registryGround: "court-decision",
  basisDocument: "Решение иностранного суда",
  foreignCourtDecision: "yes",
  courtRegistryAction: "registration",
  authorizedRepresentative: "no"
}).allowed, false);

assert.equal(validateDivorcePropertyApplication("registry-divorce", {
  ...registryBase,
  registryGround: "special",
  specialBasis: "incapable",
  basisDocument: "Решение суда"
}).allowed, false, "форма N 11 требует данные адресата обязательного извещения");

assert.equal(validateDivorcePropertyApplication("registry-divorce", {
  ...registryBase,
  registryGround: "court-decision",
  basisDocument: "Решение суда вступило в силу 01.08.2026",
  foreignCourtDecision: "no",
  courtRegistryAction: "registration",
  authorizedRepresentative: "yes"
}).allowed, false, "форма N 12 требует данные представителя при подаче по доверенности");

const courtBase = {
  ...magistrateCourtBase,
  commonMinorChildren: "yes",
  childrenData: "Ребёнок, 2018 г.р.",
  childDispute: "no",
  consentState: "objects",
  plaintiffRole: "wife",
  pregnancyOrInfant: "none",
  otherClaims: "none",
  hearWithoutPlaintiff: "no",
  defendantLocation: "known",
  courtFeeRelief: "none"
};

for (const consentState of ["objects", "evades", "agrees"]) {
  const result = validateDivorcePropertyApplication("court-divorce", { ...courtBase, consentState });
  assert.equal(result.allowed, true, consentState);
  assert.equal(result.feeAmount, 5000);
  assert.equal(result.draftText.includes(`Позиция ответчика: ${consentState}`), false, consentState);
}

assert.equal(validateDivorcePropertyApplication("court-divorce", {
  ...courtBase,
  commonMinorChildren: "no",
  childrenData: "",
  consentState: "agrees"
}).allowed, false);

assert.equal(validateDivorcePropertyApplication("court-divorce", {
  ...courtBase,
  courtFeeRelief: "unsure"
}).allowed, false);

const statutoryCourtRelief = validateDivorcePropertyApplication("court-divorce", {
  ...courtBase,
  courtFeeRelief: "statutory",
  feeReliefDetails: "Льгота и подтверждающий документ указаны заявителем"
});
assert.equal(statutoryCourtRelief.allowed, true);
assert.equal(statutoryCourtRelief.feeAmount, null);
assert.equal(statutoryCourtRelief.requiresLegalReview, true);

for (const protectedSituation of ["pregnancy", "infant"]) {
  const article17Blocked = validateDivorcePropertyApplication("court-divorce", {
    ...courtBase,
    plaintiffRole: "husband",
    pregnancyOrInfant: protectedSituation,
    wifeConsent: "no"
  });
  assert.equal(article17Blocked.allowed, false, protectedSituation);
}

const unknownDefendant = validateDivorcePropertyApplication("court-divorce", {
  ...courtBase,
  defendantLocation: "unknown"
});
assert.equal(unknownDefendant.allowed, true);
assert.ok(unknownDefendant.notices.some((notice) => notice.includes("последнее известное")));

const absentPlaintiff = validateDivorcePropertyApplication("court-divorce", {
  ...courtBase,
  hearWithoutPlaintiff: "yes"
});
assert.equal(absentPlaintiff.supplementalDrafts.some(({ title }) => title.includes("без участия")), true);

assert.equal(calculateNotaryAgreementTariff(1), 300);
assert.equal(calculateNotaryAgreementTariff(1000000), 5000);
assert.equal(calculateNotaryAgreementTariff(100000000), 20000);

const agreementBase = {
  divisionTiming: "after-divorce",
  mutualAgreement: "yes",
  assetValue: "1000000",
  marriageContract: "no",
  mortgage: "no",
  maternityCapital: "no",
  childrenShares: "no",
  thirdPartyRights: "no",
  bankruptcy: "no"
};
assert.equal(validateDivorcePropertyApplication("property-agreement", agreementBase).allowed, true);
assert.equal(validateDivorcePropertyApplication("property-agreement", { ...agreementBase, divisionTiming: "during-marriage" }).allowed, true);
assert.equal(validateDivorcePropertyApplication("property-agreement", { ...agreementBase, mutualAgreement: "no" }).allowed, false);
assert.equal(validateDivorcePropertyApplication("property-agreement", { ...agreementBase, mortgage: "yes" }).requiresLegalReview, true);
assert.equal(validateDivorcePropertyApplication("property-agreement", { ...agreementBase, maternityCapital: "yes" }).requiresLegalReview, true);
assert.equal(validateDivorcePropertyApplication("property-agreement", { ...agreementBase, childrenShares: "yes" }).requiresLegalReview, true);
assert.equal(validateDivorcePropertyApplication("property-agreement", { ...agreementBase, thirdPartyRights: "yes" }).requiresLegalReview, true);
assert.equal(validateDivorcePropertyApplication("property-agreement", { ...agreementBase, bankruptcy: "yes" }).requiresLegalReview, true);

const expectedDuty = new Map<number, number>([
  [1, 4000],
  [100000, 4000],
  [100001, 4000],
  [300000, 10000],
  [300001, 10000],
  [500000, 15000],
  [500001, 15000],
  [1000000, 25000],
  [1000001, 25000],
  [3000000, 45000],
  [3000001, 45000],
  [8000000, 80000],
  [8000001, 80000],
  [24000000, 136000],
  [24000001, 136000],
  [50000000, 214000],
  [50000001, 214000],
  [100000000, 314000],
  [100000001, 314000],
  [500000000, 900000]
]);
for (const [price, duty] of expectedDuty) assert.equal(calculatePropertyClaimDuty(price), duty, String(price));
assert.equal(calculatePropertyClaimDuty(0), null);

const claimBase = {
  ...districtCourtBase,
  divisionTiming: "after-divorce",
  assetRows: propertyAssetRows(),
  assetOrigin: "common",
  marriageContract: "no",
  existingNotarialAgreement: "no",
  debtType: "none",
  mortgage: "no",
  maternityCapital: "no",
  childrenShares: "no",
  thirdPartyRights: "no",
  bankruptcy: "no",
  foreignProperty: "no",
  limitationCertain: "yes",
  needSecurity: "no",
  needEvidenceRequest: "no",
  combineDivorce: "no",
  courtFeeRelief: "none"
};
const standardClaim = validateDivorcePropertyApplication("property-claim", claimBase);
assert.equal(standardClaim.allowed, true);
assert.equal(standardClaim.feeAmount, 25000);
assert.equal(validateDivorcePropertyApplication("property-claim", { ...claimBase, divisionTiming: "during-marriage" }).allowed, true);

for (const assetOrigin of ["before-marriage", "gift", "inheritance", "mixed-funds"]) {
  const result = validateDivorcePropertyApplication("property-claim", { ...claimBase, assetOrigin });
  assert.equal(result.requiresLegalReview, true, assetOrigin);
}

assert.equal(validateDivorcePropertyApplication("property-claim", { ...claimBase, debtType: "personal" }).requiresLegalReview, true);
assert.equal(validateDivorcePropertyApplication("property-claim", { ...claimBase, debtType: "common" }).allowed, true);
assert.equal(validateDivorcePropertyApplication("property-claim", { ...claimBase, marriageContract: "yes" }).requiresLegalReview, true);
assert.equal(validateDivorcePropertyApplication("property-claim", { ...claimBase, existingNotarialAgreement: "yes" }).requiresLegalReview, true);
assert.equal(validateDivorcePropertyApplication("property-claim", { ...claimBase, bankruptcy: "yes" }).requiresLegalReview, true);
for (const complexField of ["mortgage", "maternityCapital", "childrenShares", "thirdPartyRights", "foreignProperty"]) {
  const result = validateDivorcePropertyApplication("property-claim", { ...claimBase, [complexField]: "yes" });
  assert.equal(result.requiresLegalReview, true, complexField);
}
assert.equal(validateDivorcePropertyApplication("property-claim", { ...claimBase, hiddenOrSold: "yes" }).notices.some((notice) => notice.includes("проданного")), true);
assert.equal(validateDivorcePropertyApplication("property-claim", { ...claimBase, hiddenOrSold: "unsure" }).allowed, false);
assert.equal(validateDivorcePropertyApplication("property-claim", { ...claimBase, limitationCertain: "no" }).allowed, false);
assert.equal(validateDivorcePropertyApplication("property-claim", { ...claimBase, assetRows: "[]", combineDivorce: "unsure" }).allowed, false);

const combined = validateDivorcePropertyApplication("property-claim", {
  ...claimBase,
  combineDivorce: "yes",
  combinedCommonMinorChildren: "yes",
  combinedChildrenData: "Ребёнок, 2018 г.р.",
  combinedChildDispute: "no",
  combinedConsentState: "objects",
  combinedPlaintiffRole: "wife",
  combinedPregnancyOrInfant: "none"
});
assert.ok(combined.feeLabel.includes("5 000"));
assert.equal(combined.feeAmount, 30000);
assert.equal(combined.allowed, true);
assert.equal(combined.draftText.includes("Расторгнуть брак"), true);
assert.equal(combined.requiresLegalReview, true);

assert.equal(validateDivorcePropertyApplication("property-claim", {
  ...claimBase,
  combineDivorce: "yes",
  combinedCommonMinorChildren: "yes",
  combinedChildrenData: "Ребёнок, 2026 г.р.",
  combinedChildDispute: "no",
  combinedConsentState: "objects",
  combinedPlaintiffRole: "husband",
  combinedPregnancyOrInfant: "infant",
  combinedWifeConsent: "no"
}).allowed, false);

assert.equal(validateDivorcePropertyApplication("property-claim", { ...claimBase, courtFeeRelief: "unsure" }).allowed, false);
const hardshipClaim = validateDivorcePropertyApplication("property-claim", {
  ...claimBase,
  courtFeeRelief: "hardship",
  feeReliefDetails: "Доходы и обязательные расходы подтверждаются документами"
});
assert.equal(hardshipClaim.allowed, true);
assert.equal(hardshipClaim.feeAmount, null);
assert.equal(hardshipClaim.requiresLegalReview, true);

const protectedClaim = validateDivorcePropertyApplication("property-claim", {
  ...claimBase,
  needSecurity: "yes",
  needEvidenceRequest: "yes"
});
assert.equal(protectedClaim.additionalDocuments.includes("Ходатайство об обеспечении иска."), true);
assert.equal(protectedClaim.additionalDocuments.includes("Ходатайство об истребовании доказательств."), true);
assert.equal(protectedClaim.supplementalDrafts.length, 5);

const propertyCalculation = calculatePropertyAssets([
  JSON.parse(propertyAssetRows("1000000", "50"))[0],
  {
    id: "asset-2",
    description: "Автомобиль",
    identifier: "VIN X0000000000000000",
    acquisitionBasis: "договор купли-продажи в период брака",
    registeredOwner: "Истец",
    fullValue: "600000",
    claimedSharePercent: "50",
    requestedResult: "shared",
    compensationDirection: "to-plaintiff",
    compensationAmount: "300000"
  }
]);
assert.equal(propertyCalculation.issues.length, 0);
assert.equal(propertyCalculation.claimPrice, 1100000);
assert.equal(propertyCalculation.assetsText.includes("кадастровый номер"), true);
assert.equal(propertyCalculation.requestedDivisionText.includes("300 000 руб."), true);
assert.equal(calculatePropertyAssets([{
  ...JSON.parse(propertyAssetRows("100000", "0"))[0],
  requestedResult: "defendant",
  compensationDirection: "to-plaintiff",
  compensationAmount: "150000"
}]).issues.some(({ message }) => message.includes("не может превышать")), true);
assert.equal(validateDivorcePropertyApplication("property-claim", { ...claimBase, assetRows: "[null]" }).allowed, false);

assert.equal(resolveCourtLevel("property-claim", { ...claimBase, assetRows: propertyAssetRows("50000") }), "magistrate");
assert.equal(resolveCourtLevel("property-claim", claimBase), "district");
assert.equal(resolveCourtLevel("court-divorce", courtBase), "magistrate");
assert.equal(resolveCourtLevel("court-divorce", { ...courtBase, childDispute: "yes" }), "manual-review");

const unconfirmedCourt = validateDivorcePropertyApplication("court-divorce", {
  ...courtBase,
  courtSearchConfirmed: "no",
  courtName: "",
  courtAddress: "",
  courtWebsite: ""
});
assert.equal(unconfirmedCourt.allowed, false);
assert.equal(unconfirmedCourt.issues.some(({ field }) => field === "courtSearchConfirmed"), true);

const plaintiffAddressWithoutBasis = validateDivorcePropertyApplication("court-divorce", {
  ...courtBase,
  commonMinorChildren: "no",
  childrenData: "",
  territorialBasis: "plaintiff-child",
  jurisdictionEvidence: "Ребёнок проживает с истцом"
});
assert.equal(plaintiffAddressWithoutBasis.allowed, false);

assert.equal(standardClaim.filingReady, true);
const complexDraft = validateDivorcePropertyApplication("property-claim", { ...claimBase, mortgage: "yes" });
assert.equal(complexDraft.allowed, true);
assert.equal(complexDraft.requiresLegalReview, true);
assert.equal(complexDraft.filingReady, false);
assert.equal(complexDraft.draftText.startsWith("ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ"), true);
assert.equal(standardClaim.draftText.includes("Тестовый районный суд города Москвы"), true);
assert.equal(standardClaim.draftText.includes("ул. Судебная"), true);

assert.equal(isDivorcePropertyLegalReviewCurrent(new Date("2026-08-04T00:00:00Z")), true);
assert.equal(isDivorcePropertyLegalReviewCurrent(new Date("2027-08-04T00:00:00Z")), false);
assert.equal(isDivorcePropertyLegalReviewCurrent(), true, "юридическая сверка маршрута устарела и должна быть повторена");

console.log("divorce-property validation tests passed");
