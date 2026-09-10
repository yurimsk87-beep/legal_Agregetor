import assert from "node:assert/strict";
import { getParentsChildRules } from "@/data/parents-child-legal-review";
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

  const changeBase = { ...safe, ...parties, changedCircumstances: "Изменились обстоятельства" };
  const residenceWritten = record(validateParentsChildApplication("change", {
    ...changeBase, changeSubject: "residence", existingBasis: "agreement", bothAgree: "yes", currentResidenceArrangement: "Письменное соглашение", requestedResidenceChange: "Новое место жительства"
  }));
  assert.equal(residenceWritten.outcomeKey, "change-residence-agreement");
  assert.equal(residenceWritten.filingReady, true);
  assert.equal(residenceWritten.documentTitle, "Проект соглашения об изменении места жительства ребёнка");
  assert.match(residenceWritten.draftText, /пункт 3 статьи 65 СК РФ/);

  const communicationWritten = record(validateParentsChildApplication("change", {
    ...changeBase, changeSubject: "communication", existingBasis: "agreement", bothAgree: "yes", currentCommunicationArrangement: "Письменное соглашение", requestedCommunicationChange: "Новый график общения"
  }));
  assert.equal(communicationWritten.outcomeKey, "change-communication-agreement");
  assert.equal(communicationWritten.filingReady, true);
  assert.equal(communicationWritten.documentTitle, "Проект соглашения об изменении порядка общения с ребёнком");
  assert.match(communicationWritten.draftText, /пункт 2 статьи 66 СК РФ/);

  const residenceOral = validateParentsChildApplication("change", {
    ...changeBase, changeSubject: "residence", existingBasis: "oral", bothAgree: "yes", currentResidenceArrangement: "Устная договорённость", requestedResidenceChange: "Новое место жительства"
  });
  assert.equal(residenceOral.outcomeKey, "change-residence-agreement");
  assert.equal(residenceOral.filingReady, true);
  assert.equal(getVisibleParentsChildFields("change", { changeSubject: "residence", existingBasis: "oral", bothAgree: "yes" }).some((field) => field.name === "courtName"), false);

  const communicationOral = validateParentsChildApplication("change", {
    ...changeBase, changeSubject: "communication", existingBasis: "oral", bothAgree: "yes", currentCommunicationArrangement: "Устная договорённость", requestedCommunicationChange: "Письменный график общения"
  });
  assert.equal(communicationOral.outcomeKey, "change-communication-agreement");
  assert.equal(communicationOral.filingReady, true);

  const changeResidenceCourt = record(validateParentsChildApplication("change", {
    ...changeBase, ...court, changeSubject: "residence", existingBasis: "court", bothAgree: "yes", currentResidenceArrangement: "Место жительства установлено судом", requestedResidenceChange: "Изменить место жительства"
  }));
  assert.equal(changeResidenceCourt.outcomeKey, "change-residence-court-draft");
  assert.equal(changeResidenceCourt.filingReady, false);
  assert.equal(changeResidenceCourt.requiresLegalReview, true);
  assert.match(changeResidenceCourt.draftText, /^ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ/);

  const changeCommunicationCourt = record(validateParentsChildApplication("change", {
    ...changeBase, ...court, changeSubject: "communication", existingBasis: "court", bothAgree: "yes", currentCommunicationArrangement: "График установлен судом", requestedCommunicationChange: "Изменить график общения"
  }));
  assert.equal(changeCommunicationCourt.outcomeKey, "change-communication-court-draft");
  assert.equal(changeCommunicationCourt.filingReady, false);
  assert.equal(changeCommunicationCourt.requiresLegalReview, true);

  const missingChangeSubject = validateParentsChildApplication("change", {
    ...changeBase, existingBasis: "agreement", bothAgree: "yes"
  });
  assert.equal(missingChangeSubject.allowed, false);
  assert.equal(missingChangeSubject.pdfAvailable, false);
  assert.equal(missingChangeSubject.draftText, "");
  assert.equal(missingChangeSubject.issues.some((issue) => issue.field === "changeSubject"), true);

  assert.equal(getParentsChildRules("change", "residence").some((rule) => rule.id === "sk-65-residence"), true);
  assert.equal(getParentsChildRules("change", "residence").some((rule) => rule.id === "sk-66-communication"), false);
  assert.equal(getParentsChildRules("change", "communication").some((rule) => rule.id === "sk-65-residence"), false);
  assert.equal(getParentsChildRules("change", "communication").some((rule) => rule.id === "sk-66-communication"), true);
  assert.equal(getParentsChildRules("change", "residence", "voluntary").some((rule) => rule.id === "sk-78-guardianship"), false);
  assert.equal(getParentsChildRules("change", "residence", "court").some((rule) => rule.id === "sk-78-guardianship"), true);

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
    "change-communication-agreement", "change-communication-court-draft", "change-residence-agreement", "change-residence-court-draft", "communication-agreement", "communication-court-draft",
    "enforcement-bailiff-draft", "enforcement-check-decision", "enforcement-check-effective", "enforcement-opening-draft", "enforcement-request-writ",
    "existing-order-enforcement", "residence-agreement", "residence-court-draft", "urgent-child-safety"
  ].sort());
  console.log(`Parents-child validation passed: ${reached.size} reachable outcomes.`);
}

run().catch((error) => { console.error(error); process.exit(1); });
