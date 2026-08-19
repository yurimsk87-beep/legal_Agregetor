import assert from "node:assert/strict";
import { inflateRawSync } from "node:zlib";
import { GUARDIANSHIP_LEGAL_RULES } from "@/data/guardianship-legal-review";
import { GUARDIANSHIP_SCENARIOS } from "@/data/guardianship-route";
import {
  getGuardianshipAuthorityOptions,
  getGuardianshipMunicipalityOptions,
  GUARDIANSHIP_DIRECTORY_METADATA,
  RUSSIAN_REGIONS,
  TERRITORY_NOT_FOUND_ID
} from "@/data/guardianship-territories";
import {
  GUARDIANSHIP_OUTCOME_KEYS,
  getVisibleGuardianshipFields,
  resetGuardianshipDependentValues,
  validateGuardianshipApplication
} from "@/lib/guardianship-validator";
import {
  createGuardianshipDocxBlob,
  ensureGuardianshipDraftMarker,
  getGuardianshipDocxFilename
} from "@/lib/guardianship-docx";
import {
  buildGuardianshipPdfText,
  createGuardianshipPdfBlob,
  getGuardianshipPdfFilename
} from "@/lib/guardianship-pdf";
import { validateLeadPdfAttachment, validateLeadPdfBuffer } from "@/lib/lead-attachments";
import { isUnknownNavigatorPath } from "@/lib/navigator-paths";
import { filterSearchableSelectOptions } from "@/lib/searchable-select";

const authority = { region: "region-moscow", municipality: "moscow-gagarinsky", authorityName: "moscow-gagarinsky-administration" };
const safeBase = { immediateThreat: "no", ...authority };
const appointmentBase = {
  ...safeBase,
  childAge: "8",
  childWithoutCare: "yes",
  urgentNeed: "no",
  knownChild: "yes",
  candidateAge: "35",
  candidateCapacity: "yes",
  parentalRightsRestricted: "no",
  formerGuardianRemoved: "no",
  adoptionCancelledForFault: "no",
  knownCriminalRestriction: "no",
  healthContraindications: "no",
  candidateMaritalStatus: "no",
  trainingStatus: "completed",
  householdAdults: "no",
  candidateData: "Иванов Иван Иванович, данные кандидата",
  childData: "Иванов Пётр Иванович, данные ребёнка"
};

const reachedOutcomes = new Set<string>();
function record<T extends ReturnType<typeof validateGuardianshipApplication>>(decision: T) {
  reachedOutcomes.add(decision.outcomeKey);
  return decision;
}

