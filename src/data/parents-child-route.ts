export const PARENTS_CHILD_ROUTE = {
  categorySlug: "semya-i-deti",
  problemSlug: "roditeli-i-rebenok-posle-razvoda"
} as const;

export const PARENTS_CHILD_SCENARIO_KEYS = ["residence", "communication", "change", "enforcement"] as const;
export type ParentsChildScenarioKey = (typeof PARENTS_CHILD_SCENARIO_KEYS)[number];

export type ParentsChildField = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select";
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  hint?: string;
};

export type ParentsChildScenario = {
  key: ParentsChildScenarioKey;
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
  helperFields: ParentsChildField[];
};

const yesNoUnsure = [
  { label: "Да", value: "yes" },
  { label: "Нет", value: "no" },
  { label: "Не уверен", value: "unsure" }
];

const safetyFields: ParentsChildField[] = [
  { name: "immediateThreat", label: "Есть непосредственная угроза жизни или здоровью ребёнка прямо сейчас?", type: "select", required: true, options: yesNoUnsure },
  { name: "complexRisk", label: "Есть насилие, жестокое обращение, зависимость, опасное поведение, удержание или риск похищения ребёнка?", type: "select", required: true, options: yesNoUnsure },
  { name: "international", label: "Ребёнок или второй родитель находятся за пределами России либо спор связан с другим государством?", type: "select", required: true, options: yesNoUnsure }
];

const partiesFields: ParentsChildField[] = [
  { name: "applicantData", label: "ФИО, дата рождения, адрес и контакты заявителя", type: "textarea", required: true },
  { name: "otherParentData", label: "ФИО и известный адрес второго родителя", type: "textarea", required: true },
  { name: "childAge", label: "Возраст ребёнка", type: "number", required: true },
  { name: "childrenCount", label: "Сколько детей затрагивает договорённость или спор?", type: "number", required: true },
  { name: "parentsStatus", label: "Каков текущий статус отношений родителей?", type: "select", required: true, options: [{ label: "Брак расторгнут", value: "divorced" }, { label: "Развод рассматривается или оформляется", value: "divorce-pending" }, { label: "Родители не состояли в браке", value: "not-married" }, { label: "Иное или не уверен", value: "unsure" }] },
  { name: "childData", label: "ФИО, дата рождения и текущее место проживания ребёнка", type: "textarea", required: true },
  { name: "childOpinion", label: "Что известно о мнении ребёнка?", type: "textarea", hint: "Не формулируйте мнение за ребёнка. Если оно не выяснялось, так и укажите." }
];

const courtFields: ParentsChildField[] = [
  { name: "courtRegion", label: "Регион для поиска суда", required: true, hint: "Используется только как параметр ручного поиска." },
  { name: "defendantAddress", label: "Адрес места жительства ответчика", type: "textarea", required: true },
  { name: "courtName", label: "Полное наименование районного или городского суда", type: "textarea", required: true },
  { name: "courtSource", label: "Ссылка на официальную страницу суда", type: "text", required: true },
  { name: "courtConfirmed", label: "Вы проверили суд на официальном ресурсе ГАС «Правосудие»?", type: "select", required: true, options: yesNoUnsure }
];

