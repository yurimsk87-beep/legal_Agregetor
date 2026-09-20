export type LegalSourceType = "primary" | "secondary";

export type FamilyLegalSource = {
  title: string;
  norm: string;
  url: string;
  checkedAt: string;
  sourceType: LegalSourceType;
  limitation: string;
};

export const FAMILY_TOOLS_CHECKED_AT = "2026-09-20";

export const NK_FNS_SOURCE: FamilyLegalSource = {
  title: "ФНС России: Налоговый кодекс РФ",
  norm: "статьи 333.19, 333.20 и 333.36 НК РФ",
  url: "https://www.nalog.gov.ru/html/nk.htm",
  checkedAt: FAMILY_TOOLS_CHECKED_AT,
  sourceType: "primary",
  limitation: "Официальный ресурс ФНС. Перед оплатой нужно повторно проверить льготу, состав требований и реквизиты конкретного суда."
};

export const COURT_FEE_AMENDMENT_SOURCE: FamilyLegalSource = {
  title: "Официальное опубликование правовых актов",
  norm: "Федеральный закон от 08.08.2024 № 259-ФЗ",
  url: "https://publication.pravo.gov.ru/document/0001202408080089",
  checkedAt: FAMILY_TOOLS_CHECKED_AT,
  sourceType: "primary",
  limitation: "Первичный источник изменений ставок судебной госпошлины. Для текущей консолидированной редакции НК РФ выполнена дополнительная сверка."
};

export const NK_CONSULTANT_SOURCE: FamilyLegalSource = {
  title: "КонсультантПлюс",
  norm: "актуальная консолидированная редакция НК РФ",
  url: "https://www.consultant.ru/document/cons_doc_LAW_28165/",
  checkedAt: FAMILY_TOOLS_CHECKED_AT,
  sourceType: "secondary",
  limitation: "Резервный вторичный источник для сверки консолидированного текста после проверки официальных источников; не является государственным официальным опубликованием."
};

export const FAMILY_CODE_OFFICIAL_SOURCE: FamilyLegalSource = {
  title: "Официальный интернет-портал правовой информации",
  norm: "Семейный кодекс РФ",
  url: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102038925",
  checkedAt: FAMILY_TOOLS_CHECKED_AT,
  sourceType: "primary",
  limitation: "Применимость нормы зависит от фактов конкретной семейной ситуации."
};
