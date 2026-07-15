import type { LegalReferenceKey } from "@/data/legal-references";

export type DocumentFaqItem = {
  question: string;
  answer: string;
};

export type DocumentRelation = {
  title: string;
  slug?: string;
};

export type NavigatorDocument = {
  slug: string;
  title: string;
  category: string;
  templateSlug?: string;
  documentType: string;
  shortTitle?: string;
  titleAccusative?: string;
  documentTypeAccusative?: string;
  shortIntro: string;
  shortDescription: string;
  description: string;
  heroDescription: string;
  whenToUse: string[];
  whenNotToUse: string[];
  beforeFillingChecklist: string[];
  requiredData: string[];
  whatToPrepare: string[];
  whatToInclude: string[];
  howToFill: string[];
  whereToFile: string;
  whereToSubmit: string;
  filingProcedure: string[];
  howToSubmit: string[];
  legalBasis: string[];
  deadlinesAndFees: string[];
  stateDuty: string[];
  deadlines: string[];
  afterFiling: string[];
  importantFactsToFix: string[];
  mistakes: string[];
  commonMistakes: string[];
  documentsToAttach: string[];
  attachments: string[];
  relatedProblems: DocumentRelation[];
  relatedSituations: DocumentRelation[];
  relatedDocuments: DocumentRelation[];
  faq: DocumentFaqItem[];
  relatedProblemSlugs: string[];
  legalReferenceKeys: LegalReferenceKey[];
  seoTitle?: string;
  seoDescription?: string;
  generatorSeoTitle?: string;
  generatorSeoDescription?: string;
  keywords: string[];
  userQueries: string[];
  lastReviewedAt?: string;
  disclaimer?: string;
};

type DocumentContent = Omit<
  NavigatorDocument,
  "slug" | "title" | "category" | "templateSlug" | "relatedProblemSlugs" | "legalReferenceKeys"
>;

type DocumentSpec = {
  slug: string;
  title: string;
  category: string;
  relatedProblemSlugs: string[];
  templateSlug?: string;
  legalReferenceKeys?: LegalReferenceKey[];
} & Partial<DocumentContent>;

const documentLegalReferenceKeys: Partial<Record<string, LegalReferenceKey[]>> = {
  "vozrazhenie-na-sudebnyy-prikaz": ["gpk_112", "gpk_128", "gpk_129"],
  "zayavlenie-o-vosstanovlenii-sroka-na-otmenu-sudebnogo-prikaza": ["gpk_108", "gpk_112", "gpk_128", "gpk_129"],
  "vozrazhenie-na-isk": ["gpk_131", "gpk_132"],
  "hodataystvo-o-primenenii-sroka-iskovoy-davnosti": ["gk_196", "gk_199"],
  "hodataystvo-ob-umenshenii-neustoyki-po-st-333-gk-rf": ["gk_333"],
  "zayavlenie-o-rassrochke-ispolneniya-resheniya": ["gpk_203"],
  "zhaloba-na-kollektorov-v-fssp": ["fz230_6", "fz230_7"],
  "zhaloba-v-trudovuyu-inspekciyu": ["tk_22", "tk_62", "tk_84_1", "tk_136", "tk_236", "tk_392"],
  "pretenziya-rabotodatelyu-o-vyplate-zarplaty": ["tk_22", "tk_136", "tk_236"],
  "isk-o-vzyskanii-zarabotnoy-platy": ["tk_22", "tk_136", "tk_236", "tk_392"],
  "zayavlenie-o-vzyskanii-alimentov": ["sk_80", "sk_81", "sk_83"],
  "isk-o-rastorzhenii-braka": [
    "sk_17",
    "sk_21",
    "sk_22",
    "sk_23",
    "sk_24",
    "gpk_23",
    "gpk_24",
    "gpk_28",
    "gpk_29",
    "gpk_131",
    "gpk_132",
    "nk_333_19",
    "nk_333_26"
  ],
  "pretenziya-v-upravlyayuschuyu-kompaniyu": ["zhk_161", "gk_15"],
  "zhaloba-v-zhilischnuyu-inspekciyu": ["zhk_161"],
  "akt-o-zalive-kvartiry": ["gk_15", "gk_1064", "zhk_161"],
  "isk-o-vozmeschenii-uscherba-posle-zaliva": ["gk_15", "gk_1064", "zhk_161"],
  "pretenziya-prodavcu-o-vozvrate-deneg": ["zpp_18", "zpp_22", "zpp_26_1", "zpp_23_1"],
  "pretenziya-po-nekachestvennoy-usluge": ["zpp_29", "zpp_31"],
  "isk-o-zaschite-prav-potrebitelya": ["zpp_18", "zpp_22", "zpp_29", "zpp_31"],
  "zayavlenie-o-vozvrate-tovara": ["zpp_18", "zpp_22"],
  "zhaloba-na-sudebnogo-pristava": ["fz229_50", "fz229_64", "fz229_99", "fz229_121"],
  "zayavlenie-o-snyatii-aresta-so-scheta": ["fz229_50", "fz229_64", "fz229_99", "fz229_121"],
  "zayavlenie-o-vozvrate-izlishne-uderzhannyh-deneg": ["fz229_50", "fz229_99", "fz229_121"]
};

