import { findGuardianshipTerritory, TERRITORY_NOT_FOUND_ID } from "@/data/guardianship-territories";
import { RELATIVE_CHILD_CONTACT_SCENARIOS, type RelativeChildContactKey } from "@/data/relative-child-contact-route";
export type RelativeChildContactValues = Record<string, string | undefined>;
export type RelativeChildContactDecision = {
  outcomeKey: string; allowed: boolean; resultKind: "agreement" | "applicationDraft" | "courtDraft" | "checklist";
  resultLabel: string; documentTitle: string; filingReady: boolean; requiresLegalReview: boolean; pdfAvailable: boolean;
  issues: { field: string; message: string }[]; preparedData: { label: string; value: string }[]; evidence: string[]; nextSteps: string[]; notices: string[]; draftText: string;
};
const relationLabels: Record<string, string> = { grandparent: "бабушка или дедушка", sibling: "брат или сестра", other: "иной родственник", parent: "родитель" };

export function validateRelativeChildContact(key: RelativeChildContactKey, rawValues: RelativeChildContactValues): RelativeChildContactDecision {
  const scenario = RELATIVE_CHILD_CONTACT_SCENARIOS[key];
  const territory = findGuardianshipTerritory(rawValues.region, rawValues.municipality, rawValues.authorityName);
  const values = key === "guardianship" ? { ...rawValues, region: territory.region?.label, municipality: territory.municipality?.name, authorityName: territory.authority?.name } : rawValues;
  const issues = scenario.questions.filter((field) => !rawValues[field.name]?.trim()).map((field) => ({ field: field.name, message: `Ответьте на вопрос «${field.label}».` }));
  if (key === "guardianship" && (rawValues.municipality === TERRITORY_NOT_FOUND_ID || rawValues.authorityName === TERRITORY_NOT_FOUND_ID || !territory.authority)) issues.push({ field: "authorityName", message: "Подтверждённый орган опеки не выбран. Найдите адресата на официальном сайте региона." });
  if (key === "court" && rawValues.guardianshipOrder !== "yes") issues.push({ field: "guardianshipOrder", message: "Для этого судебного пути необходимо подтвердить решение органа опеки и его неисполнение." });
  const parentIntent = rawValues.relation === "parent";
  const emergency = rawValues.childSafety === "yes";
  const requiresLegalReview = rawValues.relation === "other" || key === "court" || key === "enforcement";
  const preparedData = scenario.questions.filter((field) => values[field.name]?.trim()).map((field) => ({ label: field.label, value: field.options?.find((option) => option.value === rawValues[field.name])?.label ?? values[field.name]!.trim() }));
  const notices = ["Результат не воспроизводит установленную государственную форму."];
  if (rawValues.relation === "other") notices.push("Применимость статьи 67 СК РФ к указанному родственнику необходимо проверить индивидуально.");
  if (parentIntent) notices.push("Для родителя применяется отдельный маршрут по статье 66 СК РФ.");
  if (emergency) notices.push("Подготовка документа не должна задерживать защиту ребёнка.");
  const blocked = issues.length > 0 || parentIntent || emergency;
  const kind = key === "agreement" ? "agreement" : key === "guardianship" ? "applicationDraft" : key === "court" ? "courtDraft" : "checklist";
  const title = key === "agreement" ? "Проект договорённости об общении родственника с ребёнком" : key === "guardianship" ? "Обращение об устранении препятствий к общению с ребёнком" : key === "court" ? "ЧЕРНОВИК — требование об устранении препятствий к общению с ребёнком" : "Чек-лист исполнения решения об общении с ребёнком";
  return {
    outcomeKey: parentIntent ? "parent-neighbor-route" : emergency ? "urgent-child-safety" : issues.length ? `${key}-missing-data` : `${key}-${rawValues.relation}`,
    allowed: !blocked, resultKind: kind, resultLabel: parentIntent ? "Используйте маршрут для родителей" : emergency ? "Сначала защитите ребёнка" : requiresLegalReview ? "Черновик — требуется юридическая проверка" : "Материал подготовлен",
    documentTitle: title, filingReady: key === "guardianship" && !blocked && !requiresLegalReview, requiresLegalReview, pdfAvailable: !blocked,
    issues, preparedData, evidence: scenario.evidence, nextSteps: emergency ? ["Если угроза существует сейчас, позвоните 112.", "Сообщите органу опеки по месту фактического нахождения ребёнка."] : scenario.nextSteps,
    notices, draftText: blocked ? "" : buildDraft(key, values, title)
  };
}

function buildDraft(key: RelativeChildContactKey, values: RelativeChildContactValues, title: string) {
  const relation = relationLabels[values.relation ?? ""] ?? "родственник";
  if (key === "agreement") return `${title}\n\nСтороны согласовали общение ${relation} с ребёнком ${values.childData}.\n\nПрежнее общение: ${values.contactHistory}\nПредлагаемый порядок: ${values.desiredContact}\nМнение ребёнка: ${values.childOpinion}\n\nДоговорённость применяется добровольно и с учётом интересов ребёнка.\n\nПодписи: ____________`;
  if (key === "guardianship") return `В ${values.authorityName}\n\nОт: ${values.applicantData}\n\n${title.toUpperCase()}\n\nЯ являюсь ${relation} ребёнка ${values.childData}. Общение ранее происходило следующим образом: ${values.contactHistory}.\n\nПрепятствия: ${values.obstacles}\nПопытки договориться: ${values.attempts}\nПредлагаемый порядок: ${values.desiredContact}\nМнение ребёнка: ${values.childOpinion}\n\nПрошу рассмотреть вопрос в порядке статьи 67 СК РФ и выдать письменное решение.\n\nДата: ____________ Подпись: ____________`;
  if (key === "court") return `${title}\n\nЗаявитель: ${values.applicantData}\nРебёнок: ${values.childData}\nРешение органа опеки: ${values.orderDetails}\nНеисполнение: ${values.nonCompliance}\nПредлагаемый порядок: ${values.desiredContact}\n\nТребования, подсудность, участники и приложения подлежат обязательной юридической проверке.`;
  return `${title}\n\nЗаявитель: ${values.applicantData}\nРебёнок: ${values.childData}\nСудебное решение: ${values.courtDecision}\nИсполнительный лист: ${values.writ}\nСтатус производства: ${values.enforcementStatus}\n\nМатериал предназначен для проверки следующего исполнительного действия.`;
}
