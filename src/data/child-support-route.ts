export const CHILD_SUPPORT_ROUTE = {
  categorySlug: "semya-i-deti",
  problemSlug: "alimenty-na-rebenka"
} as const;

export const CHILD_SUPPORT_SCENARIO_KEYS = ["agreement", "first", "change", "debt", "enforcement"] as const;
export type ChildSupportScenarioKey = (typeof CHILD_SUPPORT_SCENARIO_KEYS)[number];

export type ChildSupportField = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select";
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  hint?: string;
};

export type ChildSupportScenario = {
  key: ChildSupportScenarioKey;
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
  helperFields: ChildSupportField[];
};

const yesNoUnsure = [
  { label: "Да", value: "yes" },
  { label: "Нет", value: "no" },
  { label: "Не уверен", value: "unsure" }
];

const peopleFields: ChildSupportField[] = [
  { name: "applicantData", label: "ФИО, дата рождения, адрес и контакты заявителя", type: "textarea", required: true },
  { name: "payerData", label: "ФИО, дата и место рождения, известный адрес плательщика", type: "textarea", required: true },
  { name: "childData", label: "ФИО и дата рождения ребёнка", type: "textarea", required: true },
  { name: "childLivesWithApplicant", label: "Ребёнок проживает с заявителем?", type: "select", required: true, options: yesNoUnsure }
];

const riskFields: ChildSupportField[] = [
  { name: "childMinor", label: "Ребёнок младше 18 лет?", type: "select", required: true, options: yesNoUnsure },
  { name: "paternityRecorded", label: "Плательщик указан родителем в записи о рождении ребёнка?", type: "select", required: true, options: yesNoUnsure },
  { name: "paternityDispute", label: "Есть спор об отцовстве или материнстве?", type: "select", required: true, options: yesNoUnsure },
  { name: "international", label: "Есть иностранное гражданство, проживание за рубежом или решение иностранного суда?", type: "select", required: true, options: yesNoUnsure }
];

const courtFields: ChildSupportField[] = [
  { name: "courtName", label: "Полное наименование суда или мирового судебного участка", type: "textarea", required: true },
  { name: "courtSource", label: "Ссылка на официальную страницу суда", type: "text", required: true },
  { name: "courtConfirmed", label: "Суд проверен на официальном ресурсе судебной системы?", type: "select", required: true, options: yesNoUnsure }
];

