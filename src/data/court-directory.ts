import { DIVORCE_PROPERTY_LEGAL_REVIEW } from "@/data/divorce-property-legal-review";

// The project has no verified court-region directory. Region stays a manual
// search parameter until an official machine-readable source is integrated.
export const COURT_REGIONS: string[] = [];

export const COURT_DIRECTORY = {
  sourceName: DIVORCE_PROPERTY_LEGAL_REVIEW.sources.courtSearch.title,
  sourceUrl: DIVORCE_PROPERTY_LEGAL_REVIEW.sources.courtSearch.href,
  lastVerifiedAt: DIVORCE_PROPERTY_LEGAL_REVIEW.reviewedAt,
  isComplete: false,
  machineVerificationAvailable: false,
  notice: "ПравоПоиск не определяет суд по адресу автоматически. Найдите суд в ГАС «Правосудие» и перенесите реквизиты без сокращений.",
  confirmedAutomaticRegions: [] as string[],
  regionalStatus: "Автоматически подтверждённых регионов нет. Регион вводится только как параметр поиска, а перенесённые реквизиты считаются введёнными пользователем и не проверенными ПравоПоиском."
} as const;

export function getCourtRegionalStatus(region: string | undefined) {
  return {
    region: region?.trim() || "Регион не выбран",
    automaticallyConfirmed: false,
    sourceUrl: COURT_DIRECTORY.sourceUrl,
    message: COURT_DIRECTORY.regionalStatus
  } as const;
}
