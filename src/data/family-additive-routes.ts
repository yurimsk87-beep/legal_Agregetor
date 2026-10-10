import { FAMILY_ADDITIVE_REVIEWED_AT } from "@/data/family-additive-problems";

export type FamilyAdditiveRouteSlug =
  | "alimenty-na-sovershennoletnego-rebenka"
  | "prekrashchenie-i-osvobozhdenie-ot-alimentov"
  | "alimenty-na-soderzhanie-roditeley"
  | "otmena-usynovleniya"
  | "dokumenty-o-rozhdenii-i-aktovaya-zapis";

export type FamilyAdditiveField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "number" | "select" | "court-name" | "court-source";
  required?: boolean;
  hint?: string;
  options?: Array<{ label: string; value: string }>;
};

export type FamilyAdditiveResultKind = "checklist" | "agreementDraft" | "courtDraft" | "enforcementDraft" | "officialForm" | "preparedData" | "legalReviewOnly";

export type FamilyAdditiveScenario = {
  key: string;
  title: string;
  shortTitle: string;
  choiceDescription: string;
  description: string[];
  steps: string[];
  documents: string[];
  filing: string;
  term: string;
  fee: string;
  warning: string;
  documentSlug: string;
  documentTitle: string;
  documentType: string;
  resultKind: FamilyAdditiveResultKind;
  officialForm?: { number: string; title: string; url: string };
  helperFields: FamilyAdditiveField[];
};

export type FamilyAdditiveRoute = {
  problemSlug: FamilyAdditiveRouteSlug;
  title: string;
  intro: string;
  legalReviewDate: string;
  scenarios: Record<string, FamilyAdditiveScenario>;
};

const yesNoUnsure = [
  { label: "Да", value: "yes" },
  { label: "Нет", value: "no" },
  { label: "Не уверен", value: "unsure" }
];

const applicant = (label = "Сведения о заявителе") => ({ name: "applicantData", label, type: "textarea" as const, required: true, hint: "ФИО, дата рождения, адрес и контакты без лишних персональных сведений." });
const counterparty = (label: string) => ({ name: "counterpartyData", label, type: "textarea" as const, required: true });
const circumstances = (label = "Подтверждённые обстоятельства") => ({ name: "circumstances", label, type: "textarea" as const, required: true, hint: "Укажите только факты, которые можно подтвердить документами или иными допустимыми доказательствами." });
const evidence = (label = "Доказательства и документы") => ({ name: "evidenceDetails", label, type: "textarea" as const, required: true });
const courtFields: FamilyAdditiveField[] = [
  { name: "courtName", label: "Полное официальное наименование суда", type: "court-name", required: true },
  { name: "courtSource", label: "Ссылка на официальную страницу суда", type: "court-source", required: true, hint: "Используйте sudrf.ru или официальный сайт суда." }
];

const adultStatusFields: FamilyAdditiveField[] = [
  { name: "childAgeStatus", label: "Ребёнку уже исполнилось 18 лет?", type: "select", required: true, options: yesNoUnsure },
  { name: "incapacityConfirmed", label: "Нетрудоспособность подтверждена?", type: "select", required: true, options: yesNoUnsure },
  { name: "needConfirmed", label: "Нуждаемость в помощи подтверждена?", type: "select", required: true, options: yesNoUnsure },
  { name: "studyOnly", label: "Требование основано только на очном обучении?", type: "select", required: true, options: yesNoUnsure }
];

const adultPartyFields: FamilyAdditiveField[] = [
  applicant("Совершеннолетний ребёнок или его законный представитель"),
  counterparty("Родитель, от которого требуется содержание"),
  { name: "applicantRole", label: "Кто обращается?", type: "select", required: true, options: [
    { label: "Совершеннолетний ребёнок лично", value: "adult-child" },
    { label: "Законный представитель недееспособного гражданина", value: "legal-representative" },
    { label: "Родитель без подтверждённых полномочий", value: "parent-unconfirmed" },
    { label: "Иное лицо", value: "other" }
  ] },
  { name: "financialDetails", label: "Доходы, обязательные расходы и семейное положение сторон", type: "textarea", required: true }
];

