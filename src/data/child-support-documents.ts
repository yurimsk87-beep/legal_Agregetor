import type { NavigatorDocument } from "@/data/documents";
import { CHILD_SUPPORT_REVIEWED_AT } from "@/data/child-support-legal-review";
import { CHILD_SUPPORT_SCENARIOS } from "@/data/child-support-route";
import type { ChildSupportScenarioKey } from "@/data/child-support-route";

const problemSlug = "alimenty-na-rebenka";

function createDocument(key: ChildSupportScenarioKey, title: string, documentType: string, queries: string[]): NavigatorDocument {
  const scenario = CHILD_SUPPORT_SCENARIOS[key];
  return {
    slug: scenario.documentSlug,
    title,
    category: "алименты на ребёнка",
    documentType,
    shortTitle: title,
    titleAccusative: title.toLowerCase(),
    documentTypeAccusative: documentType.toLowerCase(),
    shortIntro: scenario.choiceDescription,
    shortDescription: scenario.choiceDescription,
    description: scenario.description.join(" "),
    heroDescription: `${scenario.choiceDescription} Статус готовности показывается до скачивания.`,
    whenToUse: scenario.description,
    whenNotToUse: ["Нужно взыскать содержание супруга, установить отцовство или заявить дополнительные расходы на ребёнка."],
    beforeFillingChecklist: ["Определите действующий документ и цель обращения.", "Подготовьте сведения о ребёнке и сторонах.", "Не подставляйте неподтверждённый суд или подразделение ФССП."],
    requiredData: scenario.helperFields.filter((field) => field.required).map((field) => field.label),
    whatToPrepare: scenario.documents,
    whatToInclude: scenario.helperFields.map((field) => field.label),
    howToFill: ["Указывайте только подтверждаемые факты.", "Не рассчитывайте доход или задолженность приблизительно.", "Проверьте маркировку результата."],
    whereToFile: scenario.filing,
    whereToSubmit: scenario.filing,
    filingProcedure: scenario.steps,
    howToSubmit: scenario.steps,
    legalBasis: ["Раздел V Семейного кодекса РФ.", "ГПК РФ — для приказного и искового производства.", "Федеральный закон № 229-ФЗ — для исполнения."],
    deadlinesAndFees: [scenario.term, scenario.fee],
    stateDuty: [scenario.fee],
    deadlines: [scenario.term],
    afterFiling: ["Сохраните подтверждение обращения.", "Проверяйте движение дела или производства по официальному каналу.", "Полученный документ и расчёты проверяйте до дальнейших действий."],
    importantFactsToFix: scenario.helperFields.map((field) => field.label),
    mistakes: ["Смешивать приказ и иск.", "Выдавать проект соглашения за нотариальный документ.", "Обещать размер или результат без судебной оценки."],
    commonMistakes: ["Смешивать приказ и иск.", "Выдавать проект соглашения за нотариальный документ.", "Обещать размер или результат без судебной оценки."],
    documentsToAttach: scenario.documents,
    attachments: scenario.documents,
    relatedProblems: [{ title: "Алименты на ребёнка", slug: problemSlug }],
    relatedSituations: [{ title: "Алименты на ребёнка", slug: problemSlug }],
    relatedDocuments: [],
    faq: [],
    relatedProblemSlugs: [problemSlug],
    legalReferenceKeys: [],
    seoTitle: `${title}: порядок подготовки`,
    seoDescription: scenario.choiceDescription,
    generatorSeoTitle: `${title}: подготовить данные`,
    generatorSeoDescription: scenario.choiceDescription,
    keywords: queries,
    userQueries: queries,
    lastReviewedAt: CHILD_SUPPORT_REVIEWED_AT,
    disclaimer: "Нотариальные и судебные документы требуют указанной на странице проверки; неподтверждённый адресат не считается готовым."
  };
}

export const CHILD_SUPPORT_DOCUMENTS: NavigatorDocument[] = [
  createDocument("agreement", "Соглашение об уплате алиментов на ребёнка", "Проект условий соглашения", ["соглашение об алиментах на ребёнка", "алименты у нотариуса"]),
  createDocument("first", "Взыскание алиментов на ребёнка", "Судебный черновик", ["взыскать алименты на ребёнка", "судебный приказ алименты"]),
  createDocument("change", "Изменение размера алиментов на ребёнка", "Проект или судебный черновик", ["увеличить алименты", "уменьшить алименты", "изменить способ алиментов"]),
  createDocument("debt", "Расчёт задолженности по алиментам", "Чек-лист или черновик заявления", ["расчёт долга по алиментам", "задолженность по алиментам"]),
  createDocument("enforcement", "Исполнение алиментов на ребёнка", "Чек-лист или черновик обращения", ["не платит алименты", "пристав алименты"])
];
