export const INTERNATIONAL_FAMILY_DISPUTES_ROUTE = {
  categorySlug: "semya-i-deti",
  problemSlug: "mezhdunarodnye-semeynye-spory",
  documentSlug: "mezhdunarodnyy-semeynyy-spor-list-dannyh"
} as const;

export const INTERNATIONAL_FAMILY_DISPUTES_KEYS = ["child", "parental", "recognition", "maintenance", "documents"] as const;
export type InternationalFamilyDisputesKey = (typeof INTERNATIONAL_FAMILY_DISPUTES_KEYS)[number];
export type InternationalFamilyDisputesField = {
  name: string;
  label: string;
  type: "select" | "textarea";
  options?: { value: string; label: string }[];
};
export type InternationalFamilyDisputesScenario = {
  key: InternationalFamilyDisputesKey;
  title: string;
  summary: string;
  questions: InternationalFamilyDisputesField[];
  evidence: string[];
  nextSteps: string[];
};

const yesNoUnknown = [
  { value: "yes", label: "Да" },
  { value: "no", label: "Нет" },
  { value: "unsure", label: "Не знаю" }
];

const commonQuestions: InternationalFamilyDisputesField[] = [
  { name: "countries", label: "Какие государства связаны с ситуацией?", type: "textarea" },
  { name: "citizenship", label: "Гражданство всех участников", type: "textarea" },
  { name: "residence", label: "Где каждый участник обычно и фактически проживает?", type: "textarea" },
  { name: "childLocation", label: "В каком государстве сейчас находится ребёнок?", type: "textarea" },
  { name: "foreignDecision", label: "Есть иностранное решение суда или иного органа?", type: "select", options: yesNoUnknown },
  { name: "treatyKnown", label: "Проверялось ли действие международного договора между этими государствами?", type: "select", options: yesNoUnknown }
];

export const INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS: Record<InternationalFamilyDisputesKey, InternationalFamilyDisputesScenario> = {
  child: {
    key: "child",
    title: "Ребёнок находится в другом государстве",
    summary: "Собрать факты о перемещении, удержании, месте обычного проживания и действующих решениях.",
    questions: [...commonQuestions,
      { name: "movement", label: "Как ребёнок оказался в другом государстве и когда это произошло?", type: "textarea" },
      { name: "otherParentConsent", label: "Было согласие другого родителя на выезд или изменение места проживания?", type: "select", options: yesNoUnknown },
      { name: "childSafety", label: "Есть непосредственная угроза жизни или здоровью ребёнка?", type: "select", options: yesNoUnknown }
    ],
    evidence: ["Документы о месте обычного и фактического проживания ребёнка.", "Согласия, переписка, билеты и сведения о дате перемещения.", "Судебные акты и документы иностранных органов, если они есть."],
    nextSteps: ["Проверьте через официальный статусный реестр действие применимого международного договора именно между двумя государствами.", "Не определяйте компетентный суд и требование без проверки места обычного проживания ребёнка, дат и действующих решений.", "Передайте материалы юристу по международным семейным спорам."]
  },
  parental: {
    key: "parental",
    title: "Спор родителей с иностранным элементом",
    summary: "Разобрать место жительства, общение или иное осуществление родительских прав, когда участники живут в разных государствах.",
    questions: [...commonQuestions,
      { name: "disputeSubject", label: "О чём спорят родители?", type: "select", options: [{ value: "residence", label: "Место жительства ребёнка" }, { value: "communication", label: "Порядок общения" }, { value: "education", label: "Воспитание или образование" }, { value: "other", label: "Иной вопрос" }] },
      { name: "existingOrder", label: "Есть соглашение или судебный акт по этому вопросу?", type: "select", options: yesNoUnknown }
    ],
    evidence: ["Документы о гражданстве и проживании родителей и ребёнка.", "Соглашения и судебные акты по ребёнку.", "Доказательства фактического ухода, общения и интересов ребёнка."],
    nextSteps: ["Отделите предмет спора от вопроса о юрисдикции и применимом праве.", "Проверьте международный договор и процессуальные правила для конкретных государств.", "Получите индивидуальную проверку до обращения в суд или иностранный орган."]
  },
  recognition: {
    key: "recognition",
    title: "Признать или исполнить иностранное решение",
    summary: "Подготовить решение, сведения о вступлении в силу, извещении сторон и необходимости принудительного исполнения.",
    questions: [...commonQuestions,
      { name: "decisionCountry", label: "В каком государстве и каким органом вынесено решение?", type: "textarea" },
      { name: "decisionSubject", label: "Что установлено или взыскано решением?", type: "textarea" },
      { name: "effective", label: "Есть подтверждение вступления решения в законную силу?", type: "select", options: yesNoUnknown },
      { name: "notice", label: "Есть подтверждение надлежащего извещения другой стороны?", type: "select", options: yesNoUnknown }
    ],
    evidence: ["Полный заверенный текст иностранного решения.", "Подтверждения вступления в силу и извещения сторон.", "Перевод, легализация или апостиль, если они требуются после правовой проверки."],
    nextSteps: ["Определите, требуется ли принудительное исполнение или только признание.", "Проверьте международный договор и действующие правила главы 45 ГПК РФ.", "Не подавайте лист как ходатайство: форму обращения определяет юрист после проверки комплекта."]
  },
  maintenance: {
    key: "maintenance",
    title: "Трансграничные алименты",
    summary: "Собрать данные о плательщике, получателе, ребёнке, решении и активах в разных государствах.",
    questions: [...commonQuestions,
      { name: "maintenanceStatus", label: "Алименты уже установлены соглашением или решением?", type: "select", options: [{ value: "no", label: "Нет" }, { value: "agreement", label: "Есть соглашение" }, { value: "russian", label: "Есть российское решение" }, { value: "foreign", label: "Есть иностранное решение" }, { value: "unsure", label: "Не знаю" }] },
      { name: "debtorLocation", label: "Где проживает плательщик и где находятся его доходы или имущество?", type: "textarea" }
    ],
    evidence: ["Документы о родстве и содержании ребёнка.", "Соглашение или судебный акт, если алименты уже установлены.", "Сведения о месте проживания, доходах и имуществе плательщика."],
    nextSteps: ["Установите, требуется первоначальное взыскание, признание решения или исполнение.", "Проверьте договор между конкретными государствами и допустимый канал взаимодействия.", "Передайте документы специалисту до выбора суда или органа исполнения."]
  },
  documents: {
    key: "documents",
    title: "Иностранные документы или иной семейный вопрос",
    summary: "Проверить документ, его назначение и требования к признанию без автоматического выбора права или органа.",
    questions: [...commonQuestions,
      { name: "documentType", label: "Какой иностранный документ нужно использовать?", type: "textarea" },
      { name: "purpose", label: "Для какого юридического действия он нужен?", type: "textarea" },
      { name: "translation", label: "Есть заверенный перевод на русский язык?", type: "select", options: yesNoUnknown }
    ],
    evidence: ["Оригинал или заверенная копия иностранного документа.", "Сведения об органе и государстве выдачи.", "Имеющиеся перевод, апостиль или легализация."],
    nextSteps: ["Проверьте, требуется ли легализация, апостиль или действует договорное освобождение.", "Уточните требования органа, для которого предназначен документ.", "Не используйте непроверенный перевод или копию для юридически значимого обращения."]
  }
};

export function getInternationalFamilyDisputesScenario(value?: string | null) {
  return INTERNATIONAL_FAMILY_DISPUTES_KEYS.includes(value as InternationalFamilyDisputesKey)
    ? INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS[value as InternationalFamilyDisputesKey]
    : null;
}
