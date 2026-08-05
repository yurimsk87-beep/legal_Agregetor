import type { DivorcePropertyScenarioKey } from "@/data/divorce-property-route";

export type DivorcePropertyValues = Record<string, string | undefined>;

export type CourtLevel = "magistrate" | "district" | "manual-review";

export type PropertyAssetRow = {
  id: string;
  description: string;
  identifier: string;
  acquisitionBasis: string;
  registeredOwner: string;
  fullValue: string;
  valuationSource: string;
  supportingDocuments: string;
  claimedSharePercent: string;
  requestedResult: "plaintiff" | "shared" | "defendant" | "exclude" | "";
  compensationDirection: "none" | "to-plaintiff" | "from-plaintiff" | "";
  compensationAmount: string;
};

export type DivorcePropertyDecision = {
  allowed: boolean;
  issues: Array<{ field: string; message: string }>;
  notices: string[];
  documentTitle: string;
  formNumbers: string[];
  feeAmount: number | null;
  feeLabel: string;
  jurisdiction: string;
  filingInstruction: string;
  copyInstruction: string;
  paymentInstruction: string;
  originalsInstruction: string;
  afterFiling: string;
  attachments: string[];
  additionalDocuments: string[];
  supplementalDrafts: Array<{ title: string; text: string }>;
  reviewReasons: string[];
  requiresLegalReview: boolean;
  filingReady: boolean;
  officialFormOnly: boolean;
  draftText: string;
};

export const DIVORCE_FEES = {
  registryMutual: 5000,
  registryUnilateral: 350,
  courtDivorceClaim: 5000,
  notaryMinimum: 300,
  notaryMaximum: 20000,
  securityMotion: 10000
} as const;

export function calculatePropertyClaimDuty(claimPrice: number) {
  if (!Number.isFinite(claimPrice) || claimPrice <= 0) return null;
  let result: number;
  if (claimPrice <= 100000) result = 4000;
  else if (claimPrice <= 300000) result = 4000 + (claimPrice - 100000) * 0.03;
  else if (claimPrice <= 500000) result = 10000 + (claimPrice - 300000) * 0.025;
  else if (claimPrice <= 1000000) result = 15000 + (claimPrice - 500000) * 0.02;
  else if (claimPrice <= 3000000) result = 25000 + (claimPrice - 1000000) * 0.01;
  else if (claimPrice <= 8000000) result = 45000 + (claimPrice - 3000000) * 0.007;
  else if (claimPrice <= 24000000) result = 80000 + (claimPrice - 8000000) * 0.0035;
  else if (claimPrice <= 50000000) result = 136000 + (claimPrice - 24000000) * 0.003;
  else if (claimPrice <= 100000000) result = 214000 + (claimPrice - 50000000) * 0.002;
  else result = Math.min(900000, 314000 + (claimPrice - 100000000) * 0.0015);
  return Math.round(result);
}

export function calculateNotaryAgreementTariff(agreementValue: number) {
  if (!Number.isFinite(agreementValue) || agreementValue <= 0) return DIVORCE_FEES.notaryMinimum;
  return Math.min(DIVORCE_FEES.notaryMaximum, Math.max(DIVORCE_FEES.notaryMinimum, Math.round(agreementValue * 0.005)));
}

export function calculatePropertyAssets(rows: PropertyAssetRow[]) {
  const issues: Array<{ field: string; message: string }> = [];
  const assetLines: string[] = [];
  const requestLines: string[] = [];
  const supportingDocuments: string[] = [];
  let claimPrice = 0;

  if (!rows.length) {
    issues.push({ field: "assetRows", message: "Добавьте хотя бы один объект спорного имущества." });
  }

  rows.forEach((row, index) => {
    const field = `assetRows.${index}`;
    const number = index + 1;
    const fullValue = parseMoney(row.fullValue);
    const sharePercent = Number(row.claimedSharePercent.replace(",", "."));
    const compensation = row.compensationDirection === "none" ? 0 : parseMoney(row.compensationAmount);

    if (!row.description.trim()) issues.push({ field, message: `Объект ${number}: укажите вид и описание имущества.` });
    if (!row.identifier.trim()) issues.push({ field, message: `Объект ${number}: укажите кадастровый номер, VIN или иной идентификатор.` });
    if (!row.acquisitionBasis.trim()) issues.push({ field, message: `Объект ${number}: укажите дату и основание приобретения.` });
    if (!row.registeredOwner.trim()) issues.push({ field, message: `Объект ${number}: укажите, на кого оформлено имущество.` });
    if (fullValue === null) issues.push({ field, message: `Объект ${number}: укажите положительную стоимость всего объекта.` });
    if (!row.valuationSource.trim()) issues.push({ field, message: `Объект ${number}: укажите документ или иной источник стоимости.` });
    if (!row.supportingDocuments.trim()) issues.push({ field, message: `Объект ${number}: перечислите подтверждающие документы.` });
    if (!Number.isFinite(sharePercent) || sharePercent < 0 || sharePercent > 100) {
      issues.push({ field, message: `Объект ${number}: доля истца должна быть от 0 до 100 процентов.` });
    }
    if (!row.requestedResult) issues.push({ field, message: `Объект ${number}: выберите требуемый результат раздела.` });
    if (!row.compensationDirection) issues.push({ field, message: `Объект ${number}: укажите направление денежной компенсации.` });
    if (row.compensationDirection !== "none" && compensation === null) {
      issues.push({ field, message: `Объект ${number}: укажите положительную сумму компенсации.` });
    }
    if (fullValue !== null && compensation !== null && compensation > fullValue) {
      issues.push({ field, message: `Объект ${number}: компенсация не может превышать указанную стоимость объекта без отдельного обоснования и ручной проверки.` });
    }
    if (["plaintiff", "shared"].includes(row.requestedResult) && (!Number.isFinite(sharePercent) || sharePercent <= 0)) {
      issues.push({ field, message: `Объект ${number}: для передачи истцу или определения доли укажите положительную долю.` });
    }
    if (["defendant", "exclude"].includes(row.requestedResult) && sharePercent !== 0) {
      issues.push({ field, message: `Объект ${number}: при передаче ответчику или исключении из раздела доля, требуемая истцом, должна быть 0%.` });
    }

    const claimedPropertyValue = fullValue !== null && Number.isFinite(sharePercent)
      ? Math.round(fullValue * sharePercent / 100)
      : 0;
    const compensationToPlaintiff = row.compensationDirection === "to-plaintiff" && compensation !== null ? compensation : 0;
    claimPrice += claimedPropertyValue + compensationToPlaintiff;

    assetLines.push(
      `${number}. ${row.description || "Объект не указан"}; идентификатор: ${row.identifier || "не указан"}; `
      + `приобретение: ${row.acquisitionBasis || "не указано"}; оформлено на: ${row.registeredOwner || "не указано"}; `
      + `стоимость всего объекта: ${fullValue === null ? "не определена" : `${formatRubles(fullValue)} руб.`}; `
      + `источник стоимости: ${row.valuationSource || "не указан"}; `
      + `подтверждающие документы: ${row.supportingDocuments || "не указаны"}`
    );
    if (row.supportingDocuments.trim()) supportingDocuments.push(`По объекту «${row.description.trim() || number}»: ${row.supportingDocuments.trim()}.`);
    requestLines.push(buildAssetRequestLine(row, number, claimedPropertyValue, compensation ?? 0));
  });

  if (rows.length && claimPrice <= 0) {
    issues.push({ field: "assetRows", message: "Расчётная цена иска равна нулю. Проверьте требуемые доли и компенсацию в пользу истца." });
  }

  return {
    issues,
    claimPrice: Math.round(claimPrice),
    assetsText: assetLines.join("\n"),
    requestedDivisionText: requestLines.join("\n"),
    supportingDocuments
  };
}

