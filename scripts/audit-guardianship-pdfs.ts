import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createGuardianshipPdfBlob, getGuardianshipPdfFilename } from "@/lib/guardianship-pdf";
import { ensureGuardianshipDraftMarker } from "@/lib/guardianship-docx";
import { validateGuardianshipApplication, type GuardianshipValues } from "@/lib/guardianship-validator";

const authority = { immediateThreat: "no", region: "region-saint-petersburg", municipality: "spb-gagarinskoe", authorityName: "spb-gagarinskoe-guardianship" };
const appointment = {
  ...authority,
  childAge: "8", childWithoutCare: "yes", urgentNeed: "no", knownChild: "yes", candidateAge: "35", candidateCapacity: "yes",
  parentalRightsRestricted: "no", formerGuardianRemoved: "no", adoptionCancelledForFault: "no", knownCriminalRestriction: "no",
  healthContraindications: "no", candidateMaritalStatus: "no", trainingStatus: "completed", householdAdults: "no",
  candidateData: "Иванов Иван Иванович, 01.01.1990, адрес и паспорт", childData: "Иванов Пётр Иванович, 01.01.2018, адрес"
};
const report = {
  ...authority, propertyAction: "annual-report", guardianType: "citizen", guardianData: "Данные опекуна и акта", childData: "Данные подопечного",
  reportYear: "2025", assetCondition: "Имущество сохранено", assetLocation: "По месту жительства и в банке", replacementProperty: "Не приобреталось",
  managementIncome: "Проценты по вкладу", wardExpenses: "Питание и одежда", nominalAccountTransactions: "Получены выплаты и оплачены нужды",
  supportingDocuments: "Выписка и квитанции", minorHouseholdExpenses: "yes"
};
const preliminary = {
  ...authority, childAge: "8", childWithoutCare: "yes", urgentNeed: "yes", knownChild: "yes", candidateAge: "35", candidateCapacity: "yes",
  candidateData: "Данные кандидата", childData: "Данные ребёнка"
};
const complaint = {
  ...authority, responseState: "written-refusal", requestedAction: "Назначить опекуна", initialRequestDate: "2026-08-01",
  responseDate: "2026-08-08", refusalDetails: "Реквизиты и мотивы отказа", filingProof: "Отметка о регистрации", complaintChannel: "prosecutor",
  applicantData: "Данные заявителя", childInterest: "Затронуты интересы ребёнка"
};

const cases: Array<[string, Parameters<typeof validateGuardianshipApplication>[0], GuardianshipValues]> = [
  ["data-sheet", "appointment", appointment],
  ["annual-report", "property-report", report],
  ["draft", "appointment", preliminary],
  ["checklist", "refusal-inaction", complaint]
];

async function main() {
  const outputDir = process.env.GUARDIANSHIP_PDF_AUDIT_DIR || path.join(os.tmpdir(), "guardianship-pdf-audit");
  await mkdir(outputDir, { recursive: true });

  for (const [label, scenarioKey, values] of cases) {
    const decision = validateGuardianshipApplication(scenarioKey, values);
    if (!decision.pdfAvailable) {
      throw new Error(`${label}: PDF unavailable: ${decision.issues.map(({ message }) => message).join("; ")}`);
    }
    const draft = decision.draftText ? ensureGuardianshipDraftMarker(decision.draftText) : "";
    const blob = await createGuardianshipPdfBlob(decision, draft);
    const fileName = `${label}-${getGuardianshipPdfFilename(decision.outcomeKey, decision.resultKind === "draft")}`;
    await writeFile(path.join(outputDir, fileName), Buffer.from(await blob.arrayBuffer()));
  }

  console.log(outputDir);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
