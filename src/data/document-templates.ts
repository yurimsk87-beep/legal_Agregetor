import type { DocumentField, DocumentGeneratorTemplate } from "@/lib/types";

const objectionReasonOptions: NonNullable<DocumentField["options"]> = [
  { value: "disagree_with_claims", label: "Не согласен с требованиями взыскателя" },
  { value: "disagree_with_amount", label: "Не согласен с суммой" },
  { value: "already_paid", label: "Требование уже исполнено полностью или частично" },
  { value: "did_not_receive_documents", label: "Не получал документы ранее" },
  { value: "limitation_period", label: "Считаю, что срок взыскания пропущен" },
  { value: "penalties_or_interest", label: "Не согласен с пенями, штрафами или процентами" },
  { value: "other", label: "Другое" }
];

const judicialOrderReceivedWayOptions: NonNullable<DocumentField["options"]> = [
  { value: "paper", label: "Да, получил на руки или по почте" },
  { value: "gosuslugi", label: "Да, через Госуслуги" },
  { value: "after_withdrawal", label: "Узнал о приказе после списания денег" },
  { value: "unsure", label: "Не уверен, что это судебный приказ" }
];

const judicialOrderReceivedDateOptions: NonNullable<DocumentField["options"]> = [
  { value: "known", label: "Знаю точную дату" },
  { value: "unknown", label: "Не помню точную дату" },
  { value: "after_withdrawal", label: "Узнал после списания денег" }
];

const consumerDemandOptions: NonNullable<DocumentField["options"]> = [
  { value: "refund", label: "Вернуть деньги" },
  { value: "replace", label: "Заменить товар" },
  { value: "repair", label: "Устранить недостатки / ремонт" },
  { value: "reduce_price", label: "Уменьшить цену" },
  { value: "reimburse_expenses", label: "Возместить расходы" },
  { value: "other", label: "Другое" }
];

const responseDeadlineOptions: NonNullable<DocumentField["options"]> = [
  { value: "10", label: "10 дней" },
  { value: "7", label: "7 дней" },
  { value: "other", label: "Другой срок" }
];

const bailiffRoleOptions: NonNullable<DocumentField["options"]> = [
  { value: "debtor", label: "Должник" },
  { value: "creditor", label: "Взыскатель" },
  { value: "other", label: "Иное заинтересованное лицо" }
];

const bailiffComplaintReasonOptions: NonNullable<DocumentField["options"]> = [
  { value: "money_withdrawn", label: "Незаконно или ошибочно списали деньги" },
  { value: "salary_overholding", label: "Удерживают слишком много из зарплаты или дохода" },
  { value: "arrest_not_removed", label: "Не сняли арест или ограничение" },
  { value: "inaction", label: "Пристав бездействует" },
  { value: "property_arrest", label: "Незаконно арестовали имущество" },
  { value: "refund_overcharged", label: "Нужно вернуть излишне удержанные деньги" },
  { value: "other", label: "Другое нарушение" }
];

const employmentContractOptions: NonNullable<DocumentField["options"]> = [
  { value: "written", label: "Есть письменный трудовой договор" },
  { value: "not_issued", label: "Работал(а), но договор не выдали" },
  { value: "civil_contract", label: "Оформили гражданско-правовой договор" },
  { value: "unknown", label: "Не уверен(а)" }
];

const laborComplaintReasonOptions: NonNullable<DocumentField["options"]> = [
  { value: "salary_not_paid", label: "Не выплатили зарплату или расчет" },
  { value: "salary_delayed", label: "Задерживают выплаты" },
  { value: "illegal_dismissal", label: "Незаконное увольнение" },
  { value: "forced_resignation", label: "Заставляют уволиться" },
  { value: "vacation_denied", label: "Не дают отпуск" },
  { value: "no_contract", label: "Не оформили трудовой договор" },
  { value: "overtime", label: "Не оплачивают переработки" },
  { value: "documents_not_issued", label: "Не выдают документы" },
  { value: "other", label: "Другое нарушение" }
];

