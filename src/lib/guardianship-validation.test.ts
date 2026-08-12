import assert from "node:assert/strict";
import { inflateRawSync } from "node:zlib";
import { GUARDIANSHIP_LEGAL_RULES } from "@/data/guardianship-legal-review";
import { GUARDIANSHIP_SCENARIOS } from "@/data/guardianship-route";
import {
  getVisibleGuardianshipFields,
  resetGuardianshipDependentValues,
  validateGuardianshipApplication
} from "@/lib/guardianship-validator";
import {
  createGuardianshipDocxBlob,
  ensureGuardianshipDraftMarker,
  getGuardianshipDocxFilename
} from "@/lib/guardianship-docx";

const authority = { region: "Москва", municipality: "муниципальный округ", authorityName: "Наименование органа введено пользователем" };
const appointmentBase = {
  childAge: "8",
  childWithoutCare: "yes",
  urgentNeed: "no",
  knownChild: "yes",
  candidateAge: "35",
  candidateCapacity: "yes",
  candidateObstacles: "no",
  closeRelative: "no",
  householdAdults: "no",
  candidateData: "Иванов Иван Иванович, данные кандидата",
  childData: "Иванов Пётр Иванович, данные ребёнка",
  ...authority
};

const ordinaryGuardian = validateGuardianshipApplication("appointment", appointmentBase);
assert.equal(ordinaryGuardian.allowed, true);
assert.equal(ordinaryGuardian.outputMode, "official-helper");
assert.equal(ordinaryGuardian.documentTitle.includes("опекуна"), true);
assert.equal(ordinaryGuardian.draftText, "");

const ordinaryTrustee = validateGuardianshipApplication("appointment", { ...appointmentBase, childAge: "14" });
assert.equal(ordinaryTrustee.allowed, true);
assert.equal(ordinaryTrustee.documentTitle.includes("попечителя"), true);

const preliminary = validateGuardianshipApplication("appointment", { ...appointmentBase, urgentNeed: "yes" });
assert.equal(preliminary.allowed, true);
assert.equal(preliminary.outputMode, "draft");
assert.equal(preliminary.requiresLegalReview, true);
assert.equal(preliminary.draftText.includes("предварительной опеки"), true);
assert.equal(preliminary.draftText.includes("определённый период"), false);

const parentBase = {
  applicantRole: "both-parents",
  childAge: "9",
  reason: "Временная невозможность лично исполнять обязанности",
  periodStart: "2026-09-01",
  periodEnd: "2026-12-01",
  nomineeData: "Данные предлагаемого опекуна",
  nomineeConsent: "yes",
  childData: "Данные ребёнка",
  parentsData: "Данные обоих родителей",
  childInterests: "no",
  ...authority
};
const parentPeriod = validateGuardianshipApplication("parent-period", parentBase);
assert.equal(parentPeriod.allowed, true);
assert.equal(parentPeriod.outputMode, "draft");
assert.equal(parentPeriod.draftText.includes("2026-09-01"), true);
assert.equal(parentPeriod.draftText.includes("предварительной опеки"), false);

const childUnder14 = validateGuardianshipApplication("parent-period", {
  ...parentBase,
  applicantRole: "child-14",
  childAge: "13",
  otherRepresentative: "no"
});
assert.equal(childUnder14.allowed, false);
assert.equal(childUnder14.issues.some(({ message }) => message.includes("14 лет")), true);

const child14 = validateGuardianshipApplication("parent-period", {
  ...parentBase,
  applicantRole: "child-14",
  childAge: "15",
  otherRepresentative: "no"
});
assert.equal(child14.allowed, true);
assert.equal(child14.documentTitle.includes("несовершеннолетнего"), true);

const annualReport = validateGuardianshipApplication("property-report", {
  propertyAction: "annual-report",
  guardianData: "Данные опекуна",
  childData: "Данные подопечного",
  reportYear: "2025",
  assetDetails: "Сведения для отчёта",
  ...authority
});
assert.equal(annualReport.allowed, true);
assert.equal(annualReport.outputMode, "official-helper");
assert.equal(annualReport.draftText, "");

const complexPropertyValues = {
  propertyAction: "real-estate",
  guardianData: "Данные опекуна",
  childData: "Данные подопечного",
  assetDetails: "Квартира ребёнка",
  operationDetails: "Продажа с последующей покупкой",
  rightsImpact: "Права требуют проверки",
  complexProperty: "yes",
  conflictInterest: "no",
  ...authority
};
const complexProperty = validateGuardianshipApplication("property-report", complexPropertyValues);
assert.equal(complexProperty.allowed, true);
assert.equal(complexProperty.outputMode, "draft");
assert.equal(complexProperty.requiresLegalReview, true);

const conflictProperty = validateGuardianshipApplication("property-report", {
  ...complexPropertyValues,
  conflictInterest: "yes"
});
assert.equal(conflictProperty.allowed, false);
assert.equal(conflictProperty.outputMode, "manual-review");

