import type { ZagsScenarioKey } from "@/data/zags-route";

export const ZAGS_FEES = {
  marriage: 350,
  nameChange: 5000,
  repeatCertificate: 500,
  archiveReference: 350,
  recordCorrection: 700
} as const;

export type ZagsApplicationValues = Record<string, string>;

export type ZagsValidationIssue = {
  field: string;
  message: string;
};

export type ZagsApplicationDecision = {
  allowed: boolean;
  issues: ZagsValidationIssue[];
  notices: string[];
  formNumbers: string[];
  feeAmount: number;
  feeLabel: string;
  attachments: string[];
};

type ValidationOptions = {
  today?: Date;
};

export function calculateAge(birthDate: string, today = new Date()): number | null {
  const birth = new Date(`${birthDate}T00:00:00`);
  if (!birthDate || Number.isNaN(birth.getTime()) || birth > today) return null;

  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function isZagsFieldVisible(
  scenarioKey: ZagsScenarioKey,
  fieldName: string,
  values: ZagsApplicationValues,
  today = new Date()
) {
  if (scenarioKey === "name-change" && ["minorBasis", "minorBasisDetails"].includes(fieldName)) {
    const age = calculateAge(values.birthDate ?? "", today);
    return age !== null && age >= 14 && age < 18;
  }

  if (scenarioKey === "record-correction" && fieldName === "exchangeDocument") {
    return values.certificateState === "kept";
  }

  if (scenarioKey === "record-correction" && fieldName === "workerErrorConfirmed") {
    return values.errorSource === "zags-worker";
  }

  return true;
}

export function validateZagsApplication(
  scenarioKey: ZagsScenarioKey,
  values: ZagsApplicationValues,
  options: ValidationOptions = {}
): ZagsApplicationDecision {
  const today = options.today ?? new Date();
  const issues: ZagsValidationIssue[] = [];
  const notices: string[] = [];
  let formNumbers: string[] = [];
  let feeAmount = 0;
  let feeLabel = "";
  let attachments = ["Документ, удостоверяющий личность заявителя."];

  if (scenarioKey === "marriage") {
    const mode = values.mode;
    if (!mode) issues.push({ field: "mode", message: "Выберите способ подачи заявления." });
    formNumbers = mode === "separate" ? ["8"] : ["7"];
    feeAmount = ZAGS_FEES.marriage;
    feeLabel = `${feeAmount} руб. за государственную регистрацию заключения брака.`;
    attachments = [
      "Документы, удостоверяющие личности лиц, вступающих в брак.",
      "Документ о прекращении предыдущего брака, если лицо состояло в браке ранее. Если развод зарегистрировал тот же орган ЗАГС, документ можно представить по собственной инициативе.",
      "Разрешение на вступление в брак до достижения брачного возраста, если оно требуется."
    ];
    if (mode === "separate") {
      notices.push("Форма N 8 оформляет отдельное волеизъявление лица, которое не может лично подать совместное заявление. Она не отменяет личное присутствие обоих лиц при государственной регистрации брака.");
    }
  }

  if (scenarioKey === "repeat-document") {
    const status = values.marriageStatus;
    const result = values.result;
    formNumbers = ["26"];

    if (!status) issues.push({ field: "marriageStatus", message: "Укажите текущий статус брака." });
    if (!result) issues.push({ field: "result", message: "Выберите документ, который требуется получить." });

    const requestsMarriageCertificate = result === "marriage-certificate";
    if (requestsMarriageCertificate && ["divorced", "invalid"].includes(status)) {
      issues.push({
        field: "result",
        message: "После расторжения брака или признания его недействительным повторное свидетельство о заключении брака не выдаётся. Выберите справку или иной документ, подтверждающий регистрацию брака."
      });
    }
    if (requestsMarriageCertificate && status === "unsure") {
      issues.push({
        field: "marriageStatus",
        message: "Уточните статус брака перед выбором повторного свидетельства."
      });
    }
    if (status === "widowed") {
      notices.push("Смерть супруга не приравнивается к расторжению или признанию брака недействительным. Право на документ всё равно проверяется по статье 9 Закона N 143-ФЗ.");
    }

    const isReference = result?.endsWith("-reference");
    feeAmount = isReference ? ZAGS_FEES.archiveReference : ZAGS_FEES.repeatCertificate;
    feeLabel = `${feeAmount} руб. за ${isReference ? "справку из архива органов ЗАГС" : "повторное свидетельство"}.`;
    attachments.push("Документы, подтверждающие право заявителя или полномочия представителя, если они требуются.");
  }

  if (scenarioKey === "name-change") {
    const age = calculateAge(values.birthDate ?? "", today);
    formNumbers = ["20"];
    feeAmount = ZAGS_FEES.nameChange;
    feeLabel = `${feeAmount} руб. за государственную регистрацию перемены имени.`;
    attachments = [
      "Документ, удостоверяющий личность заявителя.",
      "Свидетельство о рождении заявителя.",
      "Документы об актовых записях, перечисленные в статье 59 Закона N 143-ФЗ и применимые к заявителю."
    ];

    if (age === null) {
      issues.push({ field: "birthDate", message: "Укажите корректную дату рождения заявителя." });
    } else if (age < 14) {
      issues.push({
        field: "birthDate",
        message: "Форма N 20 не применяется к ребёнку младше 14 лет. Используется другой порядок с участием органа опеки и попечительства."
      });
    } else if (age < 18) {
      if (!values.minorBasis) {
        issues.push({ field: "minorBasis", message: "Для заявителя 14-17 лет выберите законное основание." });
      }
      if (values.minorBasis && !values.minorBasisDetails?.trim()) {
        issues.push({ field: "minorBasisDetails", message: "Укажите реквизиты согласия, решения суда или документа о полной дееспособности." });
      }
      if (values.minorBasis === "full-capacity") {
        notices.push("Полная дееспособность несовершеннолетнего является отдельным основанием: приложите подтверждающий документ.");
      }
      attachments.push("Согласие применимого законного представителя, решение суда или документ о приобретении полной дееспособности.");
    } else {
      notices.push("Совершеннолетнему заявителю согласие родителей, усыновителей или попечителя не требуется.");
    }
  }

  if (scenarioKey === "record-correction") {
    formNumbers = ["23"];
    attachments = [
      "Документ, удостоверяющий личность заявителя.",
      "Документы, подтверждающие основание исправления или изменения записи."
    ];

    if (!values.certificateState) {
      issues.push({ field: "certificateState", message: "Укажите, сохранилось ли свидетельство, подлежащее обмену." });
    } else if (values.certificateState === "kept") {
      if (!values.exchangeDocument?.trim()) {
        issues.push({ field: "exchangeDocument", message: "Укажите реквизиты сохранившегося свидетельства." });
      }
      attachments.push("Свидетельство, подлежащее обмену.");
    } else if (values.certificateState === "lost") {
      notices.push("Получать повторное свидетельство специально для приложения не требуется: это прямо предусмотрено статьёй 71 Закона N 143-ФЗ.");
    }

    if (!values.errorSource) {
      issues.push({ field: "errorSource", message: "Укажите, связана ли ошибка с действиями работников ЗАГС." });
    }
    if (values.errorSource === "zags-worker" && !values.workerErrorConfirmed) {
      issues.push({ field: "workerErrorConfirmed", message: "Укажите, подтверждена ли вина работников ЗАГС документами или ответом органа." });
    }

    const exemptionConfirmed = values.errorSource === "zags-worker" && values.workerErrorConfirmed === "yes";
    feeAmount = exemptionConfirmed ? 0 : ZAGS_FEES.recordCorrection;
    feeLabel = exemptionConfirmed
      ? "Госпошлина не уплачивается: подтверждена ошибка, допущенная по вине работников при государственной регистрации."
      : `${feeAmount} руб. за внесение исправления или изменения в запись.`;
    if (values.errorSource === "zags-worker" && values.workerErrorConfirmed === "no") {
      notices.push("Освобождение от пошлины не применено автоматически: основание по статье 333.39 НК РФ нужно подтвердить.");
    }
  }

  return {
    allowed: issues.length === 0,
    issues,
    notices,
    formNumbers,
    feeAmount,
    feeLabel,
    attachments
  };
}