const ADULT_CHILD_SUPPORT_SCENARIOS: Record<string, FamilyAdditiveScenario> = {
  eligibility: {
    key: "eligibility", title: "Проверить право после 18 лет", shortTitle: "Проверка права", choiceDescription: "Отделите обучение от юридически значимых условий нетрудоспособности и нуждаемости.",
    description: ["Подходит для первичной проверки условий статьи 85 СК РФ.", "Если ребёнку нет 18 лет, сервис направит в существующий маршрут алиментов несовершеннолетнему."],
    steps: ["Подтвердите возраст.", "Проверьте нетрудоспособность.", "Проверьте нуждаемость.", "Соберите документы о положении сторон."], documents: ["Документ о возрасте и родстве.", "Подтверждение нетрудоспособности.", "Расчёт нуждаемости и обязательных расходов."],
    filing: "Это проверка применимости, а не документ для подачи.", term: "Специальный срок для проверки не установлен.", fee: "Проверка бесплатна.", warning: "Очное обучение после 18 лет само по себе не создаёт право на алименты.",
    documentSlug: "proverka-prava-na-soderzhanie-sovershennoletnego-rebenka", documentTitle: "Проверка права на содержание совершеннолетнего ребёнка", documentType: "Чек-лист", resultKind: "checklist", helperFields: adultStatusFields
  },
  agreement: {
    key: "agreement", title: "Подготовить соглашение", shortTitle: "Соглашение", choiceDescription: "Зафиксируйте добровольные условия содержания для последующего нотариального удостоверения.",
    description: ["Проект помогает согласовать сумму, срок и порядок платежей.", "Юридическую силу исполнительного документа соглашение получает после нотариального удостоверения."],
    steps: ["Подтвердите применимость.", "Согласуйте условия.", "Подготовьте подтверждения сторон.", "Передайте проект нотариусу."], documents: ["Документы сторон.", "Подтверждения статуса ребёнка.", "Согласованные условия и реквизиты."],
    filing: "Выбранный нотариус.", term: "Срок согласования и удостоверения определяет нотариус.", fee: "Размер нотариального тарифа проверяется у выбранного нотариуса.", warning: "Проект сервиса не является нотариальным соглашением.",
    documentSlug: "soglashenie-o-soderzhanii-sovershennoletnego-rebenka", documentTitle: "Проект соглашения о содержании совершеннолетнего ребёнка", documentType: "Проект соглашения", resultKind: "agreementDraft",
    helperFields: [...adultStatusFields, ...adultPartyFields, { name: "mutualConsent", label: "Обе стороны согласовали условия?", type: "select", required: true, options: yesNoUnsure }, { name: "paymentTerms", label: "Сумма, периодичность, срок и способ платежей", type: "textarea", required: true }]
  },
  claim: {
    key: "claim", title: "Взыскать содержание через суд", shortTitle: "Судебное взыскание", choiceDescription: "Подготовьте судебный документ при отсутствии добровольного соглашения.",
    description: ["Суд проверяет нетрудоспособность, нуждаемость и положение сторон.", "Размер определяется в твёрдой денежной сумме ежемесячно."],
    steps: ["Проверьте заявителя.", "Соберите доказательства.", "Рассчитайте потребности.", "Подтвердите суд.", "Проверьте иск у юриста."], documents: ["Документы о родстве и возрасте.", "Доказательства нетрудоспособности и нуждаемости.", "Расчёт и документы о положении сторон.", "Подтверждение направления копии иска."],
    filing: "Районный суд с проверкой территориальной подсудности.", term: "Срок рассмотрения и результат не прогнозируются.", fee: "Истец по требованию о взыскании алиментов освобождён от госпошлины; соединённые требования проверяются отдельно.", warning: "Суд, состав требований и приложения требуют юридической проверки.",
    documentSlug: "isk-o-vzyskanii-alimentov-na-sovershennoletnego-rebenka", documentTitle: "Иск о взыскании алиментов на совершеннолетнего ребёнка", documentType: "Исковое заявление", resultKind: "courtDraft",
    helperFields: [...adultStatusFields, ...adultPartyFields, circumstances(), evidence(), { name: "requestedAmount", label: "Просимая ежемесячная сумма и её расчёт", type: "textarea", required: true }, ...courtFields]
  },
  change: {
    key: "change", title: "Изменить установленное содержание", shortTitle: "Изменение содержания", choiceDescription: "Проверьте изменение обстоятельств после соглашения или судебного решения.",
    description: ["Сначала определяется источник действующей обязанности.", "Судебный и договорный пути нельзя смешивать."],
    steps: ["Укажите действующий документ.", "Зафиксируйте изменение обстоятельств.", "Определите договорный или судебный путь.", "Проверьте документ у юриста."], documents: ["Действующее соглашение или судебный акт.", "Доказательства новых обстоятельств.", "Расчёт предлагаемого изменения."],
    filing: "Нотариус либо районный суд — после определения действующего основания.", term: "Проверяется индивидуально.", fee: "Тариф или госпошлина зависят от выбранного пути.", warning: "Изменение не наступает автоматически из-за изменения дохода одной стороны.",
    documentSlug: "isk-ob-izmenenii-soderzhaniya-sovershennoletnego-rebenka", documentTitle: "Требование об изменении содержания совершеннолетнего ребёнка", documentType: "Судебный документ", resultKind: "courtDraft",
    helperFields: [...adultStatusFields, ...adultPartyFields, { name: "existingBasis", label: "Чем установлено содержание?", type: "select", required: true, options: [{ label: "Решением суда", value: "court" }, { label: "Нотариальным соглашением", value: "agreement" }, { label: "Не уверен", value: "unsure" }] }, { name: "existingDocument", label: "Реквизиты действующего документа", type: "textarea", required: true }, circumstances("Что изменилось после установления содержания?"), evidence(), ...courtFields]
  }
};

const obligationFields: FamilyAdditiveField[] = [
  { name: "obligationSource", label: "Чем установлена обязанность?", type: "select", required: true, options: [{ label: "Судебным решением или приказом", value: "court" }, { label: "Нотариальным соглашением", value: "agreement" }, { label: "Не уверен", value: "unsure" }] },
  { name: "existingDocument", label: "Реквизиты действующего документа", type: "textarea", required: true },
  { name: "hasDebt", label: "Есть задолженность?", type: "select", required: true, options: yesNoUnsure },
  { name: "paternityDispute", label: "Требование связано с оспариванием отцовства?", type: "select", required: true, options: yesNoUnsure },
  applicant(), counterparty("Получатель алиментов")
];