const oralRefusal = validateGuardianshipApplication("refusal-inaction", {
  responseState: "oral-refusal",
  requestedAction: "Назначить опекуна",
  initialRequestDate: "2026-08-01",
  filingProof: "Подтверждения письменной подачи нет",
  urgentThreat: "no",
  complaintChannel: "higher-authority",
  applicantData: "Данные заявителя",
  childInterest: "Интересы ребёнка",
  ...authority
});
assert.equal(oralRefusal.allowed, false);

const prematureInaction = validateGuardianshipApplication("refusal-inaction", {
  responseState: "no-response",
  requestedAction: "Назначить опекуна",
  initialRequestDate: "2026-08-01",
  filingProof: "Отметка о регистрации",
  responseDeadlineExpired: "unsure",
  urgentThreat: "no",
  complaintChannel: "higher-authority",
  applicantData: "Данные заявителя",
  childInterest: "Интересы ребёнка",
  ...authority
});
assert.equal(prematureInaction.allowed, false);
assert.equal(prematureInaction.issues.some(({ field }) => field === "responseDeadlineExpired"), true);

const confirmedInaction = validateGuardianshipApplication("refusal-inaction", {
  responseState: "no-response",
  requestedAction: "Назначить опекуна",
  initialRequestDate: "2026-08-01",
  filingProof: "Отметка о регистрации",
  responseDeadlineExpired: "yes",
  urgentThreat: "no",
  complaintChannel: "higher-authority",
  applicantData: "Данные заявителя",
  childInterest: "Интересы ребёнка",
  ...authority
});
assert.equal(confirmedInaction.allowed, true);
assert.equal(confirmedInaction.draftText.includes("срок ответа по исходной процедуре истёк"), true);

const ordinaryProperty = validateGuardianshipApplication("property-report", {
  propertyAction: "permission",
  guardianData: "Данные опекуна",
  childData: "Данные подопечного",
  assetDetails: "Денежный вклад подопечного",
  operationDetails: "Оплата подтверждённых расходов в интересах ребёнка",
  rightsImpact: "Остаток средств и права ребёнка сохраняются",
  complexProperty: "no",
  conflictInterest: "no",
  ...authority
});
assert.equal(ordinaryProperty.allowed, true);
assert.equal(ordinaryProperty.outputMode, "draft");

const courtComplaint = validateGuardianshipApplication("refusal-inaction", {
  responseState: "written-refusal",
  requestedAction: "Выдать разрешение",
  initialRequestDate: "2026-08-01",
  responseDate: "2026-08-08",
  refusalDetails: "Реквизиты письменного отказа",
  filingProof: "Отметка о регистрации",
  urgentThreat: "no",
  complaintChannel: "court",
  applicantData: "Данные заявителя",
  childInterest: "Интересы ребёнка",
  ...authority
});
assert.equal(courtComplaint.allowed, false);
assert.equal(courtComplaint.outputMode, "manual-review");

const resetHousehold = resetGuardianshipDependentValues("appointment", "householdAdults", { householdAdults: "no", householdConsent: "yes" });
assert.equal(resetHousehold.householdConsent, undefined);
const resetProperty = resetGuardianshipDependentValues("property-report", "propertyAction", { propertyAction: "annual-report", operationDetails: "старое значение", conflictInterest: "yes" });
assert.equal(resetProperty.operationDetails, undefined);
assert.equal(resetProperty.conflictInterest, undefined);
assert.equal(getVisibleGuardianshipFields("property-report", { propertyAction: "annual-report" }).some(({ name }) => name === "operationDetails"), false);
const resetRefusal = resetGuardianshipDependentValues("refusal-inaction", "responseState", { responseState: "written-refusal", responseDeadlineExpired: "yes" });
assert.equal(resetRefusal.responseDeadlineExpired, undefined);
assert.equal(getVisibleGuardianshipFields("refusal-inaction", { responseState: "written-refusal" }).some(({ name }) => name === "responseDeadlineExpired"), false);

const routeText = JSON.stringify(GUARDIANSHIP_SCENARIOS);
assert.equal(routeText.includes("Приказ Минобрнауки"), false);
assert.equal(routeText.includes("№ 334"), false);
assert.equal(routeText.includes("0 ₽"), false);
assert.equal(GUARDIANSHIP_LEGAL_RULES.some(({ scopeNote }) => scopeNote.includes("Приказ № 334 признан утратившим силу")), true);
assert.equal(getGuardianshipDocxFilename("zhaloba-na-organ-opeki"), "CHERNOVIK-zhaloba-na-organ-opeki.docx");
assert.equal(ensureGuardianshipDraftMarker("Пользователь удалил заголовок").startsWith("ЧЕРНОВИК — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА"), true);
assert.equal(ensureGuardianshipDraftMarker("").includes("ЧЕРНОВИК"), true);

createGuardianshipDocxBlob("ТЕКСТ ЧЕРНОВИКА")
  .then(async (blob) => Buffer.from(await blob.arrayBuffer()))
  .then((buffer) => {
    const xml = extractZipEntry(buffer, "word/document.xml");
    assert.equal(xml.includes("ЧЕРНОВИК — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА"), true);
    assert.equal(xml.includes("ТЕКСТ ЧЕРНОВИКА"), true);
    console.log("guardianship validation tests passed");
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
