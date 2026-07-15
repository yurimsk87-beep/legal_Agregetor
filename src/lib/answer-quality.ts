import { hasForbiddenContact } from "./contact-safety";

export type AnswerQualityResult = {
  score: number;
  containsContactAttempt: boolean;
  containsUnsupportedLegalClaim: boolean;
  containsFearPressure: boolean;
  containsGenericLeadBait: boolean;
  legalReferencesVerified: boolean;
  reviewStatus: "APPROVED" | "NEEDS_REVISION" | "BLOCKED";
  reviewReason: string | null;
};

export function analyzeLawyerAnswerQuality(text: string): AnswerQualityResult {
  const containsContactAttempt = hasForbiddenContact(text);
  const containsFearPressure = detectFearPressure(text);
  const containsGenericLeadBait = detectGenericLeadBait(text);
  const containsUnsupportedLegalClaim = detectUnsupportedLegalReference(text);
  const legalReferencesVerified = !containsUnsupportedLegalClaim && detectLegalReference(text);
  const score = containsContactAttempt
    ? 0
    : calculateAnswerQualityScore(text) -
      (containsFearPressure ? 20 : 0) -
      (containsGenericLeadBait ? 25 : 0) -
      (containsUnsupportedLegalClaim ? 30 : 0);
  const normalizedScore = Math.max(0, Math.min(100, score));
  const reviewStatus = containsContactAttempt ? "BLOCKED" : normalizedScore >= 60 ? "APPROVED" : "NEEDS_REVISION";
  const reviewReason = buildReviewReason({
    containsContactAttempt,
    containsFearPressure,
    containsGenericLeadBait,
    containsUnsupportedLegalClaim,
    score: normalizedScore
  });

  return {
    score: normalizedScore,
    containsContactAttempt,
    containsUnsupportedLegalClaim,
    containsFearPressure,
    containsGenericLeadBait,
    legalReferencesVerified,
    reviewStatus,
    reviewReason
  };
}

export function calculateAnswerQualityScore(text: string) {
  const trimmed = text.trim();
  const lengthScore = trimmed.length >= 700 ? 35 : trimmed.length >= 300 ? 25 : trimmed.length >= 120 ? 18 : 8;
  const structureScore = /(?:\n|^)\s*(?:\d+\.|-|Что важно|Документы|Следующий шаг|Срок|Риск)/i.test(trimmed) ? 20 : 10;
  const usefulSignals = /(срок|документ|иск|суд|договор|жалоб|претенз|приказ|постановлен|доказательств|нотари|пристав)/i.test(trimmed)
    ? 25
    : 12;
  const calmToneScore = detectFearPressure(trimmed) ? 0 : 10;
  const noLeadBaitScore = detectGenericLeadBait(trimmed) ? 0 : 10;

  return Math.min(100, lengthScore + structureScore + usefulSignals + calmToneScore + noLeadBaitScore);
}

export function detectGenericLeadBait(text: string) {
  return /(обращайтесь в личн|пишите мне|звоните|контакты в профиле|помогу за оплат|только на консультации|без изучения не отвечу|свяжитесь напрямую)/i.test(text);
}

export function detectFearPressure(text: string) {
  return /(срочно иначе|вы точно проиграете|останетесь без всего|последний шанс|немедленно оплатите|катастроф|без вариантов|гарантирую проигрыш)/i.test(text);
}

export function detectUnsupportedLegalReference(text: string) {
  const suspiciousArticle = /ст\.?\s*\d{3,4}\s*(?:гк|ук|гпк|коап|тк|ск|жк)\s*рф/i.test(text);
  const vagueFakeSignal = /(по закону 202[7-9]|новый федеральный закон без номера|статья закона о юридической помощи)/i.test(text);
  return suspiciousArticle || vagueFakeSignal;
}

function detectLegalReference(text: string) {
  return /(ст\.?\s*\d+|гк рф|ук рф|гпк рф|коап рф|тк рф|ск рф|жк рф|федеральн(ый|ого) закон)/i.test(text);
}

function buildReviewReason(input: {
  containsContactAttempt: boolean;
  containsFearPressure: boolean;
  containsGenericLeadBait: boolean;
  containsUnsupportedLegalClaim: boolean;
  score: number;
}) {
  const reasons = [
    input.containsContactAttempt ? "Ответ содержит контакт или попытку увести пользователя с платформы." : null,
    input.containsGenericLeadBait ? "Ответ похож на лидоген без полезного разбора." : null,
    input.containsFearPressure ? "В ответе есть давление или запугивание пользователя." : null,
    input.containsUnsupportedLegalClaim ? "Нужно вручную проверить правовую ссылку или категоричный вывод." : null,
    input.score < 60 ? "Ответу не хватает структуры, фактов или полезного следующего шага." : null
  ].filter(Boolean);

  return reasons.length ? reasons.join(" ") : null;
}
