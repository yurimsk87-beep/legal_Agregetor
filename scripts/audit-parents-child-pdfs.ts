import assert from "node:assert/strict";
import { createParentsChildDocxBlob } from "@/lib/parents-child-docx";
import { createParentsChildPdfBlob } from "@/lib/parents-child-pdf";
import { validateParentsChildApplication } from "@/lib/parents-child-validator";

async function run() {
  const decision = validateParentsChildApplication("communication", {
    immediateThreat: "no",
    complexRisk: "no",
    international: "no",
    existingOrder: "no",
    agreement: "no",
    applicantData: "Заявитель",
    otherParentData: "Ответчик",
    childAge: "8",
    childrenCount: "1",
    parentsStatus: "divorced",
    childData: "Ребёнок",
    childOpinion: "Не выяснялось",
    currentOrder: "Соглашения нет",
    requestedOrder: "Предложенный заявителем график",
    evidence: "Перечень приложений",
    courtRegion: "Москва",
    defendantAddress: "Адрес ответчика",
    courtName: "Суд, указанный пользователем",
    courtSource: "https://mos-gorsud.sudrf.ru/",
    courtConfirmed: "yes"
  });

  assert.equal(decision.filingReady, false);
  assert.match(decision.draftText, /^ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ/);
  const blob = await createParentsChildPdfBlob(decision);
  assert.equal(blob.type, "application/pdf");
  assert.equal(blob.size > 1000, true);

  const changeAgreement = validateParentsChildApplication("change", {
    immediateThreat: "no",
    complexRisk: "no",
    international: "no",
    changeSubject: "communication",
    existingBasis: "oral",
    bothAgree: "yes",
    applicantData: "Первый родитель",
    otherParentData: "Второй родитель",
    childAge: "9",
    childrenCount: "1",
    parentsStatus: "divorced",
    childData: "Ребёнок",
    currentCommunicationArrangement: "Устная договорённость",
    changedCircumstances: "Изменился режим работы",
    requestedCommunicationChange: "Новый письменный график"
  });
  assert.equal(changeAgreement.filingReady, true);
  assert.match(changeAgreement.documentTitle, /порядка общения/);
  assert.match(changeAgreement.draftText, /статьи 66 СК РФ/);
  const changePdf = await createParentsChildPdfBlob(changeAgreement);
  const changeDocx = await createParentsChildDocxBlob(changeAgreement.draftText);
  assert.equal(changePdf.size > 1000, true);
  assert.equal(changeDocx.size > 1000, true);

  const changeCourt = validateParentsChildApplication("change", {
    immediateThreat: "no",
    complexRisk: "no",
    international: "no",
    changeSubject: "residence",
    existingBasis: "court",
    bothAgree: "yes",
    applicantData: "Истец",
    otherParentData: "Ответчик",
    childAge: "11",
    childrenCount: "1",
    parentsStatus: "divorced",
    childData: "Ребёнок",
    currentResidenceArrangement: "Место жительства установлено судом",
    changedCircumstances: "Изменилось фактическое место проживания",
    requestedResidenceChange: "Изменить место жительства ребёнка",
    courtRegion: "Москва",
    defendantAddress: "Адрес ответчика",
    courtName: "Суд, указанный пользователем",
    courtSource: "https://mos-gorsud.sudrf.ru/",
    courtConfirmed: "yes"
  });
  assert.equal(changeCourt.filingReady, false);
  assert.equal(changeCourt.requiresLegalReview, true);
  assert.match(changeCourt.documentTitle, /места жительства/);
  assert.match(changeCourt.draftText, /^ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ/);
  const courtPdf = await createParentsChildPdfBlob(changeCourt);
  const courtDocx = await createParentsChildDocxBlob(changeCourt.draftText);
  assert.equal(courtPdf.size > 1000, true);
  assert.equal(courtDocx.size > 1000, true);

  console.log(`Parents-child PDF/DOCX audit passed: ${blob.size + changePdf.size + courtPdf.size} PDF bytes.`);
}

run().catch((error) => { console.error(error); process.exit(1); });
