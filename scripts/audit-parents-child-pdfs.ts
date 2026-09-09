import assert from "node:assert/strict";
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
  console.log(`Parents-child PDF audit passed: ${blob.size} bytes.`);
}

run().catch((error) => { console.error(error); process.exit(1); });
