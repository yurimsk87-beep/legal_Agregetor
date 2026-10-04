import { RUSSIAN_REGIONS } from "@/data/guardianship-territories";

export const CHILD_TRAVEL_ROUTE = { categorySlug: "semya-i-deti", problemSlug: "vyezd-rebenka-za-granitsu" } as const;
export const CHILD_TRAVEL_SCENARIO_KEYS = ["with-parent", "without-parents", "disagreement", "foreign-requirements"] as const;
export type ChildTravelScenarioKey = (typeof CHILD_TRAVEL_SCENARIO_KEYS)[number];
export type ChildTravelField = { name: string; label: string; type?: "text" | "textarea" | "select" | "searchable"; required?: boolean; options?: Array<{ label: string; value: string }>; hint?: string };
export type ChildTravelScenario = { key: ChildTravelScenarioKey; title: string; choiceDescription: string; description: string[]; steps: string[]; documents: string[]; mainDocument: string; documentSlug: string; filing: string; term: string; fee: string; warning: string; helperFields: ChildTravelField[] };

const yesNoUnsure = [{ label: "Да", value: "yes" }, { label: "Нет", value: "no" }, { label: "Не уверен", value: "unsure" }];
const russianExitFields: ChildTravelField[] = [
  { name: "childData", label: "Сведения о ребёнке", type: "textarea", required: true },
  { name: "russianCitizen", label: "Ребёнок является гражданином Российской Федерации?", type: "select", required: true, options: yesNoUnsure },
  { name: "travelDocument", label: "Есть действительный документ ребёнка для пересечения границы?", type: "select", required: true, options: yesNoUnsure },
  { name: "destinations", label: "Государство или государства поездки", type: "textarea", required: true, hint: "Перечислите конкретные государства, включая транзитные." },
  { name: "travelPeriod", label: "Планируемый период поездки", type: "text", required: true },
  { name: "nonConsent", label: "Известно о заявлении законного представителя о несогласии на выезд?", type: "select", required: true, options: [{ label: "Нет", value: "none" }, { label: "Да", value: "exists" }, { label: "Не уверен", value: "unsure" }] }
];

