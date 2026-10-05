import { getLaborRulesForArea, LABOR_LEGAL_REVIEWED_AT } from "@/data/labor-legal-sources";
import { LABOR_ROUTES, type LaborRoute, type LaborScenario } from "@/data/labor-routes";
import type { NavigatorDocument } from "@/data/documents";

export type LaborDocumentScenario = {
  route: LaborRoute;
  scenario: LaborScenario & { documentSlug: string };
};

const documentScenarios: LaborDocumentScenario[] = LABOR_ROUTES.flatMap((route) =>
  route.scenarios.flatMap((scenario) => scenario.documentSlug
    ? [{ route, scenario: scenario as LaborDocumentScenario["scenario"] }]
    : [])
);

export const LABOR_DOCUMENTS: NavigatorDocument[] = documentScenarios.map(({ route, scenario }) => {
  const rules = getLaborRulesForArea(route.areaId);
  const documentType = getDocumentType(scenario.resultTitle);
  const legalBasis = rules.map((rule) => `${rule.act}, ${rule.provisions.join(", ")}`);

  return {
    slug: scenario.documentSlug,
    title: scenario.resultTitle,
    category: "Трудовое право",
    documentType,
    shortTitle: scenario.resultTitle,
    titleAccusative: scenario.resultTitle.toLowerCase(),
    documentTypeAccusative: documentType.toLowerCase(),
    shortIntro: `Подготовьте ${documentType.toLowerCase()} по подтвержденным обстоятельствам трудовой ситуации.`,
    shortDescription: `${scenario.resultTitle}: пошаговое заполнение, проверенные правовые основания, PDF и передача профильному юристу.`,
    description: `Сервис помогает подготовить связный проект документа «${scenario.resultTitle}» по выбранному трудовому сценарию. Неподтвержденные адресат, срок, расчет и иные критические сведения не подменяются предположениями.`,
    heroDescription: `Заполните сведения по документам и переписке. Сервис сформирует проект, покажет применимые нормы и дальнейшие действия. Готовность к подаче подтверждается только после юридической проверки.`,
    whenToUse: [scenario.description, ...route.whatToKnow.slice(0, 2)],
    whenNotToUse: route.exclusions.length ? route.exclusions : ["Ситуация относится к другому трудовому маршруту."],
    beforeFillingChecklist: [
      "Проверьте даты и содержание документов работодателя.",
      "Подготовьте сведения об участниках и адресате без лишних персональных данных.",
      "Отдельно проверьте срок обращения, если нарушение уже состоялось."
    ],
    requiredData: scenario.questions,
    whatToPrepare: route.documents,
    whatToInclude: ["Адресат и сведения об участниках.", "Подтвержденные обстоятельства.", "Предметная просьба или требования.", "Перечень приложений, дата и подпись."],
    howToFill: ["Вносите только подтвержденные сведения.", "Не указывайте точный суд или орган, если он не проверен.", "После редактирования явно сформируйте новую версию документа."],
    whereToFile: scenario.authority.join(", "),
    whereToSubmit: scenario.authority.join(", "),
    filingProcedure: scenario.nextSteps,
    howToSubmit: scenario.nextSteps,
    legalBasis,
    deadlinesAndFees: [scenario.deadline, scenario.stateDuty, scenario.payments].filter((item): item is string => Boolean(item)),
    stateDuty: scenario.stateDuty ? [scenario.stateDuty] : ["Применимость госпошлины проверяется по типу требования и статусу заявителя."],
    deadlines: scenario.deadline ? [scenario.deadline] : ["Специальный срок проверяется по предмету требования и подтвержденным датам."],
    afterFiling: scenario.nextSteps,
    importantFactsToFix: scenario.questions,
    mistakes: ["Указывать непроверенный адресат.", "Пропускать специальный срок.", "Добавлять обстоятельства без подтверждения."],
    commonMistakes: ["Подменять факты оценочными формулировками.", "Ссылаться на нормы, которые не относятся к выбранному сценарию."],
    documentsToAttach: route.documents,
    attachments: route.documents,
    relatedProblems: [{ title: route.title, slug: route.slug }],
    relatedSituations: [{ title: route.title, slug: route.slug }],
    relatedDocuments: [],
    faq: [],
    relatedProblemSlugs: [route.slug],
    legalReferenceKeys: [],
    seoTitle: `${scenario.resultTitle}: подготовить документ онлайн`,
    seoDescription: `Подготовьте ${scenario.resultTitle.toLowerCase()} по трудовой ситуации: проверенные нормы, редактирование данных, PDF и юридическая проверка.`,
    generatorSeoTitle: `${scenario.resultTitle}: заполнить онлайн`,
    generatorSeoDescription: `Пошаговая подготовка документа «${scenario.resultTitle}» с проверенными правовыми основаниями и безопасным статусом готовности.`,
    keywords: [...route.aliases, ...route.relatedQuestionTopics, documentType],
    userQueries: route.aliases,
    lastReviewedAt: LABOR_LEGAL_REVIEWED_AT,
    disclaimer: "Результат формируется как проект для юридической проверки. Неподтвержденные реквизиты и правовые выводы не считаются готовыми к подаче."
  };
});

export function getLaborDocumentScenario(documentSlug: string): LaborDocumentScenario | null {
  return documentScenarios.find(({ scenario }) => scenario.documentSlug === documentSlug) ?? null;
}

function getDocumentType(title: string) {
  if (/^Иск/i.test(title)) return "Исковое заявление";
  if (/^Жалоба/i.test(title)) return "Жалоба";
  if (/^Заявление/i.test(title)) return "Заявление";
  if (/^Запрос/i.test(title)) return "Запрос";
  if (/^Требование/i.test(title)) return "Требование";
  if (/^Отзыв/i.test(title)) return "Отзыв заявления";
  if (/^Возражения/i.test(title)) return "Возражения";
  return "Проект документа";
}
