import type { NavigatorDocument } from "@/data/documents";
import { PARENTS_CHILD_REVIEWED_AT } from "@/data/parents-child-legal-review";
import { PARENTS_CHILD_SCENARIOS } from "@/data/parents-child-route";
import type { ParentsChildScenarioKey } from "@/data/parents-child-route";

const problemSlug = "roditeli-i-rebenok-posle-razvoda";

function createDocument(key: ParentsChildScenarioKey, title: string, type: string, queries: string[]): NavigatorDocument {
  const scenario = PARENTS_CHILD_SCENARIOS[key];
  return {
    slug: scenario.documentSlug,
    title,
    category: "документы о ребёнке",
    documentType: type,
    shortTitle: title,
    titleAccusative: title.toLowerCase(),
    documentTypeAccusative: type.toLowerCase(),
    shortIntro: scenario.choiceDescription,
    shortDescription: scenario.choiceDescription,
    description: scenario.description.join(" "),
    heroDescription: `${scenario.choiceDescription} Помощник не прогнозирует решение суда и не подставляет неподтверждённый адресат.`,
    whenToUse: scenario.description,
    whenNotToUse: ["Нужно взыскать алименты, установить отцовство, лишить родительских прав, оформить опеку или решить вопрос о выезде ребёнка за границу."],
    beforeFillingChecklist: ["Выберите добровольный или спорный порядок.", "Подготовьте сведения о ребёнке и родителях.", "Не формулируйте мнение ребёнка или заключение органа опеки от их имени."],
    requiredData: scenario.helperFields.filter((field) => field.required).map((field) => field.label),
    whatToPrepare: scenario.documents,
    whatToInclude: scenario.helperFields.map((field) => field.label),
    howToFill: ["Указывайте только известные факты.", "Не придумывайте реквизиты суда, пристава или органа опеки.", "Проверьте маркировку результата перед использованием."],
    whereToFile: scenario.filing,
    whereToSubmit: scenario.filing,
    filingProcedure: scenario.steps,
    howToSubmit: scenario.steps,
    legalBasis: ["Статьи 57, 65, 66 и 78 СК РФ.", "Статьи 24, 28, 131 и 132 ГПК РФ — для судебных требований.", "Статья 109.3 Закона № 229-ФЗ — для исполнения решения."],
    deadlinesAndFees: [scenario.term, scenario.fee],
    stateDuty: [scenario.fee],
    deadlines: [scenario.term],
    afterFiling: ["Сохраните подтверждение подачи.", "Проверяйте движение обращения по официальному каналу.", "Неисполнение и новые риски фиксируйте документально, не нарушая права ребёнка."],
    importantFactsToFix: scenario.helperFields.map((field) => field.label),
    mistakes: ["Предсказывать исход спора.", "Выдавать неподтверждённый суд за определённый.", "Подменять мнение ребёнка текстом родителя."],
    commonMistakes: ["Предсказывать исход спора.", "Выдавать неподтверждённый суд за определённый.", "Подменять мнение ребёнка текстом родителя."],
    documentsToAttach: scenario.documents,
    attachments: scenario.documents,
    relatedProblems: [{ title: "Родители и ребёнок после развода", slug: problemSlug }],
    relatedSituations: [{ title: "Родители и ребёнок после развода", slug: problemSlug }],
    relatedDocuments: [],
    faq: [],
    relatedProblemSlugs: [problemSlug],
    legalReferenceKeys: [],
    seoTitle: `${title}: порядок и безопасная подготовка`,
    seoDescription: scenario.choiceDescription,
    generatorSeoTitle: `${title}: подготовить документ`,
    generatorSeoDescription: scenario.choiceDescription,
    keywords: queries,
    userQueries: queries,
    lastReviewedAt: PARENTS_CHILD_REVIEWED_AT,
    disclaimer: "Судебные документы, сложные случаи и неподтверждённые адресаты всегда маркируются как не готовые к подаче."
  };
}

export const PARENTS_CHILD_DOCUMENTS: NavigatorDocument[] = [
  createDocument("residence", "Место жительства ребёнка после развода", "Соглашение или черновик иска", ["с кем будет жить ребёнок после развода", "иск об определении места жительства ребёнка"]),
  createDocument("communication", "Порядок общения с ребёнком", "Соглашение или черновик иска", ["график общения с ребёнком", "не дают видеться с ребёнком"]),
  createDocument("change", "Изменение места жительства или порядка общения ребёнка", "Соглашение или судебный черновик", ["изменить график общения с ребёнком", "изменить место жительства ребёнка"]),
  createDocument("enforcement", "Исполнение решения о ребёнке", "Чек-лист или черновик обращения", ["не исполняют решение суда по ребёнку", "пристав порядок общения ребёнок"])
];