export const CHILD_TRAVEL_SCENARIOS: Record<ChildTravelScenarioKey, ChildTravelScenario> = {
  "with-parent": {
    key: "with-parent", title: "Ребёнок едет с одним родителем", choiceDescription: "Проверить российские правила выезда и отделить их от требований страны въезда.",
    description: ["Для выезда из России с одним законным представителем согласие второго по общему правилу не требуется, если не подано заявление о несогласии.", "Страна въезда, транзит и перевозчик могут устанавливать дополнительные требования."],
    steps: ["Проверьте гражданство и документ ребёнка.", "Проверьте сведения о несогласии на выезд.", "Уточните правила въезда и транзита у компетентных органов соответствующих государств.", "Проверьте требования перевозчика."],
    documents: ["Документ ребёнка для пересечения границы.", "Документы, подтверждающие полномочия сопровождающего законного представителя.", "Документы по правилам страны въезда и перевозчика после официальной проверки."],
    mainDocument: "Чек-лист выезда ребёнка с одним родителем", documentSlug: "vyezd-rebenka-s-odnim-roditelem", filing: "Российский чек-лист не подаётся. Требования въезда проверяются у компетентных органов страны назначения.", term: "Единый срок подготовки законом не установлен.", fee: "Расходы зависят от документов, нотариальных действий и требований поездки; автоматически не рассчитываются.", warning: "Чек-лист подтверждает только общую российскую модель и не гарантирует въезд в иностранное государство.",
    helperFields: [{ name: "accompanyingParent", label: "Сведения о сопровождающем законном представителе", type: "textarea", required: true }, ...russianExitFields]
  },
  "without-parents": {
    key: "without-parents", title: "Ребёнок едет без родителей", choiceDescription: "Подготовить данные для нотариального согласия и проверить перевозчика.",
    description: ["При выезде несовершеннолетнего гражданина России без законных представителей требуется его документ и нотариально оформленное согласие одного законного представителя.", "Помощник готовит сведения для нотариуса, но не создаёт нотариальное согласие."],
    steps: ["Проверьте документ ребёнка.", "Подготовьте точные государства и период поездки.", "Обратитесь к нотариусу за удостоверением согласия.", "Проверьте возрастные правила перевозчика и требования въезда."],
    documents: ["Документ ребёнка для пересечения границы.", "Свидетельство о рождении или иной документ о полномочиях представителя.", "Сведения о сопровождающем лице, если оно есть.", "Нотариальное согласие законного представителя."],
    mainDocument: "Лист данных для нотариального согласия", documentSlug: "soglasie-na-vyezd-rebenka-bez-roditeley", filing: "Передайте лист данных нотариусу; сам лист не заменяет нотариальное согласие.", term: "Срок согласия определяет законный представитель в допустимой форме; конкретные даты проверяет нотариус.", fee: "Нотариальный тариф и региональная плата уточняются у нотариуса.", warning: "PDF не является нотариальным документом и не может использоваться вместо согласия.",
    helperFields: [{ name: "legalRepresentative", label: "Сведения о законном представителе, который даст согласие", type: "textarea", required: true }, { name: "companionData", label: "Сведения о сопровождающем лице или отметка «без сопровождения»", type: "textarea", required: true }, { name: "notaryPlanned", label: "Планируется нотариальное удостоверение согласия?", type: "select", required: true, options: yesNoUnsure }, ...russianExitFields]
  },
  disagreement: {
    key: "disagreement", title: "Есть несогласие на выезд", choiceDescription: "Собрать факты для отзыва несогласия или судебного разрешения спора.",
    description: ["Заявивший несогласие законный представитель может отозвать его во внесудебном порядке.", "Если спор сохраняется, возможность выезда разрешается судом; результат зависит от обстоятельств конкретной поездки и интересов ребёнка."],
    steps: ["Получите точные сведения о действующем несогласии и его пределах.", "Проверьте возможность отзыва заявителем.", "Если спор сохраняется, подготовьте доказательства цели, срока и условий поездки.", "Определите компетентный суд с юристом."],
    documents: ["Сведения или уведомление о несогласии.", "Документы ребёнка и законных представителей.", "Подтверждения цели, маршрута, срока и условий возвращения.", "Иные доказательства интересов ребёнка."],
    mainDocument: "Черновик обстоятельств спора о выезде ребёнка", documentSlug: "spor-o-vyezde-rebenka-za-granitsu", filing: "Адресат и требования определяются после проверки несогласия, обстоятельств поездки и подсудности.", term: "Срок судебного рассмотрения не прогнозируется.", fee: "Пошлина и возможные льготы определяются после квалификации требований.", warning: "Черновик не является иском и всегда требует юридической проверки.",
    helperFields: [
      { name: "applicantData", label: "Сведения о заявителе", type: "textarea", required: true }, { name: "childData", label: "Сведения о ребёнке", type: "textarea", required: true }, { name: "objectorData", label: "Сведения о законном представителе, заявившем несогласие", type: "textarea", required: true },
      { name: "disagreementScope", label: "Подтверждённые срок и государства, охваченные несогласием", type: "textarea", required: true }, { name: "desiredTrip", label: "Цель, маршрут, даты и условия возвращения", type: "textarea", required: true }, { name: "childInterests", label: "Почему поездка отвечает интересам ребёнка", type: "textarea", required: true }, { name: "evidence", label: "Какие документы подтверждают обстоятельства", type: "textarea", required: true },
      { name: "region", label: "Регион предполагаемого обращения", type: "searchable", required: true, options: RUSSIAN_REGIONS.map(({ id, label }) => ({ value: id, label })) }, { name: "withdrawalPossible", label: "Заявитель несогласия готов отозвать его?", type: "select", required: true, options: yesNoUnsure }
    ]
  },
  "foreign-requirements": {
    key: "foreign-requirements", title: "Нужен документ для иностранного государства", choiceDescription: "Зафиксировать маршрут и получить список официальных проверок без смешения с российским правом.",
    description: ["Требования к въезду устанавливает иностранное государство, а дополнительные условия может устанавливать перевозчик.", "ПравоПоиск не определяет иностранные формы и легализацию без проверки конкретной страны."],
    steps: ["Уточните все государства назначения и транзита.", "Проверьте требования в компетентных органах каждого государства.", "Уточните форму согласия, перевод, апостиль или легализацию.", "Отдельно проверьте требования перевозчика."],
    documents: ["Документы о гражданстве ребёнка и представителей.", "Маршрут и даты.", "Ответ или требования компетентного иностранного органа.", "Требования перевозчика."],
    mainDocument: "Чек-лист проверки иностранных требований", documentSlug: "dokumenty-dlya-vyezda-rebenka-v-inostrannoe-gosudarstvo", filing: "Компетентный орган определяется для каждого государства отдельно.", term: "Срок зависит от иностранного органа и вида документа.", fee: "Расходы не рассчитываются без подтверждённых требований конкретного государства.", warning: "Всегда legalReviewOnly: маршрут не создаёт иностранный официальный документ.",
    helperFields: [{ name: "childCitizenship", label: "Гражданство или гражданства ребёнка", type: "textarea", required: true }, { name: "representativeCitizenship", label: "Гражданство законных представителей", type: "textarea", required: true }, { name: "destinations", label: "Государства назначения и транзита", type: "textarea", required: true }, { name: "travelPeriod", label: "Период и цель поездки", type: "textarea", required: true }, { name: "companion", label: "Кто сопровождает ребёнка", type: "textarea", required: true }, { name: "foreignRequirement", label: "Какой документ запросил иностранный орган, консульство или перевозчик", type: "textarea", required: true }]
  }
};

export const CHILD_TRAVEL_SCENARIO_CHOICES = CHILD_TRAVEL_SCENARIO_KEYS.map((key) => ({ key, title: CHILD_TRAVEL_SCENARIOS[key].title, description: CHILD_TRAVEL_SCENARIOS[key].choiceDescription }));
export function getChildTravelScenario(value?: string | null) { return CHILD_TRAVEL_SCENARIO_KEYS.includes(value as ChildTravelScenarioKey) ? CHILD_TRAVEL_SCENARIOS[value as ChildTravelScenarioKey] : null; }
export function getChildTravelScenarioByDocumentSlug(slug: string) { return Object.values(CHILD_TRAVEL_SCENARIOS).find((scenario) => scenario.documentSlug === slug) ?? null; }