const documentSpecs: DocumentSpec[] = [
  // Долги и приставы
  {
    slug: "vozrazhenie-na-sudebnyy-prikaz",
    title: "Возражение на судебный приказ",
    titleAccusative: "возражение на судебный приказ",
    category: "возражения",
    relatedProblemSlugs: ["sudebnyy-prikaz", "otmenit-sudebnyy-prikaz"],
    templateSlug: "vozrazhenie-na-sudebnyy-prikaz",
    legalReferenceKeys: ["gpk_112", "gpk_128", "gpk_129"],
    description:
      "Возражение на судебный приказ — короткое заявление должника в суд, который вынес приказ, о несогласии с его исполнением. Документ помогает отменить приказное производство без спора по существу, если подан в срок. Если срок уже прошёл, вместе с возражениями обычно подают просьбу восстановить срок и прикладывают подтверждающие документы.",
    whenToUse: [
      "Вы получили копию судебного приказа и не согласны с взысканием долга, алиментов, коммунальных платежей или другой суммы.",
      "О приказе стало известно после списания денег, ареста счёта или письма от приставов.",
      "Вы считаете долг спорным, уже оплаченным, неверно рассчитанным или не признаёте требования взыскателя.",
      "Нужно быстро остановить исполнение приказа и перевести спор в обычное исковое производство.",
      "Срок 10 дней уже прошёл, но есть документы, подтверждающие, что вы не могли подать возражения вовремя."
    ],
    deadlines: [
      "Возражения подают в течение 10 дней со дня получения копии судебного приказа.",
      "Судья направляет должнику копию приказа в пятидневный срок после его вынесения.",
      "Если срок пропущен, вместе с возражениями нужно объяснить причины пропуска и приложить подтверждения.",
      "После отмены судебного приказа взыскатель вправе обратиться с тем же требованием уже в исковом порядке.",
      "Если приставы уже начали взыскание, после отмены приказа нужно передать приставу определение суда об отмене."
    ],
    whereToSubmit:
      "В суд или судебный участок мирового судьи, который вынес судебный приказ. Обычно это указано в верхней части приказа и в реквизитах дела.",
    howToSubmit: [
      "Лично через канцелярию суда или судебного участка с отметкой о принятии на вашем экземпляре.",
      "Почтой заказным письмом с описью вложения и уведомлением о вручении.",
      "Через электронную подачу документов, если соответствующий суд принимает такие обращения.",
      "Если приказ уже у приставов, отдельно направьте приставу копию определения об отмене после его получения."
    ],
    documentsToAttach: [
      "Копия судебного приказа, если она есть.",
      "Конверт, уведомление, распечатка с Госуслуг или иной документ, подтверждающий дату получения приказа.",
      "Документы о списании денег, аресте счёта или исполнительном производстве, если о приказе стало известно от банка или приставов.",
      "Доказательства уважительных причин пропуска срока, если 10 дней уже прошли.",
      "Копия паспорта или доверенность представителя, если документ подаёт представитель.",
      "Копии возражений для себя и при необходимости для других участников."
    ],
    commonMistakes: [
      "Подают документ не в тот суд, который вынес судебный приказ.",
      "Считают 10 дней от даты вынесения приказа, а не от даты получения копии.",
      "При пропуске срока не прикладывают просьбу о восстановлении срока и подтверждающие документы.",
      "Подробно спорят по существу долга, но забывают прямо написать, что не согласны с исполнением приказа и просят его отменить.",
      "Не сохраняют доказательства отправки: чек, опись, трек-номер, отметку канцелярии.",
      "После отмены приказа не передают определение приставу или в банк, если взыскание уже началось."
    ],
    faq: [
      {
        question: "Нужно ли подробно объяснять, почему я не согласен с судебным приказом?",
        answer:
          "Для отмены судебного приказа обычно достаточно заявить несогласие с его исполнением. Но если срок пропущен, нужно отдельно объяснить причины пропуска и приложить подтверждения."
      },
      {
        question: "С какого дня считать 10 дней?",
        answer:
          "Срок считают со дня получения копии судебного приказа должником, а не с даты его вынесения. Дату лучше подтверждать конвертом, уведомлением, отметкой вручения или электронным сообщением."
      },
      {
        question: "Что делать, если я узнал о приказе только после списания денег?",
        answer:
          "Подайте возражения в суд, который вынес приказ, и укажите, когда фактически узнали о приказе. Если 10 дней уже прошли, приложите просьбу восстановить срок и документы от банка или пристава."
      },
      {
        question: "Суд отменит приказ автоматически?",
        answer:
          "Если возражения поступили в установленный срок, судья отменяет судебный приказ. Если срок пропущен, суд сначала оценивает причины пропуска и подтверждающие документы."
      },
      {
        question: "После отмены приказа долг исчезает?",
        answer:
          "Нет. Отмена приказа прекращает приказное производство, но взыскатель может обратиться с тем же требованием в исковом порядке, где спор будет рассматриваться с участием сторон."
      },
      {
        question: "Что делать после получения определения об отмене?",
        answer:
          "Сохраните определение суда. Если уже есть исполнительное производство или списания, передайте копию определения приставу и при необходимости в банк, чтобы прекратить исполнение по отменённому приказу."
      }
    ]
  },
  { slug: "zayavlenie-o-vosstanovlenii-sroka-na-otmenu-sudebnogo-prikaza", title: "Заявление о восстановлении срока на отмену судебного приказа", category: "заявления", relatedProblemSlugs: ["sudebnyy-prikaz", "propuschen-srok-obzhalovaniya"], templateSlug: "zayavlenie-o-vosstanovlenii-sroka-na-otmenu-sudebnogo-prikaza" },
  { slug: "zhaloba-na-sudebnogo-pristava", title: "Жалоба на судебного пристава", category: "жалобы", relatedProblemSlugs: ["spisali-dengi-pristavy", "pristav-bezdeystvuet", "obzhalovat-postanovlenie-pristava"], templateSlug: "zhaloba-na-sudebnogo-pristava" },
  { slug: "zayavlenie-o-snyatii-aresta-so-scheta", title: "Заявление о снятии ареста со счета", category: "заявления", relatedProblemSlugs: ["arestovali-zarplatnuyu-kartu", "pristavy-zablokirovali-schet", "ne-snimayut-arest-posle-oplaty"], templateSlug: "zayavlenie-o-snyatii-aresta-so-scheta" },
  { slug: "zayavlenie-o-vozvrate-izlishne-uderzhannyh-deneg", title: "Заявление о возврате излишне удержанных денег", category: "заявления", relatedProblemSlugs: ["uderzhivayut-bolshe-polozhennogo", "vzyiskali-chuzhoy-dolg", "bank-spisal-dengi-bez-soglasiya"], templateSlug: "zayavlenie-o-vozvrate-izlishne-uderzhannyh-deneg" },
  { slug: "zayavlenie-o-rassrochke-ispolneniya-resheniya", title: "Заявление об отсрочке или рассрочке исполнения решения суда", category: "заявления", relatedProblemSlugs: ["ne-mozhete-platit-kredit", "restrukturizaciya-dolga", "bank-podal-v-sud-po-kreditu", "zapret-vyezda-za-granicu"] },
  { slug: "hodataystvo-o-primenenii-sroka-iskovoy-davnosti", title: "Ходатайство о применении срока исковой давности", category: "ходатайства", relatedProblemSlugs: ["bank-podal-v-sud-po-kreditu", "srok-davnosti-po-dolgu", "mfo-trebuet-vernut-dolg"], templateSlug: "hodataystvo-o-primenenii-sroka-iskovoy-davnosti" },
  { slug: "hodataystvo-ob-umenshenii-neustoyki-po-st-333-gk-rf", title: "Ходатайство об уменьшении неустойки по ст. 333 ГК РФ", category: "ходатайства", relatedProblemSlugs: ["ogromnye-procenty-po-dolgu", "mfo-trebuet-vernut-dolg", "bank-podal-v-sud-po-kreditu"] },
  { slug: "zhaloba-na-kollektorov-v-fssp", title: "Жалоба на коллекторов в ФССП", category: "жалобы", relatedProblemSlugs: ["kollektory-ugrozhayut", "prodali-dolg-kollektoram"] },
  { slug: "pretenziya-v-bank-o-vozvrate-spisannyh-deneg", title: "Претензия в банк о возврате списанных денег", category: "претензии", relatedProblemSlugs: ["bank-spisal-dengi-bez-soglasiya"], templateSlug: "pretenziya-v-bank-o-vozvrate-spisannyh-deneg" },
  { slug: "zhaloba-v-bank-rossii", title: "Жалоба в Банк России", category: "жалобы", relatedProblemSlugs: ["bank-spisal-dengi-bez-soglasiya", "mfo-trebuet-vernut-dolg", "prodali-dolg-kollektoram"] },

  // Работа
  { slug: "zhaloba-v-trudovuyu-inspekciyu", title: "Жалоба в трудовую инспекцию", category: "жалобы", relatedProblemSlugs: ["ne-vyplatili-zarplatu", "zaderzhivayut-zarplatu", "ne-dayut-otpusk"], templateSlug: "zhaloba-v-trudovuyu-inspekciyu" },
  { slug: "pretenziya-rabotodatelyu-o-vyplate-zarplaty", title: "Претензия работодателю о выплате зарплаты", category: "претензии", relatedProblemSlugs: ["ne-vyplatili-zarplatu", "zaderzhivayut-zarplatu", "sokratili-bez-vyplat"] },
  { slug: "isk-o-vzyskanii-zarabotnoy-platy", title: "Иск о взыскании заработной платы", category: "иски", relatedProblemSlugs: ["ne-vyplatili-zarplatu", "rabotali-bez-dogovora", "ne-oplatili-bolnichnyy"], templateSlug: "isk-o-vzyskanii-zarabotnoy-platy" },
  { slug: "zayavlenie-o-vydache-trudovoy-knizhki", title: "Заявление о выдаче трудовой книжки", category: "заявления", relatedProblemSlugs: ["ne-vydayut-trudovuyu-knizhku"] },
  { slug: "zhaloba-v-prokuraturu-na-rabotodatelya", title: "Жалоба в прокуратуру на работодателя", category: "жалобы", relatedProblemSlugs: ["zastavlyayut-uvolitsya", "diskriminaciya-na-rabote", "prinuzhdayut-k-pererabotkam"] },
  { slug: "zayavlenie-o-vosstanovlenii-na-rabote", title: "Заявление о восстановлении на работе", category: "заявления", relatedProblemSlugs: ["nezakonno-uvolili", "sokratili-bez-vyplat"] },

  // Семья
  { slug: "zayavlenie-o-vzyskanii-alimentov", title: "Заявление о взыскании алиментов", category: "заявления", relatedProblemSlugs: ["alimenty", "ustanovlenie-ili-osparivanie-otcovstva"], templateSlug: "zayavlenie-o-vzyskanii-alimentov" },
  {
    slug: "isk-o-rastorzhenii-braka",
    title: "Исковое заявление о расторжении брака",
    category: "иски",
    documentType: "Исковое заявление",
    shortIntro:
      "Исковое заявление о расторжении брака нужно для развода через суд, когда через ЗАГС оформить развод нельзя. Чаще всего это ситуации с общими несовершеннолетними детьми, несогласием второго супруга или уклонением от подачи совместного заявления.",
    relatedProblemSlugs: [
      "razvod",
      "razdel-imushchestva-suprugov",
      "alimenty",
      "mesto-zhitelstva-rebenka",
      "poryadok-obscheniya-s-rebenkom"
    ],
    shortDescription: "Иск для развода через суд, когда через ЗАГС расторгнуть брак нельзя.",
    description:
      "Исковое заявление о расторжении брака подают в суд, если развестись через ЗАГС нельзя: есть общие несовершеннолетние дети, второй супруг не согласен на развод или уклоняется от подачи заявления.",
    heroDescription:
      "Исковое заявление о расторжении брака подают в суд, если развестись через ЗАГС нельзя: есть общие несовершеннолетние дети, второй супруг не согласен на развод или уклоняется от подачи заявления. В иске указывают сведения о браке, детях, позиции сторон, наличии или отсутствии спора о детях и имуществе, а также просьбу расторгнуть брак через суд.",
    whenToUse: [
      "У супругов есть общие несовершеннолетние дети.",
      "Второй супруг не согласен на развод.",
      "Второй супруг не приходит в ЗАГС или уклоняется от подачи совместного заявления.",
      "Супруги фактически не живут вместе и не ведут общее хозяйство.",
      "Нужно расторгнуть брак через мирового судью или районный суд.",
      "Нужно зафиксировать, что спора о детях и имуществе нет.",
      "Нужно подать иск без личного контакта со вторым супругом."
    ],
    whenNotToUse: [
      "Оба супруга согласны на развод, общих несовершеннолетних детей нет и можно подать заявление в ЗАГС.",
      "Есть спор о месте жительства ребенка, порядке общения, алиментах или разделе крупного имущества: иск о разводе нужно дорабатывать под дополнительные требования.",
      "Муж хочет подать иск без согласия жены во время ее беременности или в течение года после рождения ребенка.",
      "Нужно не расторгнуть брак, а признать его недействительным: это другой тип требований."
    ],
    requiredData: [
      "Паспортные данные истца.",
      "Известные данные второго супруга.",
      "Свидетельство о заключении брака.",
      "Свидетельства о рождении общих несовершеннолетних детей.",
      "Адрес регистрации или проживания ответчика.",
      "Сведения о том, проживают ли супруги вместе.",
      "Информация о наличии или отсутствии спора о детях.",
      "Информация о наличии или отсутствии спора об имуществе.",
      "Квитанция об оплате госпошлины.",
      "Подтверждение направления копии иска ответчику.",
      "Доверенность, если заявление подает представитель."
    ],
    whatToPrepare: [
      "Паспортные данные истца.",
      "Известные данные второго супруга.",
      "Свидетельство о заключении брака.",
      "Свидетельства о рождении общих несовершеннолетних детей.",
      "Адрес регистрации или проживания ответчика.",
      "Сведения о том, проживают ли супруги вместе и ведут ли общее хозяйство.",
      "Информацию о наличии или отсутствии спора о детях и имуществе.",
      "Квитанцию об оплате госпошлины.",
      "Подтверждение направления копии иска ответчику.",
      "Доверенность, если заявление подает представитель."
    ],
    howToFill: [
      "Укажите суд, данные истца и известные данные ответчика.",
      "Опишите дату регистрации брака и реквизиты свидетельства о заключении брака.",
      "Укажите общих несовершеннолетних детей, если они есть.",
      "Кратко опишите, что семейные отношения прекращены, совместное проживание и общее хозяйство не ведутся.",
      "Отдельно укажите, есть ли спор о детях, алиментах или имуществе.",
      "Сформулируйте требование: расторгнуть брак между истцом и ответчиком.",
      "Перечислите приложения и поставьте дату и подпись."
    ],
    whereToSubmit:
      "Если между супругами нет спора о детях, иск обычно подают мировому судье. По общему правилу заявление подают по месту жительства ответчика. Истец может обратиться по своему месту жительства, если с ним проживает несовершеннолетний ребенок или состояние здоровья не позволяет выехать к месту жительства ответчика. Если вместе с разводом заявлен спор о детях или другие сложные требования, дело может относиться к районному суду.",
    howToSubmit: [
      "Перед подачей проверьте подсудность: мировой судья или районный суд, адрес ответчика и возможные основания для подачи по адресу истца.",
      "Направьте копию иска с приложениями ответчику и сохраните подтверждение отправки.",
      "Подайте иск через канцелярию суда, почтой заказным письмом или через электронную систему суда, если она доступна.",
      "Сохраните копию иска, квитанцию об оплате госпошлины и подтверждение подачи."
    ],
    legalBasis: [
      "Статьи 21-23 СК РФ регулируют расторжение брака в судебном порядке.",
      "Статья 17 СК РФ ограничивает право мужа подать иск без согласия жены во время беременности и в течение года после рождения ребенка.",
      "Статья 24 СК РФ указывает, какие вопросы суд может разрешать при вынесении решения о разводе.",
      "Статьи 23 и 24 ГПК РФ помогают определить, мировой или районный суд должен рассматривать дело.",
      "Статьи 28 и 29 ГПК РФ регулируют территориальную подсудность: по адресу ответчика или в отдельных случаях по адресу истца.",
      "Статьи 131 и 132 ГПК РФ устанавливают требования к форме и содержанию иска и приложениям.",
      "Статьи 333.19 и 333.26 НК РФ регулируют госпошлину за подачу иска о разводе и регистрацию расторжения брака."
    ],
    stateDuty: [
      "По состоянию на 17.06.2026 госпошлина за подачу искового заявления о расторжении брака составляет 5000 рублей.",
      "После вступления решения суда в силу расторжение брака регистрируют в ЗАГСе; госпошлина за регистрацию расторжения брака в судебном порядке составляет 5000 рублей с каждого из супругов.",
      "Если вместе с разводом заявлены имущественные требования, пошлина по этим требованиям может рассчитываться отдельно."
    ],
    deadlines: [
      "Дело о расторжении брака рассматривается судом после принятия иска к производству; дату заседания суд сообщает повесткой или уведомлением.",
      "Если второй супруг не согласен на развод, суд может назначить срок для примирения до трех месяцев.",
      "Решение суда вступает в законную силу после истечения срока на апелляционное обжалование, если жалоба не подана.",
      "После вступления решения в силу нужно обратиться в ЗАГС для государственной регистрации расторжения брака и получения свидетельства."
    ],
    afterFiling: [
      "Суд проверит иск и приложения. Если не хватает сведений, квитанции, подтверждения отправки ответчику или других документов, заявление могут оставить без движения и дать срок исправить недостатки.",
      "После принятия иска суд назначит заседание и направит сторонам уведомления.",
      "Если второй супруг возражает против развода, суд может дать срок для примирения до трех месяцев.",
      "После вступления решения в силу нужно обратиться в ЗАГС для государственной регистрации расторжения брака и получения свидетельства."
    ],
    importantFactsToFix: [
      "Когда и где был зарегистрирован брак.",
      "Есть ли общие несовершеннолетние дети и с кем они фактически проживают.",
      "Прекращены ли семейные отношения, совместное проживание и общее хозяйство.",
      "Согласен ли второй супруг на развод или уклоняется от обращения в ЗАГС.",
      "Есть ли спор о детях, алиментах или имуществе.",
      "Почему истец обращается именно в выбранный суд.",
      "Направлена ли копия иска ответчику."
    ],
    attachments: [
      "Копия искового заявления для суда.",
      "Подтверждение направления копии иска ответчику.",
      "Свидетельство о заключении брака или его дубликат.",
      "Копии свидетельств о рождении общих несовершеннолетних детей.",
      "Квитанция об оплате госпошлины.",
      "Документы, подтверждающие проживание ребенка с истцом, если иск подается по месту жительства истца.",
      "Медицинские документы, если истец ссылается на невозможность выезда к месту жительства ответчика.",
      "Доверенность представителя, если иск подает представитель."
    ],
    mistakes: [
      "Подать иск не в тот суд.",
      "Не указать сведения о детях или споре о детях.",
      "Не направить копию иска ответчику.",
      "Не приложить свидетельство о браке или документы о детях.",
      "Не оплатить госпошлину или приложить квитанцию с неверными реквизитами.",
      "Объединить развод со сложными имущественными требованиями без проверки подсудности.",
      "Написать эмоциональный текст без юридически значимых фактов."
    ],
    commonMistakes: [
      "Подать иск не в тот суд.",
      "Не указать сведения о детях или споре о детях.",
      "Не направить копию иска ответчику.",
      "Не приложить свидетельство о браке или документы о детях.",
      "Не оплатить госпошлину или приложить квитанцию с неверными реквизитами.",
      "Объединить развод со сложными имущественными требованиями без проверки подсудности.",
      "Написать эмоциональный текст без юридически значимых фактов."
    ],
    relatedSituations: [
      { title: "Развод", slug: "razvod" },
      { title: "Раздел имущества", slug: "razdel-imushchestva-suprugov" },
      { title: "Алименты", slug: "alimenty" },
      { title: "Определение места жительства ребенка", slug: "mesto-zhitelstva-rebenka" },
      { title: "Порядок общения с ребенком", slug: "poryadok-obscheniya-s-rebenkom" }
    ],
    relatedDocuments: [
      { title: "Заявление о взыскании алиментов", slug: "zayavlenie-o-vzyskanii-alimentov" },
      { title: "Иск о разделе имущества", slug: "isk-o-razdele-imuschestva" },
      { title: "Соглашение о разделе имущества" },
      { title: "Соглашение об уплате алиментов" },
      { title: "Заявление об определении места жительства ребенка", slug: "zayavlenie-ob-opredelenii-mesta-zhitelstva-rebenka" },
      { title: "Заявление об установлении порядка общения с ребенком", slug: "zayavlenie-ob-ustanovlenii-poryadka-obscheniya-s-rebenkom" }
    ],
    faq: [
      {
        question: "Можно ли подать на развод, если второй супруг против?",
        answer:
          "Да. Несогласие второго супруга не блокирует развод. Суд может дать срок для примирения, но если истец продолжает настаивать на разводе, брак может быть расторгнут."
      },
      {
        question: "Можно ли развестись через суд, если есть дети?",
        answer:
          "Да. Если есть общие несовершеннолетние дети, развод обычно оформляется через суд. Если спора о детях нет, дело чаще рассматривает мировой судья. Если спор есть, может потребоваться районный суд."
      },
      {
        question: "Нужно ли указывать причину развода?",
        answer:
          "Да, но кратко. Обычно достаточно указать, что семейные отношения прекращены, совместное проживание и общее хозяйство не ведутся, сохранение семьи невозможно."
      },
      {
        question: "Можно ли подать иск по своему адресу?",
        answer:
          "Да, если с истцом проживает несовершеннолетний ребенок или состояние здоровья мешает ехать к месту жительства ответчика. В остальных случаях обычно действует правило подачи по адресу ответчика."
      },
      {
        question: "Что делать после решения суда?",
        answer:
          "После вступления решения суда в законную силу расторжение брака регистрируют в ЗАГСе. После регистрации можно получить свидетельство о расторжении брака."
      }
    ],
    seoTitle: "Исковое заявление о расторжении брака — образец иска на развод через суд",
    seoDescription:
      "Подготовьте исковое заявление о расторжении брака через суд. Когда нужен иск на развод, куда подавать, какие документы приложить, госпошлина, сроки и частые ошибки.",
    keywords: [
      "исковое заявление о расторжении брака",
      "иск на развод",
      "заявление на развод через суд",
      "образец иска о расторжении брака",
      "развод через суд",
      "развод с детьми через суд",
      "развод если супруг против",
      "куда подавать иск о разводе",
      "госпошлина за развод через суд",
      "документы для развода через суд",
      "развод через мирового судью",
      "расторжение брака с несовершеннолетними детьми"
    ],
    userQueries: [
      "исковое заявление о расторжении брака",
      "иск на развод через суд",
      "заявление на развод через суд",
      "образец иска о расторжении брака",
      "развод через суд с детьми",
      "развод если супруг против",
      "как подать на развод в суд",
      "куда подавать иск о разводе",
      "госпошлина за развод через суд",
      "документы для развода через суд",
      "развод через мирового судью",
      "расторжение брака с несовершеннолетними детьми"
    ],
    lastReviewedAt: "2026-06-17",
    disclaimer:
      "Информация носит справочный характер и не заменяет консультацию юриста. Перед подачей проверьте реквизиты суда, актуальные размеры госпошлины и обстоятельства конкретного дела."
  },
  { slug: "isk-o-razdele-imuschestva", title: "Иск о разделе имущества", category: "иски", relatedProblemSlugs: ["razdel-imushchestva-suprugov", "suprug-skryvaet-imuschestvo", "pokupka-kvartiry-s-matkapitalom"] },
  { slug: "zayavlenie-ob-opredelenii-mesta-zhitelstva-rebenka", title: "Заявление об определении места жительства ребенка", category: "заявления", relatedProblemSlugs: ["mesto-zhitelstva-rebenka", "razvod"] },
  { slug: "zayavlenie-ob-ustanovlenii-poryadka-obscheniya-s-rebenkom", title: "Заявление об установлении порядка общения с ребенком", category: "заявления", relatedProblemSlugs: ["poryadok-obscheniya-s-rebenkom"] },
  { slug: "isk-o-lishenii-roditelskih-prav", title: "Иск о лишении родительских прав", category: "иски", relatedProblemSlugs: ["lishenie-roditelskih-prav", "nasilie-v-seme"] },

  // ЖКХ
  { slug: "pretenziya-v-upravlyayuschuyu-kompaniyu", title: "Претензия в управляющую компанию", category: "претензии", relatedProblemSlugs: ["uk-ne-delaet-remont", "plesen-v-kvartire", "otklyuchili-vodu-ili-svet", "zatopili-sosedi", "protekaet-krysha"], templateSlug: "pretenziya-v-upravlyayuschuyu-kompaniyu" },
  { slug: "zhaloba-v-zhilischnuyu-inspekciyu", title: "Жалоба в жилищную инспекцию", category: "жалобы", relatedProblemSlugs: ["uk-ne-delaet-remont", "nezakonnoe-sobranie-sobstvennikov", "nekachestvennoe-otoplenie"] },
  { slug: "akt-o-zalive-kvartiry", title: "Акт о заливе квартиры", category: "акты", relatedProblemSlugs: ["zatopili-sosedi", "protekaet-krysha"] },
  { slug: "pretenziya-o-pereraschete-kommunalnyh-uslug", title: "Претензия о перерасчете коммунальных услуг", category: "претензии", relatedProblemSlugs: ["zavyshennye-nachisleniya-zhkh", "ne-delayut-pereraschet", "nekachestvennoe-otoplenie"] },
  { slug: "zhaloba-v-rospotrebnadzor", title: "Жалоба в Роспотребнадзор", category: "жалобы", relatedProblemSlugs: ["navyazali-platnye-uslugi-uk", "prodavec-ne-prinimaet-pretenziyu", "marketpleys-otkazal-v-vozvrate"] },
  { slug: "isk-o-vozmeschenii-uscherba-posle-zaliva", title: "Иск о возмещении ущерба после залива", category: "иски", relatedProblemSlugs: ["zatopili-sosedi", "protekaet-krysha"] },

  // Наследство
  { slug: "zayavlenie-o-prinyatii-nasledstva", title: "Заявление о принятии наследства", category: "заявления", relatedProblemSlugs: ["vstuplenie-v-nasledstvo", "nasledstvo-bez-zaveschaniya"] },
  { slug: "zayavlenie-o-vosstanovlenii-sroka-prinyatiya-nasledstva", title: "Заявление о восстановлении срока принятия наследства", category: "заявления", relatedProblemSlugs: ["propuschen-srok-nasledstva"] },
  { slug: "isk-o-priznanii-prava-na-nasledstvo", title: "Иск о признании права на наследство", category: "иски", relatedProblemSlugs: ["spor-mezhdu-naslednikami", "razdel-nasledstvennogo-imuschestva", "notarius-otkazal-v-nasledstve"] },
  { slug: "zayavlenie-ob-otkaze-ot-nasledstva", title: "Заявление об отказе от наследства", category: "заявления", relatedProblemSlugs: ["nasledstvo-s-dolgami"] },
  { slug: "isk-ob-osparivanii-zaveschaniya", title: "Иск об оспаривании завещания", category: "иски", relatedProblemSlugs: ["osporit-zaveschanie", "obyazatelnaya-dolya-v-nasledstve"] },

  // Потребительские права
  { slug: "pretenziya-prodavcu-o-vozvrate-deneg", title: "Претензия продавцу о возврате денег", category: "претензии", relatedProblemSlugs: ["vernut-dengi-za-tovar", "ne-dostavili-oplachennyy-tovar", "skrytye-defekty-avtomobilya"], templateSlug: "pretenziya-prodavcu-o-vozvrate-deneg" },
  { slug: "pretenziya-po-nekachestvennoy-usluge", title: "Претензия по некачественной услуге", category: "претензии", relatedProblemSlugs: ["nekachestvennaya-usluga", "navyazali-dopolnitelnuyu-uslugu", "turoperator-ne-vozvraschaet-dengi"] },
  { slug: "isk-o-zaschite-prav-potrebitelya", title: "Иск о защите прав потребителя", category: "иски", relatedProblemSlugs: ["vernut-dengi-za-tovar", "marketpleys-otkazal-v-vozvrate", "avtosalon-navyazal-uslugi"] },
  { slug: "zayavlenie-o-vozvrate-tovara", title: "Заявление о возврате товара", category: "заявления", relatedProblemSlugs: ["tovar-slomalsya-na-garantii", "servisnyy-centr-zatyagivaet-remont"] },

  // Суды
  { slug: "iskovoe-zayavlenie", title: "Исковое заявление", category: "иски", relatedProblemSlugs: ["nuzhno-podat-isk", "vyselenie-iz-kvartiry", "spor-o-dole-v-kvartire"] },
  {
    slug: "vozrazhenie-na-isk",
    title: "Возражение на иск",
    titleAccusative: "возражение на иск",
    category: "возражения",
    relatedProblemSlugs: ["podat-vozrazheniya-v-sud", "bank-podal-v-sud-po-kreditu", "rabotodatel-trebuet-vernut-dengi"],
    templateSlug: "vozrazhenie-na-isk",
    legalReferenceKeys: ["gpk_149", "gpk_150", "apk_131"],
    description:
      "Возражение на исковое заявление — письменная позиция ответчика, в которой он указывает, почему требования истца необоснованны полностью или частично. Документ помогает изложить доводы, представить доказательства и обратить внимание суда на значимые обстоятельства дела.",
    whenToUse: [
      "Вы не согласны с требованиями истца полностью или частично.",
      "Истец неверно изложил обстоятельства дела.",
      "Есть документы или иные доказательства в подтверждение вашей позиции.",
      "Истцом неправильно применены нормы закона.",
      "Пропущен срок исковой давности (если применимо и заявляется ответчиком)."
    ],
    deadlines: [
      "По гражданским делам (ГПК РФ) отдельного обязательного срока подачи возражений не установлено.",
      "Рекомендуется подать после получения копии иска и до первого заседания, чтобы суд и другие участники заранее ознакомились с позицией.",
      "Право представить возражения предусмотрено статьями 149 и 150 ГПК РФ."
    ],
    whereToSubmit: "В суд, рассматривающий дело. Одновременно желательно направить копии другим участникам процесса.",
    howToSubmit: [
      "Лично через канцелярию суда.",
      "Почтовым отправлением.",
      "В электронном виде через сервис подачи процессуальных документов, если это допускается судом."
    ],
    documentsToAttach: [
      "Письменные доказательства по спору.",
      "Договоры, расписки, чеки, квитанции.",
      "Переписка с истцом или третьими лицами.",
      "Доверенность представителя (если подаёт представитель).",
      "Иные документы, подтверждающие ваши доводы."
    ],
    commonMistakes: [
      "Нет ссылок на доказательства.",
      "Эмоции вместо юридических доводов.",
      "Нет конкретной просьбы к суду.",
      "Нет подписи.",
      "Документы приложены без пояснения, что именно они подтверждают.",
      "Документ подан в день заседания — участники не успевают ознакомиться."
    ],
    faq: [
      {
        question: "Обязательно ли подавать возражение на иск?",
        answer:
          "Нет, это право ответчика, а не обязанность. Но письменные возражения помогают заранее донести до суда вашу позицию и доказательства, поэтому их подача целесообразна, если вы не согласны с иском."
      },
      {
        question: "В какой срок нужно подать возражение по ГПК РФ?",
        answer:
          "Отдельного обязательного срока закон не устанавливает. Возражения лучше представить после получения копии иска и до первого заседания либо в ходе рассмотрения дела в первой инстанции (статьи 149 и 150 ГПК РФ)."
      },
      {
        question: "Чем возражение отличается от отзыва в арбитражном суде?",
        answer:
          "В гражданском процессе (ГПК РФ) документ называют возражением. В арбитражном процессе это отзыв на исковое заявление, содержание и порядок подачи которого регулирует статья 131 АПК РФ."
      },
      {
        question: "На какие нормы ссылаться в возражении?",
        answer:
          "На процессуальные нормы о подаче возражений (статьи 149, 150 ГПК РФ) и на нормы материального права, регулирующие конкретный спор, — например ГК РФ, СК РФ или ТК РФ."
      },
      {
        question: "Приведёт ли возражение к отказу в иске?",
        answer:
          "Само по себе — нет. Суд оценивает все доказательства сторон и принимает решение после их исследования. Поэтому каждый довод желательно подтверждать документами или иными допустимыми доказательствами."
      },
      {
        question: "Как подать возражение?",
        answer:
          "Лично через канцелярию суда, почтой или в электронном виде через сервис подачи процессуальных документов, если суд это допускает. Копии желательно направить другим участникам процесса."
      }
    ]
  },
  { slug: "apellyacionnaya-zhaloba", title: "Апелляционная жалоба", category: "жалобы", relatedProblemSlugs: ["podat-apellyaciyu", "propuschen-srok-obzhalovaniya", "deportaciya-ili-vydvorenie"] },
  { slug: "hodataystvo-o-vosstanovlenii-sroka", title: "Ходатайство о восстановлении срока", category: "ходатайства", relatedProblemSlugs: ["vosstanovit-srok-v-sude", "propuschen-srok-obzhalovaniya", "osporit-shtraf-gibdd"] },
  { slug: "hodataystvo-ob-otlozhenii-sudebnogo-zasedaniya", title: "Ходатайство об отложении судебного заседания", category: "ходатайства", relatedProblemSlugs: ["povestka-v-sud", "podat-vozrazheniya-v-sud"] },
  { slug: "zayavlenie-o-vydache-ispolnitelnogo-lista", title: "Заявление о выдаче исполнительного листа", category: "заявления", relatedProblemSlugs: ["poluchit-ispolnitelnyy-list"] },

  // Авто, медицина, соцвыплаты, миграция, воинский учет, бизнес, уголовные риски
  { slug: "zhaloba-na-postanovlenie-gibdd", title: "Жалоба на постановление ГИБДД", category: "жалобы", relatedProblemSlugs: ["prishol-shtraf-gibdd", "osporit-shtraf-gibdd", "lishayut-voditelskih-prav"] },
  { slug: "pretenziya-v-strahovuyu-kompaniyu", title: "Претензия в страховую компанию", category: "претензии", relatedProblemSlugs: ["strahovaya-zanizila-vyplatu", "dtp-bez-strahovki"] },
  { slug: "zhaloba-na-otkaz-v-medicinskoy-pomoschi", title: "Жалоба на отказ в медицинской помощи", category: "жалобы", relatedProblemSlugs: ["otkazali-v-medicinskoy-pomoschi", "nekachestvennoe-lechenie", "otkazali-v-oms"] },
  { slug: "zayavlenie-o-vydache-medicinskih-dokumentov", title: "Заявление о выдаче медицинских документов", category: "заявления", relatedProblemSlugs: ["ne-dayut-medicinskie-dokumenty", "vrachebnaya-oshibka", "oshibka-v-diagnoze"] },
  { slug: "zhaloba-na-otkaz-v-socialnoy-vyplate", title: "Жалоба на отказ в социальной выплате", category: "жалобы", relatedProblemSlugs: ["otkaz-v-posobii", "otkazali-v-invalidnosti", "otkaz-v-materinskom-kapitale"] },
  { slug: "zayavlenie-o-pereraschete-pensii", title: "Заявление о перерасчете пенсии", category: "заявления", relatedProblemSlugs: ["ne-naznachili-pensiyu", "oshibka-v-stazhe", "ne-uchityvayut-dohody-pravilno"] },
  { slug: "zayavlenie-o-prodlenii-registracii", title: "Заявление о продлении регистрации", category: "заявления", relatedProblemSlugs: ["prodlit-registraciyu", "narushen-srok-migracionnogo-ucheta", "poteryali-migracionnye-dokumenty"] },
  { slug: "zhaloba-na-reshenie-prizyvnoy-komissii", title: "Жалоба на решение призывной комиссии", category: "жалобы", relatedProblemSlugs: ["obzhalovat-reshenie-prizyvnoy-komissii", "reshenie-vvk", "otkazali-v-otsrochke"] },
  { slug: "raport-voennosluzhaschego", title: "Рапорт военнослужащего", category: "заявления", relatedProblemSlugs: ["oshibka-v-voennom-bilete", "ne-snimayut-s-voinskogo-ucheta", "prishla-povestka"] },
  { slug: "pretenziya-kontragentu-po-dogovoru", title: "Претензия контрагенту по договору", category: "претензии", relatedProblemSlugs: ["kontragent-ne-platit", "dolg-po-dogovoru", "postavschik-narushil-srok"] },
  { slug: "zayavlenie-v-policiyu", title: "Заявление в полицию", category: "заявления", relatedProblemSlugs: ["podat-zayavlenie-v-policiyu", "nasilie-v-seme", "ugrozhayut-ugolovnym-delom"] },
  { slug: "zhaloba-na-deystviya-policii", title: "Жалоба на действия полиции", category: "жалобы", relatedProblemSlugs: ["obzhalovat-deystviya-policii", "otkazali-v-vozbuzhdenii-dela", "izyali-telefon-ili-dokumenty"] },
  { slug: "zhaloba-v-prokuraturu", title: "Жалоба в прокуратуру", category: "жалобы", relatedProblemSlugs: ["avariynoe-zhile", "notarius-otkazal-v-nasledstve", "obzhalovat-deystviya-policii"] }
];