const ALIMONY_TERMINATION_SCENARIOS: Record<string, FamilyAdditiveScenario> = {
  termination: {
    key: "termination", title: "Проверить прекращение в силу закона", shortTitle: "Прекращение обязанности", choiceDescription: "Проверьте совершеннолетие, усыновление, смерть стороны или другое основание статьи 120 СК РФ.",
    description: ["Ветвь относится к будущим платежам.", "Накопившийся долг проверяется отдельно и автоматически не исчезает."], steps: ["Установите основание.", "Сверьте первоначальный документ.", "Проверьте задолженность.", "Определите действие суда или пристава."], documents: ["Исполнительный документ.", "Подтверждение события-основания.", "Постановления и расчёт пристава."],
    filing: "Суд или подразделение ФССП — в зависимости от основания и исполнительного документа.", term: "Срок зависит от процедуры.", fee: "Автоматический размер не определяется.", warning: "Не прекращайте выплаты самостоятельно до подтверждения применимого порядка.",
    documentSlug: "proverka-osnovaniya-prekrashcheniya-alimentov", documentTitle: "Проверка основания прекращения алиментов", documentType: "Чек-лист", resultKind: "checklist",
    helperFields: [...obligationFields, { name: "terminationBasis", label: "Предполагаемое основание", type: "select", required: true, options: [{ label: "Ребёнок достиг 18 лет или полной дееспособности", value: "majority" }, { label: "Ребёнок усыновлён другим лицом", value: "adoption" }, { label: "Восстановлена трудоспособность или прекращена нуждаемость", value: "capacity-restored" }, { label: "Бывший супруг-получатель вступил в новый брак", value: "new-marriage" }, { label: "Смерть плательщика или получателя", value: "death" }, { label: "Иное или не уверен", value: "other" }] }, { name: "basisConfirmed", label: "Основание подтверждено официальным документом?", type: "select", required: true, options: yesNoUnsure }, evidence()]
  },
  agreement: {
    key: "agreement", title: "Изменить или расторгнуть соглашение", shortTitle: "Соглашение", choiceDescription: "Подготовьте взаимно согласованные условия для нотариуса.",
    description: ["Односторонний отказ от нотариального соглашения не допускается.", "Изменение и расторжение оформляются в той же форме."], steps: ["Проверьте соглашение.", "Согласуйте условия.", "Подготовьте проект.", "Обратитесь к нотариусу."], documents: ["Нотариальное соглашение.", "Документы сторон.", "Согласованные условия изменения или расторжения."],
    filing: "Выбранный нотариус.", term: "Определяется нотариусом.", fee: "Проверяется у выбранного нотариуса.", warning: "Без согласия другой стороны судебный путь проверяется отдельно.",
    documentSlug: "soglashenie-ob-izmenenii-ili-rastorzhenii-alimentov", documentTitle: "Проект изменения или расторжения соглашения об алиментах", documentType: "Проект соглашения", resultKind: "agreementDraft",
    helperFields: [...obligationFields, { name: "agreementAction", label: "Что согласовано?", type: "select", required: true, options: [{ label: "Изменить условия", value: "change" }, { label: "Расторгнуть соглашение", value: "terminate" }] }, { name: "mutualConsent", label: "Обе стороны согласны?", type: "select", required: true, options: yesNoUnsure }, { name: "paymentTerms", label: "Согласованные изменения и дата их применения", type: "textarea", required: true }]
  },
  futureRelief: {
    key: "futureRelief", title: "Изменить размер или освободиться от будущей уплаты", shortTitle: "Будущие платежи", choiceDescription: "Подготовьте иск по статье 119 СК РФ при изменении материального или семейного положения.",
    description: ["Ветвь не касается списания уже возникшего долга.", "Изменение положения не гарантирует удовлетворение иска."], steps: ["Опишите изменения.", "Соберите подтверждения.", "Проверьте суд.", "Подготовьте иск.", "Передайте его юристу."], documents: ["Судебный акт об алиментах.", "Доказательства изменения положения.", "Расчёт и сведения о сторонах."],
    filing: "Районный суд с индивидуальной проверкой территориальной подсудности.", term: "Срок и результат не прогнозируются.", fee: "Размер пошлины проверяется по предмету и цене требования; льгота взыскателя не применяется автоматически к плательщику.", warning: "Не включайте требование о долге без отдельной ветви и расчёта.",
    documentSlug: "isk-ob-osvobozhdenii-ot-uplaty-alimentov", documentTitle: "Иск об изменении размера или освобождении от дальнейшей уплаты алиментов", documentType: "Исковое заявление", resultKind: "courtDraft",
    helperFields: [...obligationFields, circumstances("Изменение материального или семейного положения"), evidence(), { name: "requestedChange", label: "Какое изменение требуется и почему?", type: "textarea", required: true }, ...courtFields]
  },
  debtRelief: {
    key: "debtRelief", title: "Уменьшить задолженность или освободиться от неё", shortTitle: "Задолженность", choiceDescription: "Отдельно проверьте уважительную причину неуплаты и невозможность погасить долг.",
    description: ["Статья 114 СК РФ требует совокупности юридически значимых обстоятельств.", "Для долга по несовершеннолетнему ребёнку взаимное списание не применяется."], steps: ["Получите расчёт долга.", "Подтвердите причины неуплаты.", "Подтвердите невозможность погашения.", "Проверьте суд и иск."], documents: ["Постановление и расчёт задолженности.", "Медицинские и иные подтверждения уважительной причины.", "Документы о доходах, расходах и семье."],
    filing: "Районный суд.", term: "Срок и результат не прогнозируются.", fee: "Пошлина зависит от характера и размера требования и проверяется до подачи.", warning: "Тяжёлое положение без уважительной причины образования долга недостаточно само по себе.",
    documentSlug: "isk-ob-umenshenii-zadolzhennosti-po-alimentam", documentTitle: "Иск об уменьшении задолженности по алиментам или освобождении от неё", documentType: "Исковое заявление", resultKind: "courtDraft",
    helperFields: [...obligationFields, { name: "debtAmount", label: "Размер задолженности по официальному расчёту", type: "number", required: true }, { name: "nonpaymentReason", label: "Причина неуплаты", type: "select", required: true, options: [{ label: "Болезнь", value: "illness" }, { label: "Иная подтверждаемая уважительная причина", value: "other-respectful" }, { label: "Причина не подтверждена", value: "unconfirmed" }] }, { name: "cannotRepay", label: "Материальное и семейное положение не позволяет погасить долг?", type: "select", required: true, options: yesNoUnsure }, circumstances(), evidence(), ...courtFields]
  },
  enforcement: {
    key: "enforcement", title: "Обратиться по исполнительному производству", shortTitle: "Исполнительное производство", choiceDescription: "Подготовьте обращение после проверки основания и действующего производства.",
    description: ["Пристав не подменяет суд там, где нужен новый судебный акт.", "Обращение формируется только по подтверждённому производству."], steps: ["Укажите производство.", "Приложите основание.", "Определите полномочие пристава.", "Подготовьте обращение."], documents: ["Номер и постановления производства.", "Исполнительный документ.", "Подтверждение основания."],
    filing: "Подразделение ФССП, ведущее производство, либо суд, если вопрос не относится к полномочиям пристава.", term: "Срок зависит от вида обращения и обжалования.", fee: "Обращение приставу госпошлиной не облагается; судебный путь проверяется отдельно.", warning: "Сервис не утверждает, что пристав вправе прекратить производство без анализа основания.",
    documentSlug: "zayavlenie-o-prekrashchenii-ispolnitelnogo-proizvodstva-po-alimentam", documentTitle: "Обращение по вопросу прекращения алиментного исполнительного производства", documentType: "Заявление", resultKind: "enforcementDraft",
    helperFields: [...obligationFields, { name: "enforcementNumber", label: "Номер исполнительного производства", type: "text", required: true }, { name: "authorityName", label: "Подразделение ФССП и судебный пристав", type: "textarea", required: true }, { name: "terminationBasis", label: "Основание обращения", type: "select", required: true, options: [{ label: "Совершеннолетие или полная дееспособность", value: "majority" }, { label: "Усыновление", value: "adoption" }, { label: "Смерть стороны", value: "death" }, { label: "Судебный акт о прекращении или освобождении", value: "court-act" }, { label: "Иное", value: "other" }] }, { name: "basisConfirmed", label: "Есть официальный подтверждающий документ?", type: "select", required: true, options: yesNoUnsure }, evidence()]
  }
};

