export type DivorcePropertyLegalReviewStatus =
  | "verified-primary"
  | "primary-unavailable-supplementary-checked"
  | "manual-regional-check";

export type DivorcePropertyLegalRule = {
  id: string;
  statement: string;
  norm: string;
  officialUrl: string;
  supplementaryUrl?: string;
  reviewedAt: string;
  edition: string;
  scenarios: string[];
  region: "federal" | "regional";
  status: DivorcePropertyLegalReviewStatus;
  verificationNote?: string;
};

const reviewedAt = "2026-08-05";

export const DIVORCE_PROPERTY_LEGAL_RULES: DivorcePropertyLegalRule[] = [
  {
    id: "registry-divorce-grounds",
    statement: "Основание развода через ЗАГС определяет форму заявления, обязательные сведения и порядок регистрации.",
    norm: "СК РФ, статьи 19 и 25; Закон N 143-ФЗ, статьи 32-35",
    officialUrl: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102050119",
    supplementaryUrl: "https://www.consultant.ru/document/cons_doc_LAW_16758/",
    reviewedAt,
    edition: "консолидированная редакция проверена 05.08.2026",
    scenarios: ["registry-divorce", "court-divorce"],
    region: "federal",
    status: "primary-unavailable-supplementary-checked",
    verificationNote: "Официальный портал не отдал содержание документа при повторной проверке; реквизиты первичного источника сохранены, текст сверен по консолидированной редакции."
  },
  {
    id: "registry-forms-9-12",
    statement: "Для заявлений о расторжении брака используются утвержденные формы N 9-12; приблизительный внутренний бланк не создается.",
    norm: "Приказ Минюста России от 01.10.2018 N 201",
    officialUrl: "https://publication.pravo.gov.ru/Document/View/0001201810030017",
    supplementaryUrl: "https://www.consultant.ru/document/cons_doc_LAW_308185/",
    reviewedAt,
    edition: "действующая консолидированная редакция проверена 05.08.2026",
    scenarios: ["registry-divorce"],
    region: "federal",
    status: "primary-unavailable-supplementary-checked",
    verificationNote: "Официальная публикация временно не открылась; номер и структура форм дополнительно сверены по консолидированной редакции."
  },
  {
    id: "court-divorce-and-article-17",
    statement: "Судебный порядок развода и ограничение права мужа на иск применяются только при установленных законом обстоятельствах.",
    norm: "СК РФ, статьи 17 и 21-24",
    officialUrl: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102038925",
    supplementaryUrl: "https://www.consultant.ru/document/cons_doc_LAW_8982/",
    reviewedAt,
    edition: "консолидированная редакция проверена 05.08.2026",
    scenarios: ["court-divorce", "property-claim"],
    region: "federal",
    status: "primary-unavailable-supplementary-checked",
    verificationNote: "Официальный портал временно не отдал содержание; применимые разъяснения также проверены на официальном сайте Верховного Суда РФ."
  },
  {
    id: "court-jurisdiction",
    statement: "Родовая и территориальная подсудность зависят от состава требований, цены иска и подтвержденного адресного основания.",
    norm: "ГПК РФ, статьи 23, 24 и 28-30",
    officialUrl: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102078828",
    supplementaryUrl: "https://www.consultant.ru/document/cons_doc_LAW_39570/",
    reviewedAt,
    edition: "консолидированная редакция проверена 05.08.2026",
    scenarios: ["court-divorce", "property-claim"],
    region: "federal",
    status: "primary-unavailable-supplementary-checked",
    verificationNote: "Конкретный суд определяется только после проверки полного адреса в официальном судебном сервисе."
  },
  {
    id: "court-directory",
    statement: "Полный адрес, а не один регион, используется для поиска конкретного суда или мирового участка.",
    norm: "ГАС РФ 'Правосудие': поиск по территориальной подсудности",
    officialUrl: "https://sudrf.ru/index.php?id=300",
    reviewedAt,
    edition: "официальный сервис, проверен 05.08.2026",
    scenarios: ["court-divorce", "property-claim"],
    region: "federal",
    status: "verified-primary"
  },
  {
    id: "claim-content",
    statement: "Иск и приложения должны содержать сведения и подтверждения, предусмотренные процессуальным законом.",
    norm: "ГПК РФ, статьи 91, 131 и 132",
    officialUrl: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102078828",
    supplementaryUrl: "https://www.consultant.ru/document/cons_doc_LAW_39570/",
    reviewedAt,
    edition: "консолидированная редакция проверена 05.08.2026",
    scenarios: ["court-divorce", "property-claim"],
    region: "federal",
    status: "primary-unavailable-supplementary-checked"
  },
  {
    id: "property-division",
    statement: "Режим имущества, доли, соглашение и судебный раздел определяются после проверки состава имущества и прав третьих лиц.",
    norm: "СК РФ, статьи 34-39; Постановление Пленума ВС РФ от 05.11.1998 N 15",
    officialUrl: "https://www.vsrf.ru/documents/own/7783/",
    reviewedAt,
    edition: "официальная публикация Верховного Суда РФ, проверена 05.08.2026",
    scenarios: ["property-agreement", "property-claim"],
    region: "federal",
    status: "verified-primary"
  },
  {
    id: "court-duty",
    statement: "Пошлина рассчитывается по каждому самостоятельному требованию; цену иска указывает истец, а при ошибке ее определяет суд.",
    norm: "НК РФ, статьи 333.19, 333.20, 333.36 и 333.41; Постановление Пленума ВС РФ от 23.12.2025 N 39, пункты 16-22",
    officialUrl: "https://www.vsrf.ru/documents/own/35290/",
    reviewedAt,
    edition: "официальная публикация Верховного Суда РФ, проверена 05.08.2026",
    scenarios: ["court-divorce", "property-claim"],
    region: "federal",
    status: "verified-primary"
  },
  {
    id: "notary-tariff",
    statement: "Проект соглашения требует нотариального удостоверения; региональная часть нотариального тарифа не рассчитывается без официальных данных субъекта РФ.",
    norm: "СК РФ, статья 38; Основы законодательства РФ о нотариате, статьи 22 и 22.1; НК РФ, статья 333.24",
    officialUrl: "https://notariat.ru/ru-ru/actions-and-tariffs/regional-rates/",
    supplementaryUrl: "https://www.consultant.ru/document/cons_doc_LAW_1581/",
    reviewedAt,
    edition: "федеральная нормативная цепочка проверена 05.08.2026; региональная часть определяется вручную",
    scenarios: ["property-agreement"],
    region: "regional",
    status: "manual-regional-check",
    verificationNote: "Автоматически подтвержденных региональных тарифов в проекте нет."
  }
];

