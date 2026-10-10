import type { NavigatorDocument } from "@/data/documents";
import { FAMILY_ADDITIVE_ROUTES } from "@/data/family-additive-routes";

export const FAMILY_ADDITIVE_DOCUMENTS: NavigatorDocument[] = Object.values(FAMILY_ADDITIVE_ROUTES).flatMap((route) =>
  Object.values(route.scenarios).map((scenario) => ({
    slug: scenario.documentSlug,
    title: scenario.documentTitle,
    category: "Семья и дети",
    documentType: scenario.documentType,
    shortTitle: scenario.shortTitle,
    titleAccusative: scenario.documentTitle,
    documentTypeAccusative: scenario.documentType,
    shortIntro: scenario.choiceDescription,
    shortDescription: `${scenario.documentTitle}: проверьте применимый порядок, подготовьте сведения и получите персональный результат.`,
    description: `${scenario.documentTitle} для ситуации «${route.title}». Сервис проверяет обязательные сведения и не подменяет официальную форму или юридическую проверку.`,
    heroDescription: `${scenario.choiceDescription} Заполните подтверждённые сведения, сформируйте результат и при необходимости передайте его юристу.`,
    whenToUse: scenario.description,
    whenNotToUse: [scenario.warning],
    beforeFillingChecklist: scenario.steps,
    requiredData: scenario.helperFields.map((field) => field.label),
    whatToPrepare: scenario.documents,
    whatToInclude: scenario.helperFields.map((field) => field.label),
    howToFill: ["Укажите только подтверждённые сведения.", "Не оставляйте неподтверждённые реквизиты суда или органа.", "После изменения ответов сформируйте новую версию явно."],
    whereToFile: scenario.filing,
    whereToSubmit: scenario.filing,
    filingProcedure: scenario.steps,
    howToSubmit: scenario.steps,
    legalBasis: ["Применимые нормы и официальные источники приведены на странице документа."],
    deadlinesAndFees: [scenario.term, scenario.fee],
    stateDuty: [scenario.fee],
    deadlines: [scenario.term],
    afterFiling: scenario.steps,
    importantFactsToFix: scenario.helperFields.filter((field) => field.required).map((field) => field.label),
    mistakes: [scenario.warning, "Не используйте результат как готовый к подаче без проверки статуса и приложений."],
    commonMistakes: [scenario.warning, "Подмена официальной формы произвольным текстом."],
    documentsToAttach: scenario.documents,
    attachments: scenario.documents,
    relatedProblems: [{ title: route.title, slug: route.problemSlug }],
    relatedSituations: [{ title: route.title, slug: route.problemSlug }],
    relatedDocuments: Object.values(route.scenarios)
      .filter((item) => item.documentSlug !== scenario.documentSlug)
      .map((item) => ({ title: item.documentTitle, slug: item.documentSlug })),
    faq: [
      { question: "Можно ли сразу использовать результат?", answer: "Нет. Статус результата и обязательность юридической проверки указаны после формирования." },
      { question: "Можно ли изменить ответы?", answer: "Да. Ранее сформированная версия останется неизменной до явного формирования новой версии." }
    ],
    relatedProblemSlugs: [route.problemSlug],
    legalReferenceKeys: [],
    seoTitle: `${scenario.documentTitle}: образец, заполнить и скачать`,
    seoDescription: `${scenario.documentTitle}: когда применяется, какие сведения и документы нужны, как подготовить образец и скачать PDF для юридической проверки.`,
    generatorSeoTitle: `${scenario.documentTitle}: образец, заполнить онлайн и скачать`,
    generatorSeoDescription: `Заполните подтверждённые сведения, сформируйте ${scenario.documentTitle.toLowerCase()} и скачайте PDF либо отправьте результат на проверку юристу.`,
    keywords: [scenario.documentTitle.toLowerCase(), `${scenario.documentTitle.toLowerCase()} образец`, `${scenario.documentTitle.toLowerCase()} скачать`, route.title.toLowerCase()],
    userQueries: [scenario.choiceDescription, scenario.documentTitle, `как подготовить ${scenario.documentTitle.toLowerCase()}`],
    lastReviewedAt: route.legalReviewDate,
    disclaimer: "Результат не считается готовым к подаче, пока на странице прямо не указано обратное. Официальные формы открываются только из подтверждённого источника."
  }))
);