const parentEligibilityFields: FamilyAdditiveField[] = [
  { name: "directionConfirmed", label: "Содержание требуется родителю от совершеннолетнего ребёнка?", type: "select", required: true, options: yesNoUnsure },
  { name: "childAdult", label: "Ребёнок совершеннолетний?", type: "select", required: true, options: yesNoUnsure },
  { name: "childAble", label: "Ребёнок трудоспособен?", type: "select", required: true, options: yesNoUnsure },
  { name: "parentIncapacity", label: "Нетрудоспособность родителя подтверждена?", type: "select", required: true, options: yesNoUnsure },
  { name: "parentNeed", label: "Нуждаемость родителя подтверждена?", type: "select", required: true, options: yesNoUnsure },
  { name: "parentDeprived", label: "Родитель был лишён родительских прав в отношении этого ребёнка?", type: "select", required: true, options: yesNoUnsure },
  { name: "parentAvoidedDuties", label: "Есть подтверждения уклонения родителя от выполнения обязанностей?", type: "select", required: true, options: yesNoUnsure },
  { name: "otherAdultChildren", label: "Сведения обо всех других совершеннолетних детях", type: "textarea", required: true }
];
const parentPartyFields = [applicant("Родитель-заявитель"), counterparty("Совершеннолетний ребёнок"), { name: "financialDetails", label: "Доходы, обязательные расходы и семейное положение родителя и детей", type: "textarea" as const, required: true }];