async function run() {
  const urgent = record(validateGuardianshipApplication("appointment", { immediateThreat: "yes" }));
  assert.equal(urgent.outcomeKey, "urgent-protection");
  assert.equal(urgent.outputMode, "urgent");
  assert.equal(urgent.pdfAvailable, false);
  assert.equal(urgent.lawyerReviewAvailable, false);
  assert.equal(urgent.filingSteps.some((step) => step.includes("112")), true);

  const ordinaryGuardian = record(validateGuardianshipApplication("appointment", appointmentBase));
  assert.equal(ordinaryGuardian.allowed, true);
  assert.equal(ordinaryGuardian.outcomeKey, "appointment-standard-child");
  assert.equal(ordinaryGuardian.outputMode, "official-helper");
  assert.equal(ordinaryGuardian.resultKind, "data-sheet");
  assert.equal(ordinaryGuardian.providedDocuments.some(({ title }) => title.includes("согласие членов семьи")), false);
  assert.equal(ordinaryGuardian.providedDocuments.some(({ title }) => title.includes("Свидетельство о браке")), false);

  const marriedCandidate = validateGuardianshipApplication("appointment", { ...appointmentBase, candidateMaritalStatus: "yes" });
  assert.equal(marriedCandidate.providedDocuments.some(({ title }) => title.includes("Свидетельство о браке")), true);
  assert.equal(marriedCandidate.copies.includes("Копия свидетельства о браке."), true);

  const candidateConclusion = record(validateGuardianshipApplication("appointment", {
    ...appointmentBase,
    knownChild: "no",
    childData: undefined
  }));
  assert.equal(candidateConclusion.outcomeKey, "appointment-standard-candidate");
  assert.equal(candidateConclusion.documentTitle.includes("заключения о возможности"), true);
  assert.equal(getVisibleGuardianshipFields("appointment", { ...appointmentBase, knownChild: "no" }).some(({ name }) => name === "childData"), false);

  const ordinaryTrustee = validateGuardianshipApplication("appointment", { ...appointmentBase, childAge: "14" });
  assert.equal(ordinaryTrustee.documentTitle.includes("попечителя"), true);

  const preliminaryValues = {
    ...safeBase,
    childAge: "8",
    childWithoutCare: "yes",
    urgentNeed: "yes",
    knownChild: "yes",
    candidateAge: "35",
    candidateCapacity: "yes",
    candidateData: "Данные кандидата",
    childData: "Данные ребёнка"
  };
  const preliminaryFields = getVisibleGuardianshipFields("appointment", preliminaryValues).map(({ name }) => name);
  for (const hidden of ["parentalRightsRestricted", "formerGuardianRemoved", "adoptionCancelledForFault", "knownCriminalRestriction", "healthContraindications", "candidateMaritalStatus", "trainingStatus", "householdAdults", "householdConsent"]) {
    assert.equal(preliminaryFields.includes(hidden), false, hidden);
  }
  const preliminary = record(validateGuardianshipApplication("appointment", preliminaryValues));
  assert.equal(preliminary.outcomeKey, "appointment-preliminary");
  assert.equal(preliminary.allowed, true);
  assert.equal(preliminary.draftText.includes("предварительной опеки"), true);
  assert.equal(preliminary.draftText.includes("временной опеки"), false);
  assert.equal(validateGuardianshipApplication("appointment", { ...preliminaryValues, knownChild: "no" }).pdfAvailable, false);

  const parentBase = {
    ...safeBase,
    article13Basis: "parents-period",
    childAge: "9",
    reason: "Уважительная причина подтверждается заявителями",
    periodStart: "2026-09-01",
    periodEnd: "2026-12-01",
    nomineeData: "Данные предлагаемого опекуна",
    nomineeConsent: "yes",
    childData: "Данные ребёнка",
    parentsData: "Данные обоих родителей",
    childInterests: "no"
  };
  const parentPeriod = record(validateGuardianshipApplication("parent-period", parentBase));
  assert.equal(parentPeriod.outcomeKey, "parent-period-parents");
  assert.equal(parentPeriod.draftText.includes("определённый период"), true);
  assert.equal(parentPeriod.draftText.includes("предварительной опеки"), false);

  const child14Values = {
    ...safeBase,
    article13Basis: "child-14",
    childAge: "15",
    nomineeData: "Данные предлагаемого попечителя",
    nomineeConsent: "yes",
    childData: "Данные ребёнка",
    childInterests: "no"
  };
  const childFields = getVisibleGuardianshipFields("parent-period", child14Values).map(({ name }) => name);
  for (const hidden of ["reason", "periodStart", "periodEnd", "parentsData", "otherRepresentative"]) {
    assert.equal(childFields.includes(hidden), false, hidden);
  }
  const child14 = record(validateGuardianshipApplication("parent-period", child14Values));
  assert.equal(child14.outcomeKey, "parent-period-child-14");
  assert.equal(child14.allowed, true);
  assert.equal(child14.draftText.includes("период"), false);
  assert.equal(child14.draftText.includes("родител"), false);

  const childUnder14 = validateGuardianshipApplication("parent-period", { ...child14Values, childAge: "13" });
  assert.equal(childUnder14.allowed, false);
  assert.equal(childUnder14.pdfAvailable, false);
  assert.equal(childUnder14.draftText, "");
  assert.equal(childUnder14.issues.some(({ message }) => message.includes("14 лет")), true);

  const deathBase = {
    ...safeBase,
    childAge: "9",
    nomineeData: "Данные предлагаемого опекуна",
    nomineeConsent: "yes",
    childData: "Данные ребёнка",
    parentsData: "Данные родителя или родителей",
    childInterests: "no",
    statementDate: "2026-08-13",
    signatureAuthentication: "guardianship-head"
  };
  const deathScenarios = [
    ["sole-parent-death", "parent-death-sole"],
    ["both-parents-death", "parent-death-both"],
    ["change-death", "parent-death-change"],
    ["cancel-death", "parent-death-cancel"]
  ] as const;
  for (const [article13Basis, outcomeKey] of deathScenarios) {
    const result = record(validateGuardianshipApplication("parent-period", {
      ...deathBase,
      article13Basis,
      ...(article13Basis === "sole-parent-death" ? { soleParentConfirmed: "yes" } : {}),
      ...(["change-death", "cancel-death"].includes(article13Basis) ? { previousStatementDetails: "Заявление от 01.02.2026", deathStatementApplicant: "both-parents" } : {})
    }));
    assert.equal(result.outcomeKey, outcomeKey);
    assert.equal(result.draftText.includes("Собственноручная подпись"), true);
    assert.equal(result.pdfAvailable, true);
    if (article13Basis === "cancel-death") assert.equal(result.draftText.includes("отменить"), true);
  }

  const propertyBase = {
    ...safeBase,
    guardianData: "Данные опекуна",
    childData: "Данные подопечного",
    assetDetails: "Сведения об имуществе и операциях"
  };
  const reportData = {
    assetCondition: "Квартира и вклад сохранены",
    assetLocation: "Квартира по адресу; вклад в банке",
    replacementProperty: "Не приобреталось",
    managementIncome: "Проценты по вкладу 1000 рублей",
    wardExpenses: "Питание и одежда 5000 рублей",
    nominalAccountTransactions: "Получено пособие, оплачены нужды ребёнка",
    supportingDocuments: "Выписка банка и квитанции",
    minorHouseholdExpenses: "yes"
  };
  const annualCitizen = record(validateGuardianshipApplication("property-report", {
    ...propertyBase, ...reportData, propertyAction: "annual-report", guardianType: "citizen", reportYear: "2025"
  }));
  assert.equal(annualCitizen.outcomeKey, "annual-report-citizen");
  assert.equal(annualCitizen.deadline.includes("1 февраля"), true);

  const annualOrganization = record(validateGuardianshipApplication("property-report", {
    ...propertyBase, ...reportData, propertyAction: "annual-report", guardianType: "organization", reportYear: "2025"
  }));
  assert.equal(annualOrganization.outcomeKey, "annual-report-organization");
  assert.equal(annualOrganization.deadline.includes("1 апреля"), true);

  const nominalAccount = record(validateGuardianshipApplication("property-report", {
    ...propertyBase,
    propertyAction: "nominal-account",
    nominalAccountDetails: "Счёт 1234, выплаты на содержание ребёнка",
    nominalOperations: "Оплата питания и одежды"
  }));
  assert.equal(nominalAccount.outcomeKey, "nominal-account");
  assert.equal(nominalAccount.resultKind, "checklist");
  assert.equal(nominalAccount.notices.some((notice) => notice.includes("не заявление")), true);
  const nominalFields = getVisibleGuardianshipFields("property-report", { ...propertyBase, propertyAction: "nominal-account" }).map(({ name }) => name);
  for (const unnecessary of ["guardianData", "childData", "assetDetails", "assetCondition"]) assert.equal(nominalFields.includes(unnecessary), false);
  assert.equal(nominalFields.includes("nominalAccountDetails"), true);

  const propertyPermissionBase = {
    ...propertyBase,
    propertyAction: "permission",
    operationType: "money",
    operationDetails: "Оплата подтверждённых расходов в интересах ребёнка",
    rightsImpact: "Остаток средств и права ребёнка сохраняются",
    complexProperty: "no",
    conflictInterest: "no"
  };
  const propertyStandard = record(validateGuardianshipApplication("property-report", propertyPermissionBase));
  assert.equal(propertyStandard.outcomeKey, "property-permission-standard");
  assert.equal(propertyStandard.deadline.includes("15 дней"), true);
  assert.equal(propertyStandard.filingSteps.some((step) => step.includes("Не совершайте")), true);

  const propertyComplex = record(validateGuardianshipApplication("property-report", {
    ...propertyPermissionBase,
    propertyAction: "real-estate",
    operationType: "real-estate-sale",
    complexProperty: "yes"
  }));
  assert.equal(propertyComplex.outcomeKey, "property-permission-complex");
  assert.equal(propertyComplex.requiresLegalReview, true);

  const propertyConflict = validateGuardianshipApplication("property-report", {
    ...propertyPermissionBase,
    conflictInterest: "yes"
  });
  assert.equal(propertyConflict.outputMode, "manual-review");
  assert.equal(propertyConflict.pdfAvailable, true);

  const complaintBase = {
    ...safeBase,
    requestedAction: "Получить решение органа опеки",
    initialRequestDate: "2026-08-01",
    filingProof: "Отметка о регистрации",
    applicantData: "Данные заявителя",
    childInterest: "Интересы ребёнка"
  };
  const oralRefusal = record(validateGuardianshipApplication("refusal-inaction", {
    ...complaintBase, responseState: "oral-refusal", complaintChannel: "higher-authority"
  }));
  assert.equal(oralRefusal.outcomeKey, "oral-refusal-registration");
  assert.equal(oralRefusal.resultKind, "checklist");

  for (const responseState of ["written-refusal", "no-response"] as const) {
    for (const complaintChannel of ["higher-authority", "prosecutor", "court"] as const) {
      const decision = record(validateGuardianshipApplication("refusal-inaction", {
        ...complaintBase,
        responseState,
        complaintChannel,
        ...(responseState === "written-refusal"
          ? { responseDate: "2026-08-08", refusalDetails: "Реквизиты и мотивы отказа" }
          : { responseDeadlineExpired: "yes" })
      }));
      assert.equal(decision.outcomeKey, `${responseState === "no-response" ? "inaction" : "refusal"}-${complaintChannel}`);
      assert.equal(decision.pdfAvailable, true);
      assert.equal(decision.outputMode, "manual-review");
      assert.equal(decision.draftText, "");
      assert.equal(decision.resultKind, "checklist");
    }
  }

  const prematureInaction = validateGuardianshipApplication("refusal-inaction", {
    ...complaintBase, responseState: "no-response", responseDeadlineExpired: "unsure", complaintChannel: "higher-authority"
  });
  assert.equal(prematureInaction.allowed, false);
  assert.equal(prematureInaction.issues.some(({ field }) => field === "responseDeadlineExpired"), true);

  const expectedOutcomes = GUARDIANSHIP_OUTCOME_KEYS.filter((key) => key !== "unresolved").sort();
  assert.deepEqual([...reachedOutcomes].sort(), expectedOutcomes);

  const resetHousehold = resetGuardianshipDependentValues("appointment", "householdAdults", { householdAdults: "no", householdConsent: "yes" });
  assert.equal(resetHousehold.householdConsent, undefined);
  const resetProperty = resetGuardianshipDependentValues("property-report", "propertyAction", { propertyAction: "annual-report", operationDetails: "старое", conflictInterest: "yes" });
  assert.equal(resetProperty.operationDetails, undefined);
  assert.equal(resetProperty.conflictInterest, undefined);
  const resetThreat = resetGuardianshipDependentValues("appointment", "immediateThreat", { ...appointmentBase, immediateThreat: "yes" });
  assert.deepEqual(resetThreat, { immediateThreat: "yes" });
  const resetRegion = resetGuardianshipDependentValues("appointment", "region", { ...authority, region: "region-saint-petersburg" });
  assert.equal(resetRegion.municipality, undefined);
  assert.equal(resetRegion.authorityName, undefined);
  const resetMunicipality = resetGuardianshipDependentValues("appointment", "municipality", { ...authority, municipality: "spb-gagarinskoe" });
  assert.equal(resetMunicipality.authorityName, undefined);

  assert.equal(RUSSIAN_REGIONS.length, 89);
  assert.equal(new Set(RUSSIAN_REGIONS.map(({ id }) => id)).size, RUSSIAN_REGIONS.length);
  assert.equal(filterSearchableSelectOptions(RUSSIAN_REGIONS, "моск").some(({ id }) => id === "region-moscow"), true);
  assert.equal(filterSearchableSelectOptions([{ id: "oryol", label: "Орёл" }], "орел").length, 1);
  assert.equal(getGuardianshipMunicipalityOptions("region-moscow").some(({ id }) => id === "moscow-gagarinsky"), true);
  assert.equal(getGuardianshipMunicipalityOptions("region-moscow").some(({ id }) => id === "moscow-kurkino"), false);
  assert.equal(getGuardianshipAuthorityOptions("moscow-gagarinsky").some(({ id }) => id === "moscow-gagarinsky-administration"), true);
  assert.equal(GUARDIANSHIP_DIRECTORY_METADATA.isComplete, false);

  const missingMunicipality = validateGuardianshipApplication("appointment", { ...appointmentBase, municipality: TERRITORY_NOT_FOUND_ID, authorityName: undefined });
  assert.equal(missingMunicipality.pdfAvailable, false);
  assert.equal(missingMunicipality.draftText, "");
  const missingAuthority = validateGuardianshipApplication("appointment", { ...appointmentBase, authorityName: TERRITORY_NOT_FOUND_ID });
  assert.equal(missingAuthority.pdfAvailable, false);
  const mismatchedAuthority = validateGuardianshipApplication("appointment", { ...appointmentBase, municipality: "moscow-kurkino", authorityName: "moscow-gagarinsky-administration" });
  assert.equal(mismatchedAuthority.pdfAvailable, false);

  const routeText = JSON.stringify(GUARDIANSHIP_SCENARIOS);
  assert.equal(routeText.includes("Приказ Минобрнауки"), false);
  assert.equal(routeText.includes("№ 334"), false);
  assert.equal(routeText.includes("0 ₽"), false);
  assert.equal(routeText.includes("Введите название вручную"), false);
  assert.equal(routeText.includes("временная опека"), false);
  assert.equal(GUARDIANSHIP_LEGAL_RULES.some(({ status }) => status === "not-found"), true);
  assert.equal(isUnknownNavigatorPath("/documents/ne-sushchestvuet/"), true);
  assert.equal(isUnknownNavigatorPath("/problems/ne-sushchestvuet/"), true);
  assert.equal(isUnknownNavigatorPath("/problems/semya-i-deti/ne-sushchestvuet/"), true);
  assert.equal(isUnknownNavigatorPath("/problems/semya-i-deti/opeka-i-popechitelstvo-nad-rebenkom/"), false);

  assert.equal(getGuardianshipDocxFilename("zhaloba-na-organ-opeki"), "CHERNOVIK-zhaloba-na-organ-opeki.docx");
  assert.equal(ensureGuardianshipDraftMarker("Текст").startsWith("ЧЕРНОВИК — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА"), true);
  const docxBuffer = Buffer.from(await (await createGuardianshipDocxBlob("ТЕКСТ ЧЕРНОВИКА")).arrayBuffer());
  const xml = extractZipEntry(docxBuffer, "word/document.xml");
  assert.equal(xml.includes("ЧЕРНОВИК — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА"), true);

  const pdfText = buildGuardianshipPdfText(propertyComplex, ensureGuardianshipDraftMarker(propertyComplex.draftText));
  assert.equal(pdfText.includes("ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА"), true);
  assert.equal(pdfText.includes("15 дней"), true);
  assert.equal(pdfText.includes("Сведения об имуществе и операциях"), true);
  assert.equal(pdfText.includes("Можно подавать результат сразу: нет"), true);
  assert.equal(getGuardianshipPdfFilename(propertyComplex.outcomeKey, true), "CHERNOVIK-opeka-property-permission-complex.pdf");
  const reportPdfText = buildGuardianshipPdfText(annualCitizen, "");
  assert.equal(reportPdfText.includes("Квартира и вклад сохранены"), true);
  assert.equal(reportPdfText.includes("2025"), true);
  const filingStepsBeforePdf = [...propertyComplex.filingSteps];
  const originalsBeforePdf = [...propertyComplex.originals];
  const pdfBuffer = Buffer.from(await (await createGuardianshipPdfBlob(propertyComplex, propertyComplex.draftText)).arrayBuffer());
  assert.equal(pdfBuffer.subarray(0, 5).toString("ascii"), "%PDF-");
  assert.deepEqual(propertyComplex.filingSteps, filingStepsBeforePdf);
  assert.deepEqual(propertyComplex.originals, originalsBeforePdf);
  assert.equal(validateLeadPdfAttachment(new File([pdfBuffer], "result.pdf", { type: "application/pdf" })), null);
  assert.equal(validateLeadPdfAttachment(new File(["x"], "result.txt", { type: "text/plain" }))?.includes("PDF"), true);
  assert.equal(validateLeadPdfBuffer(pdfBuffer), null);
  assert.equal(validateLeadPdfBuffer(Buffer.from("not a pdf"))?.includes("формату PDF"), true);
  assert.equal(
    validateLeadPdfBuffer(Buffer.from("%PDF-1.4\n1 0 obj << /JavaScript true >>\n%%EOF"))?.includes("запрещённые"),
    true
  );
  assert.equal(validateLeadPdfBuffer(Buffer.from("%PDF-1.4\n1 0 obj <<>>\n"))?.includes("завершения"), true);

  console.log("guardianship validation tests passed");
}

run().catch((error: unknown) => {
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