export const DIVORCE_PROPERTY_LEGAL_REVIEW = {
  reviewedAt,
  maxAgeDays: 180,
  sources: {
    civilProcedure: {
      title: "ГПК РФ: официальная публикация и контрольная сверка",
      href: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102078828",
      edition: "официальный портал временно недоступен; консолидированная редакция проверена 05.08.2026"
    },
    courtSearch: {
      title: "ГАС РФ 'Правосудие': поиск по территориальной подсудности",
      href: "https://sudrf.ru/index.php?id=300",
      edition: "официальный сервис, проверен 05.08.2026"
    },
    notaryFundamentals: {
      title: "Основы законодательства РФ о нотариате: статьи 22 и 22.1",
      href: "https://www.consultant.ru/document/cons_doc_LAW_1581/dca39e6d6491d8760cc41573ddd5f7500a86834a/",
      edition: "контрольная консолидированная редакция проверена 05.08.2026"
    },
    supremeCourtDuty: {
      title: "Постановление Пленума ВС РФ от 23.12.2025 N 39",
      href: "https://www.vsrf.ru/documents/own/35290/",
      edition: "официальная публикация Верховного Суда РФ, проверена 05.08.2026"
    }
  }
} as const;

export function getDivorcePropertyLegalReviewDate(scenarioKey?: string) {
  const dates = DIVORCE_PROPERTY_LEGAL_RULES
    .filter((rule) => !scenarioKey || rule.scenarios.includes(scenarioKey))
    .map((rule) => rule.reviewedAt)
    .sort();
  return dates.at(-1) ?? DIVORCE_PROPERTY_LEGAL_REVIEW.reviewedAt;
}

export function isDivorcePropertyLegalReviewCurrent(now = new Date()) {
  const reviewed = getDivorcePropertyLegalReviewDate();
  const checkedAt = new Date(`${reviewed}T00:00:00Z`);
  const ageDays = (now.getTime() - checkedAt.getTime()) / 86_400_000;
  return Number.isFinite(ageDays) && ageDays >= 0 && ageDays <= DIVORCE_PROPERTY_LEGAL_REVIEW.maxAgeDays;
}

export function isDivorcePropertyLegalReviewFullyPrimaryVerified(scenarioKey?: string) {
  return DIVORCE_PROPERTY_LEGAL_RULES
    .filter((rule) => !scenarioKey || rule.scenarios.includes(scenarioKey))
    .every((rule) => rule.status === "verified-primary");
}