const PARENT_SUPPORT_SCENARIOS: Record<string, FamilyAdditiveScenario> = {
  eligibility: {
    key: "eligibility", title: "Проверить право родителя", shortTitle: "Проверка права", choiceDescription: "Проверьте направление обязанности, статусы сторон и законные исключения.", description: ["Маршрут относится только к содержанию родителя ребёнком.", "Нетрудоспособность и нуждаемость проверяются раздельно."], steps: ["Подтвердите родство.", "Проверьте статусы сторон.", "Укажите всех детей.", "Проверьте исключения."], documents: ["Документы о родстве.", "Подтверждения нетрудоспособности и нуждаемости.", "Сведения о детях и прежнем исполнении обязанностей."], filing: "Проверка применимости, не документ для подачи.", term: "Не установлен.", fee: "Бесплатно.", warning: "Лишение родительских прав исключает право на содержание; уклонение от обязанностей оценивает суд.", documentSlug: "proverka-prava-na-soderzhanie-roditelya", documentTitle: "Проверка права родителя на содержание", documentType: "Чек-лист", resultKind: "checklist", helperFields: parentEligibilityFields
  },
  agreement: {
    key: "agreement", title: "Подготовить соглашение", shortTitle: "Соглашение", choiceDescription: "Согласуйте добровольное содержание родителя для нотариуса.", description: ["Условия должны быть добровольными и определёнными.", "Проект не заменяет нотариальное удостоверение."], steps: ["Проверьте применимость.", "Согласуйте сумму и порядок.", "Подготовьте документы.", "Обратитесь к нотариусу."], documents: ["Документы сторон и о родстве.", "Подтверждения статуса родителя.", "Согласованные условия."], filing: "Выбранный нотариус.", term: "Определяет нотариус.", fee: "Проверяется у нотариуса.", warning: "Проект не имеет силы исполнительного документа до нотариального удостоверения.", documentSlug: "soglashenie-o-soderzhanii-roditelya", documentTitle: "Проект соглашения о содержании родителя", documentType: "Проект соглашения", resultKind: "agreementDraft", helperFields: [...parentEligibilityFields, ...parentPartyFields, { name: "mutualConsent", label: "Стороны согласовали условия?", type: "select", required: true, options: yesNoUnsure }, { name: "paymentTerms", label: "Сумма, срок, периодичность и способ содержания", type: "textarea", required: true }]
  },
  claim: {
    key: "claim", title: "Взыскать содержание через суд", shortTitle: "Судебное взыскание", choiceDescription: "Подготовьте иск о ежемесячном содержании по статье 87 СК РФ.", description: ["Суд учитывает материальное и семейное положение.", "Суд вправе учесть всех совершеннолетних детей."], steps: ["Подтвердите условия.", "Соберите расчёт нуждаемости.", "Укажите всех детей.", "Проверьте суд.", "Передайте иск юристу."], documents: ["Документы о родстве и статусах.", "Расчёт потребностей.", "Сведения о доходах и детях.", "Подтверждение направления копии иска."], filing: "Районный суд; иск о взыскании алиментов допускает альтернативную территориальную подсудность.", term: "Срок и результат не прогнозируются.", fee: "Истец по требованию о взыскании алиментов освобождён от госпошлины.", warning: "Размер и распределение между детьми определяет суд.", documentSlug: "isk-o-vzyskanii-alimentov-na-soderzhanie-roditelya", documentTitle: "Иск о взыскании алиментов на содержание родителя", documentType: "Исковое заявление", resultKind: "courtDraft", helperFields: [...parentEligibilityFields, ...parentPartyFields, circumstances(), evidence(), { name: "requestedAmount", label: "Просимая сумма и расчёт нуждаемости", type: "textarea", required: true }, ...courtFields]
  },
  extraExpenses: {
    key: "extraExpenses", title: "Взыскать дополнительные расходы", shortTitle: "Дополнительные расходы", choiceDescription: "Проверьте исключительные обстоятельства и расходы по статье 88 СК РФ.", description: ["Обычное содержание и дополнительные расходы — разные требования.", "Нужно подтвердить исключительное обстоятельство, необходимость и сумму."], steps: ["Определите исключительное обстоятельство.", "Соберите медицинские и платёжные документы.", "Распределите расходы.", "Проверьте суд и иск."], documents: ["Медицинские и иные подтверждения.", "Расчёт расходов.", "Документы о положении сторон."], filing: "Районный суд.", term: "Срок и результат не прогнозируются.", fee: "Проверяется по составу и цене требований.", warning: "Обычные расходы родителя не относятся к статье 88 автоматически.", documentSlug: "isk-o-dopolnitelnyh-rashodah-na-roditelya", documentTitle: "Иск об участии в дополнительных расходах на родителя", documentType: "Исковое заявление", resultKind: "courtDraft", helperFields: [...parentEligibilityFields, ...parentPartyFields, { name: "exceptionalCircumstance", label: "Исключительное обстоятельство", type: "textarea", required: true }, { name: "expenseAmount", label: "Сумма и подробный расчёт расходов", type: "textarea", required: true }, circumstances(), evidence(), ...courtFields]
  }
};

const adoptionCommonFields: FamilyAdditiveField[] = [
  { name: "adoptedAge", label: "Усыновлённый достиг совершеннолетия?", type: "select", required: true, options: yesNoUnsure },
  { name: "applicantRole", label: "Кто инициирует отмену?", type: "select", required: true, options: [{ label: "Родитель ребёнка", value: "parent" }, { label: "Усыновитель", value: "adopter" }, { label: "Усыновлённый ребёнок старше 14 лет", value: "child-14" }, { label: "Орган опеки", value: "guardianship" }, { label: "Прокурор", value: "prosecutor" }, { label: "Другое лицо", value: "other" }] },
  { name: "international", label: "Есть иностранное усыновление, гражданство или проживание за рубежом?", type: "select", required: true, options: yesNoUnsure },
  { name: "cancellationGround", label: "Основание", type: "select", required: true, options: [{ label: "Уклонение от обязанностей", value: "avoidance" }, { label: "Злоупотребление родительскими правами", value: "abuse" }, { label: "Жестокое обращение", value: "cruelty" }, { label: "Хронический алкоголизм или наркомания", value: "addiction" }, { label: "Иное обстоятельство в интересах ребёнка", value: "child-interest" }, { label: "Только развод или расставание", value: "divorce-only" }, { label: "Не уверен", value: "unsure" }] },
  { name: "adoptionDecision", label: "Реквизиты решения суда об усыновлении и актовой записи", type: "textarea", required: true },
  applicant(), counterparty("Усыновитель, родитель или другое применимое лицо"), circumstances(), evidence()
];

