export const RELATIVE_CHILD_CONTACT_ROUTE = { categorySlug: "semya-i-deti", problemSlug: "obshchenie-rodstvennikov-s-rebenkom", documentSlug: "obshchenie-rodstvennikov-s-rebenkom-materialy" } as const;
export const RELATIVE_CHILD_CONTACT_KEYS = ["agreement", "guardianship", "court", "enforcement"] as const;
export type RelativeChildContactKey = (typeof RELATIVE_CHILD_CONTACT_KEYS)[number];
export type RelativeChildContactField = { name: string; label: string; type: "select" | "textarea" | "territory-region" | "territory-municipality" | "guardianship-authority"; options?: { value: string; label: string }[] };
export type RelativeChildContactScenario = { key: RelativeChildContactKey; title: string; summary: string; questions: RelativeChildContactField[]; evidence: string[]; nextSteps: string[] };

const yesNoUnknown = [{ value: "yes", label: "Да" }, { value: "no", label: "Нет" }, { value: "unsure", label: "Не знаю" }];
const relation = { name: "relation", label: "Кем вы приходитесь ребёнку?", type: "select" as const, options: [
  { value: "grandparent", label: "Бабушка или дедушка" }, { value: "sibling", label: "Брат или сестра" },
  { value: "other", label: "Иной родственник" }, { value: "parent", label: "Родитель" }
] };
const facts: RelativeChildContactField[] = [relation,
  { name: "applicantData", label: "ФИО и контакты родственника", type: "textarea" }, { name: "childData", label: "ФИО и дата рождения ребёнка", type: "textarea" },
  { name: "contactHistory", label: "Как родственник общался с ребёнком раньше?", type: "textarea" }, { name: "desiredContact", label: "Какой порядок общения предлагается?", type: "textarea" },
  { name: "childOpinion", label: "Что известно о мнении ребёнка?", type: "textarea" }, { name: "childSafety", label: "Есть непосредственная угроза жизни или здоровью ребёнка?", type: "select", options: yesNoUnknown }
];

export const RELATIVE_CHILD_CONTACT_SCENARIOS: Record<RelativeChildContactKey, RelativeChildContactScenario> = {
  agreement: { key: "agreement", title: "Договориться добровольно", summary: "Подготовить предметную письменную договорённость о контактах без обращения в орган опеки или суд.", questions: [...facts, { name: "parentAgreement", label: "Родители или законный представитель согласны обсуждать порядок общения?", type: "select", options: yesNoUnknown }], evidence: ["Документы о родстве.", "Сведения о прежнем общении и привязанности ребёнка.", "Реалистичный график с учётом режима ребёнка."], nextSteps: ["Обсудите проект с законным представителем ребёнка.", "Учитывайте интересы и мнение ребёнка.", "Подпишите договорённость только при добровольном согласии сторон."] },
  guardianship: { key: "guardianship", title: "Родители препятствуют общению", summary: "Подготовить обращение в подтверждённый орган опеки по статье 67 СК РФ.", questions: [...facts,
    { name: "region", label: "Регион проживания ребёнка", type: "territory-region" }, { name: "municipality", label: "Муниципальное образование", type: "territory-municipality" }, { name: "authorityName", label: "Орган опеки и попечительства", type: "guardianship-authority" },
    { name: "obstacles", label: "Как и с какого времени препятствуют общению?", type: "textarea" }, { name: "attempts", label: "Какие попытки договориться уже предпринимались?", type: "textarea" }
  ], evidence: ["Документы о родстве.", "Переписка и иные подтверждения препятствий.", "Предлагаемый порядок общения и сведения об интересах ребёнка."], nextSteps: ["Подайте обращение в подтверждённый орган опеки.", "Сохраните подтверждение подачи.", "Получите письменное решение органа опеки."] },
  court: { key: "court", title: "Решение органа опеки не исполняется", summary: "Подготовить маркированный судебный черновик после прохождения предусмотренной статьёй 67 СК РФ стадии органа опеки.", questions: [...facts, { name: "guardianshipOrder", label: "Орган опеки уже вынес решение об устранении препятствий?", type: "select", options: yesNoUnknown }, { name: "orderDetails", label: "Реквизиты и содержание решения органа опеки", type: "textarea" }, { name: "nonCompliance", label: "Как решение органа опеки не исполняется?", type: "textarea" }], evidence: ["Решение органа опеки.", "Подтверждение его получения родителем или законным представителем.", "Доказательства дальнейших препятствий и сведения об интересах ребёнка."], nextSteps: ["Проверьте право заявителя и соблюдение досудебной последовательности.", "Определите подсудность и участников дела с юристом.", "Не подавайте черновик без проверки требований и приложений."] },
  enforcement: { key: "enforcement", title: "Судебное решение не исполняется", summary: "Подготовить сведения для исполнительного производства и проверки способа исполнения.", questions: [...facts, { name: "courtDecision", label: "Реквизиты и содержание вступившего в силу судебного решения", type: "textarea" }, { name: "writ", label: "Получен исполнительный лист?", type: "select", options: yesNoUnknown }, { name: "enforcementStatus", label: "Каков статус исполнительного производства?", type: "select", options: [{ value: "not-filed", label: "Ещё не возбуждалось" }, { value: "open", label: "Возбуждено" }, { value: "inaction", label: "Возбуждено, но решение не исполняется" }, { value: "unsure", label: "Не знаю" }] }], evidence: ["Судебное решение с отметкой о вступлении в силу.", "Исполнительный лист и постановления пристава, если есть.", "Подтверждения каждого случая неисполнения."], nextSteps: ["Проверьте исполнительный документ и статус производства.", "Передайте сведения специалисту для выбора законного исполнительного действия.", "Не пытайтесь самостоятельно изменять установленный судом порядок."] }
};

export function getRelativeChildContactScenario(value?: string | null) {
  return RELATIVE_CHILD_CONTACT_KEYS.includes(value as RelativeChildContactKey) ? RELATIVE_CHILD_CONTACT_SCENARIOS[value as RelativeChildContactKey] : null;
}
