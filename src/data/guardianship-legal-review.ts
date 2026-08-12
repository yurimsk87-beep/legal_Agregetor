export type GuardianshipLegalSourceType = "official" | "official-court" | "consolidated-fallback";
export type GuardianshipLegalStatus = "current" | "primary-unavailable" | "regional-check-required";

export type GuardianshipLegalRule = {
  id: string;
  statement: string;
  act: string;
  provision: string;
  url: string;
  supplementaryUrl?: string;
  sourceType: GuardianshipLegalSourceType;
  reviewedAt: string;
  status: GuardianshipLegalStatus;
  scenarios: string[];
  scopeNote: string;
};

const reviewedAt = "2026-08-12";

export const GUARDIANSHIP_LEGAL_RULES: GuardianshipLegalRule[] = [
  {
    id: "age-boundary",
    statement: "Опека устанавливается над ребёнком младше 14 лет, попечительство — над ребёнком от 14 до 18 лет.",
    act: "Семейный кодекс РФ",
    provision: "статья 145, пункт 2",
    url: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102038925",
    supplementaryUrl: "https://www.consultant.ru/document/cons_doc_LAW_8982/",
    sourceType: "consolidated-fallback",
    reviewedAt,
    status: "primary-unavailable",
    scenarios: ["appointment", "parent-period"],
    scopeNote: "Применяется только к несовершеннолетним; опека над совершеннолетними исключена из маршрута."
  },
  {
    id: "candidate-requirements",
    statement: "Кандидат должен быть совершеннолетним и дееспособным; препятствия и личные качества проверяются по закону.",
    act: "Федеральный закон № 48-ФЗ и Семейный кодекс РФ",
    provision: "статья 10 Закона № 48-ФЗ; статья 146 СК РФ",
    url: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102121394",
    supplementaryUrl: "https://www.consultant.ru/document/cons_doc_LAW_76459/",
    sourceType: "consolidated-fallback",
    reviewedAt,
    status: "primary-unavailable",
    scenarios: ["appointment", "parent-period"],
    scopeNote: "Помощник не заменяет межведомственную, медицинскую и личностную проверку кандидата."
  },
  {
    id: "preliminary-guardianship",
    statement: "Предварительная опека применяется при необходимости немедленного назначения и не даёт права распоряжаться имуществом подопечного.",
    act: "Федеральный закон № 48-ФЗ",
    provision: "статья 12, части 1-5",
    url: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102121394",
    supplementaryUrl: "https://www.consultant.ru/document/cons_doc_LAW_76459/ff9a4233704115d5ac3caa40d67acbfe1445dfa8/",
    sourceType: "consolidated-fallback",
    reviewedAt,
    status: "primary-unavailable",
    scenarios: ["appointment"],
    scopeNote: "Не смешивается с назначением по заявлению родителей на определённый период."
  },
  {
    id: "parent-and-child-application",
    statement: "Родители подают совместное заявление на определённый период; несовершеннолетний от 14 лет может просить назначить конкретного попечителя.",
    act: "Федеральный закон № 48-ФЗ",
    provision: "статья 13, части 1, 3-5",
    url: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102121394",
    supplementaryUrl: "https://www.consultant.ru/document/cons_doc_LAW_76459/ff202d87e686459df7304a4758f30cb25f706054/",
    sourceType: "consolidated-fallback",
    reviewedAt,
    status: "primary-unavailable",
    scenarios: ["parent-period"],
    scopeNote: "Одностороннее заявление родителя по части 1 не автоматизируется без индивидуальной проверки."
  },
  {
    id: "candidate-documents",
    statement: "Общий порядок, документы, межведомственные запросы, обследование и срок действия заключения определены федеральными Правилами.",
    act: "Постановление Правительства РФ от 18.05.2009 № 423",
    provision: "Правила подбора, пункты 4-11",
    url: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102130032",
    supplementaryUrl: "https://www.consultant.ru/document/cons_doc_LAW_88016/dfc6d1fe7b40b3987f2d5b970c0a1732f36f2a7b/",
    sourceType: "consolidated-fallback",
    reviewedAt,
    status: "primary-unavailable",
    scenarios: ["appointment"],
    scopeNote: "Региональный регламент может определять канал подачи, но не должен расширять федеральные требования без правового основания."
  },
  {
    id: "candidate-official-form",
    statement: "Заявление кандидата имеет утверждённую форму; приблизительная внутренняя копия не создаётся.",
    act: "Приказ Минпросвещения России от 10.01.2019 № 4",
    provision: "приложение № 4, в редакции приказа № 687",
    url: "https://publication.pravo.gov.ru/Document/View/0001201903270001",
    supplementaryUrl: "https://www.consultant.ru/document/cons_doc_LAW_321090/6c5ae1d357f6891209c3bec8b0fbfa20de9940f3/",
    sourceType: "consolidated-fallback",
    reviewedAt,
    status: "primary-unavailable",
    scenarios: ["appointment"],
    scopeNote: "Официальный портал не отдал содержимое при проверке; структура формы сверена по консолидированной редакции от 23.07.2024. Приказ № 334 признан утратившим силу."
  },
  {
    id: "medical-current-order",
    statement: "С 1 сентября 2025 года медицинское освидетельствование проводится по приказу Минздрава № 254н; приказ № 290н утратил силу.",
    act: "Приказ Минздрава России от 25.04.2025 № 254н",
    provision: "пункты 1-3 и приложения",
    url: "https://publication.pravo.gov.ru/document/0001202505300028",
    supplementaryUrl: "https://www.consultant.ru/document/cons_doc_LAW_506679/",
    sourceType: "consolidated-fallback",
    reviewedAt,
    status: "primary-unavailable",
    scenarios: ["appointment"],
    scopeNote: "Не использовать утративший силу приказ № 290н как действующий."
  },
  {
    id: "property-permission",
    statement: "Предварительное разрешение требуется для действий, способных уменьшить имущество или права подопечного; письменное решение выдают не позднее 15 дней.",
    act: "ГК РФ и Федеральный закон № 48-ФЗ",
    provision: "статья 37 ГК РФ; статьи 20-21 Закона № 48-ФЗ",
    url: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102033239",
    supplementaryUrl: "https://www.consultant.ru/document/cons_doc_LAW_5142/9deaf716ae6188bcfecb901fc9e9f941c551f6d7/",
    sourceType: "consolidated-fallback",
    reviewedAt,
    status: "primary-unavailable",
    scenarios: ["property-report"],
    scopeNote: "Разрешение само по себе не подтверждает законность сделки и сохранение прав ребёнка."
  },
  {
    id: "guardian-report",
    statement: "Опекун-гражданин подаёт ежегодный отчёт не позднее 1 февраля, если договором не установлен иной срок, по утверждённой форме.",
    act: "Федеральный закон № 48-ФЗ и Постановление Правительства РФ № 423",
    provision: "статья 25; форма отчёта",
    url: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102121394",
    supplementaryUrl: "https://www.consultant.ru/document/cons_doc_LAW_76459/72e1a6801dc7a6fe07fdb517df734513f33b88ed/",
    sourceType: "consolidated-fallback",
    reviewedAt,
    status: "primary-unavailable",
    scenarios: ["property-report"],
    scopeNote: "Изменение 2025 года об отчёте организаций до 1 апреля не переносится на опекуна-гражданина."
  },
  {
    id: "supreme-court-property",
    statement: "Согласие органа опеки на отчуждение недвижимости само по себе не подтверждает законность сделки; суд оценивает реальное соблюдение прав ребёнка.",
    act: "Определение Судебной коллегии по гражданским делам Верховного Суда РФ",
    provision: "от 24.04.2012 № 49-В12-1",
    url: "https://vsrf.ru/files/14005/",
    sourceType: "official-court",
    reviewedAt,
    status: "current",
    scenarios: ["property-report"],
    scopeNote: "Применяется как предупреждение о пределах разрешения органа опеки, а не как универсальный вывод по любой сделке."
  },
  {
    id: "regional-filing",
    statement: "Конкретный орган, электронный канал и региональные приложения определяются местным регламентом.",
    act: "Региональные административные регламенты",
    provision: "зависит от субъекта РФ и муниципального образования",
    url: "https://www.gosuslugi.ru/",
    sourceType: "official",
    reviewedAt,
    status: "regional-check-required",
    scenarios: ["appointment", "parent-period", "property-report", "refusal-inaction"],
    scopeNote: "Введённое пользователем название органа не считается официально подтверждённым."
  },
  {
    id: "appeal-form",
    statement: "Судебная форма обжалования не определяется без предмета решения, прав заявителя, вида производства, подсудности и срока.",
    act: "Федеральный закон № 48-ФЗ, КАС РФ и ГПК РФ",
    provision: "статья 8 Закона № 48-ФЗ; применимые процессуальные нормы определяются индивидуально",
    url: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102121394",
    supplementaryUrl: "https://www.consultant.ru/document/cons_doc_LAW_76459/",
    sourceType: "consolidated-fallback",
    reviewedAt,
    status: "primary-unavailable",
    scenarios: ["refusal-inaction"],
    scopeNote: "Автоматический судебный документ отключён; возможен только черновик внесудебной жалобы."
  }
];

