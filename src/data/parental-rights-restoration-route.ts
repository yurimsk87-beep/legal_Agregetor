import { RUSSIAN_REGIONS } from "@/data/guardianship-territories";

export const PARENTAL_RIGHTS_RESTORATION_ROUTE = {
  categorySlug: "semya-i-deti",
  problemSlug: "vosstanovlenie-v-roditelskih-pravah"
} as const;

export const PARENTAL_RIGHTS_RESTORATION_SCENARIO_KEYS = ["restoration", "restoration-return", "barrier-review"] as const;
export type ParentalRightsRestorationScenarioKey = (typeof PARENTAL_RIGHTS_RESTORATION_SCENARIO_KEYS)[number];
export type ParentalRightsRestorationField = { name: string; label: string; type?: "text" | "textarea" | "select" | "searchable"; required?: boolean; options?: Array<{ label: string; value: string }>; hint?: string };
export type ParentalRightsRestorationScenario = { key: ParentalRightsRestorationScenarioKey; title: string; choiceDescription: string; description: string[]; steps: string[]; documents: string[]; mainDocument: string; documentSlug: string; filing: string; term: string; fee: string; warning: string; helperFields: ParentalRightsRestorationField[] };

const yesNoUnsure = [{ label: "Да", value: "yes" }, { label: "Нет", value: "no" }, { label: "Не уверен", value: "unsure" }];
const statusFields: ParentalRightsRestorationField[] = [
  { name: "deprivationDecision", label: "Есть вступившее в законную силу решение суда о лишении вас родительских прав?", type: "select", required: true, options: yesNoUnsure },
  { name: "decisionDetails", label: "Суд, дата, номер дела и содержание решения о лишении", type: "textarea", required: true },
  { name: "circumstancesChanged", label: "Изменились поведение, образ жизни и/или отношение к воспитанию ребёнка?", type: "select", required: true, options: yesNoUnsure },
  { name: "changeEvidence", label: "Какие изменения произошли и чем они подтверждаются?", type: "textarea", required: true },
  { name: "currentRisks", label: "Сохраняются обстоятельства, способные угрожать интересам ребёнка?", type: "select", required: true, options: yesNoUnsure },
  { name: "childAge", label: "Возраст и статус ребёнка", type: "select", required: true, options: [{ label: "До 10 лет", value: "under-10" }, { label: "От 10 до 17 лет", value: "10-17" }, { label: "18 лет или старше", value: "adult" }, { label: "Не уверен", value: "unsure" }] },
  { name: "childConsent", label: "Ребёнок согласен на восстановление родительских прав?", type: "select", required: true, options: yesNoUnsure },
  { name: "childAdopted", label: "Ребёнок усыновлён другим лицом?", type: "select", required: true, options: yesNoUnsure },
  { name: "adoptionCancelled", label: "Усыновление отменено вступившим в силу решением суда?", type: "select", required: true, options: yesNoUnsure }
];
const partyFields: ParentalRightsRestorationField[] = [
  { name: "applicantData", label: "ФИО, дата и место рождения, адрес и идентификатор заявителя", type: "textarea", required: true },
  { name: "caregiverData", label: "Лицо или организация, на попечении которых находится ребёнок", type: "textarea", required: true },
  { name: "childData", label: "ФИО, дата рождения и текущее место проживания ребёнка", type: "textarea", required: true }
];
const courtFields: ParentalRightsRestorationField[] = [
  { name: "courtRegion", label: "Регион суда", type: "searchable", required: true, options: RUSSIAN_REGIONS.map(({ id, label }) => ({ value: id, label })) },
  { name: "courtName", label: "Полное наименование районного или городского суда", type: "textarea", required: true, hint: "Перенесите точное наименование с официальной страницы суда." },
  { name: "courtSource", label: "Ссылка на официальную страницу суда", type: "text", required: true },
  { name: "courtConfirmed", label: "Наименование и подсудность проверены на официальном ресурсе?", type: "select", required: true, options: yesNoUnsure }
];

