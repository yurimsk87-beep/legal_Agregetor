import type { LaborLegalRule } from "@/data/labor-legal-sources";

export const LABOR_ADDITIVE_LEGAL_REVIEWED_AT = "2026-10-11";

const TC_URL = "https://pravo.gov.ru/proxy/ips/?docbody=&link_id=0&nd=102074279&intelsearch=&firstDoc=1";
const TC_CONTROL_URL = "https://www.consultant.ru/document/cons_doc_LAW_34683/";
const SFR_MATERNITY_URL = "https://sfr.gov.ru/grazhdanam/semyam_s_detmi/posobie_po_beremennosti_i_rodam/";
const SFR_ACCIDENT_URL = "https://sfr.gov.ru/grazhdanam/postradavshim_na_proizvodstve/";
const FZ_125_URL = "https://sfr.gov.ru/files/branches/kirov/2025/3/7_Federalnyiy_zakon_ot_24-07-1998_N_125-FZ_red-_ot_28-12-2024.pdf";

export type LaborAdditiveLegalRule = LaborLegalRule & {
  routeSlugs: string[];
  controlUrl?: string;
  effectiveFrom?: string;
  sourceCheck: "OFFICIAL_SOURCE" | "OFFICIAL_SOURCE_WITH_CONTROL_COPY";
};

function tcRule(input: Omit<LaborAdditiveLegalRule, "act" | "officialSource" | "url" | "reviewedAt" | "verificationStatus" | "controlUrl" | "sourceCheck">): LaborAdditiveLegalRule {
  return {
    ...input,
    act: "Трудовой кодекс Российской Федерации",
    officialSource: "Официальный интернет-портал правовой информации",
    url: TC_URL,
    controlUrl: TC_CONTROL_URL,
    reviewedAt: LABOR_ADDITIVE_LEGAL_REVIEWED_AT,
    verificationStatus: "VERIFIED_OFFICIAL",
    sourceCheck: "OFFICIAL_SOURCE_WITH_CONTROL_COPY"
  };
}

function officialRule(input: Omit<LaborAdditiveLegalRule, "reviewedAt" | "verificationStatus" | "sourceCheck"> & { sourceCheck?: LaborAdditiveLegalRule["sourceCheck"] }): LaborAdditiveLegalRule {
  return {
    ...input,
    reviewedAt: LABOR_ADDITIVE_LEGAL_REVIEWED_AT,
    verificationStatus: "VERIFIED_OFFICIAL",
    sourceCheck: input.sourceCheck ?? "OFFICIAL_SOURCE"
  };
}