export const GUARDIANSHIP_LEGAL_REVIEW = {
  reviewedAt,
  nextMandatoryReviewAt: "2026-11-12",
  sources: {
    guardianshipLaw: { title: "Закон № 48-ФЗ: официальная публикация", href: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102121394" },
    familyCode: { title: "Семейный кодекс РФ: официальная публикация", href: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102038925" },
    civilCode: { title: "ГК РФ: официальная публикация", href: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102033239" },
    government423: { title: "Постановление Правительства РФ № 423", href: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102130032" },
    educationForm: { title: "Приказ Минпросвещения № 4: официальное опубликование", href: "https://publication.pravo.gov.ru/Document/View/0001201903270001" },
    medical: { title: "Приказ Минздрава № 254н: действующий порядок освидетельствования", href: "https://publication.pravo.gov.ru/document/0001202505300028" },
    supremeCourt: { title: "ВС РФ: определение № 49-В12-1", href: "https://vsrf.ru/files/14005/" }
  }
} as const;

export function getGuardianshipLegalReviewDate(scenarioKey?: string) {
  return GUARDIANSHIP_LEGAL_RULES
    .filter((rule) => !scenarioKey || rule.scenarios.includes(scenarioKey))
    .map((rule) => rule.reviewedAt)
    .sort()
    .at(-1) ?? GUARDIANSHIP_LEGAL_REVIEW.reviewedAt;
}

export function isGuardianshipLegalReviewFullyPrimaryVerified(scenarioKey?: string) {
  return GUARDIANSHIP_LEGAL_RULES
    .filter((rule) => !scenarioKey || rule.scenarios.includes(scenarioKey))
    .every((rule) => rule.sourceType !== "consolidated-fallback" && rule.status === "current");
}
