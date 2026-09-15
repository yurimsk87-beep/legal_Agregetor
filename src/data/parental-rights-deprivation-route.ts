import { RUSSIAN_REGIONS } from "@/data/guardianship-territories";

export const PARENTAL_RIGHTS_DEPRIVATION_ROUTE = {
  categorySlug: "semya-i-deti",
  problemSlug: "lishenie-roditelskih-prav"
} as const;

export const PARENTAL_RIGHTS_DEPRIVATION_SCENARIO_KEYS = ["grounds", "court", "existing", "support"] as const;
export type ParentalRightsDeprivationScenarioKey = (typeof PARENTAL_RIGHTS_DEPRIVATION_SCENARIO_KEYS)[number];

export type ParentalRightsDeprivationField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "select" | "searchable";
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  hint?: string;
};

export type ParentalRightsDeprivationScenario = {
  key: ParentalRightsDeprivationScenarioKey;
  title: string;
  choiceDescription: string;
  description: string[];
  steps: string[];
  documents: string[];
  mainDocument: string;
  documentSlug: string;
  filing: string;
  term: string;
  fee: string;
  warning: string;
  helperFields: ParentalRightsDeprivationField[];
};

const yesNoUnsure = [
  { label: "Да", value: "yes" },
  { label: "Нет", value: "no" },
  { label: "Не уверен", value: "unsure" }
];

const safetyFields: ParentalRightsDeprivationField[] = [
  { name: "immediateDanger", label: "Сейчас есть непосредственная угроза жизни или здоровью ребёнка?", type: "select", required: true, options: yesNoUnsure },
  { name: "targetRecordedParent", label: "Лицо записано матерью или отцом в записи о рождении?", type: "select", required: true, options: yesNoUnsure },
  { name: "childStatus", label: "Каков текущий статус ребёнка?", type: "select", required: true, options: [
    { label: "Не достиг 18 лет и не приобрёл полную дееспособность", value: "minor" },
    { label: "Достиг 18 лет", value: "adult" },
    { label: "Приобрёл полную дееспособность до 18 лет", value: "fully-capable" },
    { label: "Не уверен", value: "unsure" }
  ] },
  { name: "applicantRole", label: "Кто планирует обратиться?", type: "select", required: true, options: [
    { label: "Другой родитель", value: "parent" },
    { label: "Опекун, попечитель, приёмный родитель или иной заменяющий родителя", value: "substitute" },
    { label: "Прокурор", value: "prosecutor" },
    { label: "Орган или организация по защите прав детей", value: "authority" },
    { label: "Сам ребёнок от 14 лет", value: "child-14" },
    { label: "Совершеннолетний, пострадавший от преступления родителя до 18 лет", value: "adult-victim" },
    { label: "Другой родственник или иное лицо", value: "other" }
  ] },
  { name: "ground", label: "Какое основание предполагается?", type: "select", required: true, options: [
    { label: "Уклонение от обязанностей родителя, включая злостное уклонение от алиментов", value: "duties" },
    { label: "Отказ без уважительных причин забрать ребёнка из организации", value: "refusal" },
    { label: "Злоупотребление родительскими правами", value: "abuse" },
    { label: "Жестокое обращение с ребёнком", value: "cruelty" },
    { label: "Хронический алкоголизм или наркомания", value: "addiction" },
    { label: "Умышленное преступление, указанное в статье 69 СК РФ", value: "intentional-crime" },
    { label: "Тяжёлые обстоятельства или заболевание, не зависящие от родителя", value: "objective" },
    { label: "Только конфликт между взрослыми", value: "conflict" },
    { label: "Основание пока неясно", value: "unclear" }
  ] },
  { name: "facts", label: "Факты, даты и действия родителя", type: "textarea", required: true },
  { name: "evidence", label: "Какие подтверждающие документы и сведения имеются?", type: "textarea" }
];

const courtFields: ParentalRightsDeprivationField[] = [
  { name: "courtRegion", label: "Регион суда", type: "searchable", required: true, options: RUSSIAN_REGIONS.map(({ id, label }) => ({ value: id, label })) },
  { name: "courtName", label: "Полное наименование районного или городского суда", type: "textarea", required: true, hint: "Перенесите точное наименование с официальной страницы суда." },
  { name: "courtSource", label: "Ссылка на официальную страницу суда", type: "text", required: true },
  { name: "courtConfirmed", label: "Вы проверили наименование и территориальную подсудность на официальном ресурсе?", type: "select", required: true, options: yesNoUnsure }
];

