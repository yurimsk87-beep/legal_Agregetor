import assert from "node:assert/strict";
import { PARENTS_CHILD_SCENARIO_KEYS } from "@/data/parents-child-route";
import { buildParentsChildPdfText } from "@/lib/parents-child-pdf";
import { getVisibleParentsChildFields, validateParentsChildApplication } from "@/lib/parents-child-validator";

const safe = { immediateThreat: "no", complexRisk: "no", international: "no" };
const parties = {
  applicantData: "Иванов Иван Иванович, адрес заявителя",
  otherParentData: "Иванова Анна Ивановна, адрес второго родителя",
  childAge: "8",
  childrenCount: "1",
  parentsStatus: "divorced",
  childData: "Иванов Пётр Иванович, 01.01.2018, адрес",
  childOpinion: "Мнение ребёнка заявителю неизвестно"
};
const court = {
  courtRegion: "Москва",
  defendantAddress: "Адрес ответчика",
  courtName: "Районный суд, указан пользователем",
  courtSource: "https://mos-gorsud.sudrf.ru/",
  courtConfirmed: "yes"
};

const reached = new Set<string>();
function record(decision: ReturnType<typeof validateParentsChildApplication>) {
  reached.add(decision.outcomeKey);
  return decision;
}

async function run() {
  const urgent = record(validateParentsChildApplication("residence", { immediateThreat: "yes" }));
  assert.equal(urgent.resultKind, "urgent");
  assert.equal(urgent.pdfAvailable, false);
  assert.equal(urgent.filingSteps.some((step) => step.includes("112")), true);

  const residenceAgreement = record(validateParentsChildApplication("residence", {
    ...safe, existingOrder: "no", agreement: "yes", ...parties, currentCircumstances: "Ребёнок живёт с первым родителем", requestedResidence: "Ребёнок проживает с первым родителем по указанному адресу"
  }));
  assert.equal(residenceAgreement.resultKind, "agreement");
  assert.equal(residenceAgreement.filingReady, true);
  assert.equal(residenceAgreement.draftText.includes("ПРОЕКТ СОГЛАШЕНИЯ"), true);
  assert.equal(getVisibleParentsChildFields("residence", { agreement: "yes" }).some((field) => field.name === "courtName"), false);

  const residenceCourt = record(validateParentsChildApplication("residence", {
    ...safe, existingOrder: "no", agreement: "no", ...parties, ...court, currentCircumstances: "Ребёнок фактически живёт по указанному адресу", requestedResidence: "Определить место жительства по указанному адресу", evidence: "Перечень документов заявителя"
  }));
  assert.equal(residenceCourt.resultKind, "draft");
  assert.equal(residenceCourt.filingReady, false);
  assert.equal(residenceCourt.requiresLegalReview, true);
  assert.match(residenceCourt.draftText, /^ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ/);

  const communicationAgreement = record(validateParentsChildApplication("communication", {
    ...safe, existingOrder: "no", agreement: "yes", ...parties, currentOrder: "Устная договорённость", requestedOrder: "Предложенный родителями график"
  }));
  assert.equal(communicationAgreement.filingReady, true);

  const communicationCourt = record(validateParentsChildApplication("communication", {
    ...safe, existingOrder: "no", agreement: "no", ...parties, ...court, currentOrder: "Соглашения нет", requestedOrder: "График, сформулированный заявителем", evidence: "Сообщения сторон"
  }));
  assert.equal(communicationCourt.filingReady, false);

  const changeAgreement = record(validateParentsChildApplication("change", {
    ...safe, existingBasis: "agreement", bothAgree: "yes", ...parties, existingDocument: "Письменное соглашение", changedCircumstances: "Изменился режим работы", requestedChanges: "Новый график"
  }));
  assert.equal(changeAgreement.resultKind, "agreement");

  const changeCourt = record(validateParentsChildApplication("change", {
    ...safe, existingBasis: "court", bothAgree: "yes", ...parties, ...court, existingDocument: "Решение суда", changedCircumstances: "Изменились обстоятельства", requestedChanges: "Новый порядок"
  }));
  assert.equal(changeCourt.filingReady, false);

  const enforcementBase = { ...safe, ...parties };
  assert.equal(record(validateParentsChildApplication("enforcement", { ...enforcementBase, decisionExists: "no" })).outcomeKey, "enforcement-check-decision");
  assert.equal(record(validateParentsChildApplication("enforcement", { ...enforcementBase, decisionExists: "yes", decisionEffective: "no" })).outcomeKey, "enforcement-check-effective");
  assert.equal(record(validateParentsChildApplication("enforcement", { ...enforcementBase, decisionExists: "yes", decisionEffective: "yes", writExists: "no", decisionDetails: "Решение суда", nonCompliance: "Не исполняется", bailiffConfirmed: "no" })).outcomeKey, "enforcement-request-writ");

  const opening = record(validateParentsChildApplication("enforcement", { ...enforcementBase, decisionExists: "yes", decisionEffective: "yes", writExists: "yes", enforcementStarted: "no", decisionDetails: "Решение суда", nonCompliance: "Не исполняется", bailiffConfirmed: "yes" }));
  assert.equal(opening.outcomeKey, "enforcement-opening-draft");
  assert.equal(opening.filingReady, false);

  const bailiff = record(validateParentsChildApplication("enforcement", { ...enforcementBase, decisionExists: "yes", decisionEffective: "yes", writExists: "yes", enforcementStarted: "yes", decisionDetails: "Решение суда", enforcementDetails: "Номер производства", nonCompliance: "Два конкретных эпизода", evidence: "Переписка", bailiffConfirmed: "yes" }));
  assert.equal(bailiff.outcomeKey, "enforcement-bailiff-draft");
  assert.match(buildParentsChildPdfText(bailiff), /Готово к подаче: нет/);

  const existingOrder = record(validateParentsChildApplication("communication", { ...safe, existingOrder: "yes", existingOrderNeed: "enforcement" }));
  assert.equal(existingOrder.outcomeKey, "existing-order-enforcement");
  assert.equal(existingOrder.draftText, "");

  const international = validateParentsChildApplication("communication", { ...safe, international: "yes", existingOrder: "no", agreement: "yes", ...parties, currentOrder: "Нет", requestedOrder: "Предложение" });
  assert.equal(international.requiresLegalReview, true);
  assert.equal(international.filingReady, false);

  const unverifiedCourt = validateParentsChildApplication("residence", { ...safe, existingOrder: "no", agreement: "no", ...parties, ...court, courtConfirmed: "no", currentCircumstances: "Факты", requestedResidence: "Требование" });
  assert.equal(unverifiedCourt.allowed, false);
  assert.equal(unverifiedCourt.issues.some((issue) => issue.field === "courtConfirmed"), true);

  for (const key of PARENTS_CHILD_SCENARIO_KEYS) assert.equal(Boolean(getVisibleParentsChildFields(key, safe).length), true);
  assert.deepEqual([...reached].sort(), [
    "change-agreement", "change-court-draft", "communication-agreement", "communication-court-draft",
    "enforcement-bailiff-draft", "enforcement-check-decision", "enforcement-check-effective", "enforcement-opening-draft", "enforcement-request-writ",
    "existing-order-enforcement", "residence-agreement", "residence-court-draft", "urgent-child-safety"
  ].sort());
  console.log(`Parents-child validation passed: ${reached.size} reachable outcomes.`);
}

run().catch((error) => { console.error(error); process.exit(1); });