export function resolveCourtLevel(scenarioKey: DivorcePropertyScenarioKey, values: DivorcePropertyValues): CourtLevel {
  if (scenarioKey === "court-divorce") {
    return values.childDispute === "no" && values.otherClaims === "none" ? "magistrate" : "manual-review";
  }
  if (scenarioKey !== "property-claim") return "manual-review";

  const assets = parsePropertyAssetRows(values.assetRows);
  const claimPrice = assets ? calculatePropertyAssets(assets).claimPrice : 0;
  if (claimPrice <= 0 || values.combineDivorce === "unsure") return "manual-review";
  if (values.combineDivorce === "yes" && values.combinedChildDispute !== "no") return "manual-review";
  return claimPrice <= 50_000 ? "magistrate" : "district";
}

export function courtLevelLabel(level: CourtLevel) {
  if (level === "magistrate") return "мировой судья";
  if (level === "district") return "районный или городской суд";
  return "уровень суда требует ручной юридической проверки";
}

function resolveCourtSelection(scenarioKey: DivorcePropertyScenarioKey, values: DivorcePropertyValues) {
  const issues: Array<{ field: string; message: string }> = [];
  const notices: string[] = [];
  const level = resolveCourtLevel(scenarioKey, values);
  let manualSourceReview = false;
  const basis = values.territorialBasis;
  const basisLabels: Record<string, string> = {
    defendant: "по месту жительства ответчика по статье 28 ГПК РФ",
    "plaintiff-child": "по месту жительства истца, при котором находится несовершеннолетний ребёнок, по части 4 статьи 29 ГПК РФ",
    "plaintiff-health": "по месту жительства истца из-за затруднённого по состоянию здоровья выезда к ответчику по части 4 статьи 29 ГПК РФ",
    "last-known": "по последнему известному месту жительства ответчика в Российской Федерации по части 1 статьи 29 ГПК РФ",
    "defendant-property": "по месту нахождения имущества ответчика при неизвестном месте жительства по части 1 статьи 29 ГПК РФ",
    "real-estate-exclusive": "по месту нахождения недвижимости — применимость статьи 30 ГПК РФ требует отдельной проверки состава требований"
  };

  if (!values.courtRegion?.trim()) issues.push({ field: "courtRegion", message: "Выберите регион суда." });
  if (!basis) issues.push({ field: "territorialBasis", message: "Выберите подтверждённое законом основание территориальной подсудности." });
  if (!values.territorialAddress?.trim()) issues.push({ field: "territorialAddress", message: "Укажите полный адрес, по которому определяется территория суда." });
  if (basis && basis !== "defendant" && !values.jurisdictionEvidence?.trim()) {
    issues.push({ field: "jurisdictionEvidence", message: "Укажите документ или обстоятельство, подтверждающее выбранное специальное основание подсудности." });
  }
  if (basis === "plaintiff-child" && values.commonMinorChildren !== "yes") {
    issues.push({ field: "territorialBasis", message: "Подача по месту истца из-за ребёнка требует подтверждения, что при истце находится несовершеннолетний ребёнок." });
  }
  if (["last-known", "defendant-property"].includes(basis ?? "")
    && scenarioKey === "court-divorce"
    && !["unknown", "abroad"].includes(values.defendantLocation ?? "")) {
    issues.push({ field: "territorialBasis", message: "Часть 1 статьи 29 ГПК РФ применяется, когда место жительства ответчика неизвестно либо у него нет места жительства в Российской Федерации." });
  }
  if (basis === "real-estate-exclusive") {
    notices.push("Сам по себе раздел совместно нажитой недвижимости не подтверждает применение статьи 30 ГПК РФ. Нужна ручная проверка предмета каждого требования.");
  }
  if (values.courtSearchConfirmed !== "yes") {
    issues.push({ field: "courtSearchConfirmed", message: "Участок автоматически не определён. Найдите суд по полному адресу в официальном сервисе ГАС «Правосудие» и перенесите его реквизиты." });
  } else {
    if (!values.courtName?.trim()) issues.push({ field: "courtName", message: "Укажите официальное наименование найденного суда или мирового участка." });
    if (!values.courtAddress?.trim()) issues.push({ field: "courtAddress", message: "Укажите официальный адрес найденного суда или мирового участка." });
    if (!isHttpsUrl(values.courtWebsite)) {
      issues.push({ field: "courtWebsite", message: "Укажите официальную ссылку на суд или участок, начинающуюся с https://." });
    } else if (!isSupportedOfficialCourtUrl(values.courtWebsite)) {
      manualSourceReview = true;
      notices.push("Домен ссылки не относится к автоматически распознаваемым судебным доменам sudrf.ru, msudrf.ru или mos-sud.ru. Региональный официальный источник и реквизиты суда нужно проверить вручную.");
    }
    if (level === "magistrate" && !values.courtPrecinctNumber?.trim()) {
      issues.push({ field: "courtPrecinctNumber", message: "Укажите номер выбранного мирового судебного участка." });
    }
    if (level === "magistrate" && !values.appealCourtName?.trim()) {
      issues.push({ field: "appealCourtName", message: "Укажите районный суд, рассматривающий жалобы на решения выбранного мирового судьи." });
    }
  }

  const precinct = level === "magistrate" && values.courtPrecinctNumber?.trim()
    ? `N ${values.courtPrecinctNumber.trim()} — `
    : "";
  const selectedCourt = values.courtName?.trim() ? `${precinct}${values.courtName.trim()}` : courtLevelLabel(level);
  const selectedAddress = values.courtAddress?.trim() ? `, адрес: ${values.courtAddress.trim()}` : "";
  const region = values.courtRegion?.trim() ? `, регион: ${values.courtRegion.trim()}` : "";
  const reason = basisLabels[basis ?? ""] ?? "основание территориальной подсудности не выбрано";
  const reviewReasons = [
    ...(basis === "real-estate-exclusive" ? ["Применимость исключительной подсудности по месту недвижимости требует проверки предмета требований."] : []),
    ...(level === "manual-review" ? ["Родовая подсудность не определяется автоматически при выбранном составе требований."] : []),
    ...(manualSourceReview ? ["Официальность регионального источника и реквизиты выбранного суда требуют ручной проверки."] : [])
  ];

  return {
    issues,
    notices,
    level,
    jurisdiction: `${selectedCourt}${selectedAddress}${region}; ${reason}. Официальный источник: ${values.courtWebsite?.trim() || "не подтверждён"}.`,
    reviewReasons,
    requiresLegalReview: basis === "real-estate-exclusive" || level === "manual-review" || manualSourceReview
  };
}

function isHttpsUrl(rawValue: string | undefined) {
  if (!rawValue?.trim()) return false;
  try {
    return new URL(rawValue.trim()).protocol === "https:";
  } catch {
    return false;
  }
}