export const CHILD_SUPPORT_SCENARIOS: Record<ChildSupportScenarioKey, ChildSupportScenario> = {
  agreement: {
    key: "agreement",
    title: "Заключить соглашение об алиментах",
    choiceDescription: "Подготовить условия соглашения для обязательного нотариального удостоверения.",
    description: [
      "Родители могут определить размер, способ и порядок уплаты алиментов соглашением.",
      "Соглашение заключается письменно и удостоверяется нотариусом. Проект ПравоПоиска не заменяет нотариальное удостоверение."
    ],
    steps: ["Проверьте согласие сторон.", "Определите способ, размер и периодичность платежей.", "Зафиксируйте порядок индексации и оплаты дополнительных расходов, если он согласован.", "Передайте проект нотариусу.", "Подписывайте окончательный текст только после проверки нотариусом."],
    documents: ["Документы, удостоверяющие личность сторон.", "Документ о рождении ребёнка.", "Сведения о доходах и согласованных условиях содержания.", "Банковские реквизиты, если выплаты будут безналичными."],
    mainDocument: "Проект условий соглашения об уплате алиментов",
    documentSlug: "soglashenie-ob-uplate-alimentov-na-rebenka",
    filing: "Окончательное соглашение удостоверяет нотариус. Помощник не выбирает конкретного нотариуса.",
    term: "Срок подготовки и удостоверения зависит от полноты документов и проверки нотариуса.",
    fee: "Нотариальные расходы зависят от действующего тарифа и региональной платы; сумму нужно уточнить у нотариуса.",
    warning: "Размер содержания несовершеннолетнего ребёнка по соглашению не должен быть ниже размера, который ребёнок мог бы получить при взыскании в судебном порядке.",
    helperFields: [
      { name: "bothAgree", label: "Обе стороны согласны заключить соглашение?", type: "select", required: true, options: yesNoUnsure },
      ...riskFields,
      ...peopleFields,
      { name: "paymentMethod", label: "Как стороны хотят определить выплаты?", type: "select", required: true, options: [{ label: "Доля дохода", value: "share" }, { label: "Твёрдая денежная сумма", value: "fixed" }, { label: "Сочетание способов", value: "combined" }, { label: "Иной способ или не уверен", value: "unsure" }] },
      { name: "paymentTerms", label: "Согласованные размер, периодичность и способ перечисления", type: "textarea", required: true },
      { name: "indexationTerms", label: "Как стороны предлагают индексировать выплаты?", type: "textarea", required: true },
      { name: "agreementExtras", label: "Дополнительные согласованные условия", type: "textarea" }
    ]
  },
  first: {
    key: "first",
    title: "Взыскать алименты впервые",
    choiceDescription: "Определить, применим ли судебный приказ или требуется исковое производство.",
    description: [
      "Судебный приказ применяется только к ограниченному кругу требований о взыскании алиментов на несовершеннолетнего ребёнка.",
      "Твёрдая денежная сумма, сочетание способов, спор об отцовстве или необходимость участия других заинтересованных лиц требуют исковой либо иной отдельной процедуры."
    ],
    steps: ["Проверьте запись о родителе и отсутствие действующего документа.", "Выберите требуемый способ взыскания.", "Укажите обстоятельства, влияющие на приказной или исковой порядок.", "Проверьте суд по официальному источнику.", "Скачайте маркированный черновик и проверьте его до подачи."],
    documents: ["Документ о рождении ребёнка.", "Сведения о месте проживания ребёнка.", "Сведения о плательщике и его доходах, если известны.", "Документы, подтверждающие обстоятельства заявленного способа взыскания."],
    mainDocument: "Черновик заявления о судебном приказе или искового заявления",
    documentSlug: "vzyskanie-alimentov-na-rebenka",
    filing: "Вид производства и конкретный суд определяются после проверки условий требования и официальной подсудности.",
    term: "Сроки зависят от вида производства и движения конкретного дела; помощник не обещает дату результата.",
    fee: "Истец по требованию о взыскании алиментов освобождается от уплаты госпошлины; иные объединённые требования оцениваются отдельно.",
    warning: "Помощник не рассчитывает доход плательщика и не обещает присуждение выбранного размера.",
    helperFields: [
      ...riskFields,
      { name: "existingInstrument", label: "Алименты уже установлены соглашением, судебным приказом или решением суда?", type: "select", required: true, options: yesNoUnsure },
      { name: "otherInterested", label: "Нужно привлекать других получателей алиментов или иных заинтересованных лиц?", type: "select", required: true, options: yesNoUnsure },
      { name: "paymentMethod", label: "Какой способ взыскания требуется?", type: "select", required: true, options: [{ label: "Доля дохода", value: "share" }, { label: "Твёрдая денежная сумма", value: "fixed" }, { label: "Доля и твёрдая сумма одновременно", value: "combined" }, { label: "Не уверен", value: "unsure" }] },
      { name: "payerIncomeStable", label: "Доход плательщика регулярный и официально подтверждаемый?", type: "select", required: true, options: yesNoUnsure },
      ...peopleFields,
      { name: "requestedSupport", label: "Какое требование и обстоятельства нужно изложить?", type: "textarea", required: true },
      { name: "evidence", label: "Какие подтверждающие документы имеются?", type: "textarea" },
      ...courtFields
    ]
  },
  change: {
    key: "change",
    title: "Изменить установленный размер или способ",
    choiceDescription: "Разделить изменение нотариального соглашения и судебно установленного размера.",
    description: ["Сначала определяется, каким документом установлены алименты.", "Соглашение изменяется по взаимному согласию в той же форме; изменение судебно установленного размера требует судебной оценки обстоятельств."],
    steps: ["Укажите действующий документ.", "Опишите изменившиеся обстоятельства.", "Зафиксируйте требуемое изменение.", "Для судебного пути подтвердите суд.", "Проверьте проект до нотариуса или суда."],
    documents: ["Действующее соглашение, приказ или решение.", "Документы об изменившихся обстоятельствах.", "Расчёт и подтверждения заявленного размера."],
    mainDocument: "Проект изменения соглашения или судебный черновик",
    documentSlug: "izmenenie-razmera-alimentov-na-rebenka",
    filing: "Изменение нотариального соглашения удостоверяется нотариально; судебно установленный размер изменяется судом.",
    term: "Единый срок результата помощником не устанавливается.",
    fee: "Нотариальные и судебные расходы проверяются отдельно по выбранному пути.",
    warning: "Само изменение дохода не гарантирует изменение алиментов: обстоятельства оцениваются применительно к делу.",
    helperFields: [
      ...riskFields,
      { name: "currentBasis", label: "Чем установлены действующие алименты?", type: "select", required: true, options: [{ label: "Нотариальным соглашением", value: "agreement" }, { label: "Судебным приказом или решением", value: "court" }, { label: "Не уверен", value: "unsure" }] },
      { name: "bothAgree", label: "Обе стороны согласны с изменением соглашения?", type: "select", required: true, options: yesNoUnsure },
      ...peopleFields,
      { name: "currentTerms", label: "Действующий размер, способ и реквизиты документа", type: "textarea", required: true },
      { name: "changedCircumstances", label: "Какие материальные или семейные обстоятельства изменились?", type: "textarea", required: true },
      { name: "requestedChange", label: "Какое изменение требуется?", type: "textarea", required: true },
      { name: "evidence", label: "Какие документы подтверждают изменения?", type: "textarea" },
      ...courtFields
    ]
  },
  debt: {
    key: "debt",
    title: "Определить задолженность по алиментам",
    choiceDescription: "Проверить исполнительный документ, расчёт задолженности и следующий способ защиты.",
    description: ["Расчёт задолженности связан с основанием взыскания и данными об уплате и доходах.", "Помощник не рассчитывает задолженность вместо судебного пристава и не подменяет оспаривание постановления."],
    steps: ["Проверьте исполнительный документ.", "Соберите сведения о платежах.", "Уточните наличие расчёта пристава.", "Определите, требуется расчёт или оспаривание.", "Проверьте адресата до обращения."],
    documents: ["Исполнительный документ.", "Постановления пристава, если есть.", "Банковские выписки и расписки.", "Сведения о доходах и периоде задолженности."],
    mainDocument: "Чек-лист или черновик заявления о расчёте задолженности",
    documentSlug: "raschet-zadolzhennosti-po-alimentam",
    filing: "В подтверждённое подразделение ФССП либо в суд, если требуется оспаривание и это подтверждено применительно к ситуации.",
    term: "Срок и порядок зависят от стадии исполнительного производства и вида обращения.",
    fee: "Помощник не указывает платёж без подтверждения конкретного вида обращения.",
    warning: "Расчёт пользователя является предварительным и не заменяет официальный расчёт задолженности.",
    helperFields: [
      { name: "executiveDocument", label: "Есть исполнительный документ об алиментах?", type: "select", required: true, options: yesNoUnsure },
      { name: "bailiffCalculation", label: "Судебный пристав уже вынес расчёт задолженности?", type: "select", required: true, options: yesNoUnsure },
      { name: "calculationDisputed", label: "Вы не согласны с расчётом пристава?", type: "select", required: true, options: yesNoUnsure },
      { name: "international", label: "Исполнение связано с другим государством?", type: "select", required: true, options: yesNoUnsure },
      ...peopleFields,
      { name: "instrumentDetails", label: "Реквизиты исполнительного документа", type: "textarea", required: true },
      { name: "debtPeriod", label: "Период предполагаемой задолженности", type: "textarea", required: true },
      { name: "paymentHistory", label: "Известные платежи и подтверждения", type: "textarea", required: true },
      { name: "bailiffOffice", label: "Подтверждённое подразделение ФССП", type: "textarea", required: true },
      { name: "bailiffSource", label: "Ссылка на официальную страницу подразделения", type: "text", required: true }
    ]
  },
  enforcement: {
    key: "enforcement",
    title: "Добиться исполнения",
    choiceDescription: "Определить стадию исполнения и подготовить следующий безопасный шаг.",
    description: ["Исполнение начинается с проверки исполнительного документа и стадии производства.", "Ответственность за неуплату не определяется автоматически: факты и основания оценивает компетентный орган."],
    steps: ["Проверьте исполнительный документ.", "Уточните, возбуждено ли производство.", "Зафиксируйте конкретные факты неисполнения.", "Проверьте подразделение ФССП.", "Используйте только подходящий стадии черновик."],
    documents: ["Исполнительный документ.", "Постановление о возбуждении производства.", "Подтверждения платежей и неисполнения.", "Переписка и обращения к приставу."],
    mainDocument: "Чек-лист исполнения или черновик обращения приставу",
    documentSlug: "ispolnenie-alimentov-na-rebenka",
    filing: "В суд за исполнительным документом или в подтверждённое подразделение ФССП в зависимости от стадии.",
    term: "Срок конкретного исполнительного действия помощник не прогнозирует.",
    fee: "Платёж не указывается без подтверждённого основания для выбранного действия.",
    warning: "Не обещайте привлечение должника к ответственности: решение принимает компетентный орган после проверки обстоятельств.",
    helperFields: [
      { name: "executiveDocument", label: "Есть исполнительный документ?", type: "select", required: true, options: yesNoUnsure },
      { name: "enforcementStarted", label: "Исполнительное производство возбуждено?", type: "select", required: true, options: yesNoUnsure },
      { name: "international", label: "Исполнение связано с другим государством?", type: "select", required: true, options: yesNoUnsure },
      ...peopleFields,
      { name: "instrumentDetails", label: "Реквизиты исполнительного документа", type: "textarea", required: true },
      { name: "enforcementDetails", label: "Номер и сведения об исполнительном производстве", type: "textarea", required: true },
      { name: "nonPaymentFacts", label: "Конкретные факты неисполнения", type: "textarea", required: true },
      { name: "evidence", label: "Подтверждения неисполнения", type: "textarea" },
      { name: "bailiffOffice", label: "Подтверждённое подразделение ФССП", type: "textarea", required: true },
      { name: "bailiffSource", label: "Ссылка на официальную страницу подразделения", type: "text", required: true }
    ]
  }
};

export const CHILD_SUPPORT_SCENARIO_CHOICES = CHILD_SUPPORT_SCENARIO_KEYS.map((key) => ({
  key,
  title: CHILD_SUPPORT_SCENARIOS[key].title,
  description: CHILD_SUPPORT_SCENARIOS[key].choiceDescription
}));

export function getChildSupportScenario(value: string | undefined) {
  return CHILD_SUPPORT_SCENARIO_KEYS.includes(value as ChildSupportScenarioKey)
    ? CHILD_SUPPORT_SCENARIOS[value as ChildSupportScenarioKey]
    : null;
}

export function getChildSupportScenarioByDocumentSlug(slug: string) {
  return Object.values(CHILD_SUPPORT_SCENARIOS).find((scenario) => scenario.documentSlug === slug) ?? null;
}
