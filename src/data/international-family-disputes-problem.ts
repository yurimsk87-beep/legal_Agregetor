import type { LegalProblem } from "@/data/legal-problems";
import { INTERNATIONAL_FAMILY_DISPUTES_REVIEWED_AT } from "@/data/international-family-disputes-legal-review";
import { INTERNATIONAL_FAMILY_DISPUTES_ROUTE } from "@/data/international-family-disputes-route";

export const INTERNATIONAL_FAMILY_DISPUTES_PROBLEM = {
  slug: INTERNATIONAL_FAMILY_DISPUTES_ROUTE.problemSlug, categorySlug: INTERNATIONAL_FAMILY_DISPUTES_ROUTE.categorySlug,
  title: "Международные семейные споры", h1: "Международные семейные споры", shortTitle: "Международный семейный спор",
  shortAnswer: "Соберите гражданство, места проживания, страну нахождения ребёнка, решения и возможные договоры без автоматического выбора суда или права.",
  description: "Пять безопасных сценариев для семейных ситуаций с иностранным элементом.",
  seoTitle: "Международные семейные споры: ребёнок, решения и алименты",
  seoDescription: "Подготовьте факты по трансграничному спору о ребёнке, иностранному решению, алиментам или документам для юридической проверки.",
  riskLevel: "high", urgency: "standard",
  whatToKnow: ["Гражданство само по себе не определяет суд и применимое право.", "Действие международного договора проверяется для конкретных государств и даты."],
  deadlines: ["Сроки зависят от предмета спора, государства и применимой процедуры; маршрут их не рассчитывает."],
  risks: ["Обратиться не в тот суд или орган.", "Ошибочно считать иностранное решение автоматически действующим.", "Пропустить срочные меры при перемещении ребёнка."],
  steps: ["Выберите предмет вопроса.", "Зафиксируйте государства, гражданство и проживание участников.", "Соберите решения и документы.", "Передайте лист на международную юридическую проверку."],
  documents: ["Персональный лист данных, не являющийся заявлением или иском."],
  mistakes: ["Автоматически выбирать применимое право.", "Считать любой международный договор действующим между любыми государствами."],
  faq: [
    { question: "Маршрут выберет российский или иностранный суд?", answer: "Нет. Потенциальная юрисдикция определяется только после проверки всех фактов и договоров." },
    { question: "PDF можно подать в суд?", answer: "Нет. Это лист подготовленных данных для юридической проверки." }
  ],
  relatedDocumentSlugs: [INTERNATIONAL_FAMILY_DISPUTES_ROUTE.documentSlug], legalReferenceKeys: [],
  relatedQuestionTopics: ["международный семейный спор", "ребёнок за границей", "иностранное решение", "алименты за границей"],
  relatedLawyerSpecializations: ["семейное право", "международное частное право"],
  relatedProblemSlugs: ["roditeli-i-rebenok-posle-razvoda", "alimenty-na-rebenka", "vyezd-rebenka-za-granitsu"],
  selfHelpConditions: ["сбор фактов и документов"], lawyerConditions: ["любой сценарий маршрута"],
  heroNote: { title: "Только подготовка данных", text: "Сервис не определяет применимое право, компетентный суд или действие договора." },
  lastReviewedAt: INTERNATIONAL_FAMILY_DISPUTES_REVIEWED_AT
} satisfies LegalProblem;
