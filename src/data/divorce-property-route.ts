import {
  calculateNotaryAgreementTariff,
  DIVORCE_FEES
} from "@/lib/divorce-property-validator";
import { DIVORCE_PROPERTY_LEGAL_REVIEW } from "@/data/divorce-property-legal-review";

export const DIVORCE_PROPERTY_ROUTE = {
  categorySlug: "semya-i-deti",
  problemSlug: "razvod-i-razdel-imushchestva"
} as const;

export const DIVORCE_PROPERTY_SCENARIO_KEYS = [
  "registry-divorce",
  "court-divorce",
  "property-agreement",
  "property-claim"
] as const;

export type DivorcePropertyScenarioKey = (typeof DIVORCE_PROPERTY_SCENARIO_KEYS)[number];
export type DivorcePropertyGoalKey = "divorce" | "property";

export type DivorcePropertyHelperField = {
  name: string;
  label: string;
  type?: "text" | "date" | "number" | "textarea" | "select" | "court-region";
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
};

export type DivorcePropertyScenario = {
  key: DivorcePropertyScenarioKey;
  goal: DivorcePropertyGoalKey;
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
  helperFields: DivorcePropertyHelperField[];
};

const sources = {
  taxRounding: { title: "Статья 52 НК РФ: округление суммы сбора до полных рублей", href: "https://www.consultant.ru/document/cons_doc_LAW_19671/bbc7b0201b7be7a79e0b44464f1f2fa071d9a774/" },
  familyCode: { title: "Семейный кодекс РФ: официальная публикация", href: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102038925" },
  civilProcedure: { title: "ГПК РФ: официальная публикация", href: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102078828" },
  civilStatus: { title: "Закон N 143-ФЗ: официальная публикация", href: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102050119" },
  minjustForms: { title: "Приказ Минюста России N 201: официальное опубликование", href: "https://publication.pravo.gov.ru/Document/View/0001201810030017" },
  taxCourt: { title: "Статья 333.19 НК РФ: действующая редакция", href: "https://www.consultant.ru/document/cons_doc_LAW_28165/1cfcdcc5936cbfc3ea52f964201a1bb6002be313/" },
  taxCourtAmendment: { title: "Федеральный закон N 259-ФЗ: официальное опубликование изменений пошлин", href: "https://publication.pravo.gov.ru/document/0001202408080089" },
  taxCourtProcedure: { title: "Статья 333.20 НК РФ: расчёт и изменение платежа судом", href: "https://www.consultant.ru/document/cons_doc_LAW_28165/84d383b088ff6ad7be9ba16d43c71828b1105aa5/" },
  taxCourtBenefits: { title: "Статья 333.36 НК РФ: льготы при обращении в суд", href: "https://www.consultant.ru/document/cons_doc_LAW_28165/61fdaaad02ecf7772dc9e0331d21c7ddc3323d4f/" },
  taxCourtDeferral: { title: "Статья 333.41 НК РФ: отсрочка и рассрочка госпошлины", href: "https://www.consultant.ru/document/cons_doc_LAW_28165/43f951e3b5b57ed28f6d22ae8853fbd2d53df025/" },
  taxRegistry: { title: "Статья 333.26 НК РФ: действующая редакция", href: "https://www.consultant.ru/document/cons_doc_LAW_28165/3493a50227f324c50e1f0910735f4588c5630c1b/" },
  taxRegistryAmendment: { title: "Федеральный закон N 176-ФЗ: официальное опубликование изменений пошлин ЗАГС", href: "https://publication.pravo.gov.ru/document/0001202407120009" },
  taxNotary: { title: "Статья 333.24 НК РФ: нотариальные действия", href: "https://www.consultant.ru/document/cons_doc_LAW_28165/a3cd0bcff028f127a00fa0aa61842f4ff13ffafb/" },
  notaryTariffs: { title: "Федеральная нотариальная палата: тарифы и региональная часть", href: "https://notariat.ru/ru-ru/actions-and-tariffs/regional-rates/" },
  notaryFundamentals: DIVORCE_PROPERTY_LEGAL_REVIEW.sources.notaryFundamentals,
  courtSearch: DIVORCE_PROPERTY_LEGAL_REVIEW.sources.courtSearch,
  supremeCourt: { title: "Постановление Пленума ВС РФ от 05.11.1998 N 15", href: "https://www.vsrf.ru/documents/own/7783/" },
  supremeCourtDuty: { title: "Постановление Пленума ВС РФ от 23.12.2025 N 39 о госпошлине", href: "https://www.vsrf.ru/documents/own/35290/" }
} as const;

const yesNoUnsure = [
  { label: "Да", value: "yes" },
  { label: "Нет", value: "no" },
  { label: "Не уверен", value: "unsure" }
];

export const DIVORCE_PROPERTY_GOALS = [
  {
    key: "divorce" as const,
    title: "Развестись",
    description: "Определить, обращаться в ЗАГС или в суд, и подготовить основной документ."
  },
  {
    key: "property" as const,
    title: "Разделить имущество",
    description: "Подготовить проект нотариального соглашения или иск о разделе имущества."
  }
];

export const DIVORCE_PROPERTY_SCENARIOS: Record<DivorcePropertyScenarioKey, DivorcePropertyScenario> = {
  "registry-divorce": {
    key: "registry-divorce",
    goal: "divorce",
    title: "Развод через ЗАГС",
    shortTitle: "Через ЗАГС",
    choiceDescription: "Взаимное согласие без общих несовершеннолетних детей, специальный односторонний случай или регистрация после решения суда.",
    description: [
      "ЗАГС расторгает брак по взаимному согласию супругов без общих несовершеннолетних детей. Наличие имущественного спора само по себе не исключает этот порядок.",
      "По заявлению одного супруга ЗАГС действует только в случаях, прямо названных законом: второй супруг признан безвестно отсутствующим или недееспособным либо осуждён к лишению свободы на срок свыше трёх лет. После судебного развода форма N 12 нужна для государственной регистрации записи и получения свидетельства."
    ],
    steps: [
      "Выберите основание расторжения брака и проверьте, подходит ли внесудебный порядок.",
      "Определите форму N 9, 10, 11 или 12 и подготовьте предусмотренные ею сведения.",
      "Соберите паспорт, сведения о записи брака и документ-основание для специального или судебного случая.",
      "Уплатите госпошлину в размере, рассчитанном для выбранного основания.",
      "Подайте заявление предусмотренным способом и явитесь на регистрацию, если личное присутствие требуется."
    ],
    documents: [
      "Документы, удостоверяющие личности заявителей.",
      "Свидетельство о заключении брака; при его утрате специально получать повторное свидетельство для этой процедуры не требуется.",
      "Вступившее в силу решение суда, приговор суда или иной судебный акт — для соответствующего основания.",
      "Нотариально удостоверенная подпись отсутствующего супруга для формы N 10, кроме предусмотренной законом электронной подачи."
    ],
    fee: `По взаимному согласию и после судебного развода — ${DIVORCE_FEES.registryMutual} руб. с каждого супруга; специальный односторонний случай — ${DIVORCE_FEES.registryUnilateral} руб. с заявителя.`,
    term: "По заявлениям форм N 9-11 регистрация производится по истечении месяца со дня подачи. Для формы N 12 сначала должно вступить в силу решение суда.",
    filing: "Формы N 9 и 10 подают в ЗАГС, через МФЦ или электронный портал в пределах способов, предусмотренных статьёй 33 Закона N 143-ФЗ. Способ подачи форм N 11 и 12 определяется статьями 34-35 этого закона.",
    mainDocument: "Заявление о расторжении брака по форме N 9, 10, 11 или 12.",
    documentSlug: "zayavlenie-o-rastorzhenii-braka-v-zags",
    warning: "Помощник определяет форму и готовит данные, но не создаёт приблизительную копию официального бланка Минюста.",
    legalSources: [sources.civilStatus, sources.minjustForms, sources.taxRegistry, sources.taxRegistryAmendment, sources.familyCode],
    helperFields: [
      { name: "registryGround", label: "На каком основании оформляется развод?", type: "select", required: true, options: [
        { label: "Взаимное согласие, общих несовершеннолетних детей нет", value: "mutual" },
        { label: "Один супруг не может лично подать совместное заявление", value: "separate" },
        { label: "Специальный случай по заявлению одного супруга", value: "special" },
        { label: "Есть вступившее в силу решение суда", value: "court-decision" },
        { label: "Не уверен", value: "unsure" }
      ] },
      { name: "mutualConsent", label: "Оба супруга согласны на развод?", type: "select", options: yesNoUnsure },
      { name: "commonMinorChildren", label: "Есть общие дети младше 18 лет?", type: "select", options: yesNoUnsure },
      { name: "specialBasis", label: "Специальное основание", type: "select", options: [
        { label: "Супруг признан безвестно отсутствующим", value: "missing" },
        { label: "Супруг признан недееспособным", value: "incapable" },
        { label: "Супруг осуждён к лишению свободы свыше трёх лет", value: "imprisoned" },
        { label: "Другое или не уверен", value: "unsure" }
      ] },
      { name: "applicantData", label: "ФИО, дата и место рождения, гражданство, адрес и паспорт заявителя", type: "textarea", required: true },
      { name: "spouseData", label: "Сведения о втором супруге по выбранной форме: ФИО и предусмотренные формой данные", type: "textarea", required: true },
      { name: "contactPhone", label: "Контактный телефон", type: "text", required: true },
      { name: "zagsOffice", label: "Орган ЗАГС, в который подаётся заявление", type: "text", required: true },
      { name: "marriageRecord", label: "Дата и место регистрации брака, орган ЗАГС и номер актовой записи", type: "textarea", required: true },
      { name: "selectedSurnames", label: "Фамилии каждого супруга после развода", type: "textarea", required: true },
      { name: "registryStatistics", label: "Образование, первый или повторный брак и количество общих несовершеннолетних детей — укажите по желанию", type: "textarea" },
      { name: "nationalities", label: "Национальность супругов — укажите по желанию", type: "textarea" },
      { name: "basisDocument", label: "Реквизиты судебного акта и дата вступления в силу", type: "textarea" },
      { name: "foreignCourtDecision", label: "Решение о разводе вынесено иностранным судом?", type: "select", options: yesNoUnsure },
      { name: "absentSignature", label: "Как удостоверена подпись отсутствующего супруга?", type: "textarea" },
      { name: "specialNoticeRecipient", label: "Кому ЗАГС должен направить извещение: наименование или ФИО и полный почтовый адрес", type: "textarea", required: true },
      { name: "courtRegistryAction", label: "Что требуется по форме N 12?", type: "select", required: true, options: [
        { label: "Зарегистрировать расторжение брака по решению суда", value: "registration" },
        { label: "Дополнить ранее составленную запись сведениями о втором бывшем супруге", value: "supplement" },
        { label: "Не уверен", value: "unsure" }
      ] },
      { name: "authorizedRepresentative", label: "Заявление по форме N 12 подаёт уполномоченное лицо?", type: "select", required: true, options: yesNoUnsure },
      { name: "representativeData", label: "ФИО и адрес представителя, паспорт, реквизиты нотариальной доверенности", type: "textarea", required: true },
      { name: "documentDestination", label: "Орган ЗАГС, в который нужно выслать документ — если требуется", type: "text" }
    ]
  },
  "court-divorce": {
    key: "court-divorce",
    goal: "divorce",
    title: "Развод через суд",
    shortTitle: "Через суд",
    choiceDescription: "Есть общие несовершеннолетние дети, нет согласия супруга или он уклоняется от оформления развода.",
    description: [
      "Судебный порядок нужен при общих несовершеннолетних детях, отсутствии согласия второго супруга либо его уклонении от развода через ЗАГС.",
      "Этот документ не добавляет автоматически требования об алиментах, месте жительства ребёнка или порядке общения. Такие вопросы требуют самостоятельной правовой оценки."
    ],
    steps: [
      "Проверьте судебное основание и ограничение права мужа на иск по статье 17 СК РФ.",
      "Определите родовую и территориальную подсудность.",
      "Сформируйте иск и приложения по статьям 131-132 ГПК РФ.",
      "Направьте копии документов ответчику и сохраните подтверждение отправки.",
      "Уплатите госпошлину и подайте иск в выбранный суд."
    ],
    documents: [
      "Документ об уплате госпошлины или подтверждение основания льготы.",
      "Документы о заключении брака и общих несовершеннолетних детях.",
      "Подтверждение направления ответчику копии иска и отсутствующих у него приложений.",
      "Доказательства обстоятельств, на которых основаны требования, если они имеются."
    ],
    fee: `Базовая пошлина — ${DIVORCE_FEES.courtDivorceClaim} руб. за подачу иска. Льгота или изменение платежа по имущественному положению требуют подтверждённого основания. После вступления решения в силу государственная регистрация расторжения брака оплачивается отдельно — ${DIVORCE_FEES.registryMutual} руб. с каждого супруга.`,
    term: "При несогласии одного супруга суд вправе назначить срок для примирения в пределах, установленных статьёй 22 СК РФ. Точную продолжительность конкретного дела заранее определить нельзя.",
    filing: "По общему правилу иск подают по месту жительства ответчика. Истец может подать по своему месту жительства, если при нём находится несовершеннолетний ребёнок или выезд к ответчику затруднителен по состоянию здоровья.",
    mainDocument: "Исковое заявление о расторжении брака.",
    documentSlug: "isk-o-rastorzhenii-braka",
    warning: "Если есть спор о детях или дополнительные требования, подсудность и содержание иска меняются. Помощник остановит автоматическое формирование и сохранит собранные сведения для ручной проверки.",
    legalSources: [sources.familyCode, sources.civilProcedure, sources.courtSearch, sources.taxRounding, sources.taxCourt, sources.taxCourtAmendment, sources.taxCourtProcedure, sources.taxCourtBenefits, sources.taxCourtDeferral, sources.supremeCourtDuty, sources.supremeCourt],
    helperFields: [
      { name: "courtRegion", label: "Регион суда", type: "court-region", required: true },
      { name: "territorialBasis", label: "Основание территориальной подсудности", type: "select", required: true, options: [
        { label: "Место жительства ответчика — статья 28 ГПК РФ", value: "defendant" },
        { label: "При истце находится несовершеннолетний ребёнок — часть 4 статьи 29 ГПК РФ", value: "plaintiff-child" },
        { label: "Выезд к ответчику затруднителен по состоянию здоровья — часть 4 статьи 29 ГПК РФ", value: "plaintiff-health" },
        { label: "Последнее известное место жительства ответчика — часть 1 статьи 29 ГПК РФ", value: "last-known" },
        { label: "Место нахождения имущества ответчика при неизвестном адресе — часть 1 статьи 29 ГПК РФ", value: "defendant-property" }
      ] },
      { name: "territorialAddress", label: "Полный адрес, по которому определяется территория суда", type: "textarea", required: true },
      { name: "jurisdictionEvidence", label: "Документ или обстоятельство, подтверждающее выбранное основание подсудности", type: "textarea" },
      { name: "courtSearchConfirmed", label: "Суд или участок проверен по адресу в официальном сервисе ГАС «Правосудие»?", type: "select", required: true, options: [
        { label: "Да, реквизиты найдены в официальном сервисе", value: "yes" },
        { label: "Нет, участок автоматически не определён", value: "no" }
      ] },
      { name: "courtName", label: "Официальное наименование найденного суда или участка", required: true },
      { name: "courtPrecinctNumber", label: "Номер мирового судебного участка", required: true },
      { name: "courtAddress", label: "Официальный адрес суда или участка", type: "textarea", required: true },
      { name: "courtWebsite", label: "Официальная ссылка на страницу суда или участка", required: true, placeholder: "https://...sudrf.ru/" },
      { name: "appealCourtName", label: "Районный суд, рассматривающий жалобы на решения мирового судьи", required: true },
      { name: "plaintiffData", label: "ФИО, дата и место рождения, адрес, контакты и один идентификатор истца", type: "textarea", required: true },
      { name: "defendantData", label: "ФИО, известные дата и место рождения, адрес, место работы и идентификатор ответчика; неизвестные сведения так и отметьте", type: "textarea", required: true },
      { name: "defendantLocation", label: "Где находится ответчик?", type: "select", required: true, options: [
        { label: "По известному месту жительства в России", value: "known" },
        { label: "Место жительства неизвестно", value: "unknown" },
        { label: "За границей", value: "abroad" },
        { label: "На военной службе / СВО", value: "military" },
        { label: "В месте лишения свободы", value: "prison" }
      ] },
      { name: "marriageRecord", label: "Дата, орган ЗАГС и номер записи о заключении брака", type: "textarea", required: true },
      { name: "relationshipEnded", label: "Когда прекращены семейные отношения и общее хозяйство?", type: "textarea", required: true },
      { name: "commonMinorChildren", label: "Есть общие несовершеннолетние дети?", type: "select", required: true, options: yesNoUnsure },
      { name: "childrenData", label: "ФИО и даты рождения общих несовершеннолетних детей", type: "textarea" },
      { name: "childDispute", label: "Есть спор о месте жительства или общении с детьми?", type: "select", required: true, options: yesNoUnsure },
      { name: "consentState", label: "Позиция второго супруга", type: "select", required: true, options: [
        { label: "Согласен на развод", value: "agrees" },
        { label: "Не согласен", value: "objects" },
        { label: "Уклоняется от оформления через ЗАГС", value: "evades" },
        { label: "Позиция неизвестна", value: "unknown" }
      ] },
      { name: "plaintiffRole", label: "Кто подаёт иск?", type: "select", required: true, options: [{ label: "Муж", value: "husband" }, { label: "Жена", value: "wife" }] },
      { name: "pregnancyOrInfant", label: "Есть обстоятельство, ограничивающее право мужа на иск?", type: "select", required: true, options: [
        { label: "Жена беременна", value: "pregnancy" },
        { label: "Общему ребёнку ещё нет одного года", value: "infant" },
        { label: "Нет", value: "none" },
        { label: "Не уверен", value: "unsure" }
      ] },
      { name: "wifeConsent", label: "Жена согласна на расторжение брака?", type: "select", options: yesNoUnsure },
      { name: "otherClaims", label: "Есть другие требования в этом иске?", type: "select", required: true, options: [
        { label: "Нет, только расторжение брака", value: "none" },
        { label: "Раздел имущества", value: "property" },
        { label: "Алименты или спор о детях", value: "children" },
        { label: "Не уверен", value: "unsure" }
      ] },
      { name: "hearWithoutPlaintiff", label: "Нужно ходатайство о рассмотрении без участия истца?", type: "select", required: true, options: yesNoUnsure },
      { name: "courtFeeRelief", label: "Есть льгота или нужна просьба изменить срок либо размер пошлины?", type: "select", required: true, options: [
        { label: "Нет", value: "none" },
        { label: "Есть установленная законом льгота", value: "statutory" },
        { label: "Нужна отсрочка, рассрочка, уменьшение или освобождение по имущественному положению", value: "hardship" },
        { label: "Не уверен", value: "unsure" }
      ] },
      { name: "feeReliefDetails", label: "Основание льготы или обстоятельства имущественного положения", type: "textarea" }
    ]
  },
  "property-agreement": {
    key: "property-agreement",
    goal: "property",
    title: "Раздел по нотариальному соглашению",
    shortTitle: "По соглашению",
    choiceDescription: "Супруги договорились о составе имущества, распределении и компенсации.",
    description: [
      "Общее имущество можно разделить по соглашению как во время брака, так и после развода. Соглашение должно быть нотариально удостоверено.",
      "Сервис формирует проект для передачи нотариусу. Он не заменяет нотариальное удостоверение и не изменяет автоматически обязательства перед банком или другим кредитором."
    ],
    steps: [
      "Проверьте согласие обоих супругов и действие брачного договора, если он есть.",
      "Перечислите имущество, стоимость, долги и права третьих лиц.",
      "Определите, кому передаётся каждый объект и нужна ли компенсация.",
      "Сформируйте проект соглашения и перечень вопросов для нотариуса.",
      "Передайте проект и оригиналы документов нотариусу для проверки и удостоверения."
    ],
    documents: [
      "Паспорта супругов, свидетельство о браке или расторжении брака.",
      "Правоустанавливающие документы и подтверждение стоимости имущества.",
      "Кредитные, ипотечные и залоговые документы.",
      "Брачный договор и документы о материнском капитале или детских долях, если применимо."
    ],
    fee: `Федеральная часть единого нотариального тарифа — 0,5% суммы соглашения, не менее ${calculateNotaryAgreementTariff(0)} руб. и не более ${calculateNotaryAgreementTariff(100000000)} руб. Региональная часть определяется для субъекта РФ и уточняется у нотариуса до удостоверения.`,
    term: "Единого федерального срока подготовки и удостоверения соглашения не установлено; срок зависит от состава имущества, документов и проверок нотариуса.",
    filing: "Проект передают нотариусу. Переход или изменение прав на недвижимость затем регистрируется в установленном порядке; конкретный комплект проверяет нотариус с учётом объектов соглашения.",
    mainDocument: "Проект соглашения о разделе общего имущества супругов.",
    documentSlug: "soglashenie-o-razdele-imushchestva",
    warning: "Ипотека, материнский капитал, детские доли, банкротство и права третьих лиц требуют ручной проверки. Проект в этих случаях не считается окончательно готовым.",
    legalSources: [sources.familyCode, sources.taxNotary, sources.notaryFundamentals, sources.notaryTariffs, sources.supremeCourt],
    helperFields: [
      { name: "notaryRegion", label: "Регион нотариального действия", type: "court-region", required: true },
      { name: "spouse1Data", label: "ФИО, дата рождения, паспорт и адрес первого супруга", type: "textarea", required: true },
      { name: "spouse2Data", label: "ФИО, дата рождения, паспорт и адрес второго супруга", type: "textarea", required: true },
      { name: "marriageData", label: "Сведения о заключении и, если применимо, расторжении брака", type: "textarea", required: true },
      { name: "divisionTiming", label: "Когда проводится раздел?", type: "select", required: true, options: [
        { label: "Во время брака", value: "during-marriage" },
        { label: "После развода", value: "after-divorce" }
      ] },
      { name: "mutualAgreement", label: "Оба супруга согласовали раздел?", type: "select", required: true, options: yesNoUnsure },
      { name: "marriageContract", label: "Есть брачный договор или прежнее соглашение?", type: "select", required: true, options: yesNoUnsure },
      { name: "marriageContractDetails", label: "Реквизиты и применимые условия брачного договора", type: "textarea" },
      { name: "assets", label: "Полный перечень имущества: объект, дата и основание приобретения, регистрационные данные", type: "textarea", required: true },
      { name: "assetValue", label: "Общая стоимость имущества по соглашению, руб.", type: "number", required: true },
      { name: "allocation", label: "Как имущество распределяется между супругами", type: "textarea", required: true },
      { name: "compensation", label: "Размер, срок и порядок выплаты компенсации, если она предусмотрена", type: "textarea" },
      { name: "transferTerms", label: "Сроки и порядок передачи имущества и документов", type: "textarea", required: true },
      { name: "debts", label: "Кредиты, долги, кредиторы и предложенное распределение обязательств", type: "textarea" },
      { name: "mortgage", label: "Есть ипотека или залог?", type: "select", required: true, options: yesNoUnsure },
      { name: "maternityCapital", label: "Использовался материнский капитал?", type: "select", required: true, options: yesNoUnsure },
      { name: "childrenShares", label: "Есть доли или имущество детей?", type: "select", required: true, options: yesNoUnsure },
      { name: "thirdPartyRights", label: "Есть права банков, кредиторов или иных третьих лиц?", type: "select", required: true, options: yesNoUnsure },
      { name: "bankruptcy", label: "Есть банкротство одного из супругов?", type: "select", required: true, options: yesNoUnsure }
    ]
  },
  "property-claim": {
    key: "property-claim",
    goal: "property",
    title: "Раздел имущества через суд",
    shortTitle: "Через суд",
    choiceDescription: "Есть спор о составе имущества, долях, компенсации, сделках или долгах.",
    description: [
      "При споре состав общего имущества, доли и способ раздела определяет суд. Имущество оценивается, а госпошлина рассчитывается по цене иска.",
      "Трёхлетний срок после развода не исчисляется автоматически со дня развода: по пункту 19 Постановления Пленума ВС РФ N 15 важен момент, когда бывший супруг узнал или должен был узнать о нарушении права."
    ],
    steps: [
      "Определите состав спорного имущества, его правовой режим и стоимость.",
      "Сформулируйте требования о долях, передаче объектов и компенсации.",
      "Проверьте подсудность, цену иска и госпошлину.",
      "Подготовьте иск, расчёт, перечень имущества и обязательные приложения.",
      "При подтверждённом риске отдельно решите вопрос об обеспечении иска или истребовании доказательств."
    ],
    documents: [
      "Документы о браке и его расторжении, приобретении и стоимости имущества.",
      "Выписки, договоры, платёжные документы и доказательства источника средств.",
      "Кредитные, ипотечные документы, брачный договор и документы о правах детей или третьих лиц.",
      "Подтверждение направления ответчику копий иска и приложений."
    ],
    fee: "Базовая госпошлина рассчитывается по прогрессивной шкале статьи 333.19 НК РФ исходя из цены иска: от 4 000 до 900 000 руб. При объединении с разводом добавляется 5 000 руб. за неимущественное требование. Льготы и изменение платежа проверяются отдельно.",
    term: "Срок рассмотрения конкретного дела зависит от суда, экспертизы, состава имущества и участников. Помощник не обещает дату решения.",
    filing: "До 50 000 руб. цены иска спор о разделе имущества относится к мировому судье; свыше 50 000 руб. — к районному суду. Иски о правах на недвижимость требуют отдельной проверки исключительной подсудности по статье 30 ГПК РФ.",
    mainDocument: "Исковое заявление о разделе общего имущества супругов.",
    documentSlug: "isk-o-razdele-imushchestva-suprugov",
    warning: "Иностранное имущество, банкротство, материнский капитал, детские доли и права третьих лиц требуют ручной проверки. Помощник сформирует черновик и отметит ограничения.",
    legalSources: [sources.familyCode, sources.civilProcedure, sources.courtSearch, sources.taxRounding, sources.taxCourt, sources.taxCourtAmendment, sources.taxCourtProcedure, sources.taxCourtBenefits, sources.taxCourtDeferral, sources.supremeCourtDuty, sources.supremeCourt],
    helperFields: [
      { name: "courtRegion", label: "Регион суда", type: "court-region", required: true },
      { name: "territorialBasis", label: "Основание территориальной подсудности", type: "select", required: true, options: [
        { label: "Место жительства ответчика — статья 28 ГПК РФ", value: "defendant" },
        { label: "Последнее известное место жительства ответчика — часть 1 статьи 29 ГПК РФ", value: "last-known" },
        { label: "Место нахождения имущества ответчика при неизвестном адресе — часть 1 статьи 29 ГПК РФ", value: "defendant-property" },
        { label: "Место недвижимости — только для самостоятельного требования, подпадающего под статью 30 ГПК РФ", value: "real-estate-exclusive" }
      ] },
      { name: "territorialAddress", label: "Полный адрес, по которому определяется территория суда", type: "textarea", required: true },
      { name: "jurisdictionEvidence", label: "Документ или обстоятельство, подтверждающее выбранное основание подсудности", type: "textarea" },
      { name: "courtSearchConfirmed", label: "Суд или участок проверен по адресу в официальном сервисе ГАС «Правосудие»?", type: "select", required: true, options: [
        { label: "Да, реквизиты найдены в официальном сервисе", value: "yes" },
        { label: "Нет, участок автоматически не определён", value: "no" }
      ] },
      { name: "courtName", label: "Официальное наименование найденного суда или участка", required: true },
      { name: "courtPrecinctNumber", label: "Номер мирового судебного участка", required: true },
      { name: "courtAddress", label: "Официальный адрес суда или участка", type: "textarea", required: true },
      { name: "courtWebsite", label: "Официальная ссылка на страницу суда или участка", required: true, placeholder: "https://...sudrf.ru/" },
      { name: "appealCourtName", label: "Районный суд, рассматривающий жалобы на решения мирового судьи", required: true },
      { name: "plaintiffData", label: "ФИО, дата и место рождения, адрес, контакты и один идентификатор истца", type: "textarea", required: true },
      { name: "defendantData", label: "ФИО, известные дата и место рождения, адрес, место работы и идентификатор ответчика; неизвестные сведения так и отметьте", type: "textarea", required: true },
      { name: "marriageData", label: "Сведения о браке, разводе и прекращении общего хозяйства", type: "textarea", required: true },
      { name: "divisionTiming", label: "Когда проводится раздел?", type: "select", required: true, options: [
        { label: "Во время брака", value: "during-marriage" },
        { label: "После развода", value: "after-divorce" }
      ] },
      { name: "assetOrigin", label: "Основное основание приобретения спорного имущества", type: "select", required: true, options: [
        { label: "Приобретено в браке на общие средства", value: "common" },
        { label: "Приобретено до брака", value: "before-marriage" },
        { label: "Получено в дар", value: "gift" },
        { label: "Получено по наследству", value: "inheritance" },
        { label: "Есть общие и личные вложения", value: "mixed-funds" },
        { label: "Не уверен", value: "unsure" }
      ] },
      { name: "fundingSource", label: "Источники средств на приобретение и доказательства личных вложений", type: "textarea", required: true },
      { name: "marriageContract", label: "Есть брачный договор или соглашение?", type: "select", required: true, options: yesNoUnsure },
      { name: "existingNotarialAgreement", label: "Есть действующее нотариальное соглашение о разделе этого имущества?", type: "select", required: true, options: yesNoUnsure },
      { name: "debtType", label: "Как связаны долги с семьёй?", type: "select", required: true, options: [
        { label: "Общие обязательства или использованы на нужды семьи", value: "common" },
        { label: "Личные обязательства одного супруга", value: "personal" },
        { label: "Есть общие и личные долги", value: "mixed" },
        { label: "Долгов нет", value: "none" },
        { label: "Не уверен", value: "unsure" }
      ] },
      { name: "debts", label: "Общие и личные долги, кредиторы и связь обязательств с нуждами семьи", type: "textarea" },
      { name: "mortgage", label: "Есть ипотека или залог?", type: "select", required: true, options: yesNoUnsure },
      { name: "maternityCapital", label: "Использовался материнский капитал?", type: "select", required: true, options: yesNoUnsure },
      { name: "childrenShares", label: "Есть доли или имущество детей?", type: "select", required: true, options: yesNoUnsure },
      { name: "thirdPartyRights", label: "Имущество или права находятся у третьих лиц?", type: "select", required: true, options: yesNoUnsure },
      { name: "bankruptcy", label: "Есть банкротство одного из супругов?", type: "select", required: true, options: yesNoUnsure },
      { name: "foreignProperty", label: "Есть имущество за границей?", type: "select", required: true, options: yesNoUnsure },
      { name: "hiddenOrSold", label: "Имущество продано, подарено, израсходовано или скрывается?", type: "select", required: true, options: yesNoUnsure },
      { name: "violationKnownAt", label: "Когда и из каких обстоятельств стало известно о нарушении права?", type: "textarea", required: true },
      { name: "limitationCertain", label: "Момент нарушения права подтверждён документами?", type: "select", required: true, options: yesNoUnsure },
      { name: "evidence", label: "Имеющиеся доказательства и документы, которых нет у истца", type: "textarea", required: true },
      { name: "needSecurity", label: "Есть подтверждённый риск продажи, дарения или сокрытия имущества?", type: "select", required: true, options: yesNoUnsure },
      { name: "needEvidenceRequest", label: "Нужно истребовать доказательства, которые невозможно получить самостоятельно?", type: "select", required: true, options: yesNoUnsure },
      { name: "combineDivorce", label: "Добавить требование о расторжении брака?", type: "select", required: true, options: yesNoUnsure },
      { name: "combinedCommonMinorChildren", label: "Есть общие несовершеннолетние дети?", type: "select", required: true, options: yesNoUnsure },
      { name: "combinedChildrenData", label: "ФИО и даты рождения общих несовершеннолетних детей", type: "textarea", required: true },
      { name: "combinedChildDispute", label: "Есть спор о месте жительства или общении с детьми?", type: "select", required: true, options: yesNoUnsure },
      { name: "combinedConsentState", label: "Позиция второго супруга по разводу", type: "select", required: true, options: [
        { label: "Согласен", value: "agrees" },
        { label: "Не согласен", value: "objects" },
        { label: "Уклоняется от оформления через ЗАГС", value: "evades" },
        { label: "Позиция неизвестна", value: "unknown" }
      ] },
      { name: "combinedPlaintiffRole", label: "Кто заявляет требование о разводе?", type: "select", required: true, options: [{ label: "Муж", value: "husband" }, { label: "Жена", value: "wife" }] },
      { name: "combinedPregnancyOrInfant", label: "Есть обстоятельство, ограничивающее право мужа на иск?", type: "select", required: true, options: [
        { label: "Жена беременна", value: "pregnancy" },
        { label: "Общему ребёнку ещё нет одного года", value: "infant" },
        { label: "Нет", value: "none" },
        { label: "Не уверен", value: "unsure" }
      ] },
      { name: "combinedWifeConsent", label: "Жена согласна на расторжение брака?", type: "select", required: true, options: yesNoUnsure },
      { name: "courtFeeRelief", label: "Есть льгота или нужна просьба изменить срок либо размер пошлины?", type: "select", required: true, options: [
        { label: "Нет", value: "none" },
        { label: "Есть установленная законом льгота", value: "statutory" },
        { label: "Нужна отсрочка, рассрочка, уменьшение или освобождение по имущественному положению", value: "hardship" },
        { label: "Не уверен", value: "unsure" }
      ] },
      { name: "feeReliefDetails", label: "Основание льготы или обстоятельства имущественного положения", type: "textarea" }
    ]
  }
};

export const DIVORCE_PROPERTY_SCENARIO_CHOICES = DIVORCE_PROPERTY_SCENARIO_KEYS.map((key) => ({
  key,
  goal: DIVORCE_PROPERTY_SCENARIOS[key].goal,
  title: DIVORCE_PROPERTY_SCENARIOS[key].shortTitle,
  description: DIVORCE_PROPERTY_SCENARIOS[key].choiceDescription
}));

export function getDivorcePropertyScenario(value: string | undefined) {
  return value && DIVORCE_PROPERTY_SCENARIO_KEYS.includes(value as DivorcePropertyScenarioKey)
    ? DIVORCE_PROPERTY_SCENARIOS[value as DivorcePropertyScenarioKey]
    : null;
}

export function getDivorcePropertyGoal(value: string | undefined) {
  return value === "divorce" || value === "property" ? value : null;
}

export function getDivorceScenarioByDocumentSlug(slug: string) {
  return Object.values(DIVORCE_PROPERTY_SCENARIOS).find((scenario) => scenario.documentSlug === slug) ?? null;
}
