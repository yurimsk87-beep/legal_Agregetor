import zagsDirectoryJson from "@/data/zags-offices.json";
import { DIVORCE_PROPERTY_LEGAL_REVIEW } from "@/data/divorce-property-legal-review";

type RegionDirectory = {
  regions: Record<string, string[]>;
};

const regionDirectory = zagsDirectoryJson as RegionDirectory;

export const COURT_REGIONS = Object.keys(regionDirectory.regions).sort((left, right) => left.localeCompare(right, "ru"));

export const COURT_DIRECTORY = {
  sourceName: DIVORCE_PROPERTY_LEGAL_REVIEW.sources.courtSearch.title,
  sourceUrl: DIVORCE_PROPERTY_LEGAL_REVIEW.sources.courtSearch.href,
  lastVerifiedAt: DIVORCE_PROPERTY_LEGAL_REVIEW.reviewedAt,
  isComplete: false,
  notice: "Список судебных участков не хранится в сервисе. Найдите участок по адресу в ГАС «Правосудие» и перенесите его официальные реквизиты без сокращений."
} as const;