export const navigatorDocuments: NavigatorDocument[] = documentSpecs.map((document) => ({
  slug: document.slug,
  title: document.title,
  category: document.category,
  templateSlug: document.templateSlug,
  documentType: document.documentType ?? document.category,
  shortTitle: document.shortTitle,
  titleAccusative: document.titleAccusative,
  documentTypeAccusative: document.documentTypeAccusative,
  shortIntro: document.shortIntro ?? document.shortDescription ?? `${document.title}: что проверить перед подготовкой и подачей.`,
  shortDescription: document.shortDescription ?? document.shortIntro ?? `${document.title}: что проверить перед подготовкой и подачей.`,
  description:
    document.description ??
    getDefaultDocumentDescription(document),
  heroDescription:
    document.heroDescription ??
    document.shortIntro ??
    document.description ??
    getDefaultDocumentDescription(document),
  whenToUse: document.whenToUse ?? [
    "Есть спор, отказ, нарушение срока или нужно подтвердить свою позицию письменно.",
    "Устные обращения не дают результата или нужно доказательство подачи.",
    "Перед подачей жалобы, претензии, заявления или иска нужно собрать факты в одном документе."
  ],
  whenNotToUse: document.whenNotToUse ?? [],
  beforeFillingChecklist: document.beforeFillingChecklist ?? document.whatToPrepare ?? document.requiredData ?? [
    "Данные заявителя и второй стороны или органа",
    "Даты событий, номера дел, договоров, постановлений или обращений",
    "Краткое описание нарушения и желаемый результат",
    "Копии доказательств: переписка, чеки, акты, выписки, решения или отказы"
  ],
  requiredData: document.requiredData ?? [
    "Данные заявителя и второй стороны или органа",
    "Даты событий, номера дел, договоров, постановлений или обращений",
    "Краткое описание нарушения и желаемый результат",
    "Копии доказательств: переписка, чеки, акты, выписки, решения или отказы"
  ],
  whatToPrepare: document.whatToPrepare ?? document.beforeFillingChecklist ?? document.requiredData ?? [
    "Данные заявителя и второй стороны или органа",
    "Даты событий, номера дел, договоров, постановлений или обращений",
    "Краткое описание нарушения и желаемый результат",
    "Копии доказательств: переписка, чеки, акты, выписки, решения или отказы"
  ],
  whatToInclude: document.whatToInclude ?? document.importantFactsToFix ?? [],
  howToFill: document.howToFill ?? [
    "Укажите адресата, свои данные и реквизиты спорного документа, если он есть.",
    "Опишите события по датам без лишних эмоций и оценок.",
    "Сформулируйте конкретное требование: отменить, взыскать, вернуть, выдать, пересчитать или провести проверку.",
    "Приложите копии доказательств и сохраните подтверждение отправки."
  ],
  whereToFile: document.whereToFile ?? document.whereToSubmit ?? getSubmitPlace(document.category),
  whereToSubmit: document.whereToSubmit ?? document.whereToFile ?? getSubmitPlace(document.category),
  filingProcedure: document.filingProcedure ?? document.howToSubmit ?? [],
  howToSubmit: document.howToSubmit ?? document.filingProcedure ?? [],
  legalBasis: document.legalBasis ?? [],
  deadlinesAndFees: document.deadlinesAndFees ?? [...(document.deadlines ?? []), ...(document.stateDuty ?? [])],
  stateDuty: document.stateDuty ?? [],
  deadlines: document.deadlines ?? [
    "Срок зависит от ситуации и даты получения отказа, постановления, решения или иного документа.",
    "Если есть риск пропуска срока, документ лучше готовить сразу и отдельно проверить необходимость ходатайства о восстановлении срока."
  ],
  afterFiling: document.afterFiling ?? [],
  importantFactsToFix: document.importantFactsToFix ?? document.whatToInclude ?? [],
  mistakes: document.mistakes ?? [
    "Не указать конкретное требование.",
    "Не приложить доказательства или не сохранить подтверждение отправки.",
    "Использовать шаблон без проверки адресата, срока и правового результата."
  ],
  commonMistakes: document.commonMistakes ?? [],
  documentsToAttach: document.documentsToAttach ?? document.attachments ?? [],
  attachments: document.attachments ?? document.documentsToAttach ?? [],
  relatedProblems: document.relatedProblems ?? document.relatedSituations ?? [],
  relatedSituations: document.relatedSituations ?? document.relatedProblems ?? [],
  relatedDocuments: document.relatedDocuments ?? [],
  faq: document.faq ?? [],
  relatedProblemSlugs: document.relatedProblemSlugs,
  legalReferenceKeys: document.legalReferenceKeys ?? documentLegalReferenceKeys[document.slug] ?? [],
  seoTitle: document.seoTitle,
  seoDescription: document.seoDescription,
  generatorSeoTitle: document.generatorSeoTitle,
  generatorSeoDescription: document.generatorSeoDescription,
  keywords: document.keywords ?? document.userQueries ?? [],
  userQueries: document.userQueries ?? document.keywords ?? [],
  lastReviewedAt: document.lastReviewedAt,
  disclaimer: document.disclaimer
}));

function getDefaultDocumentDescription(document: DocumentSpec) {
  return `${document.title} нужен, чтобы письменно изложить факты, требование и доказательства по вашей ситуации. Сервис подскажет, какие данные указать, куда подать документ, какие сроки проверить и какие приложения подготовить.`;
}

function getSubmitPlace(category: string) {
  if (category === "иски") return "В суд по правилам подсудности и с приложением копий для участников дела.";
  if (category === "жалобы") return "В орган, должностному лицу или в суд, который вправе проверить нарушение.";
  if (category === "претензии") return "Второй стороне договора, продавцу, исполнителю, работодателю, УК или контрагенту.";
  if (category === "ходатайства") return "В суд или орган, где рассматривается дело или заявление.";
  if (category === "акты") return "Составляется с участием ответственного лица, свидетелей или представителя организации.";
  return "Адресату, который обязан рассмотреть заявление или выдать документ.";
}

export function getNavigatorDocument(slug: string) {
  return navigatorDocuments.find((document) => document.slug === slug) ?? null;
}
