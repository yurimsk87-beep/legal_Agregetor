import assert from "node:assert/strict";
import { inflateRawSync } from "node:zlib";
import {
  calculateNotaryAgreementTariff,
  calculatePropertyAssets,
  calculatePropertyClaimDuty,
  resetCourtSelection,
  resolveCourtLevel,
  validateDivorcePropertyApplication
} from "@/lib/divorce-property-validator";
import {
  composeDivorcePropertyDocumentText,
  createDivorcePropertyDocxBlob,
  getDivorcePropertyDocxFilename
} from "@/lib/divorce-property-docx";
import {
  DIVORCE_PROPERTY_LEGAL_RULES,
  isDivorcePropertyLegalReviewDue,
  isDivorcePropertyLegalReviewFullyPrimaryVerified
} from "@/data/divorce-property-legal-review";
import { COURT_DIRECTORY, COURT_REGIONS } from "@/data/court-directory";

const magistrateCourtBase = {
  courtRegion: "Москва",
  territorialBasis: "defendant",
  territorialAddress: "г. Москва, ул. Тестовая, д. 1",
  courtSearchConfirmed: "yes",
  courtName: "Судебный участок мирового судьи N 1 Центрального района",
  courtPrecinctNumber: "1",
  courtAddress: "г. Москва, ул. Судебная, д. 1",
  courtWebsite: "https://sudrf.ru/index.php?id=300",
  appealCourtName: "Центральный районный суд"
};

const districtCourtBase = {
  ...magistrateCourtBase,
  courtName: "Центральный районный суд",
  courtPrecinctNumber: "",
  appealCourtName: ""
};

function propertyAssetRows(fullValue = "1000000", claimedSharePercent = "100") {
  return JSON.stringify([{
    id: "asset-1",
    assetType: "Недвижимость",
    description: "Квартира",
    identifier: "кадастровый номер 77:01:0000000:1",
    acquisitionDate: "2020-01-15",
    acquisitionBasis: "договор купли-продажи",
    registeredOwner: "Ответчик",
    fullValue,
    valuationDate: "2026-08-01",
    valuationSource: "Независимая оценка",
    valuationDocument: "Отчёт оценщика от 01.08.2026",
    supportingDocuments: "Договор купли-продажи, выписка ЕГРН",
    claimedSharePercent,
    requestedResult: "determine-plaintiff-share",
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
assert.equal(mutual.officialFormOnly, true);
assert.equal(mutual.filingReady, false);
assert.equal(mutual.draftText, "");

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
  assert.equal(result.filingReady, false, "ручной перенос реквизитов суда не подтверждает готовность");
  assert.equal(result.draftText.startsWith("ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ"), true);
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
  notaryRegion: "Москва",
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
assert.equal(validateDivorcePropertyApplication("property-agreement", agreementBase).filingReady, false);
assert.equal(validateDivorcePropertyApplication("property-agreement", agreementBase).draftText.startsWith("ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ"), true);
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
  hiddenOrSold: "no",
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
assert.equal(validateDivorcePropertyApplication("property-claim", { ...claimBase, hiddenOrSold: "unsure" }).filingReady, false);
assert.equal(validateDivorcePropertyApplication("property-claim", { ...claimBase, limitationCertain: "no" }).filingReady, false);
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
    assetType: "Транспорт",
    description: "Автомобиль",
    identifier: "VIN X0000000000000000",
    acquisitionDate: "2021-02-10",
    acquisitionBasis: "договор купли-продажи в период брака",
    registeredOwner: "Истец",
    fullValue: "600000",
    valuationDate: "2026-08-02",
    valuationSource: "Независимая оценка",
    valuationDocument: "Отчёт оценщика от 02.08.2026",
    supportingDocuments: "ПТС, договор купли-продажи, отчёт оценщика",
    claimedSharePercent: "50",
    requestedResult: "determine-plaintiff-share",
    compensationDirection: "none",
    compensationAmount: ""
  }
]);
assert.equal(propertyCalculation.issues.length, 0);
assert.equal(propertyCalculation.claimPrice, 800000);
assert.equal(propertyCalculation.priceConfirmed, true);
assert.equal(propertyCalculation.assetsText.includes("кадастровый номер"), true);
assert.equal(propertyCalculation.assetsText.includes("Отчёт оценщика"), true);
assert.equal(propertyCalculation.supportingDocuments.length, 4);
assert.equal(propertyCalculation.requestedDivisionText.includes("долю 50%"), true);
assert.equal(calculatePropertyAssets([{
  ...JSON.parse(propertyAssetRows())[0],
  valuationSource: "",
  supportingDocuments: ""
}]).issues.some(({ message }) => message.includes("источник стоимости")), true);
assert.equal(calculatePropertyAssets([{
  ...JSON.parse(propertyAssetRows("100000", "100"))[0],
  requestedResult: "transfer-to-defendant",
  compensationDirection: "to-plaintiff",
  compensationAmount: "150000"
}]).issues.some(({ message }) => message.includes("не может превышать")), true);
assert.equal(calculatePropertyAssets([{
  ...JSON.parse(propertyAssetRows("100000", "50"))[0],
  requestedResult: "transfer-to-plaintiff"
}]).issues.some(({ message }) => message.includes("целиком требует значения 100%")), true);
assert.equal(calculatePropertyAssets([{
  ...JSON.parse(propertyAssetRows("100000", "50"))[0],
  requestedResult: "determine-plaintiff-share"
}]).requestedDivisionText.includes("передать весь объект"), false);
assert.equal(calculatePropertyAssets([{
  ...JSON.parse(propertyAssetRows("100000", "50"))[0],
  requestedResult: "determine-plaintiff-share",
  compensationDirection: "to-plaintiff",
  compensationAmount: "50000"
}]).issues.some(({ message }) => message.includes("не должен автоматически сочетаться")), true);
const wholeObjectTransfer = calculatePropertyAssets([{
  ...JSON.parse(propertyAssetRows("100000", "100"))[0],
  requestedResult: "transfer-to-plaintiff",
  compensationDirection: "from-plaintiff",
  compensationAmount: "50000"
}]);
assert.equal(wholeObjectTransfer.issues.length, 0);
assert.equal(wholeObjectTransfer.priceConfirmed, false);
assert.equal(wholeObjectTransfer.claimPrice, null);
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
  minorWithPlaintiff: "no",
  minorWithPlaintiffEvidence: ""
});
assert.equal(plaintiffAddressWithoutBasis.allowed, false);

