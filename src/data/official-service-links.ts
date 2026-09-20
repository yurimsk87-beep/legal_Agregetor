export type OfficialServiceKind = "court" | "notary" | "fssp" | "zags" | "guardianship";

export type OfficialServiceLink = {
  kind: OfficialServiceKind;
  label: string;
  url: string | null;
  description: string;
  checkedAt: string;
  source: string;
};

export const OFFICIAL_SERVICE_LINKS: Record<OfficialServiceKind, OfficialServiceLink> = {
  court: {
    kind: "court",
    label: "Найти суд и проверить подсудность",
    url: "https://sudrf.ru/index.php?id=300",
    description: "Ищите по полному адресу и затем переносите реквизиты только с официальной страницы найденного суда.",
    checkedAt: "2026-09-20",
    source: "ГАС РФ «Правосудие»"
  },
  notary: {
    kind: "notary",
    label: "Найти нотариуса",
    url: "https://data.notariat.ru/directory/notary/",
    description: "Откройте официальный реестр ФНП, выберите регион и проверьте адрес и график нотариуса.",
    checkedAt: "2026-09-20",
    source: "Федеральная нотариальная палата"
  },
  fssp: {
    kind: "fssp",
    label: "Открыть официальный сервис ФССП",
    url: "https://fssp.gov.ru/iss/ip",
    description: "Проверьте исполнительное производство и переходите к подразделению только через официальный ресурс ФССП.",
    checkedAt: "2026-09-20",
    source: "Федеральная служба судебных приставов"
  },
  zags: {
    kind: "zags",
    label: "Открыть услугу ЗАГС на Госуслугах",
    url: "https://www.gosuslugi.ru/600101/1/form",
    description: "Это федеральная точка входа. Доступный способ подачи и конкретный орган зависят от услуги и региона.",
    checkedAt: "2026-09-20",
    source: "Единый портал государственных услуг"
  },
  guardianship: {
    kind: "guardianship",
    label: "Найти орган опеки",
    url: null,
    description: "Единого подтверждённого федерального справочника нет. Используйте проверенный территориальный выбор ПравоПоиска; если орган не найден, откройте официальный сайт региона и подтвердите компетенцию до подготовки адресата.",
    checkedAt: "2026-09-20",
    source: "Региональные официальные источники"
  }
};

export function getOfficialServiceForField(fieldName: string): OfficialServiceKind | null {
  const value = fieldName.toLowerCase();
  if (/(court|sud)/.test(value)) return "court";
  if (/(notary|notarial)/.test(value)) return "notary";
  if (/(bailiff|fssp|enforcement)/.test(value)) return "fssp";
  if (/(zags|voluntarybasis)/.test(value)) return "zags";
  if (/(authorityname|guardianshipauthority|^authority$)/.test(value)) return "guardianship";
  return null;
}

