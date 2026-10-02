import type { NavigatorDocument } from "@/data/documents";
import { PARENTAL_RIGHTS_DEPRIVATION_REVIEWED_AT } from "@/data/parental-rights-deprivation-legal-review";
import { PARENTAL_RIGHTS_DEPRIVATION_SCENARIOS, type ParentalRightsDeprivationScenarioKey } from "@/data/parental-rights-deprivation-route";

const problemSlug = "lishenie-roditelskih-prav";

function createDocument(key: ParentalRightsDeprivationScenarioKey, title: string, resultType: string, queries: string[]): NavigatorDocument {
  const scenario = PARENTAL_RIGHTS_DEPRIVATION_SCENARIOS[key];
  return {
    slug: scenario.documentSlug,
    title,
    category: "лишение родительских прав",
    documentType: resultType,
    shortTitle: title,
    titleAccusative: title.toLowerCase(),
    documentTypeAccusative: resultType.toLowerCase(),
    shortIntro: scenario.choiceDescription,
    shortDescription: scenario.choiceDescription,
    description: scenario.description.join(" "),
    heroDescription: `${scenario.choiceDescription} Судебные результаты всегда требуют юридической проверки.`,
    whenToUse: scenario.description,
    whenNotToUse: ["Нужны ограничение прав, восстановление прав, спор об общении или экстренная помощь ребёнку."],
    beforeFillingChecklist: ["Исключите непосредственную угрозу.", "Проверьте статус ребёнка и заявителя.", "Выберите только предполагаемое основание из статьи 69 СК РФ."],
    requiredData: scenario.helperFields.filter((field) => field.required).map((field) => field.label),
    whatToPrepare: scenario.documents,
    whatToInclude: scenario.helperFields.map((field) => field.label),
    howToFill: ["Указывайте только проверяемые факты и даты.", "Не называйте конфликт основанием лишения прав.", "Не убирайте маркировку судебного черновика."],
    whereToFile: scenario.filing,
    whereToSubmit: scenario.filing,
    filingProcedure: scenario.steps,
    howToSubmit: scenario.steps,
    legalBasis: ["Статьи 69–71 и 77 Семейного кодекса РФ.", "Постановление Пленума ВС РФ от 14.11.2017 № 44.", "Постановление КС РФ от 16.07.2026 № 49-П — только для специального случая совершеннолетнего потерпевшего."],
    deadlinesAndFees: [scenario.term, scenario.fee],
    stateDuty: [scenario.fee],
    deadlines: [scenario.term],
    afterFiling: ["Сохраните подтверждение подачи.", "Следите за извещениями суда.", "Предоставьте суду и органу опеки запрошенные документы.", "Не препятствуйте выяснению мнения ребёнка в предусмотренном законом порядке."],
    importantFactsToFix: scenario.helperFields.map((field) => field.label),
    mistakes: ["Подменять доказательства оценочными фразами.", "Выбирать ненадлежащего заявителя.", "Считать прежнее решение достаточным само по себе."],
    commonMistakes: ["Подменять доказательства оценочными фразами.", "Выбирать ненадлежащего заявителя.", "Считать прежнее решение достаточным само по себе."],
    documentsToAttach: scenario.documents,
    attachments: scenario.documents,
    relatedProblems: [{ title: "Лишение родительских прав", slug: problemSlug }],
    relatedSituations: [{ title: "Лишение родительских прав", slug: problemSlug }],
    relatedDocuments: [],
    faq: [],
    relatedProblemSlugs: [problemSlug],
    legalReferenceKeys: [],
    seoTitle: `${title}: порядок подготовки`,
    seoDescription: scenario.choiceDescription,
    generatorSeoTitle: `${title}: подготовить сведения`,
    generatorSeoDescription: scenario.choiceDescription,
    keywords: queries,
    userQueries: queries,
    lastReviewedAt: PARENTAL_RIGHTS_DEPRIVATION_REVIEWED_AT,
    disclaimer: "Судебный результат является черновиком, не готов к подаче и требует юридической проверки."
  };
}

export const PARENTAL_RIGHTS_DEPRIVATION_DOCUMENTS: NavigatorDocument[] = [
  createDocument("grounds", "Проверка оснований лишения родительских прав", "Персональный чек-лист", ["есть ли основания лишить родительских прав", "основания лишения родительских прав"]),
  createDocument("court", "Иск о лишении родительских прав", "Судебный черновик", ["подать на лишение родительских прав", "иск лишить родительских прав"]),
  createDocument("existing", "Учёт решений при лишении родительских прав", "Чек-лист и судебный черновик", ["лишение прав после ограничения", "решение суда лишение родительских прав"]),
  createDocument("support", "Лишение родительских прав и алименты", "Судебный черновик", ["лишить родительских прав и взыскать алименты", "алименты после лишения родительских прав"])
];