export const documentTemplates = [
  {
    slug: "vozrazhenie-na-sudebnyy-prikaz",
    title: "Возражение на судебный приказ",
    description:
      "Базовый шаблон возражений относительно исполнения судебного приказа с вариантами под разные виды приказного производства.",
    documentType: "objection",
    legalReferenceKeys: ["gpk_128", "gpk_129", "gpk_108", "gpk_112"],
    baseTemplateNote:
      "Шаблон подходит для подготовки возражений по судебному приказу. Если срок подачи пропущен, вместе с возражениями обычно готовят просьбу о восстановлении срока.",
    baseFields: [
      {
        name: "receivedWay",
        label: "Вы получили судебный приказ?",
        type: "select",
        required: true,
        options: judicialOrderReceivedWayOptions,
        helpText: "Если не уверены, что документ является судебным приказом, лучше задать вопрос юристу или показать документ на проверку."
      },
      {
        name: "courtName",
        label: "Наименование суда",
        type: "text",
        required: true,
        placeholder: "Например: Судебный участок N 1 Ленинского района г. Москвы",
        helpText: "Укажите суд, который вынес судебный приказ."
      },
      {
        name: "courtAddress",
        label: "Адрес суда",
        type: "text",
        placeholder: "Адрес можно указать, если он есть в приказе."
      },
      {
        name: "applicantName",
        label: "ФИО или наименование заявителя",
        type: "text",
        required: true,
        placeholder: "Иванов Иван Иванович",
        helpText: "Укажите данные лица, в отношении которого вынесен судебный приказ."
      },
      {
        name: "applicantAddress",
        label: "Адрес заявителя",
        type: "textarea",
        required: true,
        placeholder: "Адрес регистрации или почтовый адрес"
      },
      {
        name: "applicantPhone",
        label: "Телефон заявителя",
        type: "text",
        placeholder: "+7...",
        helpText: "Необязательно. Укажите, если хотите видеть телефон в тексте документа."
      },
      {
        name: "applicantEmail",
        label: "Email заявителя",
        type: "text",
        placeholder: "name@example.ru",
        helpText: "Необязательно. Укажите, если хотите видеть email в тексте документа."
      },
      {
        name: "claimantName",
        label: "ФИО или наименование взыскателя",
        type: "text",
        required: true,
        placeholder: "Банк, МФО, управляющая организация или другое лицо"
      },
      {
        name: "claimantAddress",
        label: "Адрес взыскателя",
        type: "textarea",
        placeholder: "Можно оставить пустым, если адрес неизвестен."
      },
      {
        name: "caseNumber",
        label: "Номер дела",
        type: "text",
        required: true,
        placeholder: "Например: 2-1234/2026"
      },
      {
        name: "orderDate",
        label: "Дата вынесения судебного приказа",
        type: "date",
        required: true
      },
      {
        name: "receivedDateStatus",
        label: "Вы знаете дату получения документа?",
        type: "select",
        required: true,
        options: judicialOrderReceivedDateOptions,
        helpText: "Дата получения может влиять на срок подачи возражения."
      },
      {
        name: "receivedDate",
        label: "Дата получения судебного приказа",
        type: "date",
        helpText: "Эта дата важна для проверки десятидневного срока подачи возражений."
      },
      {
        name: "claimAmountOrSubject",
        label: "Сумма или предмет взыскания",
        type: "text",
        placeholder: "Например: 85 000 рублей задолженности по договору"
      },
      {
        name: "objectionReason",
        label: "Причина возражений",
        type: "select",
        required: true,
        options: objectionReasonOptions
      },
      {
        name: "objectionComment",
        label: "Комментарий к возражениям",
        type: "textarea",
        placeholder: "Кратко укажите, с чем именно не согласны. Можно оставить пустым."
      },
      {
        name: "requestTermRestoration",
        label: "Прошу восстановить срок подачи возражений",
        type: "checkbox",
        helpText: "Отметьте, если десятидневный срок уже пропущен или есть риск, что суд посчитает его пропущенным."
      },
      {
        name: "missedTermReason",
        label: "Причина пропуска срока",
        type: "textarea",
        placeholder: "Например: поздно получил копию приказа, был в командировке, болел, узнал о приказе от приставов.",
        showWhen: {
          field: "requestTermRestoration",
          equals: true
        }
      }
    ],
    variants: [
      {
        key: "credit-loan",
        title: "Кредит, займ, МФО или банк",
        description:
          "Подходит, если судебный приказ вынесен по требованиям банка, МФО, коллектора или другого взыскателя по денежной задолженности.",
        relatedCategorySlugs: ["dolgi", "pristavy", "sudy"],
        relatedProblemSlugs: ["sudebnyy-prikaz", "otmenit-sudebnyy-prikaz", "spisali-dengi-pristavy"],
        legalReferenceKeys: ["gpk_128", "gpk_129", "gpk_112"],
        extraFields: [
          {
            name: "creditContractInfo",
            label: "Договор или кредитор",
            type: "text",
            placeholder: "Номер договора, название банка или МФО, если известно"
          }
        ],
        generatedTextHints: ["Проверьте расчет долга, проценты, штрафы, платежи и срок давности."]
      },
      {
        key: "zhkh",
        title: "ЖКХ и коммунальные платежи",
        description:
          "Подходит, если судебный приказ связан с задолженностью за коммунальные услуги, содержание жилья, взносы или услуги управляющей организации.",
        relatedCategorySlugs: ["zhkh", "dolgi", "sudy"],
        relatedProblemSlugs: ["sudebnyy-prikaz", "uk-ne-delaet-remont"],
        legalReferenceKeys: ["gpk_128", "gpk_129", "gpk_112"],
        extraFields: [
          {
            name: "servicePeriod",
            label: "Период начислений",
            type: "text",
            placeholder: "Например: январь 2024 - март 2025"
          }
        ],
        generatedTextHints: ["Сверьте период задолженности, площадь помещения, начисления и платежные документы."]
      },
      {
        key: "alimony",
        title: "Алименты",
        description:
          "Подходит для приказного производства по алиментам, если нужно подать возражения относительно исполнения судебного приказа.",
        relatedCategorySlugs: ["semya", "sudy"],
        relatedProblemSlugs: ["alimenty"],
        legalReferenceKeys: ["gpk_128", "gpk_129", "gpk_112", "sk_80", "sk_81", "sk_83"],
        extraFields: [
          {
            name: "alimonyContext",
            label: "Что важно по алиментам",
            type: "textarea",
            placeholder: "Например: уже есть соглашение, ребенок проживает со мной, сумма рассчитана неверно."
          }
        ],
        generatedTextHints: ["Проверьте, нет ли спора, который требует искового порядка вместо приказного."]
      },
      {
        key: "taxes-fees",
        title: "Налоги, сборы и обязательные платежи",
        description:
          "Подходит, если судебный приказ связан с обязательными платежами, налогами, сборами или иными начислениями.",
        relatedCategorySlugs: ["sudy", "dolgi", "biznes"],
        relatedProblemSlugs: ["sudebnyy-prikaz"],
        legalReferenceKeys: ["gpk_128", "gpk_129", "gpk_112"],
        extraFields: [
          {
            name: "paymentType",
            label: "Вид обязательного платежа",
            type: "text",
            placeholder: "Налог, сбор, взнос или иное начисление"
          }
        ],
        generatedTextHints: ["Проверьте основание начисления, уведомления, период и дату получения требований."]
      },
      {
        key: "contract-debt",
        title: "Задолженность по договору",
        description:
          "Подходит, если требования взыскателя связаны с договором, поставкой, услугами, арендой или иными обязательствами.",
        relatedCategorySlugs: ["biznes", "dolgi", "sudy"],
        relatedProblemSlugs: ["dolg-po-dogovoru", "kontragent-ne-platit", "sudebnyy-prikaz"],
        legalReferenceKeys: ["gpk_128", "gpk_129", "gpk_112"],
        extraFields: [
          {
            name: "contractSubject",
            label: "Предмет договора",
            type: "text",
            placeholder: "Поставка, услуги, аренда, подряд или другое обязательство"
          }
        ],
        generatedTextHints: ["Проверьте договор, акты, переписку, платежи и претензионный порядок."]
      },
      {
        key: "other",
        title: "Другое приказное производство",
        description:
          "Используйте этот вариант, если ваша ситуация не подходит под другие категории, но документ является именно судебным приказом.",
        legalReferenceKeys: ["gpk_128", "gpk_129", "gpk_112"],
        generatedTextHints: ["Проверьте, что документ действительно является судебным приказом, а не решением или исполнительным листом."]
      }
    ]
  },
  {
    slug: "pretenziya-prodavcu-o-vozvrate-deneg",
    title: "Претензия продавцу о возврате денег",
    description:
      "Базовый шаблон претензии продавцу с вариантами для возврата денег, замены товара, ремонта, некачественной услуги или проблемы с доставкой.",
    documentType: "claim",
    legalReferenceKeys: ["zpp_18", "zpp_22", "zpp_29", "zpp_31"],
    baseTemplateNote:
      "Сформированный текст является шаблоном и не заменяет индивидуальную юридическую консультацию. Проверьте данные продавца, даты, сумму, требование и доказательства перед отправкой.",
    baseFields: [
      {
        name: "sellerName",
        label: "Наименование продавца / организации / ИП",
        type: "text",
        required: true,
        placeholder: "ООО «Пример», ИП Иванов И.И. или название магазина"
      },
      {
        name: "sellerAddress",
        label: "Адрес продавца",
        type: "textarea",
        placeholder: "Юридический, фактический или почтовый адрес продавца"
      },
      {
        name: "sellerInnOrOgrn",
        label: "ИНН/ОГРН продавца",
        type: "text",
        placeholder: "Если известен"
      },
      {
        name: "buyerName",
        label: "ФИО покупателя",
        type: "text",
        required: true,
        placeholder: "Иванов Иван Иванович"
      },
      {
        name: "buyerAddress",
        label: "Адрес покупателя",
        type: "textarea",
        required: true,
        placeholder: "Адрес для ответа на претензию"
      },
      {
        name: "buyerPhone",
        label: "Телефон покупателя",
        type: "text",
        placeholder: "+7..."
      },
      {
        name: "buyerEmail",
        label: "Email покупателя",
        type: "text",
        placeholder: "name@example.ru"
      },
      {
        name: "purchaseDate",
        label: "Дата покупки",
        type: "date",
        required: true
      },
      {
        name: "productName",
        label: "Товар или услуга",
        type: "text",
        required: true,
        placeholder: "Например: смартфон, диван, ремонт, онлайн-курс"
      },
      {
        name: "purchasePrice",
        label: "Стоимость",
        type: "text",
        required: true,
        placeholder: "Например: 35 000 рублей"
      },
      {
        name: "paymentMethod",
        label: "Способ оплаты",
        type: "text",
        placeholder: "Карта, наличные, перевод, рассрочка"
      },
      {
        name: "orderNumber",
        label: "Номер заказа / чека / договора",
        type: "text",
        placeholder: "Если есть"
      },
      {
        name: "problemDescription",
        label: "Что произошло",
        type: "textarea",
        required: true,
        placeholder: "Опишите недостаток, отказ продавца, проблему с доставкой или качество услуги."
      },
      {
        name: "demandType",
        label: "Требование",
        type: "select",
        required: true,
        options: consumerDemandOptions
      },
      {
        name: "responseDeadlineDays",
        label: "Срок ответа",
        type: "select",
        required: true,
        options: responseDeadlineOptions
      },
      {
        name: "attachments",
        label: "Приложения",
        type: "textarea",
        placeholder: "Чек, договор, переписка, фото дефекта, акт, гарантийный талон"
      },
      {
        name: "additionalComment",
        label: "Дополнительный комментарий",
        type: "textarea",
        placeholder: "Если выбрали «другое» или хотите уточнить требование."
      }
    ],
    variants: [
      {
        key: "defective-product",
        title: "Товар с недостатком",
        description: "Подходит, если товар сломался, не работает, имеет дефект или не соответствует описанию.",
        relatedCategorySlugs: ["pokupki-uslugi"],
        relatedProblemSlugs: ["tovar-slomalsya-na-garantii", "vernut-dengi-za-tovar", "prodavec-ne-prinimaet-pretenziyu"],
        legalReferenceKeys: ["zpp_18", "zpp_22"],
        generatedTextHints: ["Сохраните чек, фото недостатка, переписку, акт проверки качества или заключение сервиса."]
      },
      {
        key: "online-order",
        title: "Интернет-магазин или маркетплейс",
        description: "Подходит для покупки через сайт, приложение, маркетплейс или доставку.",
        relatedCategorySlugs: ["pokupki-uslugi"],
        relatedProblemSlugs: ["marketpleys-otkazal-v-vozvrate", "ne-dostavili-oplachennyy-tovar", "vernut-dengi-za-tovar"],
        legalReferenceKeys: ["zpp_18", "zpp_22", "zpp_26_1"],
        extraFields: [
          {
            name: "platformName",
            label: "Сайт, приложение или маркетплейс",
            type: "text",
            placeholder: "Название площадки, если покупка была дистанционной"
          }
        ],
        generatedTextHints: ["Сохраните карточку заказа, трек-номер, переписку с поддержкой и сведения о продавце."]
      },
      {
        key: "service-not-performed",
        title: "Услуга не оказана или оказана плохо",
        description: "Подходит, если деньги взяли за услугу, но результат не предоставили или услуга некачественная.",
        relatedCategorySlugs: ["pokupki-uslugi"],
        relatedProblemSlugs: ["nekachestvennaya-usluga", "navyazali-dopolnitelnuyu-uslugu"],
        legalReferenceKeys: ["zpp_29", "zpp_31"],
        extraFields: [
          {
            name: "serviceResult",
            label: "Что должно было быть сделано",
            type: "textarea",
            placeholder: "Кратко опишите ожидаемый результат услуги"
          }
        ],
        generatedTextHints: ["Сравните договор, задание, переписку и фактический результат услуги."]
      },
      {
        key: "seller-refuses-refund",
        title: "Продавец отказывается возвращать деньги",
        description: "Подходит, если продавец уже отказал устно или письменно.",
        relatedCategorySlugs: ["pokupki-uslugi"],
        relatedProblemSlugs: ["prodavec-ne-prinimaet-pretenziyu", "vernut-dengi-za-tovar"],
        legalReferenceKeys: ["zpp_18", "zpp_22"],
        extraFields: [
          {
            name: "refusalDetails",
            label: "Как продавец отказал",
            type: "textarea",
            placeholder: "Дата отказа, кто отказал, устно или письменно"
          }
        ],
        generatedTextHints: ["Зафиксируйте отказ: скриншот, письмо, запись обращения или отметку о непринятии претензии."]
      },
      {
        key: "delivery-or-order-problem",
        title: "Товар не доставили или заказ не выполнен",
        description: "Подходит, если товар оплачен, но не передан покупателю.",
        relatedCategorySlugs: ["pokupki-uslugi"],
        relatedProblemSlugs: ["ne-dostavili-oplachennyy-tovar", "marketpleys-otkazal-v-vozvrate"],
        legalReferenceKeys: ["zpp_23_1", "zpp_22"],
        extraFields: [
          {
            name: "deliveryDeadline",
            label: "Согласованный срок доставки или передачи",
            type: "text",
            placeholder: "Дата или период доставки, если был указан"
          }
        ],
        generatedTextHints: ["Проверьте подтверждение оплаты, срок доставки и уведомления продавца."]
      },
      {
        key: "other",
        title: "Другая потребительская ситуация",
        description: "Подходит, если ситуация не подходит под другие варианты, но связана с правами потребителя.",
        relatedCategorySlugs: ["pokupki-uslugi"],
        legalReferenceKeys: ["zpp_18", "zpp_22", "zpp_29", "zpp_31"],
        generatedTextHints: ["Опишите факты по датам и сформулируйте требование максимально конкретно."]
      }
    ]
  },
  {
    slug: "zhaloba-na-sudebnogo-pristava",
    title: "Жалоба на судебного пристава",
    description:
      "Базовый шаблон жалобы на постановление, действие или бездействие судебного пристава с вариантами для списаний, ареста имущества, удержаний и бездействия.",
    documentType: "complaint",
    legalReferenceKeys: ["fz229_50", "fz229_64", "fz229_99", "fz229_121"],
    baseTemplateNote:
      "Шаблон помогает подготовить черновик жалобы. Перед подачей проверьте номер исполнительного производства, постановления пристава, даты списаний и подтверждающие документы.",
    baseFields: [
      {
        name: "authorityName",
        label: "Куда подается жалоба",
        type: "text",
        required: true,
        placeholder: "Например: Старшему судебному приставу ОСП по району"
      },
      {
        name: "authorityAddress",
        label: "Адрес органа ФССП",
        type: "textarea",
        placeholder: "Можно оставить пустым, если адрес неизвестен."
      },
      {
        name: "applicantName",
        label: "ФИО заявителя",
        type: "text",
        required: true,
        placeholder: "Иванов Иван Иванович"
      },
      {
        name: "applicantAddress",
        label: "Адрес заявителя",
        type: "textarea",
        required: true,
        placeholder: "Адрес регистрации или почтовый адрес"
      },
      {
        name: "applicantPhone",
        label: "Телефон заявителя",
        type: "text",
        placeholder: "+7..."
      },
      {
        name: "applicantEmail",
        label: "Email заявителя",
        type: "text",
        placeholder: "name@example.ru"
      },
      {
        name: "enforcementNumber",
        label: "Номер исполнительного производства",
        type: "text",
        required: true,
        placeholder: "Например: 12345/26/77001-ИП"
      },
      {
        name: "bailiffName",
        label: "ФИО судебного пристава",
        type: "text",
        placeholder: "Если известно"
      },
      {
        name: "departmentName",
        label: "Отдел судебных приставов",
        type: "text",
        placeholder: "Например: ОСП по Ленинскому району"
      },
      {
        name: "debtorOrCreditorRole",
        label: "Ваш статус в исполнительном производстве",
        type: "select",
        required: true,
        options: bailiffRoleOptions
      },
      {
        name: "complaintReason",
        label: "Причина жалобы",
        type: "select",
        required: true,
        options: bailiffComplaintReasonOptions
      },
      {
        name: "factsDescription",
        label: "Что произошло",
        type: "textarea",
        required: true,
        placeholder: "Опишите действия, бездействие или постановление пристава по датам."
      },
      {
        name: "violationDate",
        label: "Дата нарушения или когда узнали о нем",
        type: "date",
        helpText: "Дата помогает проверить срок обжалования."
      },
      {
        name: "desiredResult",
        label: "Что просите сделать",
        type: "textarea",
        required: true,
        placeholder: "Например: отменить постановление, вернуть деньги, снять арест, совершить исполнительные действия."
      },
      {
        name: "attachments",
        label: "Приложения",
        type: "textarea",
        placeholder: "Постановление пристава, выписка банка, справка о доходах, переписка, заявления, ответы ФССП"
      }
    ],
    variants: [
      {
        key: "money-withdrawn",
        title: "Списали деньги со счета",
        description: "Подходит, если деньги списали ошибочно, повторно, с защищенного счета или без учета обстоятельств.",
        relatedCategorySlugs: ["pristavy", "dolgi"],
        relatedProblemSlugs: ["spisali-dengi-pristavy"],
        legalReferenceKeys: ["fz229_50", "fz229_64", "fz229_121"],
        extraFields: [
          {
            name: "withdrawnAmount",
            label: "Сумма списания",
            type: "text",
            placeholder: "Например: 25 000 рублей"
          },
          {
            name: "accountSource",
            label: "Источник денег на счете",
            type: "text",
            placeholder: "Зарплата, пособие, пенсия, алименты, иное"
          }
        ],
        generatedTextHints: ["Приложите банковскую выписку, постановление пристава и документы о происхождении денег."]
      },
      {
        key: "salary-overholding",
        title: "Удерживают слишком много из зарплаты",
        description: "Подходит, если удержания из зарплаты, пенсии или иного дохода превышают допустимый размер.",
        relatedCategorySlugs: ["pristavy", "dolgi"],
        relatedProblemSlugs: ["spisali-dengi-pristavy"],
        legalReferenceKeys: ["fz229_50", "fz229_99", "fz229_121"],
        extraFields: [
          {
            name: "incomeType",
            label: "Вид дохода",
            type: "text",
            placeholder: "Зарплата, пенсия, пособие или другой доход"
          },
          {
            name: "withholdingPercent",
            label: "Размер удержаний",
            type: "text",
            placeholder: "Например: 70% или 15 000 рублей ежемесячно"
          }
        ],
        generatedTextHints: ["Приложите справку о доходах, расчетные листки и постановление об обращении взыскания."]
      },
      {
        key: "arrest-not-removed",
        title: "Не сняли арест или ограничение",
        description: "Подходит, если долг погашен, но арест счета, карты, имущества или ограничение продолжает действовать.",
        relatedCategorySlugs: ["pristavy", "dolgi"],
        relatedProblemSlugs: ["pristav-bezdeystvuet"],
        legalReferenceKeys: ["fz229_50", "fz229_64", "fz229_121"],
        extraFields: [
          {
            name: "restrictionDetails",
            label: "Какой арест или ограничение не сняты",
            type: "textarea",
            placeholder: "Счет, карта, автомобиль, недвижимость, запрет регистрационных действий"
          }
        ],
        generatedTextHints: ["Приложите подтверждение оплаты долга и документы о действующем аресте или ограничении."]
      },
      {
        key: "bailiff-inaction",
        title: "Пристав бездействует",
        description: "Подходит, если пристав не рассматривает заявление, не направляет ответы или не совершает исполнительные действия.",
        relatedCategorySlugs: ["pristavy", "sudy"],
        relatedProblemSlugs: ["pristav-bezdeystvuet"],
        legalReferenceKeys: ["fz229_50", "fz229_64", "fz229_121"],
        extraFields: [
          {
            name: "previousRequestDetails",
            label: "Какие заявления уже подавались",
            type: "textarea",
            placeholder: "Дата обращения, способ подачи, входящий номер или краткое содержание"
          }
        ],
        generatedTextHints: ["Приложите копии заявлений, подтверждение отправки и отсутствие ответа, если оно есть."]
      },
      {
        key: "illegal-property-arrest",
        title: "Арестовали имущество",
        description: "Подходит, если арест наложен на имущество, которое нельзя взыскивать или которое принадлежит другому лицу.",
        relatedCategorySlugs: ["pristavy", "sudy"],
        relatedProblemSlugs: ["obzhalovat-postanovlenie-pristava"],
        legalReferenceKeys: ["fz229_50", "fz229_64", "fz229_121"],
        extraFields: [
          {
            name: "propertyDetails",
            label: "Какое имущество арестовано",
            type: "textarea",
            placeholder: "Опишите имущество и почему считаете арест незаконным"
          }
        ],
        generatedTextHints: ["Приложите документы о праве собственности и постановление об аресте имущества."]
      },
      {
        key: "refund-overcharged",
        title: "Нужно вернуть излишне удержанные деньги",
        description: "Подходит, если удержали больше суммы долга или списание произошло после погашения задолженности.",
        relatedCategorySlugs: ["pristavy", "dolgi"],
        relatedProblemSlugs: ["spisali-dengi-pristavy"],
        legalReferenceKeys: ["fz229_50", "fz229_99", "fz229_121"],
        extraFields: [
          {
            name: "overchargeDetails",
            label: "Почему сумма удержана излишне",
            type: "textarea",
            placeholder: "Укажите сумму долга, списания, оплату и даты"
          }
        ],
        generatedTextHints: ["Сверьте сумму долга, платежи, банковские выписки и постановления пристава."]
      },
      {
        key: "other",
        title: "Другая жалоба на пристава",
        description: "Подходит для иной ситуации, связанной с постановлением, действием или бездействием пристава.",
        relatedCategorySlugs: ["pristavy"],
        legalReferenceKeys: ["fz229_50", "fz229_64", "fz229_121"],
        generatedTextHints: ["Изложите факты по датам и приложите документы, которые подтверждают нарушение."]
      }
    ]
  },
  {
    slug: "zhaloba-v-trudovuyu-inspekciyu",
    title: "Жалоба в трудовую инспекцию",
    description:
      "Базовый шаблон жалобы в трудовую инспекцию с вариантами для невыплаты зарплаты, задержки расчета, незаконного увольнения, отсутствия договора и иных трудовых нарушений.",
    documentType: "complaint",
    legalReferenceKeys: ["tk_22", "tk_62", "tk_84_1", "tk_136", "tk_236", "tk_392"],
    baseTemplateNote:
      "Шаблон помогает подготовить черновик обращения. Перед отправкой проверьте данные работодателя, даты работы, сумму задолженности и документы, подтверждающие трудовые отношения.",
    baseFields: [
      {
        name: "inspectionName",
        label: "Наименование трудовой инспекции",
        type: "text",
        required: true,
        placeholder: "Например: Государственная инспекция труда в Московской области"
      },
      {
        name: "inspectionRegion",
        label: "Регион",
        type: "text",
        placeholder: "Например: Московская область"
      },
      {
        name: "employeeName",
        label: "ФИО работника",
        type: "text",
        required: true,
        placeholder: "Иванов Иван Иванович"
      },
      {
        name: "employeeAddress",
        label: "Адрес работника",
        type: "textarea",
        required: true,
        placeholder: "Адрес регистрации или почтовый адрес"
      },
      {
        name: "employeePhone",
        label: "Телефон работника",
        type: "text",
        placeholder: "+7..."
      },
      {
        name: "employeeEmail",
        label: "Email работника",
        type: "text",
        placeholder: "name@example.ru"
      },
      {
        name: "employerName",
        label: "Наименование работодателя",
        type: "text",
        required: true,
        placeholder: "ООО «Пример», ИП Иванов И.И."
      },
      {
        name: "employerAddress",
        label: "Адрес работодателя",
        type: "textarea",
        required: true,
        placeholder: "Юридический, фактический или известный адрес работодателя"
      },
      {
        name: "employerInnOrOgrn",
        label: "ИНН/ОГРН работодателя",
        type: "text",
        placeholder: "Если известен"
      },
      {
        name: "position",
        label: "Должность работника",
        type: "text",
        required: true,
        placeholder: "Например: продавец, водитель, менеджер"
      },
      {
        name: "employmentStartDate",
        label: "Дата начала работы",
        type: "date"
      },
      {
        name: "employmentContractExists",
        label: "Как оформлены отношения",
        type: "select",
        required: true,
        options: employmentContractOptions
      },
      {
        name: "complaintReason",
        label: "Причина жалобы",
        type: "select",
        required: true,
        options: laborComplaintReasonOptions
      },
      {
        name: "factsDescription",
        label: "Что произошло",
        type: "textarea",
        required: true,
        placeholder: "Опишите нарушение по датам: что должен был сделать работодатель и что фактически произошло."
      },
      {
        name: "violationDates",
        label: "Период или даты нарушения",
        type: "text",
        placeholder: "Например: март-май 2026, дата увольнения, дата задержки выплаты"
      },
      {
        name: "amountDue",
        label: "Сумма задолженности или выплат",
        type: "text",
        placeholder: "Если можно посчитать: зарплата, расчет, компенсация, отпускные"
      },
      {
        name: "requestedActions",
        label: "Что просите сделать",
        type: "textarea",
        required: true,
        placeholder: "Например: провести проверку, выдать предписание, обязать выплатить задолженность, привлечь работодателя к ответственности."
      },
      {
        name: "attachments",
        label: "Приложения",
        type: "textarea",
        placeholder: "Трудовой договор, расчетные листки, переписка, график, табель, приказ, банковские выписки"
      }
    ],
    variants: [
      {
        key: "salary-not-paid",
        title: "Не выплатили зарплату или расчет",
        description: "Подходит, если работодатель не выплатил зарплату, окончательный расчет, отпускные или иные суммы.",
        relatedCategorySlugs: ["rabota"],
        relatedProblemSlugs: ["ne-vyplatili-zarplatu"],
        legalReferenceKeys: ["tk_22", "tk_136", "tk_236", "tk_392"],
        extraFields: [
          {
            name: "paymentDueDate",
            label: "Когда должны были выплатить",
            type: "text",
            placeholder: "Дата выплаты зарплаты, увольнения или расчета"
          }
        ],
        generatedTextHints: ["Приложите расчетные листки, выписки, трудовой договор, приказ об увольнении и переписку."]
      },
      {
        key: "salary-delayed",
        title: "Задерживают выплаты",
        description: "Подходит, если выплаты задерживают регулярно или не выплачивают в установленные даты.",
        relatedCategorySlugs: ["rabota"],
        relatedProblemSlugs: ["zaderzhivayut-zarplatu"],
        legalReferenceKeys: ["tk_22", "tk_136", "tk_236"],
        extraFields: [
          {
            name: "delayPeriod",
            label: "Период задержки",
            type: "text",
            placeholder: "Например: с апреля 2026 года по настоящее время"
          }
        ],
        generatedTextHints: ["Сверьте даты выплаты по договору, локальным актам и фактические поступления на счет."]
      },
      {
        key: "illegal-dismissal",
        title: "Незаконное увольнение",
        description: "Подходит, если работника уволили без оснований, с нарушением процедуры или без полного расчета.",
        relatedCategorySlugs: ["rabota", "sudy"],
        relatedProblemSlugs: ["nezakonno-uvolili", "ne-vyplatili-zarplatu"],
        legalReferenceKeys: ["tk_84_1", "tk_392", "tk_22"],
        extraFields: [
          {
            name: "dismissalDate",
            label: "Дата увольнения",
            type: "date"
          },
          {
            name: "dismissalGround",
            label: "Основание увольнения",
            type: "text",
            placeholder: "Что указано в приказе или трудовой книжке"
          }
        ],
        generatedTextHints: ["Проверьте срок обращения в суд по спору об увольнении и сохраните приказ, трудовую книжку, расчетные документы."]
      },
      {
        key: "forced-resignation",
        title: "Заставляют уволиться",
        description: "Подходит, если работодатель давит, требует заявление по собственному желанию или угрожает увольнением.",
        relatedCategorySlugs: ["rabota"],
        relatedProblemSlugs: ["zastavlyayut-uvolitsya"],
        legalReferenceKeys: ["tk_22", "tk_84_1", "tk_392"],
        extraFields: [
          {
            name: "pressureDetails",
            label: "Как именно оказывают давление",
            type: "textarea",
            placeholder: "Угрозы, переписка, свидетели, даты разговоров"
          }
        ],
        generatedTextHints: ["Не подписывайте заявление, если не согласны увольняться, и фиксируйте давление документально."]
      },
      {
        key: "vacation-denied",
        title: "Не дают отпуск",
        description: "Подходит, если не предоставляют отпуск, не оплачивают отпускные или нарушают график отпусков.",
        relatedCategorySlugs: ["rabota"],
        relatedProblemSlugs: ["ne-dayut-otpusk"],
        legalReferenceKeys: ["tk_22"],
        extraFields: [
          {
            name: "vacationDetails",
            label: "Что произошло с отпуском",
            type: "textarea",
            placeholder: "Период отпуска, график, заявление, отказ работодателя"
          }
        ],
        generatedTextHints: ["Приложите график отпусков, заявление, отказ работодателя и расчет отпускных при наличии."]
      },
      {
        key: "no-contract",
        title: "Не оформили трудовой договор",
        description: "Подходит, если человек фактически работает, но трудовой договор не заключили или не выдали.",
        relatedCategorySlugs: ["rabota"],
        relatedProblemSlugs: ["rabota-bez-dogovora"],
        legalReferenceKeys: ["tk_22", "tk_62"],
        extraFields: [
          {
            name: "workProof",
            label: "Чем подтверждается работа",
            type: "textarea",
            placeholder: "Переписка, пропуск, график, выплаты, свидетели, задания, фото рабочего места"
          }
        ],
        generatedTextHints: ["Соберите доказательства фактического допуска к работе и выплат."]
      },
      {
        key: "overtime",
        title: "Не оплачивают переработки",
        description: "Подходит, если работник трудится сверх графика, но переработки не оплачивают или не учитывают.",
        relatedCategorySlugs: ["rabota"],
        legalReferenceKeys: ["tk_22", "tk_136", "tk_236"],
        extraFields: [
          {
            name: "overtimeDetails",
            label: "Какие переработки не оплачены",
            type: "textarea",
            placeholder: "Даты, часы, график, распоряжения руководителя"
          }
        ],
        generatedTextHints: ["Приложите графики, табели, переписку и документы о фактическом времени работы."]
      },
      {
        key: "labor-book-documents",
        title: "Не выдают документы",
        description: "Подходит, если работодатель не выдает трудовую книжку, справки, расчетные листки или копии документов.",
        relatedCategorySlugs: ["rabota"],
        legalReferenceKeys: ["tk_62", "tk_84_1"],
        extraFields: [
          {
            name: "documentsRequested",
            label: "Какие документы не выдают",
            type: "textarea",
            placeholder: "Трудовая книжка, СТД-Р, справки, расчетные листки, копии приказов"
          }
        ],
        generatedTextHints: ["Подайте письменное заявление о выдаче документов и сохраните подтверждение отправки."]
      },
      {
        key: "other",
        title: "Другое трудовое нарушение",
        description: "Подходит для иной ситуации, связанной с нарушением трудовых прав работника.",
        relatedCategorySlugs: ["rabota"],
        legalReferenceKeys: ["tk_22", "tk_392"],
        generatedTextHints: ["Опишите нарушение по датам и приложите документы, подтверждающие трудовые отношения."]
      }
    ]
  },
  {
    slug: "zayavlenie-o-vosstanovlenii-sroka-na-otmenu-sudebnogo-prikaza",
    title: "Заявление о восстановлении срока на отмену судебного приказа",
    description:
      "Шаблон заявления о восстановлении срока, если судебный приказ получили поздно, узнали о нем после списания или срок подачи возражений спорный.",
    documentType: "application",
    legalReferenceKeys: ["gpk_108", "gpk_112", "gpk_128", "gpk_129"],
    baseTemplateNote:
      "Заявление используют вместе с возражениями, если есть риск, что суд посчитает срок подачи возражений пропущенным.",
    baseFields: [
      { name: "courtName", label: "Суд, который вынес судебный приказ", type: "text", required: true, placeholder: "Например: Судебный участок N 1..." },
      { name: "courtAddress", label: "Адрес суда", type: "textarea", placeholder: "Если есть в приказе или на сайте суда" },
      { name: "applicantName", label: "ФИО заявителя", type: "text", required: true, placeholder: "Иванов Иван Иванович" },
      { name: "applicantAddress", label: "Адрес заявителя", type: "textarea", required: true, placeholder: "Адрес регистрации или почтовый адрес" },
      { name: "applicantPhone", label: "Телефон", type: "text", placeholder: "+7..." },
      { name: "applicantEmail", label: "Email", type: "text", placeholder: "name@example.ru" },
      { name: "claimantName", label: "Взыскатель", type: "text", required: true, placeholder: "Банк, МФО, УК или другое лицо" },
      { name: "caseNumber", label: "Номер дела", type: "text", required: true, placeholder: "Например: 2-1234/2026" },
      { name: "orderDate", label: "Дата судебного приказа", type: "date" },
      { name: "receivedDate", label: "Когда получили или узнали о приказе", type: "date", helpText: "Если точной даты нет, укажите примерную и поясните ниже." },
      { name: "missedTermReason", label: "Почему срок мог быть пропущен", type: "textarea", required: true, placeholder: "Поздно получил копию, узнал от приставов, болел, был в командировке..." },
      { name: "proofDocuments", label: "Чем подтверждается причина", type: "textarea", placeholder: "Конверт, уведомление, выписка банка, справка, скриншот Госуслуг" },
      { name: "attachments", label: "Приложения", type: "textarea", placeholder: "Копия приказа, возражения, подтверждение даты получения, иные документы" }
    ],
    variants: [
      {
        key: "late-copy",
        title: "Копию приказа получили поздно",
        description: "Подходит, если судебный приказ пришел по почте, через Госуслуги или был фактически получен позже даты вынесения.",
        relatedCategorySlugs: ["dolgi", "sudy"],
        relatedProblemSlugs: ["sudebnyy-prikaz", "propuschen-srok-obzhalovaniya"],
        legalReferenceKeys: ["gpk_112", "gpk_128", "gpk_129"],
        generatedTextHints: ["Приложите конверт, уведомление, скриншот Госуслуг или другое подтверждение даты получения."]
      },
      {
        key: "after-withdrawal",
        title: "Узнал после списания денег",
        description: "Подходит, если о приказе стало известно из банка, ФССП или после удержания денег.",
        relatedCategorySlugs: ["dolgi", "pristavy"],
        relatedProblemSlugs: ["spisali-dengi-pristavy", "sudebnyy-prikaz"],
        legalReferenceKeys: ["gpk_112", "gpk_129", "fz229_50"],
        generatedTextHints: ["Приложите банковскую выписку, постановление пристава или сведения об исполнительном производстве."]
      },
      {
        key: "valid-reason",
        title: "Болезнь, командировка или иная причина",
        description: "Подходит, если срок пропущен из-за обстоятельств, которые можно подтвердить документами.",
        relatedCategorySlugs: ["sudy"],
        legalReferenceKeys: ["gpk_112", "gpk_129"],
        generatedTextHints: ["Опишите причину спокойно и приложите документы, которые ее подтверждают."]
      },
      {
        key: "other",
        title: "Другая причина пропуска срока",
        description: "Используйте, если причина не подходит под готовые варианты.",
        legalReferenceKeys: ["gpk_112", "gpk_129"],
        generatedTextHints: ["Если причина спорная, лучше проверить заявление у юриста до подачи."]
      }
    ]
  },
  {
    slug: "zayavlenie-o-snyatii-aresta-so-scheta",
    title: "Заявление о снятии ареста со счета",
    description:
      "Шаблон заявления приставу или в банк о снятии ареста со счета, карты или ограничений, если удержания ошибочны, долг погашен или счет используется для защищенных выплат.",
    documentType: "application",
    legalReferenceKeys: ["fz229_50", "fz229_64", "fz229_99", "fz229_121"],
    baseTemplateNote:
      "Перед подачей проверьте номер исполнительного производства, основание ареста и документы о происхождении денег на счете.",
    baseFields: [
      { name: "authorityName", label: "Кому подаете заявление", type: "text", required: true, placeholder: "ОСП, судебному приставу или банку" },
      { name: "authorityAddress", label: "Адрес адресата", type: "textarea", placeholder: "Если известен" },
      { name: "applicantName", label: "ФИО заявителя", type: "text", required: true, placeholder: "Иванов Иван Иванович" },
      { name: "applicantAddress", label: "Адрес заявителя", type: "textarea", required: true },
      { name: "applicantPhone", label: "Телефон", type: "text", placeholder: "+7..." },
      { name: "applicantEmail", label: "Email", type: "text", placeholder: "name@example.ru" },
      { name: "enforcementNumber", label: "Номер исполнительного производства", type: "text", required: true, placeholder: "Если известен" },
      { name: "bailiffName", label: "ФИО пристава", type: "text", placeholder: "Если известно" },
      { name: "bankName", label: "Банк и счет / карта", type: "text", required: true, placeholder: "Например: Т-Банк, счет/карта оканчивается на 1234" },
      { name: "arrestDate", label: "Когда узнали об аресте", type: "date" },
      { name: "reasonToRemove", label: "Почему арест нужно снять", type: "textarea", required: true, placeholder: "Счет зарплатный, поступают пособия, долг оплачен, арест ошибочный..." },
      { name: "desiredResult", label: "Что просите сделать", type: "textarea", required: true, placeholder: "Снять арест, прекратить удержания, вернуть излишне списанные деньги" },
      { name: "attachments", label: "Приложения", type: "textarea", placeholder: "Выписка банка, справка о зарплате, подтверждение оплаты долга, постановление пристава" }
    ],
    variants: [
      {
        key: "salary-account",
        title: "Арестовали зарплатную карту",
        description: "Подходит, если счет используется для зарплаты и удержания нужно ограничить или снять арест.",
        relatedCategorySlugs: ["pristavy"],
        relatedProblemSlugs: ["arestovali-zarplatnuyu-kartu", "pristavy-zablokirovali-schet"],
        legalReferenceKeys: ["fz229_50", "fz229_99"],
        extraFields: [{ name: "incomeType", label: "Какой доход поступает на счет", type: "text", placeholder: "Зарплата, пенсия, пособие" }],
        generatedTextHints: ["Приложите справку работодателя и выписку по счету."]
      },
      {
        key: "protected-payments",
        title: "На счет поступают защищенные выплаты",
        description: "Подходит для пособий, алиментов, социальных выплат и иных поступлений, которые важно отдельно подтвердить.",
        relatedCategorySlugs: ["pristavy", "socialnye-vyplaty"],
        legalReferenceKeys: ["fz229_50", "fz229_99"],
        extraFields: [{ name: "protectedPaymentDetails", label: "Какие выплаты поступают", type: "textarea", placeholder: "Пособия, алименты, компенсации, пенсия и документы по ним" }],
        generatedTextHints: ["Приложите документы о назначении выплат и выписку банка."]
      },
      {
        key: "debt-paid",
        title: "Долг уже оплачен",
        description: "Подходит, если задолженность погашена, но арест или списания продолжаются.",
        relatedCategorySlugs: ["pristavy", "dolgi"],
        relatedProblemSlugs: ["ne-snimayut-arest-posle-oplaty"],
        legalReferenceKeys: ["fz229_50", "fz229_64"],
        extraFields: [{ name: "paymentProof", label: "Чем подтверждается оплата", type: "textarea", placeholder: "Квитанция, чек, платежное поручение, справка взыскателя" }],
        generatedTextHints: ["Приложите подтверждение оплаты и попросите вынести постановление о снятии ареста."]
      },
      {
        key: "other",
        title: "Другая причина для снятия ареста",
        description: "Используйте для иной ситуации, когда счет арестован или заблокирован.",
        legalReferenceKeys: ["fz229_50", "fz229_64", "fz229_121"],
        generatedTextHints: ["Опишите факты по датам и приложите документы, которые подтверждают ошибку или основание для снятия ареста."]
      }
    ]
  },
  {
    slug: "pretenziya-v-upravlyayuschuyu-kompaniyu",
    title: "Претензия в управляющую компанию",
    description:
      "Шаблон претензии в управляющую организацию по заливу квартиры, протечке, плесени, некачественным услугам или бездействию.",
    documentType: "claim",
    legalReferenceKeys: ["zhk_161", "gk_15", "gk_1064"],
    baseTemplateNote:
      "Претензия помогает письменно зафиксировать проблему, требование и доказательства. По заливу важно приложить акт, фото и расчет ущерба, если они есть.",
    baseFields: [
      { name: "companyName", label: "Управляющая организация или ТСЖ", type: "text", required: true, placeholder: "ООО «УК Пример»" },
      { name: "companyAddress", label: "Адрес организации", type: "textarea", placeholder: "Если известен" },
      { name: "applicantName", label: "ФИО заявителя", type: "text", required: true },
      { name: "applicantAddress", label: "Адрес квартиры", type: "textarea", required: true, placeholder: "Адрес помещения, где возникла проблема" },
      { name: "applicantPhone", label: "Телефон", type: "text", placeholder: "+7..." },
      { name: "applicantEmail", label: "Email", type: "text", placeholder: "name@example.ru" },
      { name: "incidentDate", label: "Дата проблемы или обнаружения ущерба", type: "date" },
      { name: "problemDescription", label: "Что произошло", type: "textarea", required: true, placeholder: "Опишите залив, протечку, плесень, отказ УК или другую проблему" },
      { name: "damageDescription", label: "Какой ущерб или последствия", type: "textarea", placeholder: "Повреждения отделки, мебели, техники, запах, сырость, расходы" },
      { name: "demandText", label: "Что просите сделать", type: "textarea", required: true, placeholder: "Составить акт, устранить причину, возместить ущерб, провести ремонт, дать письменный ответ" },
      { name: "responseDeadlineDays", label: "Срок ответа", type: "select", required: true, options: responseDeadlineOptions },
      { name: "attachments", label: "Приложения", type: "textarea", placeholder: "Акт, фото, видео, переписка, расчет ущерба, чеки, заключение специалиста" }
    ],
    variants: [
      {
        key: "flood",
        title: "Залив квартиры",
        description: "Подходит, если квартиру затопило и нужно зафиксировать ущерб, потребовать акт или компенсацию.",
        relatedCategorySlugs: ["zhkh", "nedvizhimost"],
        relatedProblemSlugs: ["zatopili-sosedi", "protekaet-krysha"],
        legalReferenceKeys: ["gk_15", "gk_1064", "zhk_161"],
        generatedTextHints: ["Приложите акт о заливе, фото, видео, смету или оценку ущерба."]
      },
      {
        key: "roof-leak",
        title: "Протекает крыша или общедомовое имущество",
        description: "Подходит, если ущерб связан с крышей, стояком, трубами, фасадом или другим общим имуществом.",
        relatedCategorySlugs: ["zhkh"],
        relatedProblemSlugs: ["protekaet-krysha", "uk-ne-delaet-remont"],
        legalReferenceKeys: ["zhk_161", "gk_15"],
        generatedTextHints: ["Укажите, когда обращались в УК и какие ответы получили."]
      },
      {
        key: "bad-service",
        title: "УК не устраняет проблему",
        description: "Подходит для плесени, отключений, некачественного отопления, ремонта или уборки.",
        relatedCategorySlugs: ["zhkh"],
        relatedProblemSlugs: ["plesen-v-kvartire", "uk-ne-delaet-remont", "nekachestvennoe-otoplenie"],
        legalReferenceKeys: ["zhk_161"],
        generatedTextHints: ["Опишите обращения по датам и приложите переписку или заявки."]
      },
      {
        key: "other",
        title: "Другая претензия в УК",
        description: "Используйте для другой проблемы с управляющей организацией.",
        relatedCategorySlugs: ["zhkh"],
        legalReferenceKeys: ["zhk_161", "gk_15"],
        generatedTextHints: ["Формулируйте требование конкретно: что сделать, в какой срок и как сообщить о результате."]
      }
    ]
  },
  {
    slug: "zayavlenie-o-vzyskanii-alimentov",
    title: "Заявление о взыскании алиментов",
    description:
      "Шаблон заявления о взыскании алиментов на ребенка с вариантами для приказного производства, иска или фиксированной суммы.",
    documentType: "application",
    legalReferenceKeys: ["sk_80", "sk_81", "sk_83"],
    baseTemplateNote:
      "Выбор приказного или искового порядка зависит от спора о родительстве, месте жительства ребенка, сумме и других обстоятельств.",
    baseFields: [
      { name: "courtName", label: "Суд", type: "text", required: true, placeholder: "Мировой судья или районный суд" },
      { name: "claimantName", label: "ФИО заявителя", type: "text", required: true },
      { name: "claimantAddress", label: "Адрес заявителя", type: "textarea", required: true },
      { name: "claimantPhone", label: "Телефон", type: "text", placeholder: "+7..." },
      { name: "respondentName", label: "ФИО второго родителя", type: "text", required: true },
      { name: "respondentAddress", label: "Адрес второго родителя", type: "textarea", placeholder: "Если известен" },
      { name: "childName", label: "ФИО ребенка", type: "text", required: true },
      { name: "childBirthDate", label: "Дата рождения ребенка", type: "date", required: true },
      { name: "childLivesWith", label: "С кем проживает ребенок", type: "text", required: true, placeholder: "Например: проживает со мной" },
      { name: "respondentIncomeInfo", label: "Что известно о доходах второго родителя", type: "textarea", placeholder: "Место работы, регулярный доход, отсутствие сведений" },
      { name: "demandText", label: "Как просите взыскать алименты", type: "textarea", required: true, placeholder: "Например: в доле от дохода или в твердой денежной сумме" },
      { name: "attachments", label: "Приложения", type: "textarea", placeholder: "Свидетельство о рождении, документы о проживании ребенка, справки, переписка" }
    ],
    variants: [
      {
        key: "court-order",
        title: "Судебный приказ на алименты",
        description: "Подходит, если нет спора о родительстве и нужно взыскать алименты в доле от дохода.",
        relatedCategorySlugs: ["semya"],
        relatedProblemSlugs: ["alimenty"],
        legalReferenceKeys: ["sk_80", "sk_81"],
        generatedTextHints: ["Если есть спор о ребенке, родительстве или фиксированной сумме, может потребоваться иск."]
      },
      {
        key: "fixed-amount",
        title: "Алименты в твердой сумме",
        description: "Подходит, если доход второго родителя нерегулярный, неизвестный или взыскание в долях не защищает интересы ребенка.",
        relatedCategorySlugs: ["semya", "sudy"],
        relatedProblemSlugs: ["alimenty"],
        legalReferenceKeys: ["sk_80", "sk_83"],
        extraFields: [{ name: "fixedAmountReason", label: "Почему нужна твердая сумма", type: "textarea", placeholder: "Нерегулярный доход, нет сведений о доходе, расходы на ребенка" }],
        generatedTextHints: ["Подготовьте расчет расходов на ребенка и документы, подтверждающие доходы или их отсутствие."]
      },
      {
        key: "other",
        title: "Другая ситуация по алиментам",
        description: "Используйте, если нужно описать дополнительные обстоятельства.",
        relatedCategorySlugs: ["semya"],
        legalReferenceKeys: ["sk_80", "sk_81", "sk_83"],
        generatedTextHints: ["Если есть спор о месте жительства ребенка или отцовстве, лучше проверить заявление у юриста."]
      }
    ]
  },
  {
    slug: "vozrazhenie-na-isk",
    title: "Возражение на исковое заявление",
    description:
      "Письменные возражения ответчика на иск: несогласие с требованиями, доводы и при необходимости заявление о пропуске срока исковой давности.",
    documentType: "objection",
    legalReferenceKeys: ["gpk_131", "gpk_132", "gk_196", "gk_199"],
    baseTemplateNote:
      "Возражения подаются в суд, рассматривающий дело, до вынесения решения. Если истец пропустил срок исковой давности, об этом важно заявить письменно — суд применяет исковую давность только по заявлению стороны.",
    baseFields: [
      { name: "courtName", label: "Наименование суда", type: "text", required: true, placeholder: "Например: Ленинский районный суд г. Москвы", helpText: "Суд, в производстве которого находится дело." },
      { name: "caseNumber", label: "Номер дела", type: "text", required: true, placeholder: "Например: 2-1234/2026" },
      { name: "plaintiffName", label: "Истец (кто подал иск)", type: "text", required: true, placeholder: "ФИО или наименование организации" },
      { name: "defendantName", label: "Ответчик (ваши ФИО)", type: "text", required: true, placeholder: "Иванов Иван Иванович" },
      { name: "defendantAddress", label: "Ваш адрес", type: "textarea", required: true, placeholder: "Адрес регистрации или почтовый адрес" },
      { name: "defendantPhone", label: "Телефон", type: "text", placeholder: "+7...", helpText: "Необязательно." },
      { name: "claimSubject", label: "Что требует истец", type: "textarea", required: true, placeholder: "Например: взыскать 120 000 руб. задолженности по кредитному договору.", helpText: "Кратко перепишите требования из иска." },
      { name: "disagreementReason", label: "С чем именно не согласны", type: "select", required: true, options: [
        { value: "amount", label: "Не согласен с суммой требований" },
        { value: "no-violation", label: "Нарушения не было / долг отсутствует" },
        { value: "already-paid", label: "Долг уже погашен полностью или частично" },
        { value: "wrong-defendant", label: "Я ненадлежащий ответчик" },
        { value: "no-evidence", label: "Истец не доказал свои требования" },
        { value: "other", label: "Другое основание" }
      ] },
      { name: "objectionDetails", label: "Обоснование возражений", type: "textarea", required: true, placeholder: "Опишите фактами, почему требования истца необоснованны. Ссылайтесь на документы и обстоятельства." },
      { name: "requestApplyLimitation", label: "Заявить о пропуске срока исковой давности", type: "checkbox", helpText: "Отметьте, если с момента, когда истец узнал о нарушении, прошло более 3 лет." },
      { name: "limitationDetails", label: "Пояснение по сроку давности", type: "textarea", placeholder: "Например: последний платёж по договору был в марте 2021 года, а иск подан в 2026 году.", showWhen: { field: "requestApplyLimitation", equals: true } },
      { name: "attachments", label: "Приложения (по одному в строке)", type: "textarea", placeholder: "Копия возражений для истца\nДокументы, подтверждающие доводы\nКвитанции об оплате", helpText: "Каждое приложение с новой строки." }
    ],
    variants: [
      {
        key: "universal",
        title: "Универсальное возражение",
        description:
          "Подходит для любого гражданского спора: кредит и займ, услуги и договоры, требования работодателя, возмещение вреда. Детали вашей ситуации уточняются в полях формы.",
        relatedCategorySlugs: ["dolgi", "pristavy", "rabota"],
        relatedProblemSlugs: ["podat-vozrazheniya-v-sud", "bank-podal-v-sud-po-kreditu", "rabotodatel-trebuet-vernut-dengi"],
        legalReferenceKeys: ["gk_196", "gk_199"],
        generatedTextHints: [
          "Спор по кредиту или займу: укажите номер и дату договора, приложите расчёт задолженности и выписки по счёту.",
          "Спор с работодателем: сошлитесь на трудовой договор и приказы, приложите расчётные листки.",
          "Если с момента нарушения прошло больше 3 лет — отметьте пропуск срока исковой давности: суд применяет его только по заявлению стороны.",
          "В обосновании пишите факты и даты, без эмоций: что произошло, чем подтверждается, почему требования завышены или необоснованны."
        ]
      }
    ]
  },
  {
    slug: "hodataystvo-o-primenenii-sroka-iskovoy-davnosti",
    title: "Ходатайство о применении срока исковой давности",
    description:
      "Заявление ответчика о пропуске истцом срока исковой давности с просьбой отказать в иске. Суд применяет исковую давность только по заявлению стороны спора.",
    documentType: "petition",
    legalReferenceKeys: ["gk_196", "gk_199", "gk_200"],
    baseTemplateNote:
      "Общий срок исковой давности — 3 года со дня, когда лицо узнало или должно было узнать о нарушении права (ст. 196, 200 ГК РФ). Заявить о пропуске нужно до вынесения судом решения.",
    baseFields: [
      { name: "courtName", label: "Наименование суда", type: "text", required: true, placeholder: "Например: Мировой судья судебного участка N 1 г. Москвы" },
      { name: "caseNumber", label: "Номер дела", type: "text", required: true, placeholder: "Например: 2-1234/2026" },
      { name: "plaintiffName", label: "Истец (взыскатель)", type: "text", required: true, placeholder: "Банк, МФО или иное лицо" },
      { name: "defendantName", label: "Ответчик (ваши ФИО)", type: "text", required: true, placeholder: "Иванов Иван Иванович" },
      { name: "defendantAddress", label: "Ваш адрес", type: "textarea", required: true },
      { name: "claimSubject", label: "Суть требований истца", type: "textarea", required: true, placeholder: "Например: взыскание задолженности по кредитному договору N ... от ...", helpText: "Перепишите предмет иска." },
      { name: "rightViolationDate", label: "Когда возникло право требования", type: "date", required: true, helpText: "Дата, когда истец узнал или должен был узнать о нарушении (например, дата первой просрочки платежа)." },
      { name: "lastActionDate", label: "Дата последнего платежа или действия", type: "date", helpText: "Необязательно. Помогает точно рассчитать течение срока." },
      { name: "claimFilingDate", label: "Дата подачи иска (если известна)", type: "date", helpText: "Дата обращения истца в суд. Обычно указана в определении о принятии иска." },
      { name: "comment", label: "Дополнительные пояснения", type: "textarea", placeholder: "Например: перерыва течения срока не было, задолженность истец не признавал." },
      { name: "attachments", label: "Приложения (по одному в строке)", type: "textarea", placeholder: "Копия ходатайства для истца\nДокументы о датах платежей" }
    ],
    variants: [
      { key: "credit", title: "Долг по кредиту, займу или МФО", description: "Взыскание задолженности по кредитному договору или займу.", relatedCategorySlugs: ["dolgi"], relatedProblemSlugs: ["bank-podal-v-sud-po-kreditu", "srok-davnosti-po-dolgu"] },
      { key: "contract", title: "Задолженность по договору", description: "Взыскание долга по договору оказания услуг, поставки, аренды и т.п.", relatedProblemSlugs: ["srok-davnosti-po-dolgu"] },
      { key: "other", title: "Другое требование", description: "Иное требование, по которому истёк срок исковой давности.", relatedProblemSlugs: ["mfo-trebuet-vernut-dolg"] }
    ]
  },
  {
    slug: "pretenziya-v-bank-o-vozvrate-spisannyh-deneg",
    title: "Претензия в банк о возврате списанных денег",
    description:
      "Досудебная претензия в банк с требованием вернуть незаконно или ошибочно списанные со счёта деньги. Списание со счёта допускается только по распоряжению клиента или по основаниям, установленным законом.",
    documentType: "claim",
    legalReferenceKeys: [],
    baseTemplateNote:
      "Списание денег со счёта без распоряжения клиента возможно только в случаях, прямо предусмотренных законом или договором (ст. 854 ГК РФ). По операциям без согласия клиента действует особый порядок возврата (ст. 9 Федерального закона «О национальной платёжной системе»).",
    baseFields: [
      { name: "bankName", label: "Наименование банка", type: "text", required: true, placeholder: "Например: ПАО «Банк»" },
      { name: "bankAddress", label: "Адрес банка / отделения", type: "textarea", placeholder: "Можно указать адрес головного офиса или отделения." },
      { name: "applicantName", label: "Ваши ФИО (клиент)", type: "text", required: true, placeholder: "Иванов Иван Иванович" },
      { name: "applicantAddress", label: "Ваш адрес", type: "textarea", required: true },
      { name: "applicantPhone", label: "Телефон", type: "text", placeholder: "+7..." },
      { name: "accountOrCard", label: "Номер счёта или карты", type: "text", required: true, placeholder: "Например: карта ****1234 или счёт N ...", helpText: "Не указывайте полный номер карты и CVV — достаточно последних цифр." },
      { name: "writeOffDate", label: "Дата списания", type: "date", required: true },
      { name: "writeOffAmount", label: "Сумма списания, руб.", type: "text", required: true, placeholder: "Например: 15 000" },
      { name: "writeOffReason", label: "Что произошло", type: "select", required: true, options: [
        { value: "unauthorized", label: "Списание без моего согласия / мошенничество" },
        { value: "double", label: "Двойное или ошибочное списание" },
        { value: "illegal-fee", label: "Незаконная комиссия или удержание" },
        { value: "other", label: "Другое" }
      ] },
      { name: "details", label: "Опишите обстоятельства", type: "textarea", required: true, placeholder: "Когда и как обнаружили списание, обращались ли в банк, блокировали ли карту." },
      { name: "demandText", label: "Ваше требование", type: "text", required: true, placeholder: "Например: вернуть незаконно списанные 15 000 руб. на мой счёт." },
      { name: "attachments", label: "Приложения (по одному в строке)", type: "textarea", placeholder: "Выписка по счёту\nСкриншоты уведомлений\nЗаявление о несогласии с операцией" }
    ],
    variants: [
      { key: "unauthorized", title: "Списание без согласия / мошенничество", description: "Деньги списаны без вашего распоряжения или в результате мошеннических действий.", relatedCategorySlugs: ["dolgi"], relatedProblemSlugs: ["bank-spisal-dengi-bez-soglasiya"] },
      { key: "double", title: "Двойное или ошибочное списание", description: "Одна операция списана дважды или списана ошибочно.", relatedProblemSlugs: ["bank-spisal-dengi-bez-soglasiya"] },
      { key: "illegal-fee", title: "Незаконная комиссия", description: "Банк удержал комиссию или платёж без законного основания.", relatedProblemSlugs: ["bank-spisal-dengi-bez-soglasiya"] }
    ]
  },
  {
    slug: "isk-o-vzyskanii-zarabotnoy-platy",
    title: "Исковое заявление о взыскании заработной платы",
    description:
      "Иск работника к работодателю о взыскании невыплаченной зарплаты, расчёта при увольнении или иных выплат, а также компенсации за задержку по ст. 236 ТК РФ.",
    documentType: "claim",
    legalReferenceKeys: ["tk_22", "tk_136", "tk_236", "tk_392"],
    baseTemplateNote:
      "По искам о взыскании зарплаты работник освобождён от госпошлины (ст. 393 ТК РФ) и может подать иск по своему месту жительства. Срок обращения в суд по спорам об оплате труда — 1 год со дня установленного срока выплаты (ст. 392 ТК РФ).",
    baseFields: [
      { name: "courtName", label: "Наименование суда", type: "text", required: true, placeholder: "Например: Ленинский районный суд г. Москвы", helpText: "Можно подать по месту жительства работника или по адресу работодателя." },
      { name: "plaintiffName", label: "Истец (ваши ФИО)", type: "text", required: true },
      { name: "plaintiffAddress", label: "Ваш адрес", type: "textarea", required: true },
      { name: "plaintiffPhone", label: "Телефон", type: "text", placeholder: "+7..." },
      { name: "employerName", label: "Работодатель (ответчик)", type: "text", required: true, placeholder: "ООО «...» или ИП ..." },
      { name: "employerAddress", label: "Адрес работодателя", type: "textarea", required: true },
      { name: "position", label: "Ваша должность", type: "text", placeholder: "Например: менеджер" },
      { name: "workPeriod", label: "Период работы", type: "text", placeholder: "Например: с 01.03.2024 по 30.11.2025" },
      { name: "debtPeriod", label: "За какой период не выплачено", type: "text", required: true, placeholder: "Например: сентябрь — ноябрь 2025" },
      { name: "debtAmount", label: "Сумма задолженности, руб.", type: "text", required: true, placeholder: "Например: 180 000" },
      { name: "includeCompensation", label: "Взыскать компенсацию за задержку (ст. 236 ТК РФ)", type: "checkbox", helpText: "Проценты за каждый день задержки. В иске можно указать «по день фактической выплаты» — суд рассчитает сумму." },
      { name: "includeMoralHarm", label: "Взыскать компенсацию морального вреда", type: "checkbox" },
      { name: "moralHarmAmount", label: "Сумма морального вреда, руб.", type: "text", placeholder: "Например: 30 000", showWhen: { field: "includeMoralHarm", equals: true } },
      { name: "details", label: "Опишите обстоятельства", type: "textarea", placeholder: "Когда должны были выплатить, обращались ли к работодателю, есть ли трудовой договор." },
      { name: "attachments", label: "Приложения (по одному в строке)", type: "textarea", placeholder: "Копия иска для ответчика\nТрудовой договор\nРасчётные листки\nСправка о доходах" }
    ],
    variants: [
      { key: "unpaid-salary", title: "Не выплатили зарплату", description: "Работодатель не выплачивает текущую заработную плату.", relatedCategorySlugs: ["rabota"], relatedProblemSlugs: ["ne-vyplatili-zarplatu"] },
      { key: "dismissal-settlement", title: "Не выплатили расчёт при увольнении", description: "При увольнении не выплачены зарплата, компенсация за отпуск и иные суммы.", relatedProblemSlugs: ["ne-vyplatili-zarplatu"] },
      { key: "no-contract", title: "Работа без трудового договора", description: "Договор не оформлялся — в иске также нужно установить факт трудовых отношений.", relatedProblemSlugs: ["rabotali-bez-dogovora"] }
    ]
  },
  {
    slug: "zayavlenie-o-vozvrate-izlishne-uderzhannyh-deneg",
    title: "Заявление о возврате излишне удержанных денег",
    description:
      "Заявление судебному приставу-исполнителю о возврате денег, удержанных сверх положенного: с превышением лимита, из защищённых выплат или после погашения долга.",
    documentType: "application",
    legalReferenceKeys: ["fz229_50", "fz229_99", "fz229_101", "fz229_121"],
    baseTemplateNote:
      "Из зарплаты и иных доходов удерживают не более 50% (в отдельных случаях 70%), а из ряда выплат удержание не допускается (ст. 99, 101 Федерального закона N 229-ФЗ). Излишне удержанные суммы подлежат возврату.",
    baseFields: [
      { name: "bailiffDept", label: "Наименование отдела ФССП", type: "text", required: true, placeholder: "Например: Ленинское РОСП г. Москвы ГУ ФССП" },
      { name: "bailiffName", label: "ФИО пристава-исполнителя", type: "text", placeholder: "Если известно." },
      { name: "applicantName", label: "Должник (ваши ФИО)", type: "text", required: true },
      { name: "applicantAddress", label: "Ваш адрес", type: "textarea", required: true },
      { name: "applicantPhone", label: "Телефон", type: "text", placeholder: "+7..." },
      { name: "enforcementCaseNumber", label: "Номер исполнительного производства", type: "text", required: true, placeholder: "Например: 12345/26/77001-ИП" },
      { name: "overheldAmount", label: "Сумма излишне удержанного, руб.", type: "text", required: true, placeholder: "Например: 25 000" },
      { name: "overheldDate", label: "Дата удержания", type: "date" },
      { name: "reason", label: "Почему удержание излишнее", type: "select", required: true, options: [
        { value: "over-limit", label: "Удержали больше положенного лимита (более 50/70%)" },
        { value: "protected", label: "Удержаны защищённые выплаты (пособия, алименты и т.п.)" },
        { value: "debt-paid", label: "Долг уже погашен полностью" },
        { value: "double", label: "Двойное удержание" },
        { value: "other", label: "Другое" }
      ] },
      { name: "refundRequisites", label: "Реквизиты для возврата", type: "textarea", required: true, placeholder: "Банк, БИК, номер счёта, получатель." },
      { name: "details", label: "Опишите обстоятельства", type: "textarea", placeholder: "Что за выплаты поступали на счёт, когда и сколько удержано." },
      { name: "attachments", label: "Приложения (по одному в строке)", type: "textarea", placeholder: "Выписка по счёту\nСправка о назначении выплат\nКвитанция об оплате долга" }
    ],
    variants: [
      { key: "over-limit", title: "Удержали больше положенного", description: "Из дохода удержано больше установленного лимита.", relatedCategorySlugs: ["pristavy", "dolgi"], relatedProblemSlugs: ["uderzhivayut-bolshe-polozhennogo"] },
      { key: "protected", title: "Удержаны защищённые выплаты", description: "Списаны выплаты, на которые нельзя обращать взыскание.", relatedProblemSlugs: ["uderzhivayut-bolshe-polozhennogo"] },
      { key: "debt-paid", title: "Долг уже погашен", description: "Удержание произошло после полного погашения долга.", relatedProblemSlugs: ["vzyiskali-chuzhoy-dolg"] }
    ]
  }
] as const satisfies DocumentGeneratorTemplate[];

export type DocumentTemplateSlug = (typeof documentTemplates)[number]["slug"];

export function getDocumentTemplate(slug: string) {
  return documentTemplates.find((template) => template.slug === slug) ?? null;
}

export function getDocumentTemplateVariant(template: DocumentGeneratorTemplate, variantKey?: string) {
  if (!variantKey) return null;
  return template.variants.find((variant) => variant.key === variantKey) ?? null;
}