const plaintiffAddressWithChild = validateDivorcePropertyApplication("court-divorce", {
  ...courtBase,
  commonMinorChildren: "no",
  childrenData: "",
  consentState: "objects",
  territorialBasis: "plaintiff-child",
  minorWithPlaintiff: "yes",
  minorWithPlaintiffEvidence: "Несовершеннолетний племянник находится при истце; обстоятельство и подтверждение описаны заявителем"
});
assert.equal(plaintiffAddressWithChild.allowed, true);
assert.equal(plaintiffAddressWithChild.filingReady, false);

const lastKnownAddress = validateDivorcePropertyApplication("court-divorce", {
  ...courtBase,
  defendantLocation: "unknown",
  territorialBasis: "last-known",
  jurisdictionEvidence: "Последняя известная регистрация ответчика"
});
assert.equal(lastKnownAddress.allowed, true);

const magistrateWithoutNumber = validateDivorcePropertyApplication("court-divorce", {
  ...courtBase,
  courtPrecinctNumber: ""
});
assert.equal(magistrateWithoutNumber.allowed, false);
assert.equal(magistrateWithoutNumber.issues.some(({ field }) => field === "courtPrecinctNumber"), true);

const unsupportedCourtUrl = validateDivorcePropertyApplication("court-divorce", {
  ...courtBase,
  courtWebsite: "https://example.com/court"
});
assert.equal(unsupportedCourtUrl.allowed, false);
assert.equal(unsupportedCourtUrl.filingReady, false);
assert.equal(unsupportedCourtUrl.issues.some(({ field }) => field === "courtWebsite"), true);

const fakeSudrfSubdomain = validateDivorcePropertyApplication("court-divorce", {
  ...courtBase,
  courtWebsite: "https://example.sudrf.ru/"
});
assert.equal(fakeSudrfSubdomain.allowed, false);
assert.equal(fakeSudrfSubdomain.filingReady, false);
assert.equal(fakeSudrfSubdomain.issues.some(({ field }) => field === "courtWebsite"), true);

const fakeCourtName = validateDivorcePropertyApplication("court-divorce", {
  ...courtBase,
  courtName: "Тестовый судебный участок N 1"
});
assert.equal(fakeCourtName.allowed, false);
assert.equal(fakeCourtName.filingReady, false);

const incompleteCourtAddress = validateDivorcePropertyApplication("court-divorce", {
  ...courtBase,
  territorialAddress: ""
});
assert.equal(incompleteCourtAddress.allowed, false);
assert.equal(incompleteCourtAddress.issues.some(({ field }) => field === "territorialAddress"), true);

const mismatchedManualCourt = validateDivorcePropertyApplication("court-divorce", {
  ...courtBase,
  courtRegion: "Московская область",
  courtAddress: "г. Москва, ул. Судебная, д. 1"
});
assert.equal(mismatchedManualCourt.allowed, true);
assert.equal(mismatchedManualCourt.filingReady, false);
assert.equal(mismatchedManualCourt.requiresLegalReview, true);

