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
  publicApiDocumentationFound: false,
  openJurisdictionDatasetFound: false,
  integrationDocumentationPath: "docs/integrations/gas-pravosudie.md",
  directServerAccessNote: "При прямой серверной проверке наблюдался HTTP 403. Пользовательская форма не является документированным API.",
  forbiddenIntegrationMethods: [
    "production HTML scraping",
    "undocumented query parameters as API",
    "HTTP 403 or geographic restriction bypass",
    "iframe embedding without official permission",
    "unverified local territorial-jurisdiction database"
  ],
  regionDirectoryStatus: "ФИАС подтверждена ФНС как официальный адресный ресурс, но доступный и пригодный для синхронизации перечень субъектов получить и проверить 05.08.2026 не удалось. Регион остаётся ручным полем.",
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