const ADOPTION_CANCELLATION_SCENARIOS: Record<string, FamilyAdditiveScenario> = {
  eligibility: {
    key: "eligibility", title: "Проверить право и основания", shortTitle: "Проверка права", choiceDescription: "Определите надлежащего заявителя, возраст и юридически значимое основание.", description: ["Развод или расставание не отменяют усыновление автоматически.", "Совершеннолетие требует отдельной проверки статьи 144 СК РФ."], steps: ["Проверьте заявителя.", "Определите возраст.", "Зафиксируйте основание.", "Составьте перечень последствий."], documents: ["Решение об усыновлении.", "Актовая запись.", "Доказательства основания и интересов ребёнка."], filing: "Предварительная проверка; итоговый спор рассматривает суд.", term: "Не установлен.", fee: "Проверка бесплатна.", warning: "Одностороннего административного отказа от усыновления не существует.", documentSlug: "proverka-prava-na-otmenu-usynovleniya", documentTitle: "Проверка права на отмену усыновления", documentType: "Чек-лист", resultKind: "checklist", helperFields: adoptionCommonFields
  },
  minorClaim: {
    key: "minorClaim", title: "Подготовить иск об отмене усыновления", shortTitle: "Иск", choiceDescription: "Подготовьте судебный документ для ситуации несовершеннолетнего ребёнка.", description: ["Обязательны участие органа опеки и прокурора.", "Суд оценивает интересы и мнение ребёнка."], steps: ["Подтвердите право заявителя.", "Соберите доказательства.", "Опишите последствия.", "Проверьте суд.", "Передайте иск юристу."], documents: ["Решение об усыновлении.", "Материалы об основании отмены.", "Документы о ребёнке и предлагаемых последствиях."], filing: "Районный суд; международная ситуация требует отдельной проверки.", term: "Срок и результат не прогнозируются.", fee: "Базовая пошлина за неимущественный иск физического лица — 3 000 рублей; льготы и соединённые требования проверяются отдельно.", warning: "Сервис не прогнозирует отмену и не подменяет заключение органа опеки.", documentSlug: "isk-ob-otmene-usynovleniya", documentTitle: "Иск об отмене усыновления", documentType: "Исковое заявление", resultKind: "courtDraft", helperFields: [...adoptionCommonFields, { name: "childOpinion", label: "Мнение ребёнка и согласие ребёнка старше 10 лет, если применимо", type: "textarea", required: true }, { name: "requestedConsequences", label: "Просимые последствия для проживания, имени и прав ребёнка", type: "textarea", required: true }, ...courtFields]
  },
  minorClaimSupport: {
    key: "minorClaimSupport", title: "Подготовить иск с вопросом о содержании ребёнка", shortTitle: "Иск и содержание", choiceDescription: "Отдельно сформулируйте просьбу о возможном содержании после отмены.", description: ["Содержание не является автоматическим последствием.", "Суд решает вопрос исходя из интересов ребёнка."], steps: ["Проверьте основное требование.", "Соберите расчёт содержания.", "Разделите последствия.", "Проверьте иск у юриста."], documents: ["Документы основного спора.", "Расчёт потребностей ребёнка.", "Документы о положении сторон."], filing: "Районный суд.", term: "Срок и результат не прогнозируются.", fee: "Пошлина и возможная льгота проверяются по составу требований.", warning: "Просьба о содержании должна быть отдельной и доказанной.", documentSlug: "isk-ob-otmene-usynovleniya-i-soderzhanii-rebenka", documentTitle: "Иск об отмене усыновления и разрешении вопроса о содержании ребёнка", documentType: "Исковое заявление", resultKind: "courtDraft", helperFields: [...adoptionCommonFields, { name: "childOpinion", label: "Мнение ребёнка и согласие ребёнка старше 10 лет, если применимо", type: "textarea", required: true }, { name: "supportCalculation", label: "Потребности ребёнка и расчёт содержания", type: "textarea", required: true }, { name: "requestedConsequences", label: "Остальные просимые последствия", type: "textarea", required: true }, ...courtFields]
  },
  adultConsent: {
    key: "adultConsent", title: "Проверить отмену после совершеннолетия", shortTitle: "Совершеннолетний усыновлённый", choiceDescription: "Соберите взаимные согласия лиц, указанных в статье 144 СК РФ.", description: ["После совершеннолетия отмена по общему правилу недопустима.", "Исключение требует совокупности применимых согласий."], steps: ["Подтвердите совершеннолетие.", "Определите живых и правоспособных родителей.", "Соберите взаимные согласия.", "Передайте пакет юристу для определения процедуры."], documents: ["Решение об усыновлении.", "Документы усыновителя и усыновлённого.", "Согласия применимых родителей и сведения об исключениях."], filing: "Суд после индивидуальной проверки состава лиц и процедуры.", term: "Не прогнозируется.", fee: "Проверяется перед обращением.", warning: "При отсутствии хотя бы одного необходимого согласия результат не формируется как готовый документ.", documentSlug: "svedeniya-dlya-otmeny-usynovleniya-sovershennoletnego", documentTitle: "Сведения для проверки отмены усыновления совершеннолетнего", documentType: "Подготовленные сведения", resultKind: "preparedData", helperFields: [...adoptionCommonFields, { name: "adultAdopteeConsent", label: "Совершеннолетний усыновлённый согласен?", type: "select", required: true, options: yesNoUnsure }, { name: "adopterConsent", label: "Усыновитель согласен?", type: "select", required: true, options: yesNoUnsure }, { name: "parentConsentStatus", label: "Согласие родителей или подтверждение, почему оно не требуется", type: "textarea", required: true }]
  }
};

const birthApplicantFields: FamilyAdditiveField[] = [
  applicant(),
  { name: "authorityName", label: "Орган ЗАГС или МФЦ", type: "textarea", required: true },
  { name: "applicantAuthority", label: "Основание полномочий заявителя", type: "textarea", required: true }
];
const officialOrderUrl = "https://publication.pravo.gov.ru/Document/View/0001201810030017";

