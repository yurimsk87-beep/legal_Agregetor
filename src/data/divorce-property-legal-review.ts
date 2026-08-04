export const DIVORCE_PROPERTY_LEGAL_REVIEW = {
  reviewedAt: "2026-08-04",
  maxAgeDays: 180,
  sources: {
    civilProcedure: {
      title: "ГПК РФ: действующая редакция",
      href: "https://www.consultant.ru/document/cons_doc_LAW_39570/",
      edition: "ред. от 04.07.2026"
    },
    courtSearch: {
      title: "ГАС РФ «Правосудие»: поиск по территориальной подсудности",
      href: "https://sudrf.ru/index.php?id=300",
      edition: "официальный сервис"
    },
    notaryFundamentals: {
      title: "Основы законодательства РФ о нотариате: статьи 22 и 22.1",
      href: "https://www.consultant.ru/document/cons_doc_LAW_1581/dca39e6d6491d8760cc41573ddd5f7500a86834a/",
      edition: "ред. от 10.06.2026"
    },
    supremeCourtDuty: {
      title: "Постановление Пленума ВС РФ от 23.12.2025 N 39",
      href: "https://www.vsrf.ru/documents/own/35290/",
      edition: "официальная публикация Верховного Суда РФ"
    }
  }
} as const;

export function isDivorcePropertyLegalReviewCurrent(now = new Date()) {
  const reviewedAt = new Date(`${DIVORCE_PROPERTY_LEGAL_REVIEW.reviewedAt}T00:00:00Z`);
  const ageDays = (now.getTime() - reviewedAt.getTime()) / 86_400_000;
  return Number.isFinite(ageDays) && ageDays >= 0 && ageDays <= DIVORCE_PROPERTY_LEGAL_REVIEW.maxAgeDays;
}