export const LABOR_ADDITIVE_LEGAL_RULES: LaborAdditiveLegalRule[] = [
  tcRule({
    id: "tk-pregnancy-hiring",
    routeSlugs: ["beremennost-i-trudovye-garantii"],
    areas: ["childcare-leave", "employment-contract"],
    provisions: ["часть третья статьи 64", "статья 70"],
    statement: "Беременность или наличие детей не могут служить основанием отказа в заключении трудового договора; беременным женщинам испытание при приеме на работу не устанавливается.",
    scope: "Отказ в приеме на работу и условие об испытании беременной работницы.",
    limitations: "Работодатель вправе оценивать деловые качества и законные требования должности; беременность и соблюдение сроков запроса подтверждаются документами.",
    verifiedClaims: ["deadline"]
  }),
  tcRule({
    id: "tk-pregnancy-work-conditions",
    routeSlugs: ["beremennost-i-trudovye-garantii"],
    areas: ["childcare-leave", "working-time", "transfer-and-change"],
    provisions: ["статья 93", "статья 254"],
    statement: "По заявлению беременной устанавливается неполное рабочее время; по медицинскому заключению и заявлению снижаются нормы либо предоставляется другая работа, исключающая неблагоприятные факторы, с установленными гарантиями среднего заработка.",
    scope: "Неполное рабочее время, снижение норм, перевод и освобождение для диспансерного обследования.",
    limitations: "Содержание меры зависит от медицинского заключения, заявления, характера работы и наличия подходящей работы; конкретный размер среднего заработка сервис не рассчитывает.",
    verifiedClaims: ["payment"]
  }),
  tcRule({
    id: "tk-pregnancy-schedule-leave",
    routeSlugs: ["beremennost-i-trudovye-garantii"],
    areas: ["childcare-leave", "working-time", "annual-leave"],
    provisions: ["статья 259", "статья 260"],
    statement: "Беременную нельзя направлять в командировки и привлекать к сверхурочной, ночной работе, работе в выходные и нерабочие праздничные дни; ежегодный отпуск предоставляется перед отпуском по беременности и родам или непосредственно после него по ее желанию.",
    scope: "Рабочее время, командировки и ежегодный отпуск в связи с беременностью.",
    limitations: "Беременность и соответствующее заявление должны быть подтверждены; для иных лиц с семейными обязанностями правила отличаются.",
    verifiedClaims: ["deadline"]
  }),
  tcRule({
    id: "tk-pregnancy-dismissal",
    routeSlugs: ["beremennost-i-trudovye-garantii"],
    areas: ["childcare-leave", "employer-dismissal"],
    provisions: ["статья 261", "часть первая статьи 392"],
    statement: "Расторжение договора по инициативе работодателя с беременной женщиной не допускается, кроме ликвидации организации или прекращения деятельности ИП; для отдельных срочных договоров статья устанавливает специальный порядок и исключения.",
    scope: "Увольнение беременной, продление срочного договора и срок судебного оспаривания увольнения.",
    limitations: "Запрет не является абсолютным. Отдельно проверяются основание увольнения, прекращение работодателя, срок договора и возможность перевода при выходе отсутствующего работника.",
    verifiedClaims: ["deadline", "jurisdiction"]
  }),
  officialRule({
    id: "tk-pregnancy-maternity-leave",
    routeSlugs: ["beremennost-i-trudovye-garantii"],
    areas: ["childcare-leave", "sick-leave"],
    act: "Трудовой кодекс Российской Федерации и Федеральный закон от 29.12.2006 № 255-ФЗ",
    provisions: ["статья 255 ТК РФ", "статьи 10-11.1 Федерального закона № 255-ФЗ"],
    statement: "Отпуск по беременности и родам предоставляется по заявлению и листку нетрудоспособности, а пособие назначается по правилам обязательного социального страхования.",
    scope: "Оформление отпуска по беременности и родам и связанного пособия.",
    limitations: "Продолжительность отпуска, расчетный период и размер пособия зависят от медицинских и страховых данных; сервис не подставляет неподтвержденные суммы.",
    officialSource: "Социальный фонд России",
    url: SFR_MATERNITY_URL,
    verifiedClaims: ["deadline", "payment", "authority"]
  }),

  tcRule({
    id: "tk-occupational-safety-duties",
    routeSlugs: ["ohrana-truda-i-neschastnyy-sluchay"],
    areas: ["employer-rights-and-duties"],
    provisions: ["статьи 214-215"],
    statement: "Работодатель обязан обеспечить безопасные условия, обучение, средства защиты и управление профессиональными рисками, а работник обязан соблюдать требования и сообщать об опасности и происшествиях.",
    scope: "Обязанности сторон в области охраны труда, обучение, инструктаж и средства защиты.",
    limitations: "Конкретный набор мер зависит от работы, профессиональных рисков и обязательных требований; сервис не проводит специальную оценку условий труда.",
    verifiedClaims: ["authority"]
  }),
  tcRule({
    id: "tk-danger-refusal",
    routeSlugs: ["ohrana-truda-i-neschastnyy-sluchay"],
    areas: ["employer-rights-and-duties"],
    provisions: ["статья 216.1"],
    statement: "Работник вправе отказаться от работы при возникновении опасности для жизни и здоровья вследствие нарушения требований охраны труда, кроме предусмотренных федеральными законами случаев, до устранения опасности.",
    scope: "Непосредственная опасность, прекращение опасной работы и гарантии на период устранения нарушения.",
    limitations: "Нужно зафиксировать конкретную опасность и уведомить работодателя; при экстренной угрозе сначала вызываются медицинские или спасательные службы.",
    verifiedClaims: ["authority"]
  }),
  tcRule({
    id: "tk-accident-investigation",
    routeSlugs: ["ohrana-truda-i-neschastnyy-sluchay"],
    areas: ["employer-rights-and-duties", "sick-leave"],
    provisions: ["статьи 227-231"],
    statement: "Происшествия, подпадающие под критерии закона, расследуются комиссией с соблюдением правил извещения, сроков, оформления и учета; разногласия по расследованию разрешаются в установленном порядке.",
    scope: "Извещение, расследование, квалификация, акт и учет несчастного случая.",
    limitations: "Связь события с производством определяется по фактам и материалам расследования; сервис не формирует официальный акт комиссии и не подменяет расследование.",
    verifiedClaims: ["deadline", "authority"]
  }),
  officialRule({
    id: "fz-125-industrial-insurance",
    routeSlugs: ["ohrana-truda-i-neschastnyy-sluchay"],
    areas: ["employer-rights-and-duties", "sick-leave"],
    act: "Федеральный закон от 24.07.1998 № 125-ФЗ об обязательном социальном страховании от несчастных случаев на производстве и профессиональных заболеваний",
    provisions: ["статьи 8, 10-12 и 15"],
    statement: "При подтвержденном страховом случае предусмотрены виды страхового обеспечения, назначаемые по установленным документам и данным о последствиях повреждения здоровья.",
    scope: "Страховое обеспечение после несчастного случая на производстве или профессионального заболевания.",
    limitations: "Вид и размер обеспечения зависят от признания страхового случая, утраты профессиональной трудоспособности, заработка и иных подтвержденных данных.",
    officialSource: "Социальный фонд России",
    url: FZ_125_URL,
    controlUrl: SFR_ACCIDENT_URL,
    sourceCheck: "OFFICIAL_SOURCE_WITH_CONTROL_COPY",
    verifiedClaims: ["payment", "authority"]
  }),

  tcRule({
    id: "tk-hiring-refusal",
    routeSlugs: ["priem-na-rabotu-i-otkaz", "diskriminatsiya-na-rabote"],
    areas: ["employment-contract", "employer-disputes"],
    provisions: ["статья 64"],
    statement: "Необоснованный отказ в заключении трудового договора запрещен; по письменному требованию кандидата работодатель сообщает причину отказа письменно в течение семи рабочих дней.",
    scope: "Отказ в приеме на работу, письменная причина отказа и его обжалование.",
    limitations: "Отказ может основываться на деловых качествах и законных требованиях работы; содержание вакансии, квалификация и причина отказа проверяются по доказательствам.",
    verifiedClaims: ["deadline", "jurisdiction"]
  }),
  tcRule({
    id: "tk-hiring-documents",
    routeSlugs: ["priem-na-rabotu-i-otkaz"],
    areas: ["employment-contract"],
    provisions: ["статья 65"],
    statement: "Закон устанавливает перечень документов при заключении трудового договора; требовать иные документы можно только в случаях, прямо предусмотренных законом.",
    scope: "Документы при трудоустройстве и дополнительные требования работодателя.",
    limitations: "Для отдельных должностей, работ и категорий работников специальные законы могут устанавливать дополнительные документы.",
    verifiedClaims: []
  }),
  tcRule({
    id: "tk-probation",
    routeSlugs: ["priem-na-rabotu-i-otkaz", "beremennost-i-trudovye-garantii"],
    areas: ["employment-contract", "childcare-leave"],
    provisions: ["статья 70"],
    statement: "Испытание устанавливается соглашением сторон при заключении договора и не применяется к перечисленным законом категориям работников.",
    scope: "Законность условия об испытании и категории, которым испытание не устанавливается.",
    limitations: "Отсутствие условия в трудовом договоре означает прием без испытания; специальные факты и статус работника подтверждаются документами.",
    verifiedClaims: []
  }),

  tcRule({
    id: "tk-work-documents-deadline",
    routeSlugs: ["trudovye-dokumenty-i-spravki"],
    areas: ["employment-contract", "employer-rights-and-duties"],
    provisions: ["статья 62"],
    statement: "По письменному заявлению работодатель обязан не позднее трех рабочих дней безвозмездно выдать надлежаще заверенные копии документов, связанных с работой.",
    scope: "Трудовой договор, приказы, справки и иные связанные с работой документы, которыми располагает работодатель.",
    limitations: "В заявлении нужно определить документы и период; правило не возлагает на работодателя обязанность создавать не предусмотренный законом документ или выдавать данные третьих лиц.",
    verifiedClaims: ["deadline"]
  }),
  tcRule({
    id: "tk-employment-record",
    routeSlugs: ["trudovye-dokumenty-i-spravki"],
    areas: ["employment-contract", "employer-rights-and-duties"],
    provisions: ["статьи 66 и 66.1"],
    statement: "Сведения о трудовой деятельности ведутся и предоставляются в бумажной или электронной форме по правилам закона; недостоверные записи исправляются на основании подтверждающих документов.",
    scope: "Трудовая книжка, сведения о трудовой деятельности, выдача и исправление записей.",
    limitations: "Порядок зависит от выбранной формы учета, периода работы и работодателя, внесшего запись.",
    verifiedClaims: ["deadline"]
  }),
  tcRule({
    id: "tk-termination-documents",
    routeSlugs: ["trudovye-dokumenty-i-spravki"],
    areas: ["employment-contract", "termination-payments"],
    provisions: ["статья 84.1"],
    statement: "В день прекращения трудового договора работодатель выдает трудовую книжку или сведения о трудовой деятельности и предусмотренные законом документы; при невозможности выдачи направляется уведомление.",
    scope: "Документы в день увольнения и действия при их невыдаче.",
    limitations: "Перечень зависит от формы учета и обстоятельств увольнения; связанные с работой документы, не входящие в обязательный набор, запрашиваются отдельно.",
    verifiedClaims: ["deadline"]
  }),

  tcRule({
    id: "tk-discrimination",
    routeSlugs: ["diskriminatsiya-na-rabote", "priem-na-rabotu-i-otkaz"],
    areas: ["employer-disputes", "employment-contract"],
    provisions: ["статья 3"],
    statement: "Ограничение трудовых прав или предоставление преимуществ по обстоятельствам, не связанным с деловыми качествами, запрещается; различия, обусловленные требованиями работы либо специальной заботой государства, дискриминацией не являются.",
    scope: "Проверка признаков дискриминации в трудовых отношениях и допустимых различий.",
    limitations: "Вывод требует конкретного решения работодателя, сравнимых обстоятельств и доказательств связи с защищаемым признаком; сервис не объявляет дискриминацию доказанной.",
    verifiedClaims: ["jurisdiction"]
  }),
  tcRule({
    id: "tk-equal-pay",
    routeSlugs: ["diskriminatsiya-na-rabote"],
    areas: ["employer-disputes", "wages"],
    provisions: ["статьи 22 и 132"],
    statement: "Работодатель обязан обеспечивать равную оплату за труд равной ценности; заработная плата зависит от квалификации, сложности, количества, качества и условий работы и не ограничивается дискриминационными критериями.",
    scope: "Сравнение оплаты труда и условий премирования.",
    limitations: "Сравниваются сопоставимые функции, квалификация, результаты и условия; различие суммы само по себе не подтверждает дискриминацию.",
    verifiedClaims: ["payment"]
  }),
  tcRule({
    id: "tk-labor-protection-remedies",
    routeSlugs: ["diskriminatsiya-na-rabote", "ohrana-truda-i-neschastnyy-sluchay"],
    areas: ["employer-disputes", "employer-rights-and-duties"],
    provisions: ["статьи 352, 356, 357 и 391"],
    statement: "Трудовые права защищаются установленными законом способами, включая государственный надзор и судебную защиту; компетенция органа зависит от содержания требования и характера спора.",
    scope: "Выбор обращения работодателю, в инспекцию труда, прокуратуру или суд.",
    limitations: "Инспекция не подменяет суд в споре о праве; подсудность, срок и состав требований проверяются отдельно.",
    verifiedClaims: ["authority", "jurisdiction"]
  })
];