const realEstateJurisdiction = validateDivorcePropertyApplication("property-claim", {
  ...claimBase,
  territorialBasis: "real-estate-exclusive",
  jurisdictionEvidence: "Заявлено самостоятельное требование о праве на недвижимость"
});
assert.equal(realEstateJurisdiction.requiresLegalReview, true);

assert.equal(standardClaim.filingReady, false);
assert.equal(standardClaim.draftText.startsWith("ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ"), true);
const complexDraft = validateDivorcePropertyApplication("property-claim", { ...claimBase, mortgage: "yes" });
assert.equal(complexDraft.allowed, true);
assert.equal(complexDraft.requiresLegalReview, true);
assert.equal(complexDraft.filingReady, false);
assert.equal(complexDraft.draftText.startsWith("ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ"), true);
assert.equal(complexDraft.reviewReasons.some((reason) => reason.includes("Ипотека")), true);
assert.equal(standardClaim.draftText.includes("Центральный районный суд"), true);
assert.equal(standardClaim.draftText.includes("ул. Судебная"), true);

const resetAfterRegionChange = resetCourtSelection({ ...courtBase, courtRegion: "Москва" });
assert.equal(resetAfterRegionChange.courtName, "");
assert.equal(resetAfterRegionChange.courtSearchConfirmed, "");
assert.equal(resetAfterRegionChange.courtRegion, "Москва");
const resetAfterCourtLevelChange = resetCourtSelection({ ...courtBase });
assert.equal(resetAfterCourtLevelChange.courtPrecinctNumber, "");
assert.equal(resetAfterCourtLevelChange.appealCourtName, "");

assert.equal(protectedClaim.notices.some((notice) => notice.includes("10 000")), true);
assert.equal(getDivorcePropertyDocxFilename("isk-o-razdele", false), "CHERNOVIK-isk-o-razdele.docx");
assert.equal(getDivorcePropertyDocxFilename("isk-o-razdele", true), "isk-o-razdele.docx");
assert.equal(
  composeDivorcePropertyDocumentText("ОСНОВНОЙ ДОКУМЕНТ", [{ title: "Ходатайство", text: "ОТРЕДАКТИРОВАННЫЙ ТЕКСТ" }], false).includes("ОТРЕДАКТИРОВАННЫЙ ТЕКСТ"),
  true
);
assert.equal(composeDivorcePropertyDocumentText("Текст без предупреждения", [], false).startsWith("ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ"), true);
assert.deepEqual(COURT_DIRECTORY.confirmedAutomaticRegions, []);
assert.deepEqual(COURT_REGIONS, []);
assert.equal(COURT_DIRECTORY.machineVerificationAvailable, false);
assert.equal(DIVORCE_PROPERTY_LEGAL_RULES.every((rule) => Boolean(rule.statement && rule.norm && rule.officialUrl && rule.reviewedAt && rule.edition && rule.scenarios.length && rule.region && rule.status && rule.automation && rule.fallbackBehavior)), true);
assert.equal(isDivorcePropertyLegalReviewFullyPrimaryVerified(), false);

assert.equal(isDivorcePropertyLegalReviewDue(new Date("2026-08-05T00:00:00Z")), false);
assert.equal(isDivorcePropertyLegalReviewDue(new Date("2026-11-05T00:00:00Z")), true);

createDivorcePropertyDocxBlob("ОСНОВНОЙ ДОКУМЕНТ", [{ title: "Ходатайство", text: "ОТРЕДАКТИРОВАННЫЙ ТЕКСТ" }], false)
  .then(async (blob) => Buffer.from(await blob.arrayBuffer()))
  .then((buffer) => {
    const xml = extractZipEntry(buffer, "word/document.xml");
    assert.equal(xml.includes("ОСНОВНОЙ ДОКУМЕНТ"), true);
    assert.equal(xml.includes("ОТРЕДАКТИРОВАННЫЙ ТЕКСТ"), true);
    assert.equal(xml.includes("ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ"), true);
    console.log("divorce-property validation tests passed");
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });

function extractZipEntry(buffer: Buffer, expectedName: string) {
  for (let offset = 0; offset <= buffer.length - 46; offset += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) continue;
    const compression = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");
    if (fileName === expectedName) {
      assert.equal(buffer.readUInt32LE(localHeaderOffset), 0x04034b50);
      const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
      if (compression === 0) return compressed.toString("utf8");
      if (compression === 8) return inflateRawSync(compressed).toString("utf8");
      throw new Error(`Unsupported ZIP compression method: ${compression}`);
    }
    offset += 45 + fileNameLength + extraLength + commentLength;
  }
  throw new Error(`DOCX entry not found: ${expectedName}`);
}