const BIRTH_RECORD_SCENARIOS: Record<string, FamilyAdditiveScenario> = {
  registration: {
    key: "registration", title: "Зарегистрировать рождение", shortTitle: "Регистрация рождения", choiceDescription: "Определите официальную форму № 1–6 по обстоятельствам рождения и заявителю.", description: ["Сервис подготавливает данные для официальной формы.", "Он не создаёт собственный похожий бланк."], steps: ["Определите основание рождения.", "Выберите статус заявителей.", "Подготовьте сведения о ребёнке и родителях.", "Откройте официальную форму."], documents: ["Документ, подтверждающий рождение.", "Документы заявителей.", "Основание сведений о родителях.", "Документ о полномочиях представителя."], filing: "Орган ЗАГС, уполномоченный МФЦ или реализованный канал ЕПГУ.", term: "Заявить о рождении нужно не позднее месяца со дня рождения.", fee: "Государственная регистрация рождения и первичное свидетельство пошлиной не облагаются.", warning: "Форма выбирается по фактам; при необычной ситуации выбор подтверждает ЗАГС.", documentSlug: "svedeniya-dlya-registracii-rozhdeniya", documentTitle: "Подготовленные сведения для государственной регистрации рождения", documentType: "Подготовленные сведения", resultKind: "officialForm", officialForm: { number: "1–6", title: "Заявление о рождении", url: officialOrderUrl }, helperFields: [...birthApplicantFields, { name: "birthFormBasis", label: "Какая ситуация регистрации?", type: "select", required: true, options: [{ label: "Родители состоят в браке — форма № 1", value: "married-parents" }, { label: "Мать не в браке, отцовство не установлено — форма № 2", value: "unmarried-mother" }, { label: "Рождение ранее не зарегистрировано, обращается совершеннолетний или заинтересованное лицо — форма № 3", value: "late-adult-registration" }, { label: "Мертворождение или смерть на первой неделе — форма № 4", value: "stillbirth" }, { label: "Найденный или оставленный ребёнок — форма № 5", value: "found-child" }, { label: "Роды вне медорганизации без медпомощи, заявляет свидетель — форма № 6", value: "outside-medical" }] }, { name: "childData", label: "ФИО, пол, дата, время и место рождения ребёнка", type: "textarea", required: true }, { name: "parentData", label: "Сведения о родителях и основание внесения сведений", type: "textarea", required: true }, { name: "birthProof", label: "Документ или иное законное основание, подтверждающее рождение", type: "textarea", required: true }]
  },
  repeatCertificate: {
    key: "repeatCertificate", title: "Получить повторное свидетельство", shortTitle: "Повторное свидетельство", choiceDescription: "Подготовьте данные для официальной формы № 25.", description: ["Право заявителя проверяется по статье 9 Закона № 143-ФЗ.", "Для совершеннолетнего лица родителю может выдаваться иной документ, а не повторное свидетельство."], steps: ["Проверьте право заявителя.", "Укажите актовую запись.", "Подготовьте подтверждение полномочий.", "Откройте форму № 25."], documents: ["Документ заявителя.", "Сведения об актовой записи.", "Документы о родстве, смерти или полномочиях."], filing: "Орган ЗАГС, МФЦ или доступный электронный канал.", term: "При наличии записи в ЕГР ЗАГС личная выдача возможна в день обращения; иной срок зависит от поиска и канала.", fee: "500 рублей, если не действует льгота.", warning: "Форма № 26 относится к браку и разводу и здесь не применяется.", documentSlug: "zayavlenie-o-vydache-povtornogo-svidetelstva-o-rozhdenii", documentTitle: "Заявление о выдаче повторного свидетельства о рождении", documentType: "Официальная форма № 25", resultKind: "officialForm", officialForm: { number: "25", title: "Заявление о выдаче повторного свидетельства или справки о рождении", url: officialOrderUrl }, helperFields: [...birthApplicantFields, { name: "subjectStatus", label: "В отношении кого составлена запись?", type: "select", required: true, options: [{ label: "Обо мне", value: "self" }, { label: "О несовершеннолетнем ребёнке", value: "minor-child" }, { label: "О совершеннолетнем живом лице", value: "adult-living" }, { label: "Об умершем лице", value: "deceased" }] }, { name: "recordDetails", label: "ФИО при рождении, дата, место и известные реквизиты записи", type: "textarea", required: true }, evidence("Документы, подтверждающие право получить документ")]
  },
  reference: {
    key: "reference", title: "Получить справку о рождении", shortTitle: "Справка о рождении", choiceDescription: "Подготовьте данные для справки по официальной форме № 25.", description: ["Справка и повторное свидетельство — разные результаты.", "Право заявителя и льгота проверяются отдельно."], steps: ["Проверьте цель и право.", "Укажите запись.", "Подготовьте полномочия.", "Откройте форму № 25."], documents: ["Документ заявителя.", "Сведения об актовой записи.", "Документы о полномочиях и льготе."], filing: "Орган ЗАГС, МФЦ или доступный электронный канал.", term: "Зависит от наличия записи и способа обращения.", fee: "350 рублей; справка для назначения или перерасчёта пенсии либо пособия может выдаваться без пошлины.", warning: "Цель обращения и право на сведения должны быть подтверждены.", documentSlug: "zayavlenie-o-vydache-spravki-o-rozhdenii", documentTitle: "Заявление о выдаче справки о рождении", documentType: "Официальная форма № 25", resultKind: "officialForm", officialForm: { number: "25", title: "Заявление о выдаче повторного свидетельства или справки о рождении", url: officialOrderUrl }, helperFields: [...birthApplicantFields, { name: "subjectStatus", label: "В отношении кого составлена запись?", type: "select", required: true, options: [{ label: "Обо мне", value: "self" }, { label: "О несовершеннолетнем ребёнке", value: "minor-child" }, { label: "О совершеннолетнем живом лице", value: "adult-living" }, { label: "Об умершем лице", value: "deceased" }] }, { name: "recordDetails", label: "ФИО при рождении, дата, место и известные реквизиты записи", type: "textarea", required: true }, { name: "requestPurpose", label: "Для чего нужна справка?", type: "textarea", required: true }, evidence("Документы, подтверждающие право и возможную льготу")]
  },
  correction: {
    key: "correction", title: "Исправить или изменить актовую запись", shortTitle: "Исправление записи", choiceDescription: "Подготовьте данные для формы № 23 при наличии основания и отсутствии спора.", description: ["ЗАГС рассматривает административное заявление при законном основании и отсутствии спора.", "При споре или недостаточном основании может потребоваться решение суда."], steps: ["Определите ошибочные сведения.", "Укажите требуемое исправление.", "Подтвердите основание.", "Откройте форму № 23."], documents: ["Свидетельство, подлежащее обмену, если оно сохранилось.", "Документы, подтверждающие основание.", "Документ заявителя и полномочия."], filing: "Орган ЗАГС по правилам статьи 71 Закона № 143-ФЗ.", term: "Один месяц; при уважительных причинах срок может быть продлён не более чем на два месяца.", fee: "700 рублей, если не действует льгота статьи 333.39 НК РФ.", warning: "При наличии спора сервис не формирует административное заявление как готовое к подаче.", documentSlug: "zayavlenie-ob-ispravlenii-aktovoy-zapisi-o-rozhdenii", documentTitle: "Заявление об исправлении или изменении актовой записи о рождении", documentType: "Официальная форма № 23", resultKind: "officialForm", officialForm: { number: "23", title: "Заявление о внесении исправления или изменения в запись акта гражданского состояния", url: officialOrderUrl }, helperFields: [...birthApplicantFields, { name: "recordDetails", label: "Реквизиты актовой записи и свидетельства", type: "textarea", required: true }, { name: "currentData", label: "Какие сведения указаны сейчас?", type: "textarea", required: true }, { name: "requestedData", label: "Какие сведения должны быть внесены?", type: "textarea", required: true }, { name: "hasDispute", label: "Есть спор между заинтересованными лицами?", type: "select", required: true, options: yesNoUnsure }, { name: "correctionBasis", label: "Документальное основание исправления или изменения", type: "textarea", required: true }, evidence()]
  }
};