const peopleFields: ParentalRightsDeprivationField[] = [
  { name: "applicantData", label: "ФИО, адрес и контакты заявителя", type: "textarea", required: true },
  { name: "respondentData", label: "ФИО, дата и место рождения, известный адрес родителя-ответчика", type: "textarea", required: true },
  { name: "childData", label: "ФИО, дата рождения и место проживания ребёнка", type: "textarea", required: true }
];

export const PARENTAL_RIGHTS_DEPRIVATION_SCENARIOS: Record<ParentalRightsDeprivationScenarioKey, ParentalRightsDeprivationScenario> = {
  grounds: {
    key: "grounds",
    title: "Проверить предполагаемое основание",
    choiceDescription: "Сопоставить ситуацию с закрытым перечнем статьи 69 СК РФ без обещания результата суда.",
    description: ["Лишение родительских прав является крайней мерой и возможно только по основаниям, прямо перечисленным законом.", "Обычный конфликт, редкое общение или тяжёлые обстоятельства сами по себе нельзя автоматически считать основанием."],
    steps: ["Сначала исключите непосредственную угрозу ребёнку.", "Определите статус ребёнка и заявителя.", "Выберите только подтверждаемое предполагаемое основание.", "Соберите относящиеся к нему доказательства.", "Перед судебным обращением получите юридическую проверку."],
    documents: ["Запись акта о рождении или свидетельство о рождении.", "Документы об обстоятельствах выбранного основания.", "Ранее принятые судебные акты и материалы органов, если они есть."],
    mainDocument: "Персональный чек-лист проверки основания",
    documentSlug: "proverka-osnovaniy-lisheniya-roditelskih-prav",
    filing: "Чек-лист не подаётся. При подтверждаемом основании дальнейший путь связан с районным судом и обязательной юридической проверкой.",
    term: "Срок результата суда помощник не прогнозирует.",
    fee: "Размер платежа и наличие льготы проверяются применительно к заявителю и составу требований до подачи.",
    warning: "Сервис не устанавливает виновность родителя и не рекомендует лишение прав только из-за семейного конфликта.",
    helperFields: safetyFields
  },
  court: {
    key: "court",
    title: "Подготовиться к обращению в суд",
    choiceDescription: "Собрать сведения для маркированного судебного черновика, который нельзя подавать без проверки.",
    description: ["Лишение родительских прав производится только судом.", "В деле участвуют прокурор и орган опеки; суд оценивает доказательства, интересы ребёнка и возможность иной защиты."],
    steps: ["Проверьте право заявителя на обращение.", "Определите предполагаемое основание статьи 69 СК РФ.", "Соберите доказательства отдельно по каждому ребёнку.", "Подтвердите районный суд на официальном ресурсе.", "Проверьте судебный черновик у юриста."],
    documents: ["Документы о рождении ребёнка.", "Доказательства конкретного основания.", "Документы о месте проживания сторон.", "Решения, акты обследования и ответы органов, если имеются."],
    mainDocument: "Черновик иска о лишении родительских прав",
    documentSlug: "isk-o-lishenii-roditelskih-prav",
    filing: "В районный или городской суд. Территориальная подсудность и возможность подачи по месту истца проверяются отдельно.",
    term: "Срок рассмотрения зависит от движения конкретного дела; дата результата не обещается.",
    fee: "Платёж и льгота не определяются без проверки заявителя и всех объединённых требований.",
    warning: "Любой судебный документ этого маршрута имеет статус «черновик» и требует юридической проверки.",
    helperFields: [...safetyFields, ...peopleFields, ...courtFields]
  },
  existing: {
    key: "existing",
    title: "Учесть прежнее решение или материалы",
    choiceDescription: "Проверить значение ранее принятого судебного акта или материалов органа для нового требования.",
    description: ["Предыдущее решение не заменяет самостоятельную проверку основания лишения прав.", "Иностранный акт, отменённый акт или не вступившее в силу решение требуют отдельного процессуального анализа."],
    steps: ["Укажите вид и статус прежнего акта.", "Определите, какие обстоятельства им уже установлены.", "Проверьте актуальное основание статьи 69 СК РФ.", "Подтвердите компетентный районный суд.", "Не подавайте черновик без юридической проверки преюдициальности и приложений."],
    documents: ["Полный текст судебного акта с отметкой о вступлении в силу.", "Материалы органа опеки, прокуратуры, полиции или ФССП.", "Документы о новых обстоятельствах."],
    mainDocument: "Чек-лист учёта решений и судебный черновик",
    documentSlug: "uchet-resheniy-pri-lishenii-roditelskih-prav",
    filing: "После проверки значения прежнего акта — в надлежащий районный или городской суд.",
    term: "Единый срок не указывается: он зависит от вида прежнего акта и нового требования.",
    fee: "Расходы проверяются после определения процессуального пути.",
    warning: "Само наличие решения об алиментах, общении или месте жительства ребёнка не доказывает основание лишения прав.",
    helperFields: [...safetyFields, { name: "existingDecisionKind", label: "Какой акт или материал уже имеется?", type: "select", required: true, options: [
      { label: "Решение об ограничении родительских прав", value: "restriction" },
      { label: "Приговор или постановление по уголовному делу", value: "criminal" },
      { label: "Решение или приказ об алиментах", value: "support" },
      { label: "Решение по спору о ребёнке", value: "child-dispute" },
      { label: "Иностранный судебный акт", value: "foreign" },
      { label: "Материалы органа без судебного решения", value: "authority" },
      { label: "Иное или не уверен", value: "unsure" }
    ] }, { name: "decisionInForce", label: "Судебный акт вступил в законную силу?", type: "select", required: true, options: yesNoUnsure }, { name: "existingDecisionDetails", label: "Реквизиты, содержание и статус акта или материалов", type: "textarea", required: true }, ...peopleFields, ...courtFields]
  },
  support: {
    key: "support",
    title: "Учесть содержание ребёнка",
    choiceDescription: "Отразить действующие алименты или вопрос их взыскания в безопасном судебном черновике.",
    description: ["Лишение родительских прав не прекращает обязанность содержать ребёнка.", "Суд при рассмотрении дела решает вопрос о взыскании алиментов, но действующий исполнительный документ и получателя нужно проверить."],
    steps: ["Проверьте, установлены ли алименты ранее.", "Укажите получателя и реквизиты действующего документа.", "Не дублируйте уже разрешённое требование без проверки.", "Подтвердите суд и состав участников.", "Проверьте черновик и алиментную часть у юриста."],
    documents: ["Соглашение, приказ, исполнительный лист или решение об алиментах, если есть.", "Сведения о получателе содержания ребёнка.", "Документы о ребёнке и предполагаемом основании лишения прав."],
    mainDocument: "Черновик иска с разделом о содержании ребёнка",
    documentSlug: "lishenie-roditelskih-prav-i-alimenty",
    filing: "В районный или городской суд после проверки подсудности и действующего алиментного документа.",
    term: "Срок конкретного дела помощник не прогнозирует.",
    fee: "Льготы и платёж проверяются отдельно по каждому требованию и статусу заявителя.",
    warning: "Помощник не рассчитывает размер алиментов и не отменяет ранее выданный исполнительный документ.",
    helperFields: [...safetyFields, { name: "existingSupport", label: "Алименты уже установлены соглашением или судебным актом?", type: "select", required: true, options: yesNoUnsure }, { name: "supportDetails", label: "Реквизиты действующего документа либо обстоятельства нового требования", type: "textarea", required: true }, { name: "supportRecipient", label: "Кому фактически передан ребёнок и кто должен получать содержание?", type: "textarea", required: true }, ...peopleFields, ...courtFields]
  }
};

export const PARENTAL_RIGHTS_DEPRIVATION_SCENARIO_CHOICES = PARENTAL_RIGHTS_DEPRIVATION_SCENARIO_KEYS.map((key) => ({
  key,
  title: PARENTAL_RIGHTS_DEPRIVATION_SCENARIOS[key].title,
  description: PARENTAL_RIGHTS_DEPRIVATION_SCENARIOS[key].choiceDescription
}));

export function getParentalRightsDeprivationScenario(value: string | undefined) {
  return PARENTAL_RIGHTS_DEPRIVATION_SCENARIO_KEYS.includes(value as ParentalRightsDeprivationScenarioKey)
    ? PARENTAL_RIGHTS_DEPRIVATION_SCENARIOS[value as ParentalRightsDeprivationScenarioKey]
    : null;
}

export function getParentalRightsDeprivationScenarioByDocumentSlug(slug: string) {
  return Object.values(PARENTAL_RIGHTS_DEPRIVATION_SCENARIOS).find((scenario) => scenario.documentSlug === slug) ?? null;
}
