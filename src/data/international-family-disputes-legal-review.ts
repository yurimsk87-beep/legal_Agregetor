import type { InternationalFamilyDisputesKey } from "@/data/international-family-disputes-route";

export const INTERNATIONAL_FAMILY_DISPUTES_REVIEWED_AT = "2026-09-17";
export const INTERNATIONAL_FAMILY_DISPUTES_RULES: {
  id: string; statement: string; norm: string; officialSource: string; url: string;
  checkedAt: string; scope: string; scenarios: InternationalFamilyDisputesKey[]; limitations: string;
}[] = [
  {
    id: "sk-160-164", statement: "Российские коллизионные нормы связывают разные семейные вопросы с разными обстоятельствами, включая гражданство и совместное место жительства участников.",
    norm: "статьи 160, 163 и 164 СК РФ", officialSource: "Официальный сайт Президента РФ, текст кодекса", url: "https://www.kremlin.ru/acts/bank/8671/print",
    checkedAt: INTERNATIONAL_FAMILY_DISPUTES_REVIEWED_AT, scope: "Расторжение брака, отношения родителей и детей, алиментные обязательства с иностранным элементом.",
    scenarios: ["parental", "maintenance", "documents"], limitations: "Маршрут собирает связующие факты, но не определяет применимое право автоматически."
  },
  {
    id: "gpk-402", statement: "Компетенция российских судов по делам с иностранными лицами устанавливается процессуальными нормами и международными договорами, а не одним гражданством участника.",
    norm: "статья 402 ГПК РФ", officialSource: "Верховный Суд РФ, опубликованный текст ГПК РФ", url: "https://vsrf.ru/Show_pdf.php?Id=9940",
    checkedAt: INTERNATIONAL_FAMILY_DISPUTES_REVIEWED_AT, scope: "Потенциальная международная подсудность.", scenarios: ["child", "parental", "maintenance", "documents"],
    limitations: "Компетентный суд не выбирается без проверки актуального текста, договора и фактов конкретного дела."
  },
  {
    id: "gpk-408-409", statement: "Иностранные документы и решения имеют разные режимы принятия, признания и исполнения; перевод, легализация и международный договор проверяются отдельно.",
    norm: "статьи 408 и 409, глава 45 ГПК РФ", officialSource: "Верховный Суд РФ, опубликованный текст ГПК РФ", url: "https://vsrf.ru/Show_pdf.php?Id=9940",
    checkedAt: INTERNATIONAL_FAMILY_DISPUTES_REVIEWED_AT, scope: "Иностранные документы и судебные решения.", scenarios: ["recognition", "maintenance", "documents"],
    limitations: "Опубликованная копия кодекса используется как официальный ориентир; действующую редакцию и применимый договор нужно перепроверить перед подачей."
  },
  {
    id: "hcch-1980", statement: "Для возврата ребёнка по Конвенции 1980 года необходимо проверить участие государств и принятие присоединения между конкретной парой государств.",
    norm: "Конвенция от 25.10.1980 о гражданско-правовых аспектах международного похищения детей", officialSource: "Гаагская конференция по международному частному праву, статусный реестр", url: "https://www.hcch.net/en/instruments/conventions/status-table?cid=24",
    checkedAt: INTERNATIONAL_FAMILY_DISPUTES_REVIEWED_AT, scope: "Трансграничное перемещение или удержание ребёнка.", scenarios: ["child"],
    limitations: "Сам факт участия России не подтверждает действие Конвенции между любыми двумя государствами; проверяется таблица принятия присоединений."
  },
  {
    id: "vs-plenum-24", statement: "При отношениях с иностранным элементом суд квалифицирует отношения и устанавливает содержание применимого иностранного права по специальным правилам.",
    norm: "Постановление Пленума ВС РФ от 09.07.2019 № 24", officialSource: "Верховный Суд РФ", url: "https://www.vsrf.ru/files/28073/",
    checkedAt: INTERNATIONAL_FAMILY_DISPUTES_REVIEWED_AT, scope: "Определение и применение иностранного права российским судом.", scenarios: ["child", "parental", "recognition", "maintenance", "documents"],
    limitations: "Разъяснение не позволяет сервису заменить судебную квалификацию или заключение специалиста по иностранному праву."
  }
];

export function getInternationalFamilyDisputesRules(key: InternationalFamilyDisputesKey) {
  return INTERNATIONAL_FAMILY_DISPUTES_RULES.filter((rule) => rule.scenarios.includes(key));
}
