import type { NavigatorDocument } from "@/data/documents";
import { INTERNATIONAL_FAMILY_DISPUTES_REVIEWED_AT } from "@/data/international-family-disputes-legal-review";
import { INTERNATIONAL_FAMILY_DISPUTES_ROUTE, INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS } from "@/data/international-family-disputes-route";

export const INTERNATIONAL_FAMILY_DISPUTES_DOCUMENT = {
  slug: INTERNATIONAL_FAMILY_DISPUTES_ROUTE.documentSlug,
  title: "Международный семейный спор: лист подготовленных данных", category: "семейное право", documentType: "Лист подготовленных данных",
  shortTitle: "Лист данных по международному спору", titleAccusative: "лист подготовленных данных", documentTypeAccusative: "лист подготовленных данных",
  shortIntro: "Подготовьте факты для проверки юрисдикции, применимого права и международного договора.",
  shortDescription: "Персональный перечень государств, мест проживания, решений и документов по международному семейному спору.",
  description: "Лист не является иском, ходатайством или официальной формой.",
  heroDescription: "Выберите предмет вопроса. Сервис соберёт сведения, но не назначит суд и не определит применимое право.",
  whenToUse: Object.values(INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS).map((scenario) => scenario.summary),
  whenNotToUse: ["Если нужен готовый к подаче иск или автоматический выбор суда."],
  beforeFillingChecklist: ["Соберите документы о гражданстве и проживании.", "Подготовьте иностранные решения и соглашения, если они есть."],
  requiredData: ["Государства, гражданство, проживание, страна ребёнка, предмет спора, решения и сведения о договоре."],
  whatToPrepare: ["Паспорта, документы о проживании, решения, соглашения и иностранные документы."],
  whatToInclude: ["Только подтверждённые сведения и точные даты."],
  howToFill: ["Выберите сценарий.", "Ответьте по имеющимся документам.", "Скачайте лист и передайте юристу."],
  whereToFile: "Лист не подаётся. Компетентный орган определяется индивидуально.", whereToSubmit: "Лист не подаётся.",
  filingProcedure: ["Сначала проверьте юрисдикцию, применимое право и международный договор."], howToSubmit: ["Не используйте PDF вместо процессуального документа."],
  legalBasis: ["Статьи 160, 163–164 СК РФ; статьи 402, 408–409 и глава 45 ГПК РФ; применимые международные договоры."],
  deadlinesAndFees: ["Не рассчитываются без определения процедуры."], stateDuty: ["Не рассчитывается."], deadlines: ["Определяются после юридической проверки."],
  afterFiling: ["Лист не предназначен для подачи."], importantFactsToFix: ["Гражданство и проживание участников, страна ребёнка, даты, решения и договоры."],
  mistakes: ["Выбирать суд только по гражданству."], commonMistakes: ["Считать иностранное решение автоматически исполнимым."],
  documentsToAttach: [], attachments: [],
  relatedProblems: [{ title: "Международные семейные споры", slug: INTERNATIONAL_FAMILY_DISPUTES_ROUTE.problemSlug }],
  relatedSituations: [{ title: "Международные семейные споры", slug: INTERNATIONAL_FAMILY_DISPUTES_ROUTE.problemSlug }], relatedDocuments: [], faq: [],
  relatedProblemSlugs: [INTERNATIONAL_FAMILY_DISPUTES_ROUTE.problemSlug], legalReferenceKeys: [],
  seoTitle: "Международный семейный спор: подготовить сведения", seoDescription: "Лист сведений по спору о ребёнке, иностранному решению, алиментам или документам.",
  generatorSeoTitle: "Лист данных по международному семейному спору", generatorSeoDescription: "Подготовка фактов без автоматического определения суда и права.",
  keywords: ["международный семейный спор", "ребёнок за границей", "признать иностранное решение", "алименты за границей"],
  userQueries: ["ребенка увезли в другую страну", "как признать иностранное решение о ребенке", "алименты если отец за границей"],
  lastReviewedAt: INTERNATIONAL_FAMILY_DISPUTES_REVIEWED_AT,
  disclaimer: "Лист не готов к подаче. Обязательна проверка специалистом по международному семейному праву."
} satisfies NavigatorDocument;