function isSupportedOfficialCourtUrl(rawValue: string | undefined) {
  if (!rawValue?.trim()) return false;
  try {
    const url = new URL(rawValue.trim());
    if (url.protocol !== "https:") return false;
    return ["sudrf.ru", "msudrf.ru", "mos-sud.ru"].some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function resolveCourtFee(values: DivorcePropertyValues, baseAmount: number | null, baseLabel: string) {
  const relief = values.courtFeeRelief;
  if (!relief || relief === "unsure") {
    return {
      amount: null,
      label: `${baseLabel} Итоговый платёж не подтверждён: уточните наличие льготы или оснований для изменения платежа.`,
      issue: "Уточните наличие льготы либо оснований для отсрочки, рассрочки, уменьшения или освобождения от пошлины.",
      notice: "Льготы проверяются по статьям 333.35-333.36 НК РФ; изменение платежа по имущественному положению разрешает суд по статьям 333.20 и 333.41 НК РФ.",
      requiresLegalReview: false
    };
  }
  if (relief === "statutory") {
    return {
      amount: null,
      label: `Базовый расчёт: ${baseLabel} Фактический платёж определяется после проверки конкретной льготы.`,
      issue: values.feeReliefDetails?.trim() ? "" : "Укажите норму и документ, подтверждающие заявленную льготу.",
      notice: "Помощник не применяет льготу автоматически: её основание и пределы нужно подтвердить по статьям 333.35-333.36 НК РФ.",
      requiresLegalReview: true
    };
  }
  if (relief === "hardship") {
    return {
      amount: null,
      label: `Базовый расчёт: ${baseLabel} Размер и срок платежа определит суд по отдельному ходатайству.`,
      issue: values.feeReliefDetails?.trim() ? "" : "Опишите имущественное положение и документы, которыми оно подтверждается.",
      notice: "Суд с учётом имущественного положения вправе освободить от пошлины, уменьшить её, отсрочить или рассрочить уплату; решение заранее не гарантируется.",
      requiresLegalReview: true
    };
  }
  return { amount: baseAmount, label: baseLabel, issue: "", notice: "", requiresLegalReview: false };
}

export function isDivorcePropertyFieldVisible(
  scenarioKey: DivorcePropertyScenarioKey,
  fieldName: string,
  values: DivorcePropertyValues
) {
  if (scenarioKey === "registry-divorce") {
    if (["mutualConsent", "commonMinorChildren"].includes(fieldName)) return ["mutual", "separate"].includes(values.registryGround ?? "");
    if (fieldName === "specialBasis") return values.registryGround === "special";
    if (fieldName === "basisDocument") return ["special", "court-decision"].includes(values.registryGround ?? "");
    if (fieldName === "foreignCourtDecision") return values.registryGround === "court-decision";
    if (fieldName === "absentSignature") return values.registryGround === "separate";
    if (fieldName === "specialNoticeRecipient") return values.registryGround === "special";
    if (["courtRegistryAction", "authorizedRepresentative", "documentDestination"].includes(fieldName)) {
      return values.registryGround === "court-decision";
    }
    if (fieldName === "representativeData") {
      return values.registryGround === "court-decision" && values.authorizedRepresentative === "yes";
    }
  }
  if (scenarioKey === "court-divorce") {
    if (fieldName === "childrenData") return values.commonMinorChildren === "yes";
    if (fieldName === "wifeConsent") return values.plaintiffRole === "husband" && ["pregnancy", "infant"].includes(values.pregnancyOrInfant ?? "");
  }
  if (scenarioKey === "property-agreement" && fieldName === "marriageContractDetails") {
    return values.marriageContract === "yes";
  }
  if (scenarioKey === "property-claim" && fieldName.startsWith("combined")) {
    if (values.combineDivorce !== "yes") return false;
    if (fieldName === "combinedChildrenData") return values.combinedCommonMinorChildren === "yes";
    if (fieldName === "combinedWifeConsent") {
      return values.combinedPlaintiffRole === "husband"
        && ["pregnancy", "infant"].includes(values.combinedPregnancyOrInfant ?? "");
    }
    return true;
  }
  if (["court-divorce", "property-claim"].includes(scenarioKey) && fieldName === "feeReliefDetails") {
    return ["statutory", "hardship"].includes(values.courtFeeRelief ?? "");
  }
  if (["court-divorce", "property-claim"].includes(scenarioKey)) {
    if (fieldName === "jurisdictionEvidence") return Boolean(values.territorialBasis && values.territorialBasis !== "defendant");
    if (["courtName", "courtAddress", "courtWebsite"].includes(fieldName)) return values.courtSearchConfirmed === "yes";
    if (fieldName === "courtPrecinctNumber") {
      return values.courtSearchConfirmed === "yes" && resolveCourtLevel(scenarioKey, values) === "magistrate";
    }
    if (fieldName === "appealCourtName") {
      return values.courtSearchConfirmed === "yes" && resolveCourtLevel(scenarioKey, values) === "magistrate";
    }
  }
  return true;
}

export function validateDivorcePropertyApplication(
  scenarioKey: DivorcePropertyScenarioKey,
  inputValues: DivorcePropertyValues
): DivorcePropertyDecision {
  const propertyAssets = scenarioKey === "property-claim" ? parsePropertyAssetRows(inputValues.assetRows) : null;
  const assetCalculation = propertyAssets ? calculatePropertyAssets(propertyAssets) : null;
  const values: DivorcePropertyValues = assetCalculation
    ? {
        ...inputValues,
        claimPrice: String(assetCalculation.claimPrice),
        assets: assetCalculation.assetsText,
        requestedDivision: assetCalculation.requestedDivisionText
      }
    : { ...inputValues };
  const issues: DivorcePropertyDecision["issues"] = [];
  const notices: string[] = [];
  const attachments: string[] = [];
  const additionalDocuments: string[] = [];
  const supplementalDrafts: Array<{ title: string; text: string }> = [];
  const reviewReasons: string[] = [];
  let documentTitle = "";
  let formNumbers: string[] = [];
  let feeAmount: number | null = null;
  let feeLabel = "";
  let jurisdiction = "";
  let filingInstruction = "";
  let copyInstruction = "Не применяется для выбранной процедуры.";
  let paymentInstruction = "Используйте только реквизиты выбранного органа или суда, проверенные непосредственно перед оплатой.";
  let originalsInstruction = "Возьмите оригиналы документов, перечисленных для выбранной процедуры, если орган или суд требует их предъявления.";
  let afterFiling = "";
  let requiresLegalReview = false;
  let draftText = "";
  const markLegalReview = (reason: string) => {
    requiresLegalReview = true;
    reviewReasons.push(reason);
  };

  if (scenarioKey === "registry-divorce") {
    documentTitle = "Заявление о расторжении брака через ЗАГС";
    jurisdiction = "Орган ЗАГС по выбору заявителя в пределах способов, предусмотренных Законом N 143-ФЗ.";
    filingInstruction = "Подайте заявление способом, предусмотренным для определённой формы N 9-12; помощник покажет официальный бланк, но не имитирует его.";
    paymentInstruction = "Получите актуальные реквизиты выбранного органа ЗАГС или используйте официальный электронный способ оплаты; региональные реквизиты в сервисе не сохраняются.";
    originalsInstruction = "При обращении возьмите документ, удостоверяющий личность, и оригиналы тех документов-оснований, которые применимы к выбранной форме.";
    afterFiling = "ЗАГС проверяет заявление и основания. В применимых случаях регистрация проводится по истечении месяца при требуемом законом присутствии; после регистрации выдается свидетельство, а момент прекращения брака определяется статьей 25 СК РФ.";
    for (const [field, message] of [
      ["applicantData", "Укажите предусмотренные формой сведения о заявителе."],
      ["spouseData", "Укажите предусмотренные выбранной формой сведения о втором супруге."],
      ["contactPhone", "Укажите контактный телефон для заявления."],
      ["zagsOffice", "Укажите орган ЗАГС, в который подаётся заявление."],
      ["marriageRecord", "Укажите реквизиты записи акта о заключении брака."],
      ["selectedSurnames", "Укажите фамилию или фамилии после расторжения брака."]
    ] as const) {
      if (!values[field]?.trim()) issues.push({ field, message });
    }
    attachments.push("Документ, удостоверяющий личность заявителя.", "Сведения о записи акта о заключении брака.");
    const ground = values.registryGround;
    if (!ground || ground === "unsure") {
      issues.push({ field: "registryGround", message: "Уточните основание развода: от него зависят форма, приложения и госпошлина." });
      feeLabel = "350 или 5 000 руб. — основание развода не определено.";
    } else if (ground === "mutual" || ground === "separate") {
      filingInstruction = ground === "separate"
        ? "Присутствующий супруг подаёт форму N 9, а волеизъявление отсутствующего супруга оформляется формой N 10. Подпись на форме N 10 удостоверяется по правилам пункта 3 статьи 33 Закона N 143-ФЗ; электронную подачу не смешивайте с нотариальным порядком."
        : "Подайте совместную форму N 9 лично в ЗАГС, через МФЦ либо в электронной форме через предусмотренный законом портал по статье 33 Закона N 143-ФЗ.";
      afterFiling = "Регистрация проводится по истечении месяца со дня подачи при присутствии хотя бы одного супруга. После внесения записи выдается свидетельство; если свидетельство о браке утрачено, специально получать повторное свидетельство для подачи не требуется.";
      formNumbers = ground === "separate" ? ["9", "10"] : ["9"];
      feeAmount = DIVORCE_FEES.registryMutual;
      feeLabel = `${formatRubles(feeAmount)} руб. с каждого супруга.`;
      if (values.mutualConsent !== "yes") issues.push({ field: "mutualConsent", message: "Формы N 9-10 применяются только при взаимном согласии супругов." });
      if (values.commonMinorChildren !== "no") issues.push({ field: "commonMinorChildren", message: "При общих несовершеннолетних детях развод по взаимному согласию оформляется через суд." });
      if (ground === "separate") {
        if (!values.absentSignature?.trim()) issues.push({ field: "absentSignature", message: "Укажите способ удостоверения подписи отсутствующего супруга." });
        notices.push("Форма N 10 выражает волю отсутствующего супруга и используется вместе с заявлением присутствующего супруга; это не самостоятельное основание развода.");
        attachments.push("Отдельное заявление по форме N 10 с подписью, удостоверенной по правилам пункта 3 статьи 33 Закона N 143-ФЗ, если оно не направляется электронно.");
      }
      attachments.push("Свидетельство о заключении брака, если оно сохранилось.");
    } else if (ground === "special") {
      filingInstruction = "Подайте форму N 11 и судебный акт, подтверждающий одно из оснований статьи 34 Закона N 143-ФЗ, непосредственно в орган ЗАГС.";
      afterFiling = "ЗАГС направляет предусмотренное законом извещение. Регистрация проводится в присутствии заявителя по истечении месяца со дня подачи, после чего выдается свидетельство.";
      formNumbers = ["11"];
      feeAmount = DIVORCE_FEES.registryUnilateral;
      feeLabel = `${formatRubles(feeAmount)} руб. с заявителя.`;
      if (!values.specialBasis || values.specialBasis === "unsure") {
        issues.push({ field: "specialBasis", message: "Форма N 11 возможна только при одном из трёх специальных оснований статьи 19 СК РФ." });
      }
      if (!values.basisDocument?.trim()) issues.push({ field: "basisDocument", message: "Укажите судебный акт, подтверждающий специальное основание." });
      if (!values.specialNoticeRecipient?.trim()) {
        issues.push({ field: "specialNoticeRecipient", message: "Укажите получателя и почтовый адрес для обязательного извещения по пункту 4 статьи 34 Закона N 143-ФЗ." });
      }
      attachments.push(
        "Вступившее в силу решение суда или приговор суда, подтверждающий специальное основание.",
        "Свидетельство о заключении брака, если оно сохранилось; при утрате повторное свидетельство специально получать не требуется."
      );
    } else if (ground === "court-decision") {
      filingInstruction = "Заявление по форме N 12 может быть сделано устно или письменно, направлено через предусмотренный законом электронный портал либо подано представителем с нотариальной доверенностью по статье 35 Закона N 143-ФЗ.";
      afterFiling = "После вступления решения суда в законную силу ЗАГС регистрирует расторжение брака и выдает свидетельство по месту обращения. Если запись уже оформлена другим бывшим супругом, ЗАГС дополняет ранее составленную запись в порядке статьи 35 Закона N 143-ФЗ.";
      formNumbers = ["12"];
      feeAmount = DIVORCE_FEES.registryMutual;
      feeLabel = `${formatRubles(feeAmount)} руб. с каждого бывшего супруга при государственной регистрации расторжения брака.`;
      if (!values.basisDocument?.trim()) issues.push({ field: "basisDocument", message: "Укажите решение суда и дату его вступления в законную силу." });
      if (!values.courtRegistryAction || values.courtRegistryAction === "unsure") {
        issues.push({ field: "courtRegistryAction", message: "Уточните, требуется первичная регистрация развода или дополнение ранее составленной записи." });
      }
      if (values.foreignCourtDecision !== "no") {
        issues.push({
          field: "foreignCourtDecision",
          message: values.foreignCourtDecision === "yes"
            ? "Применимость иностранного решения, его признание и требования к документам нужно проверить отдельно до использования формы N 12."
            : "Уточните, вынесено ли решение российским или иностранным судом."
        });
      }
      if (!values.authorizedRepresentative || values.authorizedRepresentative === "unsure") {
        issues.push({ field: "authorizedRepresentative", message: "Уточните, кто подаёт форму N 12: заявитель или уполномоченное лицо." });
      } else if (values.authorizedRepresentative === "yes" && !values.representativeData?.trim()) {
        issues.push({ field: "representativeData", message: "Укажите сведения представителя и реквизиты нотариальной доверенности, предусмотренные формой N 12." });
      }
      notices.push("Брак прекращается со дня вступления решения суда в законную силу. Форма N 12 используется для последующей государственной регистрации записи и получения свидетельства.");
      if (values.courtRegistryAction === "supplement") {
        notices.push("При дополнении ранее составленной записи выписка из решения суда может не представляться в случае, прямо предусмотренном пунктом 1 статьи 35 Закона N 143-ФЗ.");
      } else {
        attachments.push("Выписка из вступившего в силу решения суда о расторжении брака.");
      }
      if (values.authorizedRepresentative === "yes") attachments.push("Нотариально удостоверенная доверенность представителя.");
    }
  }

  if (scenarioKey === "court-divorce") {
    documentTitle = "Исковое заявление о расторжении брака";
    filingInstruction = "Направьте ответчику копию иска с отсутствующими у него приложениями, сохраните подтверждение и подайте комплект в определённый суд.";
    copyInstruction = "До подачи направьте ответчику копию иска и отсутствующих у него приложений; сохраните почтовое или иное допустимое подтверждение направления.";
    paymentInstruction = "Сформируйте платеж по актуальным реквизитам выбранного суда с его официальной страницы; сохраните документ об уплате либо подтверждение льготы.";
    originalsInstruction = "Возьмите в заседание оригиналы документов о браке, детях и иных доказательств, копии которых приложены к иску, если суд потребует их предъявить.";
    afterFiling = "Суд проверит иск и может принять его, оставить без движения с указанием недостатков либо вернуть по предусмотренному законом основанию. Устраните недостатки в срок суда, отслеживайте извещения и учитывайте возможный срок для примирения. После вступления решения в законную силу обратитесь за государственной регистрацией расторжения брака и свидетельством.";
    feeAmount = DIVORCE_FEES.courtDivorceClaim;
    feeLabel = `${formatRubles(feeAmount)} руб. за подачу иска. Регистрация развода после решения суда оплачивается отдельно.`;
    const courtSelection = resolveCourtSelection(scenarioKey, values);
    jurisdiction = courtSelection.jurisdiction;
    issues.push(...courtSelection.issues);
    notices.push(...courtSelection.notices);
    courtSelection.reviewReasons.forEach(markLegalReview);
    values.courtName = courtHeading(values);
    filingInstruction = `Проверьте реквизиты выбранного суда по официальной ссылке ${value(values, "courtWebsite")}, направьте ответчику копию иска с отсутствующими у него приложениями и подайте комплект в этот суд.`;
    attachments.push(
      "Документ об уплате госпошлины или подтверждение льготы.",
      "Документ о заключении брака.",
      "Документы о рождении общих несовершеннолетних детей, если они есть.",
      "Подтверждение направления ответчику копии иска и отсутствующих у него приложений."
    );
    if (values.commonMinorChildren === "unsure") issues.push({ field: "commonMinorChildren", message: "Уточните наличие общих несовершеннолетних детей." });
    if (values.commonMinorChildren === "yes" && !values.childrenData?.trim()) issues.push({ field: "childrenData", message: "Укажите сведения об общих несовершеннолетних детях." });
    if (values.commonMinorChildren === "no" && values.consentState === "agrees") {
      issues.push({ field: "consentState", message: "При взаимном согласии и отсутствии общих несовершеннолетних детей используйте развод через ЗАГС, а не судебный иск." });
    }
    if (values.childDispute !== "no") {
      issues.push({ field: "childDispute", message: values.childDispute === "yes" ? "Спор о детях не входит в этот документ и требует отдельного маршрута и проверки подсудности." : "Уточните, есть ли спор о детях." });
    }
    if (values.plaintiffRole === "husband" && ["pregnancy", "infant"].includes(values.pregnancyOrInfant ?? "") && values.wifeConsent !== "yes") {
      issues.push({ field: "wifeConsent", message: "Муж не вправе без согласия жены возбуждать дело во время её беременности и в течение года после рождения ребёнка." });
    }
    if (values.pregnancyOrInfant === "unsure") issues.push({ field: "pregnancyOrInfant", message: "Уточните обстоятельства статьи 17 СК РФ до формирования иска." });
    if (values.otherClaims !== "none") {
      issues.push({ field: "otherClaims", message: values.otherClaims === "property" ? "Объединённый иск требует расчёта цены иска, пошлины и отдельной проверки подсудности. Сначала подготовьте иск о разделе имущества." : "Дополнительные требования не включаются в этот документ автоматически." });
    }
    if (values.hearWithoutPlaintiff === "yes") {
      additionalDocuments.push("Ходатайство о рассмотрении дела без участия истца.");
      supplementalDrafts.push({
        title: "Ходатайство о рассмотрении дела без участия истца",
        text: `${value(values, "courtName")}\n\nИстец: ${value(values, "plaintiffData")}\nОтветчик: ${value(values, "defendantData")}\n\nХОДАТАЙСТВО\nо рассмотрении дела без участия истца\n\nНа основании части 5 статьи 167 ГПК РФ прошу рассмотреть дело о расторжении брака в моё отсутствие и направить мне копию решения суда. Исковые требования поддерживаю.\n\nДата: ____________    Подпись: ____________`
      });
    }
    if (values.hearWithoutPlaintiff === "unsure") issues.push({ field: "hearWithoutPlaintiff", message: "Уточните, требуется ли ходатайство о рассмотрении дела без участия истца." });
    if (values.defendantLocation === "unknown") notices.push("При неизвестном месте жительства ответчика укажите последнее известное место жительства или место нахождения имущества и проверьте статью 29 ГПК РФ.");
    if (["abroad", "military", "prison"].includes(values.defendantLocation ?? "")) {
      markLegalReview("Место нахождения ответчика требует индивидуальной проверки извещения и подсудности.");
      notices.push("Место нахождения ответчика требует проверки извещения, подсудности и возможных специальных правил до подачи иска.");
    }
    const courtFee = resolveCourtFee(values, feeAmount, feeLabel);
    feeAmount = courtFee.amount;
    feeLabel = courtFee.label;
    if (courtFee.issue) issues.push({ field: "courtFeeRelief", message: courtFee.issue });
    if (courtFee.notice) notices.push(courtFee.notice);
    if (courtFee.requiresLegalReview) markLegalReview("Льгота или изменение срока либо размера госпошлины требуют проверки документов и решения суда.");
    draftText = buildDivorceClaim(values, jurisdiction);
  }

  if (scenarioKey === "property-agreement") {
    documentTitle = "Проект соглашения о разделе общего имущества супругов";
    jurisdiction = values.notaryRegion?.trim()
      ? `Нотариус в регионе «${values.notaryRegion.trim()}»; конкретного нотариуса и региональный тариф проверьте на официальном ресурсе ФНП.`
      : "Нотариус; регион и региональная часть тарифа автоматически не определены.";
    filingInstruction = "Передайте проект и оригиналы документов нотариусу. Не подписывайте проект как нотариально удостоверенное соглашение заранее.";
    copyInstruction = "Предварительная отправка копий не заменяет совместное обращение сторон и проверку документов нотариусом.";
    paymentInstruction = "Федеральную и региональную части единого нотариального тарифа уточните у выбранного нотариуса до удостоверения; региональная часть автоматически не рассчитана.";
    originalsInstruction = "Возьмите оригиналы паспортов, документов о браке и правах на имущество, документов о стоимости, обязательствах и ограничениях.";
    afterFiling = "Передайте проект нотариусу и представьте запрошенные оригиналы. После нотариального удостоверения выполните только те регистрационные действия, которые требуются для конкретных передаваемых объектов и прав.";
    const value = parseMoney(values.assetValue);
    if (!values.notaryRegion?.trim()) issues.push({ field: "notaryRegion", message: "Выберите регион нотариального действия; региональная часть тарифа останется для ручной проверки." });
    if (values.mutualAgreement !== "yes") issues.push({ field: "mutualAgreement", message: "Без согласия обоих супругов раздел производится в судебном порядке." });
    if (value === null) issues.push({ field: "assetValue", message: "Укажите положительную стоимость имущества по соглашению." });
    feeAmount = value === null ? null : calculateNotaryAgreementTariff(value);
    feeLabel = value === null
      ? "От 300 до 20 000 руб. федеральной части единого нотариального тарифа; точный размер не рассчитан без стоимости имущества."
      : `${formatRubles(calculateNotaryAgreementTariff(value))} руб. федеральной части единого нотариального тарифа по расчёту 0,5% стоимости. Региональная часть определяется для субъекта РФ по статьям 22 и 22.1 Основ законодательства о нотариате и уточняется до удостоверения.`;
    attachments.push(
      "Документы, удостоверяющие личности супругов.",
      "Документы о заключении или расторжении брака.",
      "Правоустанавливающие документы и документы о стоимости каждого объекта."
    );
    if (values.marriageContract === "yes") {
      markLegalReview("Брачный договор или прежнее соглашение могут изменить режим имущества и условия проекта.");
      if (!values.marriageContractDetails?.trim()) issues.push({ field: "marriageContractDetails", message: "Укажите условия брачного договора, влияющие на раздел." });
    }
    const complexFields: Record<string, string> = {
      mortgage: "Ипотека или залог затрагивают права кредитора.",
      maternityCapital: "Использование материнского капитала требует проверки обязательств и прав детей.",
      childrenShares: "Доли или имущество детей не относятся к общему имуществу супругов и требуют отдельной проверки.",
      thirdPartyRights: "Условия затрагивают права банка, кредитора или иного третьего лица.",
      bankruptcy: "Банкротство супруга влияет на порядок распоряжения и раздела имущества."
    };
    for (const [field, reason] of Object.entries(complexFields)) {
      if (values[field] === "yes" || values[field] === "unsure") markLegalReview(values[field] === "unsure" ? `Не удалось исключить обстоятельство: ${reason}` : reason);
    }
    if (values.debts?.trim()) {
      markLegalReview("Условия о долгах требуют проверки обязательств перед кредиторами.");
      notices.push("Распределение долга между супругами само по себе не заменяет согласие кредитора на изменение должника или условий обязательства.");
    }
    if (requiresLegalReview) notices.push("До удостоверения проект нужно проверить у нотариуса, а при правах банка, детей, кредиторов или банкротстве — также согласовать применимый порядок с соответствующим участником или органом.");
    draftText = buildPropertyAgreement(values);
  }

  if (scenarioKey === "property-claim") {
    documentTitle = "Исковое заявление о разделе общего имущества супругов";
    copyInstruction = "До подачи направьте ответчику и другим участвующим лицам копии иска и отсутствующих у них приложений; сохраните подтверждения направления для суда.";
    paymentInstruction = "Проверьте рассчитанную сумму и сформируйте платеж по актуальным реквизитам выбранного суда. Заявление об обеспечении иска, если оно подается, оплачивается отдельно.";
    originalsInstruction = "Возьмите оригиналы документов о браке, правах на каждый объект, его стоимости, источнике средств, обязательствах и иных доказательствах, копии которых поданы в суд.";
    afterFiling = "Суд проверит иск и может принять его, оставить без движения с указанием недостатков либо вернуть по предусмотренному законом основанию. Устраните недостатки в срок суда и отслеживайте извещения. После вступления решения в законную силу получите судебный акт и выполните необходимые регистрационные действия отдельно по каждому объекту.";
    if (!propertyAssets) {
      issues.push({ field: "assetRows", message: "Добавьте имущество в построчный расчёт." });
    }
    if (assetCalculation) issues.push(...assetCalculation.issues);
    const claimPrice = parseMoney(values.claimPrice);
    const propertyFee = claimPrice === null ? null : calculatePropertyClaimDuty(claimPrice);
    const divorceFee = values.combineDivorce === "yes" ? DIVORCE_FEES.courtDivorceClaim : 0;
    feeAmount = propertyFee === null ? null : propertyFee + divorceFee;
    feeLabel = claimPrice === null
      ? "От 4 000 до 900 000 руб. по цене иска; окончательный расчёт невозможен без цены иска."
      : `Предварительно: ${formatRubles(propertyFee ?? 0)} руб. по имущественному требованию${divorceFee ? ` + ${formatRubles(divorceFee)} руб. за требование о разводе; всего ${formatRubles((propertyFee ?? 0) + divorceFee)} руб.` : "."}`;
    if (claimPrice === null) issues.push({ field: "claimPrice", message: "Укажите положительную цену иска для расчёта госпошлины и подсудности." });
    notices.push("Цена иска рассчитана построчно по введённым объектам и требованиям. При явном несоответствии действительной стоимости цену иска определяет судья по статье 91 ГПК РФ.");
    const courtSelection = resolveCourtSelection(scenarioKey, values);
    jurisdiction = courtSelection.jurisdiction;
    issues.push(...courtSelection.issues);
    notices.push(...courtSelection.notices);
    courtSelection.reviewReasons.forEach(markLegalReview);
    values.courtName = courtHeading(values);
    filingInstruction = `Проверьте реквизиты выбранного суда по официальной ссылке ${value(values, "courtWebsite")}, направьте ответчику копию иска с отсутствующими у него приложениями и подайте комплект в этот суд.`;
    attachments.push(
      "Документ об уплате госпошлины или подтверждение льготы.",
      "Документы о заключении брака и, если брак уже расторгнут, о его расторжении.",
      "Документы о приобретении, регистрации и стоимости спорного имущества.",
      "Расчёт цены иска и компенсации.",
      "Подтверждение направления ответчику копии иска и отсутствующих у него приложений."
    );
    if (assetCalculation) attachments.push(...assetCalculation.supportingDocuments);
    additionalDocuments.push("Расчёт цены иска и компенсации.", "Перечень спорного имущества.", "Опись приложений.");
    supplementalDrafts.push(
      {
        title: "Расчёт цены иска и компенсации",
        text: `РАСЧЁТ ЦЕНЫ ИСКА И КОМПЕНСАЦИИ\n\nНазначение: обоснование цены иска и расчёта по статьям 91 и 132 ГПК РФ.\n\nСпорное имущество:\n${value(values, "assets")}\n\nЦена иска: ${value(values, "claimPrice")} руб.\n\nТребуемый раздел и компенсация:\n${value(values, "requestedDivision")}\n\nГосударственная пошлина: ${feeLabel}`
      },
      {
        title: "Перечень спорного имущества",
        text: `ПЕРЕЧЕНЬ СПОРНОГО ИМУЩЕСТВА\n\nНазначение: конкретизация обстоятельств и требований иска по статьям 131-132 ГПК РФ.\n\n${value(values, "assets")}\n\nИсточники средств и доказательства:\n${value(values, "fundingSource")}`
      },
      {
        title: "Опись приложений",
        text: `ОПИСЬ ПРИЛОЖЕНИЙ\n\nНазначение: проверка комплекта приложений по статье 132 ГПК РФ.\n\n1. Документ об уплате государственной пошлины либо документ о льготе.\n2. Документы о заключении и расторжении брака.\n3. Документы о приобретении, регистрации и стоимости имущества.\n4. Расчёт цены иска и компенсации.\n5. Подтверждение направления ответчику копии иска и приложений.\n6. Иные доказательства: ${value(values, "evidence")}.`
      }
    );
    if (values.assetOrigin === "unsure") {
      issues.push({ field: "assetOrigin", message: "Уточните основание приобретения имущества: от него зависит, относится ли объект к общему имуществу." });
    }
    if (["before-marriage", "gift", "inheritance"].includes(values.assetOrigin ?? "")) {
      markLegalReview("Заявлено имущество, которое может относиться к личному имуществу одного из супругов.");
      notices.push("Имущество, приобретённое до брака, полученное в дар или по наследству, по общему правилу является личным. Для включения его в раздел нужно отдельное подтверждённое основание.");
    }
    if (values.assetOrigin === "mixed-funds") {
      markLegalReview("Спорные личные вложения требуют оценки доказательств и не позволяют автоматически определить доли.");
      notices.push("Личные вложения и их влияние на режим имущества оцениваются по доказательствам; автоматическое определение долей невозможно.");
    }
    if (values.marriageContract === "unsure" || values.existingNotarialAgreement === "unsure") {
      issues.push({ field: "marriageContract", message: "Уточните наличие брачного договора и нотариального соглашения: они могут изменить режим имущества." });
    }
    if (values.marriageContract === "yes" || values.existingNotarialAgreement === "yes") {
      markLegalReview("Брачный договор или ранее заключенное нотариальное соглашение могут изменить режим имущества.");
      notices.push("Действующий брачный договор или нотариальное соглашение нужно проверить до формулирования требований о разделе.");
    }
    if (values.debtType === "unsure") {
      issues.push({ field: "debtType", message: "Уточните связь долгов с нуждами семьи: личные и общие обязательства учитываются по-разному." });
    }
    if (["common", "personal", "mixed"].includes(values.debtType ?? "")) {
      markLegalReview("Требования об учёте долга требуют проверки основания обязательства, использования средств и прав кредитора.");
      notices.push("Обязательство одного супруга не становится общим автоматически; нужно подтвердить основание и использование полученного в интересах семьи.");
    }
    const complexFields: Record<string, string> = {
      mortgage: "Ипотека или залог затрагивают права кредитора и состав участников дела.",
      maternityCapital: "Использование материнского капитала требует проверки прав детей и обязательств по выделению долей.",
      childrenShares: "Доли или имущество детей не подлежат разделу как общее имущество супругов.",
      thirdPartyRights: "Требования затрагивают права банка, кредитора или иного третьего лица.",
      bankruptcy: "Банкротство супруга может изменить порядок рассмотрения имущественного спора.",
      foreignProperty: "Иностранное имущество требует проверки применимого права, юрисдикции и исполнимости решения."
    };
    for (const [field, reason] of Object.entries(complexFields)) {
      if (values[field] === "yes" || values[field] === "unsure") markLegalReview(values[field] === "unsure" ? `Не удалось исключить обстоятельство: ${reason}` : reason);
    }
    if (!values.limitationCertain) {
      issues.push({ field: "limitationCertain", message: "Укажите, подтвержден ли момент, когда стало известно о нарушении права." });
    } else if (values.limitationCertain !== "yes") {
      markLegalReview("Момент начала течения срока исковой давности не подтвержден.");
      notices.push("Нельзя автоматически считать срок от даты развода. Для подачи нужно установить и подтвердить момент, когда стало известно о нарушении права.");
    }
    if (values.needSecurity === "yes") {
      additionalDocuments.push("Ходатайство об обеспечении иска.");
      notices.push(`За каждое заявление об обеспечении иска НК РФ предусматривает отдельную госпошлину ${formatRubles(DIVORCE_FEES.securityMotion)} руб.; она не включена в платёж по основному иску.`);
      supplementalDrafts.push({
        title: "Ходатайство об обеспечении иска",
        text: `${value(values, "courtName")}\n\nИстец: ${value(values, "plaintiffData")}\nОтветчик: ${value(values, "defendantData")}\n\nХОДАТАЙСТВО\nоб обеспечении иска\n\nВ производстве суда находится иск о разделе имущества. Спорное имущество: ${value(values, "assets")}.\n\nРиск, из-за которого исполнение решения может быть затруднено: ${value(values, "evidence")}.\n\nНа основании статей 139-140 ГПК РФ прошу применить соразмерную обеспечительную меру в отношении указанного спорного имущества.\n\nДата: ____________    Подпись: ____________`
      });
    } else if (values.needSecurity === "unsure") {
      issues.push({ field: "needSecurity", message: "Уточните наличие подтверждённого риска распоряжения имуществом." });
    }
    if (values.needEvidenceRequest === "yes") {
      additionalDocuments.push("Ходатайство об истребовании доказательств.");
      supplementalDrafts.push({
        title: "Ходатайство об истребовании доказательств",
        text: `${value(values, "courtName")}\n\nИстец: ${value(values, "plaintiffData")}\nОтветчик: ${value(values, "defendantData")}\n\nХОДАТАЙСТВО\nоб истребовании доказательств\n\nНеобходимые доказательства и место их нахождения: ${value(values, "evidence")}.\n\nЭти доказательства подтверждают состав, стоимость или правовой режим спорного имущества. Получить их самостоятельно затруднительно.\n\nНа основании статьи 57 ГПК РФ прошу истребовать указанные доказательства.\n\nДата: ____________    Подпись: ____________`
      });
    }
    if (values.needEvidenceRequest === "unsure") issues.push({ field: "needEvidenceRequest", message: "Уточните, можно ли получить необходимые доказательства самостоятельно." });
    if (values.combineDivorce === "unsure") issues.push({ field: "combineDivorce", message: "Уточните состав требований для расчёта пошлины и подсудности." });
    if (values.combineDivorce === "yes") {
      documentTitle = "Исковое заявление о расторжении брака и разделе общего имущества супругов";
      afterFiling = "Отслеживайте извещения и определения суда. После вступления решения в силу зарегистрируйте расторжение брака в ЗАГС и выполните регистрационные действия по разделённому имуществу.";
      markLegalReview("Объединение требований о разводе и разделе имущества требует проверки подсудности и состава участников.");
      if (!values.combinedCommonMinorChildren || values.combinedCommonMinorChildren === "unsure") {
        issues.push({ field: "combinedCommonMinorChildren", message: "Уточните наличие общих несовершеннолетних детей для требования о разводе." });
      }
      if (values.combinedCommonMinorChildren === "yes" && !values.combinedChildrenData?.trim()) {
        issues.push({ field: "combinedChildrenData", message: "Укажите сведения об общих несовершеннолетних детях." });
      }
      if (values.combinedChildDispute !== "no") {
        issues.push({ field: "combinedChildDispute", message: values.combinedChildDispute === "yes" ? "Спор о детях не включается в этот документ и требует отдельной проверки требований и подсудности." : "Уточните, есть ли спор о детях." });
      }
      if (!values.combinedConsentState) {
        issues.push({ field: "combinedConsentState", message: "Укажите позицию второго супруга по требованию о разводе." });
      }
      if (values.combinedCommonMinorChildren === "no" && values.combinedConsentState === "agrees") {
        issues.push({ field: "combinedConsentState", message: "При взаимном согласии и отсутствии общих несовершеннолетних детей развод оформляется через ЗАГС; автоматически объединять его с имущественным иском нельзя." });
      }
      if (!values.combinedPlaintiffRole) issues.push({ field: "combinedPlaintiffRole", message: "Укажите, кто заявляет требование о разводе." });
      if (!values.combinedPregnancyOrInfant || values.combinedPregnancyOrInfant === "unsure") {
        issues.push({ field: "combinedPregnancyOrInfant", message: "Уточните обстоятельства статьи 17 СК РФ." });
      }
      if (values.combinedPlaintiffRole === "husband"
        && ["pregnancy", "infant"].includes(values.combinedPregnancyOrInfant ?? "")
        && values.combinedWifeConsent !== "yes") {
        issues.push({ field: "combinedWifeConsent", message: "Муж не вправе без согласия жены возбуждать дело во время её беременности и в течение года после рождения ребёнка." });
      }
      if (values.combinedCommonMinorChildren === "yes") attachments.push("Документы о рождении общих несовершеннолетних детей.");
      notices.push("Суд вправе выделить требование о разделе имущества в отдельное производство, если раздел затрагивает интересы третьих лиц; совместное рассмотрение заранее не гарантируется.");
    }
    if (!values.hiddenOrSold) issues.push({ field: "hiddenOrSold", message: "Укажите, совершались ли сделки или сокрытие имущества." });
    if (values.hiddenOrSold === "unsure") markLegalReview("Не удалось исключить сокрытие или отчуждение имущества.");
    if (values.hiddenOrSold === "yes") {
      markLegalReview("Заявлено сокрытие, отчуждение или расходование спорного имущества.");
      notices.push("Стоимость проданного, скрытого или израсходованного имущества может учитываться только при доказанности применимых обстоятельств; приложите доказательства сделки и стоимости.");
    }
    const courtFee = resolveCourtFee(values, feeAmount, feeLabel);
    feeAmount = courtFee.amount;
    feeLabel = courtFee.label;
    if (courtFee.issue) issues.push({ field: "courtFeeRelief", message: courtFee.issue });
    if (courtFee.notice) notices.push(courtFee.notice);
    if (courtFee.requiresLegalReview) markLegalReview("Льгота или изменение срока либо размера госпошлины требуют проверки документов и решения суда.");
    draftText = buildPropertyClaim(values, jurisdiction, feeLabel);
  }

  const allowed = issues.length === 0;
  const officialFormOnly = scenarioKey === "registry-divorce";
  const filingReady = allowed && !requiresLegalReview && !officialFormOnly;
  const preparedDraft = allowed && draftText
    ? requiresLegalReview
      ? `ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ\nТребуется индивидуальная юридическая проверка.\n\n${draftText}`
      : draftText
    : "";

  return {
    allowed,
    issues,
    notices,
    documentTitle,
    formNumbers,
    feeAmount,
    feeLabel,
    jurisdiction,
    filingInstruction,
    copyInstruction,
    paymentInstruction,
    originalsInstruction,
    afterFiling,
    attachments: [...new Set(attachments)],
    additionalDocuments: [...new Set(additionalDocuments)],
    supplementalDrafts: issues.length === 0 ? supplementalDrafts : [],
    reviewReasons: [...new Set(reviewReasons)],
    requiresLegalReview,
    filingReady,
    officialFormOnly,
    draftText: preparedDraft
  };
}

function parseMoney(value: string | undefined) {
  if (!value?.trim()) return null;
  const parsed = Number(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function parsePropertyAssetRows(rawValue: string | undefined): PropertyAssetRow[] | null {
  if (!rawValue?.trim()) return null;
  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.map((item, index) => {
      const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return {
        id: textValue(row.id) || `asset-${index + 1}`,
        description: textValue(row.description),
        identifier: textValue(row.identifier),
        acquisitionBasis: textValue(row.acquisitionBasis),
        registeredOwner: textValue(row.registeredOwner),
        fullValue: textValue(row.fullValue),
        valuationSource: textValue(row.valuationSource),
        supportingDocuments: textValue(row.supportingDocuments),
        claimedSharePercent: textValue(row.claimedSharePercent),
        requestedResult: requestedResultValue(row.requestedResult),
        compensationDirection: compensationDirectionValue(row.compensationDirection),
        compensationAmount: textValue(row.compensationAmount)
      };
    });
  } catch {
    return null;
  }
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function requestedResultValue(value: unknown): PropertyAssetRow["requestedResult"] {
  return ["plaintiff", "defendant", "shared", "exclude"].includes(textValue(value))
    ? textValue(value) as PropertyAssetRow["requestedResult"]
    : "";
}

function compensationDirectionValue(value: unknown): PropertyAssetRow["compensationDirection"] {
  return ["none", "to-plaintiff", "from-plaintiff"].includes(textValue(value))
    ? textValue(value) as PropertyAssetRow["compensationDirection"]
    : "";
}

function buildAssetRequestLine(
  row: PropertyAssetRow,
  number: number,
  claimedPropertyValue: number,
  compensation: number
) {
  const object = `${row.description || "имущество не указано"} (${row.identifier || "идентификатор не указан"})`;
  const result = row.requestedResult === "plaintiff"
    ? `передать истцу следующее имущество: ${object}; стоимость требуемой доли: ${formatRubles(claimedPropertyValue)} руб.`
    : row.requestedResult === "shared"
      ? `определить за истцом долю ${row.claimedSharePercent || "0"}% в праве общей собственности на следующее имущество: ${object}; стоимость требуемой доли: ${formatRubles(claimedPropertyValue)} руб.`
      : row.requestedResult === "defendant"
        ? `передать ответчику следующее имущество: ${object}`
        : `исключить из состава общего имущества следующий объект: ${object}`;
  const compensationText = row.compensationDirection === "to-plaintiff"
    ? `; взыскать с ответчика в пользу истца компенсацию ${formatRubles(compensation)} руб.`
    : row.compensationDirection === "from-plaintiff"
      ? `; взыскать с истца в пользу ответчика компенсацию ${formatRubles(compensation)} руб.`
      : "";
  return `${number}. ${result}${compensationText}`;
}

function formatRubles(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value).replace(/\u00a0/g, " ");
}

function value(values: DivorcePropertyValues, key: string, fallback = "не указано") {
  return values[key]?.trim() || fallback;
}

function courtHeading(values: DivorcePropertyValues) {
  const address = values.courtAddress?.trim();
  const precinct = values.courtPrecinctNumber?.trim() ? `N ${values.courtPrecinctNumber.trim()} — ` : "";
  const name = `${precinct}${value(values, "courtName")}`;
  return address ? `${name}\nАдрес суда: ${address}` : name;
}

function consentStateLabel(state: string | undefined) {
  const labels: Record<string, string> = {
    agrees: "согласен на расторжение брака",
    objects: "не согласен на расторжение брака",
    evades: "уклоняется от оформления расторжения брака через ЗАГС",
    unknown: "неизвестна"
  };
  return labels[state ?? ""] ?? "не указана";
}

function buildDivorceClaim(values: DivorcePropertyValues, jurisdiction: string) {
  const children = values.commonMinorChildren === "yes"
    ? `Общие несовершеннолетние дети: ${value(values, "childrenData")}. Спор о детях в настоящем иске не заявляется.`
    : "Общих несовершеннолетних детей нет.";
  return `${value(values, "courtName")}\n\nИстец: ${value(values, "plaintiffData")}\nОтветчик: ${value(values, "defendantData")}\n\nИСКОВОЕ ЗАЯВЛЕНИЕ\nо расторжении брака\n\nБрак зарегистрирован: ${value(values, "marriageRecord")}.\nСемейные отношения и ведение общего хозяйства прекращены: ${value(values, "relationshipEnded")}.\n${children}\nПозиция ответчика: ${consentStateLabel(values.consentState)}.\n\nНа основании статей 21-23 Семейного кодекса РФ прошу расторгнуть брак между истцом и ответчиком.\n\nПодсудность: ${jurisdiction}\n\nПриложения:\n1. Документ об уплате государственной пошлины либо документ о льготе.\n2. Документ о заключении брака.\n3. Документы о рождении общих несовершеннолетних детей — при наличии.\n4. Подтверждение направления ответчику копии иска и приложений.\n5. Иные документы, подтверждающие указанные обстоятельства.\n\nДата: ____________    Подпись: ____________`;
}

function buildPropertyAgreement(values: DivorcePropertyValues) {
  return `ПРОЕКТ СОГЛАШЕНИЯ\nо разделе общего имущества супругов\n\nСторона 1: ${value(values, "spouse1Data")}\nСторона 2: ${value(values, "spouse2Data")}\nСведения о браке: ${value(values, "marriageData")}\n\n1. Состав имущества\n${value(values, "assets")}\n\n2. Распределение имущества\n${value(values, "allocation")}\n\n3. Денежная компенсация\n${value(values, "compensation", "Не предусмотрена")}\n\n4. Передача имущества и документов\n${value(values, "transferTerms")}\n\n5. Обязательства и права третьих лиц\n${value(values, "debts", "Сведения об обязательствах не указаны")}\n\nПроект необходимо передать нотариусу. Соглашение приобретает требуемую форму после нотариального удостоверения. Условия об обязательствах перед кредиторами применяются только с учётом закона и прав соответствующих кредиторов.\n\nПодписи сторон ставятся при нотариальном удостоверении.`;
}

function buildPropertyClaim(values: DivorcePropertyValues, jurisdiction: string, feeLabel: string) {
  const combined = values.combineDivorce === "yes";
  const heading = combined
    ? "о расторжении брака и разделе общего имущества супругов"
    : "о разделе общего имущества супругов";
  const divorceFacts = combined
    ? `\nТребование о расторжении брака\nОбщие несовершеннолетние дети: ${values.combinedCommonMinorChildren === "yes" ? value(values, "combinedChildrenData") : "отсутствуют"}.\nСпор о детях в настоящем иске не заявляется.\nПозиция ответчика по разводу: ${consentStateLabel(values.combinedConsentState)}.\n`
    : "";
  const legalBasis = combined ? "статей 21-23 и 34-39" : "статей 34-39";
  const requests = combined
    ? `1. Расторгнуть брак между истцом и ответчиком.\n2. ${value(values, "requestedDivision")}`
    : value(values, "requestedDivision");
  const childrenAttachment = combined && values.combinedCommonMinorChildren === "yes"
    ? "\n7. Документы о рождении общих несовершеннолетних детей."
    : "";

  return `${value(values, "courtName")}\n\nИстец: ${value(values, "plaintiffData")}\nОтветчик: ${value(values, "defendantData")}\nЦена иска: ${value(values, "claimPrice")} руб.\nГоспошлина: ${feeLabel}\n\nИСКОВОЕ ЗАЯВЛЕНИЕ\n${heading}\n\nСведения о браке и прекращении общего хозяйства:\n${value(values, "marriageData")}\n${divorceFacts}\nСпорное имущество:\n${value(values, "assets")}\n\nИсточники средств и правовой режим имущества:\n${value(values, "fundingSource")}\n\nНарушение права и момент, когда о нём стало известно:\n${value(values, "violationKnownAt")}\n\nНа основании ${legalBasis} Семейного кодекса РФ прошу:\n${requests}\n\nПодсудность: ${jurisdiction}\n\nПриложения:\n1. Документ об уплате государственной пошлины либо документ о льготе.\n2. Документы о заключении брака и, если брак уже расторгнут, о его расторжении.\n3. Документы о приобретении, регистрации и стоимости имущества.\n4. Расчёт цены иска и компенсации.\n5. Подтверждение направления ответчику копии иска и приложений.\n6. Иные доказательства, указанные истцом.${childrenAttachment}\n\nДата: ____________    Подпись: ____________`;
}