export const PARENTS_CHILD_SCENARIOS: Record<ParentsChildScenarioKey, ParentsChildScenario> = {
  residence: {
    key: "residence",
    title: "Определить, с кем будет жить ребёнок",
    choiceDescription: "Зафиксировать договорённость родителей или подготовить безопасный черновик для суда.",
    description: [
      "При раздельном проживании родителей место жительства ребёнка может быть определено соглашением родителей.",
      "Если соглашения нет, спор разрешает суд исходя из интересов ребёнка и с учётом его мнения. Сервис не прогнозирует решение суда."
    ],
    steps: ["Укажите, есть ли согласие родителей.", "Опишите сведения о ребёнке и родителях.", "Зафиксируйте договорённость либо обстоятельства спора.", "Для суда отдельно проверьте подсудность и адресата.", "Скачайте маркированный результат и проверьте его перед использованием."],
    documents: ["Сведения о рождении ребёнка.", "Сведения о месте проживания и условиях ребёнка.", "Документы, подтверждающие обстоятельства, на которые ссылается заявитель."],
    mainDocument: "Соглашение родителей или черновик иска о месте жительства ребёнка",
    documentSlug: "mesto-zhitelstva-rebenka-posle-razvoda",
    filing: "Соглашение подписывают родители. Спор рассматривает районный или городской суд; конкретный суд необходимо подтвердить по официальному источнику.",
    term: "Срок судебного рассмотрения и дата вступления решения в силу зависят от движения конкретного дела; помощник их не прогнозирует.",
    fee: "Платёж по судебному требованию необходимо проверить по действующей редакции НК РФ и реквизитам выбранного суда перед подачей.",
    warning: "Ни пол родителя, ни более высокий доход сами по себе не определяют исход спора.",
    helperFields: [...safetyFields, { name: "existingOrder", label: "Этот вопрос уже урегулирован судебным актом?", type: "select", required: true, options: yesNoUnsure }, { name: "existingOrderNeed", label: "Что требуется сделать с существующим порядком?", type: "select", required: true, options: [{ label: "Изменить порядок", value: "change" }, { label: "Добиться исполнения", value: "enforcement" }, { label: "Понять, что делать дальше", value: "unsure" }] }, { name: "agreement", label: "Родители согласны, с кем будет жить ребёнок?", type: "select", required: true, options: yesNoUnsure }, ...partiesFields, { name: "currentCircumstances", label: "Фактические обстоятельства проживания и ухода за ребёнком", type: "textarea", required: true }, { name: "requestedResidence", label: "Какую договорённость или требование нужно зафиксировать?", type: "textarea", required: true }, { name: "evidence", label: "Какие подтверждающие документы имеются?", type: "textarea" }, ...courtFields]
  },
  communication: {
    key: "communication",
    title: "Определить порядок общения с ребёнком",
    choiceDescription: "Составить письменное соглашение родителей или черновик требований для суда.",
    description: [
      "Отдельно проживающий родитель имеет право общаться с ребёнком и участвовать в его воспитании, если это не противоречит интересам ребёнка.",
      "Родители могут письменно согласовать порядок общения. При споре конкретный порядок устанавливает суд."
    ],
    steps: ["Проверьте наличие согласия и рисков для ребёнка.", "Опишите фактический и желаемый порядок общения.", "Укажите данные родителей и ребёнка.", "При споре подтвердите районный суд по официальному источнику.", "Проверьте итоговый документ до подписания или подачи."],
    documents: ["Сведения о рождении ребёнка.", "Предлагаемый график общения.", "Документы о препятствиях и значимых обстоятельствах, если есть спор."],
    mainDocument: "Соглашение о порядке общения или черновик иска",
    documentSlug: "poryadok-obshcheniya-s-rebenkom",
    filing: "Соглашение подписывают родители. Спор рассматривает районный или городской суд с участием органа опеки.",
    term: "Сроки исполнения соглашения задают родители. Срок судебного дела помощник не прогнозирует.",
    fee: "Перед судебной подачей проверьте действующий размер пошлины и реквизиты на официальной странице суда.",
    warning: "Помощник не определяет за семью безопасный график и не формулирует мнение ребёнка.",
    helperFields: [...safetyFields, { name: "existingOrder", label: "Порядок общения уже установлен судебным актом?", type: "select", required: true, options: yesNoUnsure }, { name: "existingOrderNeed", label: "Что требуется сделать с существующим порядком?", type: "select", required: true, options: [{ label: "Изменить порядок", value: "change" }, { label: "Добиться исполнения", value: "enforcement" }, { label: "Понять, что делать дальше", value: "unsure" }] }, { name: "agreement", label: "Родители согласовали порядок общения?", type: "select", required: true, options: yesNoUnsure }, ...partiesFields, { name: "currentOrder", label: "Как общение происходит сейчас?", type: "textarea", required: true }, { name: "requestedOrder", label: "Какой порядок предлагают установить?", type: "textarea", required: true }, { name: "evidence", label: "Какие обстоятельства и документы подтверждают позицию?", type: "textarea" }, ...courtFields]
  },
  change: {
    key: "change",
    title: "Изменить существующий порядок",
    choiceDescription: "Отделить изменение соглашения родителей от изменения порядка, установленного судом.",
    description: [
      "Сначала нужно определить, чем установлен действующий порядок: соглашением родителей или судебным актом.",
      "Частная договорённость не выдаётся за изменение вступившего в силу судебного решения. Для судебного порядка формируется только черновик, требующий проверки."
    ],
    steps: ["Укажите основание действующего порядка.", "Зафиксируйте, что именно изменилось.", "Опишите новый предлагаемый порядок.", "При судебном порядке проверьте способ обращения и подсудность.", "Используйте результат только с указанной маркировкой."],
    documents: ["Действующее соглашение или судебный акт.", "Документы об изменившихся обстоятельствах.", "Сведения о ребёнке и родителях."],
    mainDocument: "Изменение соглашения или черновик требования об изменении порядка",
    documentSlug: "izmenenie-poryadka-po-rebenku",
    filing: "Изменение соглашения подписывают родители. Изменение судебного порядка требует судебной процедуры, которую нужно проверить применительно к делу.",
    term: "Единый срок для добровольного изменения соглашения не установлен помощником; срок судебной процедуры зависит от дела.",
    fee: "Судебные расходы проверяются до подачи по виду требования и реквизитам суда.",
    warning: "Если действующий порядок установлен судом, документ всегда остаётся черновиком и не готов к подаче без проверки.",
    helperFields: [...safetyFields, { name: "existingBasis", label: "Чем установлен действующий порядок?", type: "select", required: true, options: [{ label: "Письменным соглашением родителей", value: "agreement" }, { label: "Судебным актом", value: "court" }, { label: "Устной договорённостью", value: "oral" }, { label: "Не уверен", value: "unsure" }] }, { name: "bothAgree", label: "Оба родителя согласны с изменениями?", type: "select", required: true, options: yesNoUnsure }, ...partiesFields, { name: "existingDocument", label: "Реквизиты и содержание действующего соглашения или судебного акта", type: "textarea", required: true }, { name: "changedCircumstances", label: "Какие обстоятельства изменились?", type: "textarea", required: true }, { name: "requestedChanges", label: "Какой новый порядок предлагается?", type: "textarea", required: true }, ...courtFields]
  },
  enforcement: {
    key: "enforcement",
    title: "Решение или установленный порядок не исполняется",
    choiceDescription: "Проверить судебный акт, исполнительный лист и стадию исполнительного производства.",
    description: [
      "До обращения к приставу нужно проверить, есть ли вступивший в силу судебный акт и исполнительный документ.",
      "Если исполнительное производство уже возбуждено, фиксируются конкретные нарушения установленного порядка. Подразделение ФССП не подставляется без проверки."
    ],
    steps: ["Проверьте судебный акт и вступление в силу.", "Проверьте выдачу исполнительного листа.", "Уточните, возбуждено ли исполнительное производство.", "Зафиксируйте нарушения и подтверждения.", "Проверьте подразделение ФССП перед обращением."],
    documents: ["Судебный акт.", "Исполнительный лист.", "Постановление о возбуждении исполнительного производства, если оно есть.", "Материалы, подтверждающие неисполнение."],
    mainDocument: "Чек-лист исполнения или черновик обращения судебному приставу",
    documentSlug: "ispolnenie-resheniya-o-rebenke",
    filing: "В суд за исполнительным листом либо в подтверждённое подразделение ФССП — в зависимости от стадии.",
    term: "Срок и порядок конкретного исполнительного действия определяются материалами производства; помощник не обещает дату результата.",
    fee: "Помощник не заявляет о платеже без подтверждённого основания для выбранного действия.",
    warning: "Если судебного решения нет, сначала нужен маршрут определения места жительства или порядка общения.",
    helperFields: [...safetyFields, { name: "decisionExists", label: "Есть судебное решение о месте жительства или порядке общения?", type: "select", required: true, options: yesNoUnsure }, { name: "decisionEffective", label: "Решение вступило в законную силу?", type: "select", required: true, options: yesNoUnsure }, { name: "writExists", label: "Получен исполнительный лист?", type: "select", required: true, options: yesNoUnsure }, { name: "enforcementStarted", label: "Исполнительное производство возбуждено?", type: "select", required: true, options: yesNoUnsure }, ...partiesFields, { name: "decisionDetails", label: "Суд, номер дела, дата и установленный порядок", type: "textarea", required: true }, { name: "enforcementDetails", label: "Номер производства и подразделение ФССП, если известны", type: "textarea" }, { name: "nonCompliance", label: "Какие конкретные действия или эпизоды нарушают решение?", type: "textarea", required: true }, { name: "evidence", label: "Какие подтверждения неисполнения имеются?", type: "textarea" }, { name: "bailiffConfirmed", label: "Подразделение ФССП проверено на официальном сайте?", type: "select", required: true, options: yesNoUnsure }]
  }
};

export const PARENTS_CHILD_SCENARIO_CHOICES = PARENTS_CHILD_SCENARIO_KEYS.map((key) => ({
  key,
  title: PARENTS_CHILD_SCENARIOS[key].title,
  description: PARENTS_CHILD_SCENARIOS[key].choiceDescription
}));

export function getParentsChildScenario(value: string | undefined) {
  return PARENTS_CHILD_SCENARIO_KEYS.includes(value as ParentsChildScenarioKey)
    ? PARENTS_CHILD_SCENARIOS[value as ParentsChildScenarioKey]
    : null;
}

export function getParentsChildScenarioByDocumentSlug(slug: string) {
  return Object.values(PARENTS_CHILD_SCENARIOS).find((scenario) => scenario.documentSlug === slug) ?? null;
}