export const FAMILY_ADDITIVE_ROUTES: Record<FamilyAdditiveRouteSlug, FamilyAdditiveRoute> = {
  "alimenty-na-sovershennoletnego-rebenka": { problemSlug: "alimenty-na-sovershennoletnego-rebenka", title: "Содержание совершеннолетнего ребёнка", intro: "Выберите проверку права, соглашение, взыскание или изменение содержания.", legalReviewDate: FAMILY_ADDITIVE_REVIEWED_AT, scenarios: ADULT_CHILD_SUPPORT_SCENARIOS },
  "prekrashchenie-i-osvobozhdenie-ot-alimentov": { problemSlug: "prekrashchenie-i-osvobozhdenie-ot-alimentov", title: "Прекращение и освобождение от алиментов", intro: "Сначала отделите будущие платежи, соглашение, задолженность и исполнительное производство.", legalReviewDate: FAMILY_ADDITIVE_REVIEWED_AT, scenarios: ALIMONY_TERMINATION_SCENARIOS },
  "alimenty-na-soderzhanie-roditeley": { problemSlug: "alimenty-na-soderzhanie-roditeley", title: "Содержание родителей совершеннолетними детьми", intro: "Проверьте право родителя, соглашение, судебное содержание или дополнительные расходы.", legalReviewDate: FAMILY_ADDITIVE_REVIEWED_AT, scenarios: PARENT_SUPPORT_SCENARIOS },
  "otmena-usynovleniya": { problemSlug: "otmena-usynovleniya", title: "Отмена усыновления", intro: "Проверьте заявителя, возраст, основания и последствия до подготовки судебного документа.", legalReviewDate: FAMILY_ADDITIVE_REVIEWED_AT, scenarios: ADOPTION_CANCELLATION_SCENARIOS },
  "dokumenty-o-rozhdenii-i-aktovaya-zapis": { problemSlug: "dokumenty-o-rozhdenii-i-aktovaya-zapis", title: "Документы о рождении и актовая запись о рождении", intro: "Выберите регистрацию, повторное свидетельство, справку или исправление записи.", legalReviewDate: FAMILY_ADDITIVE_REVIEWED_AT, scenarios: BIRTH_RECORD_SCENARIOS }
};

export const FAMILY_ADDITIVE_ROUTE_SLUGS = Object.keys(FAMILY_ADDITIVE_ROUTES) as FamilyAdditiveRouteSlug[];

export function isFamilyAdditiveRouteSlug(value: string): value is FamilyAdditiveRouteSlug {
  return value in FAMILY_ADDITIVE_ROUTES;
}

export function getFamilyAdditiveRoute(slug: string) {
  return isFamilyAdditiveRouteSlug(slug) ? FAMILY_ADDITIVE_ROUTES[slug] : null;
}

export function getFamilyAdditiveScenario(routeSlug: string, scenarioKey?: string | null) {
  const route = getFamilyAdditiveRoute(routeSlug);
  if (!route || !scenarioKey) return null;
  return route.scenarios[scenarioKey] ?? null;
}

export function getFamilyAdditiveScenarioByDocumentSlug(documentSlug: string) {
  for (const route of Object.values(FAMILY_ADDITIVE_ROUTES)) {
    for (const scenario of Object.values(route.scenarios)) {
      if (scenario.documentSlug === documentSlug) return { route, scenario };
    }
  }
  return null;
}
