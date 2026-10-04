import { GUARDIANSHIP_LEGAL_REVIEW } from "@/data/guardianship-legal-review";

export const GUARDIANSHIP_ROUTE = {
  categorySlug: "semya-i-deti",
  problemSlug: "opeka-i-popechitelstvo-nad-rebenkom"
} as const;

export const GUARDIANSHIP_SCENARIO_KEYS = [
  "appointment",
  "parent-period",
  "property-report",
  "refusal-inaction"
] as const;

export type GuardianshipScenarioKey = (typeof GUARDIANSHIP_SCENARIO_KEYS)[number];

export type GuardianshipField = {
  name: string;
  label: string;
  type?: "text" | "date" | "number" | "textarea" | "select" | "territory-region" | "territory-municipality" | "guardianship-authority";
  required?: boolean;
  hint?: string;
  options?: Array<{ label: string; value: string }>;
};

export type GuardianshipScenario = {
  key: GuardianshipScenarioKey;
  title: string;
  shortTitle: string;
  choiceDescription: string;
  description: string[];
  steps: string[];
  documents: string[];
  fee: string;
  term: string;
  filing: string;
  mainDocument: string;
  documentSlug: string;
  warning?: string;
  legalSources: Array<{ title: string; href: string }>;
  helperFields: GuardianshipField[];
};

const yesNoUnsure = [
  { label: "Да", value: "yes" },
  { label: "Нет", value: "no" },
  { label: "Не уверен", value: "unsure" }
];

const immediateThreatField: GuardianshipField = {
  name: "immediateThreat",
  label: "Есть непосредственная угроза жизни или здоровью ребёнка прямо сейчас?",
  type: "select",
  required: true,
  options: yesNoUnsure,
  hint: "При непосредственной угрозе обычная подготовка документа прекращается: сначала нужна экстренная помощь."
};

const authorityFields: GuardianshipField[] = [
  { name: "region", label: "Регион", type: "territory-region", required: true, hint: "Выберите субъект Российской Федерации из официального перечня." },
  { name: "municipality", label: "Муниципальное образование", type: "territory-municipality", required: true, hint: "Начните вводить название города или муниципального образования. Города берутся из внутреннего списка ПравоПоиска; официальный орган опеки подтверждается отдельно." },
  { name: "authorityName", label: "Орган опеки и попечительства", type: "guardianship-authority", required: true, hint: "В документ попадут официальное наименование и адрес выбранного органа." }
];

const sources = {
  guardianshipLaw: GUARDIANSHIP_LEGAL_REVIEW.sources.guardianshipLaw,
  familyCode: GUARDIANSHIP_LEGAL_REVIEW.sources.familyCode,
  civilCode: GUARDIANSHIP_LEGAL_REVIEW.sources.civilCode,
  government423: GUARDIANSHIP_LEGAL_REVIEW.sources.government423,
  educationForm: GUARDIANSHIP_LEGAL_REVIEW.sources.educationForm,
  medical: GUARDIANSHIP_LEGAL_REVIEW.sources.medical,
  supremeCourt: GUARDIANSHIP_LEGAL_REVIEW.sources.supremeCourt,
  emergency: GUARDIANSHIP_LEGAL_REVIEW.sources.emergency
};

