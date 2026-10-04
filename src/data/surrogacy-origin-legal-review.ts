import type { SurrogacyOriginKey } from "@/data/surrogacy-origin-route";

export const SURROGACY_ORIGIN_REVIEWED_AT = "2026-09-18";
export const SURROGACY_ORIGIN_RULES: {
  id: string; statement: string; norm: string; officialSource: string; url: string;
  checkedAt: string; scope: string; scenarios: SurrogacyOriginKey[]; legalPath: string; limitations: string;
}[] = [
  {
    id: "sk-51", statement: "Запись предполагаемых родителей при суррогатном материнстве связана с предусмотренным статьёй 51 согласием женщины, родившей ребёнка.",
    norm: "пункты 4–6 статьи 51 СК РФ", officialSource: "Официальный интернет-портал правовой информации",
    url: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102038925", checkedAt: SURROGACY_ORIGIN_REVIEWED_AT,
    scope: "Запись родителей и специальные случаи изменения статуса супругов.",
    scenarios: ["registration", "consents", "origin", "dispute", "foreign"],
    legalPath: "Не подтверждать готовность записи без согласия и проверки статуса участников.",
    limitations: "Статья не позволяет автоматически определить результат спора; учитываются конкретные дата, статус и документы."
  },
  {
    id: "health-55", statement: "Закон различает договор о суррогатном материнстве и письменные медицинские согласия; требования к участникам и гражданству требуют проверки по дате договора.",
    norm: "части 9–11 статьи 55 Федерального закона № 323-ФЗ", officialSource: "Официальный интернет-портал правовой информации",
    url: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102152259", checkedAt: SURROGACY_ORIGIN_REVIEWED_AT,
    scope: "Участники программы, медицинские согласия, гражданство.", scenarios: ["consents", "foreign", "registration"],
    legalPath: "Собирать даты и документы; не рассчитывать допустимость программы автоматически.",
    limitations: "Дата договора, гражданство, медицинские условия и статус каждого участника требуют индивидуальной проверки."
  },
  {
    id: "zags-16", statement: "Для регистрации рождения в описанном законом случае супругов требуется медицинский документ о рождении и документ медицинской организации о согласии суррогатной матери на их запись родителями.",
    norm: "пункт 5 статьи 16 Федерального закона № 143-ФЗ", officialSource: "Официальный интернет-портал правовой информации",
    url: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102050119", checkedAt: SURROGACY_ORIGIN_REVIEWED_AT,
    scope: "Регистрация рождения по заявлению супругов.", scenarios: ["registration", "consents"],
    legalPath: "Запросить медицинские документы и проверить актуальный перечень в ЗАГС.",
    limitations: "Не переносить перечень на одинокую женщину и специальные случаи без проверки действующей редакции и органа ЗАГС."
  },
  {
    id: "vs-plenum-16", statement: "В споре об отказе суррогатной матери дать согласие суд исследует фактические обстоятельства, а не ограничивается одним фактом отказа.",
    norm: "пункт 31 Постановления Пленума ВС РФ от 16.05.2017 № 16", officialSource: "Верховный Суд РФ, опубликованный текст постановления",
    url: "https://vsrf.ru/Show_pdf.php?Id=11399", checkedAt: SURROGACY_ORIGIN_REVIEWED_AT,
    scope: "Судебный спор о происхождении ребёнка.", scenarios: ["dispute", "origin"],
    legalPath: "Не формировать автоматический иск; передать факты на правовую проверку.",
    limitations: "Разъяснение принято до изменений 2022 года; актуальность для конкретного дела проверяет юрист."
  },
  {
    id: "vs-foreign-2026", statement: "Верховный Суд подчёркивает необходимость оценивать интересы ребёнка и все обстоятельства при трансграничном споре о суррогатном материнстве.",
    norm: "сообщение ВС РФ от 30.03.2026 о конкретном деле", officialSource: "Верховный Суд РФ",
    url: "https://www.vsrf.ru/news/35669", checkedAt: SURROGACY_ORIGIN_REVIEWED_AT,
    scope: "Сложный спор с иностранным элементом.", scenarios: ["foreign", "dispute"],
    legalPath: "Не выводить право на ребёнка из одной генетической связи.",
    limitations: "Сообщение о конкретном деле не устанавливает универсального исхода других дел."
  }
];

export function getSurrogacyOriginRules(key: SurrogacyOriginKey) {
  return SURROGACY_ORIGIN_RULES.filter((rule) => rule.scenarios.includes(key));
}
