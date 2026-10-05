import { LABOR_LEGAL_REVIEWED_AT } from "@/data/labor-legal-sources";
import { LABOR_CATEGORY_SLUG, LABOR_ROUTES } from "@/data/labor-routes";
import type { LegalProblem } from "@/data/legal-problems";

export const LABOR_PROBLEMS: LegalProblem[] = LABOR_ROUTES.map((route) => ({
  slug: route.slug,
  categorySlug: LABOR_CATEGORY_SLUG,
  title: route.title,
  h1: route.h1,
  shortTitle: route.title,
  shortAnswer: route.lead,
  description: route.description,
  seoTitle: route.seoTitle,
  seoDescription: route.seoDescription,
  riskLevel: route.riskLevel,
  urgency: route.urgency,
  whatToKnow: route.whatToKnow,
  deadlines: route.scenarios.map((scenario) => scenario.deadline).filter((item): item is string => Boolean(item)),
  risks: route.risks,
  steps: route.scenarios[0]?.nextSteps ?? [],
  documents: route.documents,
  mistakes: ["Не использовать общий маршрут вместо профильного.", "Не считать предварительный результат готовым к подаче без проверки критических фактов."],
  faq: [],
  relatedDocumentSlugs: route.scenarios.map((scenario) => scenario.documentSlug).filter((item): item is string => Boolean(item)),
  legalReferenceKeys: [],
  relatedQuestionTopics: route.relatedQuestionTopics,
  relatedLawyerSpecializations: ["Трудовое право"],
  relatedProblemSlugs: route.relatedProblemSlugs,
  selfHelpConditions: ["Критические факты подтверждены документами.", "Не требуется индивидуальный расчет или восстановление пропущенного срока."],
  lawyerConditions: ["Есть риск пропуска срока.", "Оспаривается увольнение, квалификация отношений или крупная сумма.", "Нужно определить подсудность или окончательные требования."],
  lastReviewedAt: LABOR_LEGAL_REVIEWED_AT
}));