export const PARENTAL_RIGHTS_RESTORATION_SCENARIOS: Record<ParentalRightsRestorationScenarioKey, ParentalRightsRestorationScenario> = {
  restoration: { key: "restoration", title: "Восстановить родительские права", choiceDescription: "Проверить решение о лишении, изменения обстоятельств, статус ребёнка и обязательные препятствия.", description: ["Восстановление производится только судом по иску родителя, ранее лишённого родительских прав.", "Суд оценивает изменения поведения и образа жизни, отношение к воспитанию и интересы ребёнка."], steps: ["Проверьте решение о лишении.", "Зафиксируйте подтверждаемые изменения.", "Проверьте возраст, согласие и статус усыновления.", "Подтвердите суд на официальном ресурсе.", "Перед подачей проверьте черновик у юриста."], documents: ["Решение о лишении родительских прав.", "Документы об изменении обстоятельств.", "Документы о ребёнке и его текущем устройстве.", "Иные относимые доказательства."], mainDocument: "Черновик иска о восстановлении в родительских правах", documentSlug: "isk-o-vosstanovlenii-v-roditelskih-pravah", filing: "В районный или городской суд после проверки ответчика и территориальной подсудности.", term: "Срок и результат конкретного дела не прогнозируются.", fee: "Пошлина и возможная льгота проверяются перед подачей по актуальной редакции НК РФ.", warning: "Только маркированный судебный черновик. Он не готов к подаче и всегда требует юридической проверки.", helperFields: [...statusFields, ...partyFields, ...courtFields] },
  "restoration-return": { key: "restoration-return", title: "Восстановить права и просить вернуть ребёнка", choiceDescription: "Отдельно проверить требование о возврате ребёнка и его соответствие интересам ребёнка.", description: ["Требование о возврате ребёнка может быть рассмотрено одновременно с восстановлением родительских прав.", "Даже при восстановлении суд вправе отказать в возврате, если он не отвечает интересам ребёнка."], steps: ["Пройдите проверку условий восстановления.", "Опишите текущее устройство ребёнка.", "Обоснуйте отдельное требование о возврате.", "Подтвердите суд и участников.", "Проверьте весь черновик у юриста."], documents: ["Документы для восстановления прав.", "Документы о текущем устройстве ребёнка.", "Доказательства условий для проживания и воспитания ребёнка.", "Заключения и материалы органа опеки при наличии."], mainDocument: "Черновик иска о восстановлении прав и возврате ребёнка", documentSlug: "vosstanovlenie-roditelskih-prav-i-vozvrat-rebenka", filing: "В районный или городской суд после проверки ответчика, подсудности и отдельного требования о возврате.", term: "Срок и результат конкретного дела не прогнозируются.", fee: "Пошлина определяется после проверки состава требований и статуса заявителя.", warning: "Возврат ребёнка не является автоматическим последствием восстановления прав.", helperFields: [...statusFields, ...partyFields, { name: "returnBasis", label: "Почему возврат ребёнка сейчас отвечает его интересам?", type: "textarea", required: true }, { name: "livingConditions", label: "Какие условия проживания, ухода и воспитания обеспечены?", type: "textarea", required: true }, ...courtFields] },
  "barrier-review": { key: "barrier-review", title: "Проверить препятствие до обращения", choiceDescription: "Проверить усыновление, несогласие ребёнка 10+ или отсутствие подтверждённых изменений.", description: ["Некоторые обстоятельства прямо исключают удовлетворение требования, другие требуют индивидуальной оценки до подготовки иска.", "Помощник не создаёт судебный черновик, пока критическое условие не подтверждено."], steps: ["Укажите действующее решение о лишении.", "Проверьте статус усыновления.", "Проверьте мнение ребёнка с 10 лет.", "Соберите подтверждения изменений.", "Получите юридическую оценку препятствия."], documents: ["Решение о лишении прав.", "Документы об усыновлении или его отмене при наличии.", "Сведения о позиции ребёнка.", "Документы об изменившихся обстоятельствах."], mainDocument: "Лист проверки препятствий к восстановлению", documentSlug: "proverka-prepyatstviy-k-vosstanovleniyu-roditelskih-prav", filing: "Лист не подаётся. При устранении или отсутствии препятствия используется судебный маршрут.", term: "Срок не определяется до правовой оценки препятствия.", fee: "Расходы не определяются до выбора процессуального пути.", warning: "Результат имеет статус legalReviewOnly и не является иском.", helperFields: statusFields }
};

export const PARENTAL_RIGHTS_RESTORATION_SCENARIO_CHOICES = PARENTAL_RIGHTS_RESTORATION_SCENARIO_KEYS.map((key) => ({ key, title: PARENTAL_RIGHTS_RESTORATION_SCENARIOS[key].title, description: PARENTAL_RIGHTS_RESTORATION_SCENARIOS[key].choiceDescription }));
export function getParentalRightsRestorationScenario(value?: string | null) { return PARENTAL_RIGHTS_RESTORATION_SCENARIO_KEYS.includes(value as ParentalRightsRestorationScenarioKey) ? PARENTAL_RIGHTS_RESTORATION_SCENARIOS[value as ParentalRightsRestorationScenarioKey] : null; }
export function getParentalRightsRestorationScenarioByDocumentSlug(slug: string) { return Object.values(PARENTAL_RIGHTS_RESTORATION_SCENARIOS).find((scenario) => scenario.documentSlug === slug) ?? null; }