export const GUARDIANSHIP_SCENARIOS: Record<GuardianshipScenarioKey, GuardianshipScenario> = {
  appointment: {
    key: "appointment",
    title: "Оформить опеку или попечительство",
    shortTitle: "Хочу оформить опеку над ребёнком",
    choiceDescription: "Обычное назначение над ребёнком без попечения родителей или срочная предварительная опека.",
    description: [
      "Опека устанавливается над ребёнком младше 14 лет, попечительство — с 14 до 18 лет. Обычное назначение применяется к ребёнку, оставшемуся без попечения родителей.",
      "Предварительная опека используется, когда опекуна необходимо назначить немедленно. Она не равна назначению по заявлению временно отсутствующих родителей."
    ],
    steps: [
      "Проверьте возраст ребёнка и наличие родительского попечения.",
      "Проверьте требования к кандидату и необходимость подготовки.",
      "Определите обычный или предварительный порядок.",
      "Подготовьте персональный перечень сведений и документов.",
      "Обратитесь в орган опеки и предъявите оригиналы перед решением."
    ],
    documents: [
      "Заявление по действующей форме — при обычном назначении.",
      "Документ, удостоверяющий личность, и обследование условий жизни — для предварительной опеки.",
      "Автобиография, подтверждение дохода, медицинское заключение и согласия семьи — когда применим общий порядок."
    ],
    fee: "Специальная федеральная госпошлина за подачу заявления о назначении опекуна в проверенных нормах не найдена. Возможные сопутствующие расходы нельзя рассчитывать без фактических обстоятельств.",
    term: "При обычном порядке сроки зависят от межведомственных ответов, обследования и решения органа. Предварительная опека прекращается через 6 месяцев, а при исключительных обстоятельствах срок может быть увеличен до 8 месяцев, если общее назначение не состоялось.",
    filing: "В орган опеки по месту жительства кандидата для получения заключения; конкретное назначение также связано с органом по месту жительства ребёнка. Региональные электронные способы требуют отдельной проверки.",
    mainDocument: "Помощник по подготовке данных для официального заявления кандидата либо черновик обращения о предварительной опеке.",
    documentSlug: "zayavlenie-o-naznachenii-opekuna-rebenku",
    warning: "Официальную форму заявления сервис не воспроизводит приблизительно. При срочном порядке решение о предварительной опеке принимает орган опеки.",
    legalSources: [sources.guardianshipLaw, sources.familyCode, sources.government423, sources.educationForm, sources.medical, sources.emergency],
    helperFields: [
      immediateThreatField,
      { name: "childAge", label: "Возраст ребёнка", type: "number", required: true },
      { name: "childWithoutCare", label: "Ребёнок остался без попечения родителей?", type: "select", required: true, options: yesNoUnsure },
      { name: "urgentNeed", label: "Нужно назначить опекуна немедленно?", type: "select", required: true, options: yesNoUnsure, hint: "Это вопрос о предварительной опеке по статье 12 Закона № 48-ФЗ, а не о временном отъезде родителей." },
      { name: "knownChild", label: "Известен конкретный ребёнок?", type: "select", required: true, options: yesNoUnsure },
      { name: "candidateAge", label: "Возраст кандидата", type: "number", required: true },
      { name: "candidateCapacity", label: "Кандидат полностью дееспособен?", type: "select", required: true, options: yesNoUnsure },
      { name: "parentalRightsRestricted", label: "Кандидат лишён или ограничен в родительских правах?", type: "select", required: true, options: yesNoUnsure },
      { name: "formerGuardianRemoved", label: "Кандидата ранее отстраняли от обязанностей опекуна или попечителя по его вине?", type: "select", required: true, options: yesNoUnsure },
      { name: "adoptionCancelledForFault", label: "Усыновление кандидата ранее отменяли по его вине?", type: "select", required: true, options: yesNoUnsure },
      { name: "knownCriminalRestriction", label: "Кандидату известно о судимости или уголовном преследовании, которое может препятствовать назначению?", type: "select", required: true, options: yesNoUnsure, hint: "Окончательную проверку предусмотренных законом сведений проводит орган опеки, в том числе межведомственно." },
      { name: "healthContraindications", label: "У кандидата выявлены заболевания из установленного Правительством перечня, препятствующие назначению?", type: "select", required: true, options: yesNoUnsure },
      { name: "candidateMaritalStatus", label: "Кандидат состоит в браке?", type: "select", required: true, options: yesNoUnsure },
      { name: "trainingStatus", label: "Какое основание относится к подготовке кандидата?", type: "select", required: true, options: [
        { label: "Кандидат прошёл подготовку", value: "completed" },
        { label: "Близкий родственник ребёнка", value: "close-relative" },
        { label: "Действующий или бывший усыновитель; усыновление не отменено", value: "adopter" },
        { label: "Действующий или бывший опекун; не был отстранён", value: "guardian" },
        { label: "Подготовка ещё не пройдена", value: "not-completed" },
        { label: "Не уверен", value: "unsure" }
      ] },
      { name: "householdAdults", label: "С кандидатом совместно проживают совершеннолетние члены семьи?", type: "select", required: true, options: yesNoUnsure },
      { name: "householdConsent", label: "Получено их письменное согласие с учётом мнения совместно проживающих детей от 10 лет?", type: "select", required: true, options: yesNoUnsure },
      { name: "candidateData", label: "ФИО, дата рождения, адрес и паспорт кандидата", type: "textarea", required: true },
      { name: "childData", label: "ФИО, дата рождения и место жительства ребёнка — если известны", type: "textarea" },
      ...authorityFields
    ]
  },
  "parent-period": {
    key: "parent-period",
    title: "Назначение по заявлению родителей или ребёнка",
    shortTitle: "Родители или ребёнок выбирают конкретного опекуна",
    choiceDescription: "Заявление на определённый период, заявление ребёнка с 14 лет или распоряжение родителей на случай смерти.",
    description: [
      "Родители могут совместно указать конкретного опекуна или попечителя на период, когда по уважительным причинам не могут исполнять обязанности. Период полномочий должен быть указан в акте органа опеки.",
      "Ребёнок с 14 лет может сам просить назначить конкретного попечителя. Отдельно единственный родитель или оба родителя могут определить конкретное лицо на случай смерти, изменить либо отменить такое заявление."
    ],
    steps: [
      "Определите основание заявления и применимую часть статьи 13.",
      "Укажите только сведения, относящиеся к выбранному основанию.",
      "Получите согласие предлагаемого опекуна или попечителя.",
      "Подготовьте сведения о ребёнке, родителях и кандидате.",
      "Подайте документ в орган опеки по месту жительства ребёнка."
    ],
    documents: [
      "Заявление, соответствующее выбранному основанию статьи 13 Закона № 48-ФЗ.",
      "Документы, подтверждающие личности заявителей и кандидата.",
      "Подтверждение причины и периода — если его запросит орган по применимому регламенту."
    ],
    fee: "Специальная федеральная госпошлина за такое заявление в проверенных нормах не найдена.",
    term: "Единый федеральный срок для всех региональных процедур по этому заявлению не подтверждён. Срок полномочий указывается в акте органа опеки.",
    filing: "Орган опеки и попечительства по месту жительства ребёнка. Доступность МФЦ или электронной подачи проверяется по региональному регламенту.",
    mainDocument: "Подготовка заявления об определении опекуна или попечителя по статье 13 Закона № 48-ФЗ.",
    documentSlug: "zayavlenie-roditelya-o-naznachenii-opekuna",
    warning: "Порядки по частям 1, 2 и 3 статьи 13 различаются. Для заявления на случай смерти обязательны собственноручная подпись, дата и удостоверение подписи в предусмотренном законом порядке.",
    legalSources: [sources.guardianshipLaw, sources.familyCode, sources.emergency],
    helperFields: [
      immediateThreatField,
      { name: "article13Basis", label: "Какое заявление нужно подготовить?", type: "select", required: true, options: [
        { label: "Оба родителя назначают на определённый период", value: "parents-period" },
        { label: "Ребёнок с 14 лет просит назначить попечителя", value: "child-14" },
        { label: "Единственный родитель определяет лицо на случай своей смерти", value: "sole-parent-death" },
        { label: "Оба родителя определяют лицо на случай одновременной смерти", value: "both-parents-death" },
        { label: "Изменить ранее поданное заявление на случай смерти", value: "change-death" },
        { label: "Отменить ранее поданное заявление на случай смерти", value: "cancel-death" },
        { label: "Не уверен", value: "unsure" }
      ] },
      { name: "childAge", label: "Возраст ребёнка", type: "number", required: true },
      { name: "reason", label: "Почему родители не смогут исполнять обязанности в указанный период?", type: "textarea", required: true },
      { name: "periodStart", label: "Предполагаемая дата начала полномочий", type: "date", required: true },
      { name: "periodEnd", label: "Предполагаемая дата окончания полномочий", type: "date", required: true },
      { name: "nomineeData", label: "ФИО, дата рождения и адрес предлагаемого опекуна или попечителя", type: "textarea", required: true },
      { name: "nomineeConsent", label: "Предлагаемое лицо согласно на назначение?", type: "select", required: true, options: yesNoUnsure },
      { name: "childData", label: "ФИО, дата рождения и адрес ребёнка", type: "textarea", required: true },
      { name: "parentsData", label: "ФИО, адреса и паспортные сведения родителей", type: "textarea", required: true },
      { name: "soleParentConfirmed", label: "Статус единственного родителя подтверждён документами?", type: "select", required: true, options: yesNoUnsure },
      { name: "previousStatementDetails", label: "Дата и сведения о ранее поданном заявлении", type: "textarea", required: true },
      { name: "deathStatementApplicant", label: "Кто изменяет или отменяет ранее поданное заявление?", type: "select", required: true, options: [
        { label: "Единственный родитель", value: "sole-parent" },
        { label: "Один из двух родителей", value: "one-of-two" },
        { label: "Оба родителя совместно", value: "both-parents" },
        { label: "Не уверен", value: "unsure" }
      ] },
      { name: "statementDate", label: "Дата составления заявления", type: "date", required: true },
      { name: "signatureAuthentication", label: "Как будет удостоверена собственноручная подпись?", type: "select", required: true, options: [
        { label: "Руководителем органа опеки при личной подаче", value: "guardianship-head" },
        { label: "Нотариально, поскольку личная явка невозможна", value: "notary" },
        { label: "Иным прямо предусмотренным статьёй 13 способом", value: "other-statutory" },
        { label: "Не уверен", value: "unsure" }
      ] },
      { name: "childInterests", label: "Есть сомнения, что назначение соответствует интересам ребёнка?", type: "select", required: true, options: yesNoUnsure },
      ...authorityFields
    ]
  },
  "property-report": {
    key: "property-report",
    title: "Деньги, имущество и отчёт опекуна",
    shortTitle: "Я уже опекун: деньги, имущество и отчёт",
    choiceDescription: "Отчёт, номинальный счёт или предварительное разрешение на имущественное действие.",
    description: [
      "Выплаты на содержание подопечного зачисляются на отдельный номинальный счёт и расходуются в интересах ребёнка. Ежегодный отчёт представляется по утверждённой форме.",
      "Сделки, которые уменьшают имущество или права ребёнка, требуют предварительного разрешения. Недвижимость и другие сложные случаи нельзя безопасно автоматизировать."
    ],
    steps: [
      "Выберите отчёт, работу с выплатами или запрос разрешения.",
      "Опишите имущество, деньги и предполагаемое действие.",
      "Проверьте необходимость предварительного разрешения.",
      "Подготовьте официальный отчёт либо черновик обращения.",
      "До сделки получите письменное решение и отдельно проверьте сохранение прав ребёнка."
    ],
    documents: [
      "Официальная форма ежегодного отчёта — без приблизительной внутренней копии.",
      "Документы о доходах, расходах и имуществе подопечного.",
      "Правоустанавливающие документы и проект сделки — для запроса разрешения."
    ],
    fee: "Специальная федеральная госпошлина за обращение в орган опеки за предварительным разрешением в проверенных нормах не найдена. Оценка, нотариальные, банковские или регистрационные действия могут оплачиваться отдельно.",
    term: "Отчёт гражданина подаётся не позднее 1 февраля, если договором не установлен иной срок; отчёт организации — не позднее 1 апреля. Разрешение или мотивированный отказ по статье 21 Закона № 48-ФЗ выдаётся письменно не позднее 15 дней с даты заявления.",
    filing: "В орган опеки по месту жительства подопечного. Способ подачи и региональный состав приложений необходимо уточнить в выбранном органе.",
    mainDocument: "Помощник по данным для официального отчёта либо черновик обращения за предварительным разрешением.",
    documentSlug: "dokumenty-po-imushchestvu-podopechnogo",
    warning: "Недвижимость, ипотека, доли, материнский капитал, наследство, продажа с последующей покупкой и конфликт интересов всегда требуют юридической проверки.",
    legalSources: [sources.guardianshipLaw, sources.civilCode, sources.government423, sources.supremeCourt, sources.emergency],
    helperFields: [
      immediateThreatField,
      { name: "propertyAction", label: "Что нужно сделать?", type: "select", required: true, options: [
        { label: "Подготовить ежегодный отчёт", value: "annual-report" },
        { label: "Понять порядок расходования выплат и номинального счёта", value: "nominal-account" },
        { label: "Получить разрешение на имущественное действие", value: "permission" },
        { label: "Продать или обменять недвижимость ребёнка", value: "real-estate" },
        { label: "Другое или не уверен", value: "unsure" }
      ] },
      { name: "guardianType", label: "Кто представляет ежегодный отчёт?", type: "select", required: true, options: [
        { label: "Опекун или попечитель — гражданин", value: "citizen" },
        { label: "Организация, исполняющая обязанности опекуна", value: "organization" },
        { label: "Не уверен", value: "unsure" }
      ] },
      { name: "guardianData", label: "ФИО, адрес и реквизиты акта о назначении опекуна", type: "textarea", required: true },
      { name: "childData", label: "ФИО, дата рождения и адрес подопечного", type: "textarea", required: true },
      { name: "reportYear", label: "Отчётный год", type: "number" },
      { name: "assetCondition", label: "Состояние имущества подопечного", type: "textarea", required: true, hint: "Если имущества нет, прямо укажите это." },
      { name: "assetLocation", label: "Место хранения или нахождения имущества", type: "textarea", required: true, hint: "Если имущества нет, прямо укажите это." },
      { name: "replacementProperty", label: "Имущество, приобретённое взамен отчуждённого", type: "textarea", required: true, hint: "Если таких операций не было, укажите «не было»." },
      { name: "managementIncome", label: "Доходы от управления имуществом подопечного", type: "textarea", required: true, hint: "Если доходов не было, укажите «не было»." },
      { name: "wardExpenses", label: "Расходы за счёт имущества подопечного", type: "textarea", required: true, hint: "Отдельно обозначьте питание, предметы первой необходимости и мелкие бытовые нужды." },
      { name: "nominalAccountTransactions", label: "Операции и расходы по отдельному номинальному счёту", type: "textarea", required: true, hint: "Если счёт не использовался, укажите это." },
      { name: "supportingDocuments", label: "Подтверждающие документы", type: "textarea", required: true, hint: "Перечислите чеки, квитанции и другие платёжные документы либо укажите, что приложений нет." },
      { name: "minorHouseholdExpenses", label: "Есть расходы на питание, предметы первой необходимости или иные мелкие бытовые нужды?", type: "select", required: true, options: yesNoUnsure },
      { name: "nominalAccountDetails", label: "Реквизиты отдельного номинального счёта и цель выплат", type: "textarea", required: true },
      { name: "nominalOperations", label: "Какие операции или расходы нужно учесть?", type: "textarea", required: true },
      { name: "operationType", label: "Какое имущественное действие планируется?", type: "select", required: true, options: [
        { label: "Расходование денежных средств", value: "money" },
        { label: "Движимое имущество", value: "movable" },
        { label: "Продажа недвижимости", value: "real-estate-sale" },
        { label: "Обмен недвижимости", value: "real-estate-exchange" },
        { label: "Залог или аренда", value: "pledge-rent" },
        { label: "Отказ от права, раздел или выдел доли", value: "waiver-division" },
        { label: "Доверенность от имени подопечного", value: "power-of-attorney" },
        { label: "Мировое соглашение или отказ от иска", value: "court-settlement" },
        { label: "Другое или не уверен", value: "unsure" }
      ] },
      { name: "assetDetails", label: "Имущество, счета, доходы и расходы, которых касается обращение", type: "textarea", required: true },
      { name: "operationDetails", label: "Опишите предполагаемое действие и его условия", type: "textarea" },
      { name: "rightsImpact", label: "Как будут сохранены имущественные и жилищные права ребёнка?", type: "textarea" },
      { name: "complexProperty", label: "Есть недвижимость, ипотека, доли, материнский капитал, наследство или последующая покупка?", type: "select", required: true, options: yesNoUnsure },
      { name: "conflictInterest", label: "В сделке участвует опекун, его супруг или близкий родственник?", type: "select", required: true, options: yesNoUnsure },
      ...authorityFields
    ]
  },
  "refusal-inaction": {
    key: "refusal-inaction",
    title: "Отказ или бездействие органа опеки",
    shortTitle: "Орган опеки отказал или не отвечает",
    choiceDescription: "Зафиксировать решение или нарушение срока и выбрать безопасный способ дальнейшего обращения.",
    description: [
      "Сначала необходимо различить письменный отказ и отсутствие ответа, определить предмет обращения и применимый срок.",
      "Универсальный судебный документ не создаётся: вид производства, подсудность, срок и круг участников зависят от оспариваемого решения и прав заявителя."
    ],
    steps: [
      "Зафиксируйте исходное обращение, дату и подтверждение подачи.",
      "Получите письменное решение или подтвердите отсутствие ответа.",
      "Отдельно проверьте, нет ли непосредственной угрозы жизни или здоровью ребёнка.",
      "Подготовьте внесудебную жалобу либо материалы для правовой проверки.",
      "Судебный способ выбирайте только после определения процессуальной формы."
    ],
    documents: [
      "Копия исходного обращения и подтверждение его подачи.",
      "Письменный отказ — если он получен.",
      "Документы о правах заявителя и затрагиваемых интересах ребёнка."
    ],
    fee: "Пошлина для судебного обращения не определяется автоматически без установленного вида производства и требований. Внесудебная жалоба не сопровождается приблизительным расчётом платежа.",
    term: "Срок обращения и срок ответа зависят от вида исходной процедуры и выбранного способа обжалования. Помощник не подставляет универсальный срок.",
    filing: "Вышестоящий орган, прокуратура или суд — только после проверки компетенции и процессуальной формы. При непосредственной угрозе ребёнку следует обращаться в экстренные службы и компетентные органы без ожидания этого маршрута.",
    mainDocument: "Черновик внесудебной жалобы либо результат «Требуется юридическая проверка способа обжалования».",
    documentSlug: "zhaloba-na-organ-opeki",
    warning: "Судебное административное исковое заявление автоматически не формируется.",
    legalSources: [sources.guardianshipLaw, sources.supremeCourt, sources.emergency],
    helperFields: [
      immediateThreatField,
      { name: "responseState", label: "Что произошло?", type: "select", required: true, options: [
        { label: "Получен письменный отказ", value: "written-refusal" },
        { label: "Ответ не получен", value: "no-response" },
        { label: "Есть только устный отказ", value: "oral-refusal" },
        { label: "Не уверен", value: "unsure" }
      ] },
      { name: "requestedAction", label: "Какой документ или действие вы запрашивали?", type: "textarea", required: true },
      { name: "initialRequestDate", label: "Дата первоначального обращения", type: "date", required: true },
      { name: "responseDate", label: "Дата письменного ответа", type: "date" },
      { name: "refusalDetails", label: "Реквизиты и причины письменного отказа", type: "textarea" },
      { name: "filingProof", label: "Как подтверждается подача первоначального обращения?", type: "textarea", required: true },
      { name: "responseDeadlineExpired", label: "Подтверждённый срок ответа по исходной процедуре истёк?", type: "select", required: true, options: yesNoUnsure, hint: "Универсального срока для всех обращений нет. Сверьте срок по письменному регламенту или уведомлению органа." },
      { name: "complaintChannel", label: "Куда планируете обратиться?", type: "select", required: true, options: [
        { label: "Вышестоящий орган", value: "higher-authority" },
        { label: "Прокуратура", value: "prosecutor" },
        { label: "Суд", value: "court" },
        { label: "Не уверен", value: "unsure" }
      ] },
      { name: "applicantData", label: "ФИО, адрес и контакты заявителя", type: "textarea", required: true },
      { name: "childInterest", label: "Какие права или интересы ребёнка затронуты?", type: "textarea", required: true },
      ...authorityFields
    ]
  }
};

export const GUARDIANSHIP_SCENARIO_CHOICES = GUARDIANSHIP_SCENARIO_KEYS.map((key) => {
  const scenario = GUARDIANSHIP_SCENARIOS[key];
  return { key, title: scenario.shortTitle, description: scenario.choiceDescription };
});

export function getGuardianshipScenario(value: string | undefined) {
  return value && GUARDIANSHIP_SCENARIO_KEYS.includes(value as GuardianshipScenarioKey)
    ? GUARDIANSHIP_SCENARIOS[value as GuardianshipScenarioKey]
    : null;
}

export function getGuardianshipScenarioByDocumentSlug(slug: string) {
  return Object.values(GUARDIANSHIP_SCENARIOS).find((scenario) => scenario.documentSlug === slug) ?? null;
}
