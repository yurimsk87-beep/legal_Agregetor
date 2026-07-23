import { legalCategories, normalizeLegalCategorySlug } from "@/data/legal-categories";
import type { LegalReferenceKey } from "@/data/legal-references";
import targetProblemStructure from "../../docs/analytics/problems_target_structure.json";

export type LegalProblemFaq = {
  question: string;
  answer: string;
};

export type LegalProblemRiskLevel = "low" | "medium" | "high";
export type LegalProblemUrgency = "today" | "few_days" | "standard";

export type LegalProblem = {
  slug: string;
  categorySlug: string;
  title: string;
  h1: string;
  shortTitle: string;
  shortAnswer: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  riskLevel: LegalProblemRiskLevel;
  urgency: LegalProblemUrgency;
  whatToKnow: string[];
  deadlines: string[];
  risks: string[];
  steps: string[];
  documents: string[];
  mistakes: string[];
  faq: LegalProblemFaq[];
  relatedDocumentSlugs: string[];
  legalReferenceKeys: LegalReferenceKey[];
  relatedQuestionTopics: string[];
  relatedLawyerSpecializations: string[];
  relatedProblemSlugs: string[];
  selfHelpConditions?: string[];
  lawyerConditions?: string[];
  heroNote?: { title: string; text: string };
  urgencyNote?: string;
  lastReviewedAt?: string;
};

type LegalProblemSpec = {
  slug: string;
  categorySlug: string;
  title: string;
  shortTitle: string;
  shortAnswer: string;
  relatedDocumentSlugs: string[];
  riskLevel?: LegalProblemRiskLevel;
  urgency?: LegalProblemUrgency;
  legalReferenceKeys?: LegalReferenceKey[];
  relatedQuestionTopics?: string[];
  relatedLawyerSpecializations?: string[];
};

type TargetCategory = {
  title: string;
  slug: string;
  situations: TargetSituation[];
};

type TargetSituation = {
  title: string;
  slug: string;
  shortDescription: string;
  priority: number;
  userQueries?: string[];
};

type LegalProblemTuple = [
  slug: string,
  categorySlug: string,
  title: string,
  shortTitle: string,
  shortAnswer: string,
  relatedDocumentSlugs: string[],
  riskLevel?: LegalProblemRiskLevel,
  urgency?: LegalProblemUrgency
];

const documentTitles: Record<string, string> = {
  "vozrazhenie-na-sudebnyy-prikaz": "Возражение на судебный приказ",
  "zayavlenie-o-vosstanovlenii-sroka-na-otmenu-sudebnogo-prikaza": "Заявление о восстановлении срока на отмену судебного приказа",
  "zhaloba-na-sudebnogo-pristava": "Жалоба на судебного пристава",
  "zayavlenie-o-snyatii-aresta-so-scheta": "Заявление о снятии ареста со счета",
  "zayavlenie-o-vozvrate-izlishne-uderzhannyh-deneg": "Заявление о возврате излишне удержанных денег",
  "zayavlenie-o-rassrochke-ispolneniya-resheniya": "Заявление об отсрочке или рассрочке исполнения решения суда",
  "hodataystvo-o-primenenii-sroka-iskovoy-davnosti": "Ходатайство о применении срока исковой давности",
  "hodataystvo-ob-umenshenii-neustoyki-po-st-333-gk-rf": "Ходатайство об уменьшении неустойки по ст. 333 ГК РФ",
  "zhaloba-na-kollektorov-v-fssp": "Жалоба на коллекторов в ФССП",
  "pretenziya-v-bank-o-vozvrate-spisannyh-deneg": "Претензия в банк о возврате списанных денег",
  "zhaloba-v-bank-rossii": "Жалоба в Банк России",
  "zhaloba-v-trudovuyu-inspekciyu": "Жалоба в трудовую инспекцию",
  "pretenziya-rabotodatelyu-o-vyplate-zarplaty": "Претензия работодателю о выплате зарплаты",
  "isk-o-vzyskanii-zarabotnoy-platy": "Иск о взыскании заработной платы",
  "zayavlenie-o-vydache-trudovoy-knizhki": "Заявление о выдаче трудовой книжки",
  "zhaloba-v-prokuraturu-na-rabotodatelya": "Жалоба в прокуратуру на работодателя",
  "zayavlenie-o-vosstanovlenii-na-rabote": "Заявление о восстановлении на работе",
  "zayavlenie-o-vzyskanii-alimentov": "Заявление о взыскании алиментов",
  "zayavlenie-v-zags": "Заявление в орган ЗАГС",
  "isk-o-rastorzhenii-braka": "Исковое заявление о расторжении брака",
  "isk-o-razdele-imuschestva": "Иск о разделе имущества",
  "zayavlenie-ob-opredelenii-mesta-zhitelstva-rebenka": "Заявление об определении места жительства ребенка",
  "zayavlenie-ob-ustanovlenii-poryadka-obscheniya-s-rebenkom": "Заявление об установлении порядка общения с ребенком",
  "isk-o-lishenii-roditelskih-prav": "Иск о лишении родительских прав",
  "pretenziya-v-upravlyayuschuyu-kompaniyu": "Претензия в управляющую компанию",
  "zhaloba-v-zhilischnuyu-inspekciyu": "Жалоба в жилищную инспекцию",
  "akt-o-zalive-kvartiry": "Акт о заливе квартиры",
  "pretenziya-o-pereraschete-kommunalnyh-uslug": "Претензия о перерасчете коммунальных услуг",
  "zhaloba-v-rospotrebnadzor": "Жалоба в Роспотребнадзор",
  "isk-o-vozmeschenii-uscherba-posle-zaliva": "Иск о возмещении ущерба после залива",
  "zayavlenie-o-prinyatii-nasledstva": "Заявление о принятии наследства",
  "zayavlenie-o-vosstanovlenii-sroka-prinyatiya-nasledstva": "Заявление о восстановлении срока принятия наследства",
  "isk-o-priznanii-prava-na-nasledstvo": "Иск о признании права на наследство",
  "zayavlenie-ob-otkaze-ot-nasledstva": "Заявление об отказе от наследства",
  "isk-ob-osparivanii-zaveschaniya": "Иск об оспаривании завещания",
  "pretenziya-prodavcu-o-vozvrate-deneg": "Претензия продавцу о возврате денег",
  "pretenziya-po-nekachestvennoy-usluge": "Претензия по некачественной услуге",
  "isk-o-zaschite-prav-potrebitelya": "Иск о защите прав потребителя",
  "zayavlenie-o-vozvrate-tovara": "Заявление о возврате товара",
  "iskovoe-zayavlenie": "Исковое заявление",
  "vozrazhenie-na-isk": "Возражение на иск",
  "apellyacionnaya-zhaloba": "Апелляционная жалоба",
  "hodataystvo-o-vosstanovlenii-sroka": "Ходатайство о восстановлении срока",
  "hodataystvo-ob-otlozhenii-sudebnogo-zasedaniya": "Ходатайство об отложении судебного заседания",
  "zayavlenie-o-vydache-ispolnitelnogo-lista": "Заявление о выдаче исполнительного листа",
  "zhaloba-na-postanovlenie-gibdd": "Жалоба на постановление ГИБДД",
  "pretenziya-v-strahovuyu-kompaniyu": "Претензия в страховую компанию",
  "zhaloba-na-otkaz-v-medicinskoy-pomoschi": "Жалоба на отказ в медицинской помощи",
  "zayavlenie-o-vydache-medicinskih-dokumentov": "Заявление о выдаче медицинских документов",
  "zhaloba-na-otkaz-v-socialnoy-vyplate": "Жалоба на отказ в социальной выплате",
  "zayavlenie-o-pereraschete-pensii": "Заявление о перерасчете пенсии",
  "zayavlenie-o-prodlenii-registracii": "Заявление о продлении регистрации",
  "zhaloba-na-reshenie-prizyvnoy-komissii": "Жалоба на решение призывной комиссии",
  "raport-voennosluzhaschego": "Рапорт военнослужащего",
  "pretenziya-kontragentu-po-dogovoru": "Претензия контрагенту по договору",
  "zayavlenie-v-policiyu": "Заявление в полицию",
  "zhaloba-na-deystviya-policii": "Жалоба на действия полиции"
};

const categoryFallbackDocuments: Record<string, string[]> = {
  dolgi: [
    "vozrazhenie-na-sudebnyy-prikaz",
    "zayavlenie-o-vosstanovlenii-sroka-na-otmenu-sudebnogo-prikaza",
    "vozrazhenie-na-isk",
    "hodataystvo-o-primenenii-sroka-iskovoy-davnosti",
    "hodataystvo-ob-umenshenii-neustoyki-po-st-333-gk-rf",
    "zayavlenie-o-rassrochke-ispolneniya-resheniya",
    "zhaloba-na-sudebnogo-pristava",
    "zhaloba-na-kollektorov-v-fssp"
  ],
  pristavy: ["zhaloba-na-sudebnogo-pristava", "zayavlenie-o-snyatii-aresta-so-scheta"],
  rabota: ["zhaloba-v-trudovuyu-inspekciyu", "pretenziya-rabotodatelyu-o-vyplate-zarplaty"],
  semya: ["zayavlenie-o-vzyskanii-alimentov", "isk-o-rastorzhenii-braka"],
  zhkh: ["pretenziya-v-upravlyayuschuyu-kompaniyu", "zhaloba-v-zhilischnuyu-inspekciyu"],
  nasledstvo: ["zayavlenie-o-prinyatii-nasledstva", "isk-o-priznanii-prava-na-nasledstvo"],
  nedvizhimost: ["iskovoe-zayavlenie", "pretenziya-kontragentu-po-dogovoru"],
  "pokupki-uslugi": ["pretenziya-prodavcu-o-vozvrate-deneg", "isk-o-zaschite-prav-potrebitelya"],
  "avto-shtrafy": ["zhaloba-na-postanovlenie-gibdd", "pretenziya-v-strahovuyu-kompaniyu"],
  sudy: ["vozrazhenie-na-isk", "apellyacionnaya-zhaloba"],
  medicina: ["zhaloba-na-otkaz-v-medicinskoy-pomoschi", "zayavlenie-o-vydache-medicinskih-dokumentov"],
  "socialnye-vyplaty": ["zhaloba-na-otkaz-v-socialnoy-vyplate", "zayavlenie-o-pereraschete-pensii"],
  migraciya: ["zayavlenie-o-prodlenii-registracii", "zhaloba-v-prokuraturu"],
  "voinskiy-uchet": ["zhaloba-na-reshenie-prizyvnoy-komissii", "raport-voennosluzhaschego"],
  biznes: ["pretenziya-kontragentu-po-dogovoru", "iskovoe-zayavlenie"],
  "ugolovnye-riski": ["zayavlenie-v-policiyu", "zhaloba-na-deystviya-policii"]
};

const categoryRisk: Record<string, LegalProblemRiskLevel> = {
  "semya-i-deti": "medium",
  "zhile-nedvizhimost-i-zemlya": "high",
  "voennaya-sluzhba-mobilizaciya-i-svo": "high",
  "rabota-zarplata-i-trudovye-prava": "medium",
  "dolgi-kredity-i-pristavy": "medium",
  "migraciya-grazhdanstvo-i-vezd-v-rf": "high",
  "pokupki-uslugi-i-zashchita-potrebiteley": "medium",
  "avto-dtp-shtrafy-i-transport": "medium",
  "sud-zhaloby-i-zashchita-prav": "high",
  "pensii-posobiya-i-socialnye-vyplaty": "medium",
  "zhkh-i-kommunalnye-uslugi": "medium",
  "medicina-i-zdorove": "high",
  obrazovanie: "medium",
  "biznes-ip-i-samozanyatye": "medium",
  "ugolovnye-i-administrativnye-riski": "high",
  "dokumenty-personalnye-dannye-i-gosuslugi": "medium",
  dolgi: "medium",
  pristavy: "high",
  rabota: "medium",
  semya: "medium",
  zhkh: "medium",
  nasledstvo: "medium",
  nedvizhimost: "high",
  "pokupki-uslugi": "medium",
  "avto-shtrafy": "medium",
  sudy: "high",
  medicina: "high",
  "socialnye-vyplaty": "medium",
  migraciya: "high",
  "voinskiy-uchet": "high",
  biznes: "medium",
  "ugolovnye-riski": "high"
};

function getCategoryFallbackDocuments(categorySlug: string, originalCategorySlug?: string) {
  const direct = categoryFallbackDocuments[categorySlug] ?? (originalCategorySlug ? categoryFallbackDocuments[originalCategorySlug] : undefined);
  if (direct?.length) return direct;

  for (const legacySlug of overrideCategoryAliases[categorySlug] ?? []) {
    const documents = categoryFallbackDocuments[legacySlug];
    if (documents?.length) return documents;
  }

  return [];
}

const urgentCategories = new Set([
  "pristavy",
  "sudy",
  "migraciya",
  "voinskiy-uchet",
  "ugolovnye-riski",
  "voennaya-sluzhba-mobilizaciya-i-svo",
  "migraciya-grazhdanstvo-i-vezd-v-rf",
  "sud-zhaloby-i-zashchita-prav",
  "ugolovnye-i-administrativnye-riski"
]);

const overrideCategoryAliases: Record<string, string[]> = {
  "semya-i-deti": ["semya"],
  "zhile-nedvizhimost-i-zemlya": ["nedvizhimost"],
  "voennaya-sluzhba-mobilizaciya-i-svo": ["voinskiy-uchet"],
  "rabota-zarplata-i-trudovye-prava": ["rabota"],
  "dolgi-kredity-i-pristavy": ["dolgi", "pristavy"],
  "migraciya-grazhdanstvo-i-vezd-v-rf": ["migraciya"],
  "pokupki-uslugi-i-zashchita-potrebiteley": ["pokupki-uslugi"],
  "avto-dtp-shtrafy-i-transport": ["avto-shtrafy"],
  "sud-zhaloby-i-zashchita-prav": ["sudy"],
  "pensii-posobiya-i-socialnye-vyplaty": ["socialnye-vyplaty"],
  "zhkh-i-kommunalnye-uslugi": ["zhkh"],
  "medicina-i-zdorove": ["medicina"],
  "biznes-ip-i-samozanyatye": ["biznes"],
  "ugolovnye-i-administrativnye-riski": ["ugolovnye-riski"]
};

const problemLegalReferenceKeys: Partial<Record<string, LegalReferenceKey[]>> = {
  "sudebnyy-prikaz": ["gpk_128", "gpk_129", "gpk_108", "gpk_112"],
  "otmenit-sudebnyy-prikaz": ["gpk_128", "gpk_129", "gpk_108", "gpk_112"],
  "propuschen-srok-obzhalovaniya": ["gpk_108", "gpk_112"],
  "bank-podal-v-sud-po-kreditu": ["gpk_131", "gpk_132", "gpk_108", "gpk_112"],
  "kollektory-ugrozhayut": ["fz230_6", "fz230_7"],
  "mfo-trebuet-vernut-dolg": ["gk_333", "gk_196", "gk_199"],
  "ogromnye-procenty-po-dolgu": ["gk_333"],
  "srok-davnosti-po-dolgu": ["gk_196", "gk_199"],
  "bank-spisal-dengi-bez-soglasiya": ["fz229_50", "fz229_64", "fz229_99", "fz229_121"],
  "prodali-dolg-kollektoram": ["fz230_6", "fz230_7"],
  "ne-vyplatili-zarplatu": ["tk_22", "tk_136", "tk_236", "tk_392"],
  "zaderzhivayut-zarplatu": ["tk_22", "tk_136", "tk_236", "tk_392"],
  "nezakonno-uvolili": ["tk_84_1", "tk_392"],
  "rabotali-bez-dogovora": ["tk_22", "tk_62", "tk_392"],
  "razvod": ["sk_17", "sk_21", "sk_22", "sk_23", "sk_24", "sk_80", "gpk_23", "gpk_28", "gpk_29", "gpk_131", "gpk_132", "nk_333_19", "nk_333_26"],
  "ustanovit-otcovstvo": ["sk_80", "sk_83"],
  "zatopili-sosedi": ["gk_15", "gk_1064", "zhk_161"],
  "uk-ne-delaet-remont": ["zhk_161", "gk_15"],
  "vernut-dengi-za-tovar": ["zpp_18", "zpp_22"],
  "tovar-slomalsya-na-garantii": ["zpp_18", "zpp_22"],
  "nekachestvennaya-usluga": ["zpp_29", "zpp_31"],
  "ne-dostavili-oplachennyy-tovar": ["zpp_18", "zpp_22"],
  "marketpleys-otkazal-v-vozvrate": ["zpp_18", "zpp_22"],
  "servisnyy-centr-zatyagivaet-remont": ["zpp_18", "zpp_22"],
  "spisali-dengi-pristavy": ["fz229_50", "fz229_64", "fz229_99", "fz229_121"],
  "arestovali-zarplatnuyu-kartu": ["fz229_50", "fz229_64", "fz229_99", "fz229_121"],
  "uderzhivayut-bolshe-polozhennogo": ["fz229_50", "fz229_99", "fz229_121"],
  "pristavy-zablokirovali-schet": ["fz229_50", "fz229_64", "fz229_121"],
  "ne-snimayut-arest-posle-oplaty": ["fz229_50", "fz229_64", "fz229_121"],
  "pristav-bezdeystvuet": ["fz229_50", "fz229_121"],
  "obzhalovat-postanovlenie-pristava": ["fz229_50", "fz229_121"],
  "vstuplenie-v-nasledstvo": ["gk_1153", "gk_1154"],
  "propuschen-srok-nasledstva": ["gk_1154", "gk_1155"],
  "vyzvali-na-dopros": ["const_51", "upk_46", "upk_47", "upk_56"]
};

const specs: LegalProblemSpec[] = ([
  // Долги и кредиты
  ["sudebnyy-prikaz", "dolgi", "Пришёл судебный приказ по долгу", "Судебный приказ по долгу", "Проверьте срок отмены и подготовьте возражение.", ["vozrazhenie-na-sudebnyy-prikaz", "zayavlenie-o-vosstanovlenii-sroka-na-otmenu-sudebnogo-prikaza", "zhaloba-na-sudebnogo-pristava"]],
  ["bank-podal-v-sud-po-kreditu", "dolgi", "Банк подал в суд по кредиту", "Банк подал в суд", "Проверьте иск, расчёт долга, срок давности и подготовьте возражения.", ["vozrazhenie-na-isk", "hodataystvo-o-primenenii-sroka-iskovoy-davnosti", "hodataystvo-ob-umenshenii-neustoyki-po-st-333-gk-rf", "zayavlenie-o-rassrochke-ispolneniya-resheniya"]],
  ["kollektory-ugrozhayut", "dolgi", "Коллекторы угрожают", "Угрозы коллекторов", "Зафиксируйте звонки и сообщения, проверьте законность требований и подайте жалобу.", ["zhaloba-na-kollektorov-v-fssp", "zhaloba-v-bank-rossii"], "high"],
  ["mfo-trebuet-vernut-dolg", "dolgi", "МФО требует вернуть долг", "Долг перед МФО", "Проверьте договор, проценты, платежи и ограничения по начислениям.", ["vozrazhenie-na-isk", "hodataystvo-ob-umenshenii-neustoyki-po-st-333-gk-rf", "zhaloba-v-bank-rossii", "zayavlenie-o-rassrochke-ispolneniya-resheniya"]],
  ["ne-mozhete-platit-kredit", "dolgi", "Не можете платить кредит", "Нет возможности платить кредит", "Оцените риски суда, приказа, реструктуризации или банкротства.", ["zayavlenie-o-rassrochke-ispolneniya-resheniya", "pretenziya-kontragentu-po-dogovoru"]],
  ["ogromnye-procenty-po-dolgu", "dolgi", "Начислили огромные проценты", "Большие проценты по долгу", "Проверьте договор, период просрочки и возможность снизить неустойку.", ["hodataystvo-ob-umenshenii-neustoyki-po-st-333-gk-rf", "vozrazhenie-na-isk"]],
  ["srok-davnosti-po-dolgu", "dolgi", "Прошёл срок давности по долгу", "Срок давности по долгу", "Проверьте даты платежей и заявите о сроке давности в суде.", ["hodataystvo-o-primenenii-sroka-iskovoy-davnosti", "vozrazhenie-na-isk"]],
  ["bank-spisal-dengi-bez-soglasiya", "dolgi", "Банк списал деньги без согласия", "Банк списал деньги", "Запросите основание списания и подготовьте претензию, жалобу или заявление приставу.", ["pretenziya-v-bank-o-vozvrate-spisannyh-deneg", "zhaloba-v-bank-rossii", "zhaloba-na-sudebnogo-pristava", "zayavlenie-o-vozvrate-izlishne-uderzhannyh-deneg"]],
  ["prodali-dolg-kollektoram", "dolgi", "Банк продал долг коллекторам", "Долг продали коллекторам", "Проверьте уведомление о переуступке, полномочия нового кредитора и расчёт долга.", ["zhaloba-na-kollektorov-v-fssp", "vozrazhenie-na-isk", "zhaloba-v-bank-rossii"]],
  ["restrukturizaciya-dolga", "dolgi", "Реструктуризация долга по кредиту", "Реструктуризация долга", "Подготовьте документы о доходах и предложите кредитору реалистичный график платежей.", ["zayavlenie-o-rassrochke-ispolneniya-resheniya", "pretenziya-kontragentu-po-dogovoru"]],

  // Приставы
  ["spisali-dengi-pristavy", "pristavy", "Что делать, если приставы списали деньги с карты", "Списание приставами", "Нужно получить постановление, проверить основание взыскания и при ошибке подать заявление приставу, жалобу или документ об отмене судебного акта.", ["zhaloba-na-sudebnogo-pristava", "zayavlenie-o-vozvrate-izlishne-uderzhannyh-deneg"], "high"],
  ["arestovali-zarplatnuyu-kartu", "pristavy", "Что делать, если приставы арестовали зарплатную карту", "Арест зарплатной карты", "Подайте приставу заявление о сохранении прожиточного минимума и документы, подтверждающие зарплатный характер счета.", ["zayavlenie-o-snyatii-aresta-so-scheta", "zhaloba-na-sudebnogo-pristava"], "high"],
  ["uderzhivayut-bolshe-polozhennogo", "pristavy", "Что делать, если приставы удерживают больше положенного", "Большое удержание", "Проверьте процент удержаний, вид дохода и основания взыскания, затем требуйте перерасчет или возврат переплаты.", ["zayavlenie-o-vozvrate-izlishne-uderzhannyh-deneg", "zhaloba-na-sudebnogo-pristava"], "high"],
  ["pristavy-zablokirovali-schet", "pristavy", "Как снять блокировку счета у приставов", "Блокировка счета", "Уточните производство, основание ареста и статус долга, затем подайте заявление о снятии ареста или ограничении взыскания.", ["zayavlenie-o-snyatii-aresta-so-scheta", "zhaloba-na-sudebnogo-pristava"], "high"],
  ["arest-imuschestva-pristavami", "pristavy", "Что делать, если приставы арестовали имущество", "Арест имущества", "Нужно проверить законность ареста, принадлежность имущества и возможность исключить имущество из описи.", ["zhaloba-na-sudebnogo-pristava", "iskovoe-zayavlenie"], "high"],
  ["ne-snimayut-arest-posle-oplaty", "pristavy", "Что делать, если приставы не снимают арест после оплаты долга", "Не снимают арест", "Получите подтверждение оплаты и направьте приставу заявление о завершении производства или снятии ограничений.", ["zayavlenie-o-snyatii-aresta-so-scheta", "zhaloba-na-sudebnogo-pristava"]],
  ["pristav-bezdeystvuet", "pristavy", "Как обжаловать бездействие судебного пристава", "Бездействие пристава", "Зафиксируйте обращения и сроки, затем подайте жалобу старшему приставу или административное заявление в суд.", ["zhaloba-na-sudebnogo-pristava", "iskovoe-zayavlenie"]],
  ["obzhalovat-postanovlenie-pristava", "pristavy", "Как обжаловать постановление судебного пристава", "Жалоба на постановление пристава", "Нужно получить постановление, определить срок и основания обжалования, затем подать мотивированную жалобу.", ["zhaloba-na-sudebnogo-pristava", "hodataystvo-o-vosstanovlenii-sroka"]],
  ["zapret-vyezda-za-granicu", "pristavy", "Что делать, если приставы запретили выезд за границу", "Запрет выезда", "Проверьте сумму долга, постановление и возможность отмены ограничения после оплаты, рассрочки или ошибки в производстве.", ["zhaloba-na-sudebnogo-pristava", "zayavlenie-o-rassrochke-ispolneniya-resheniya"], "high"],
  ["vzyiskali-chuzhoy-dolg", "pristavy", "Что делать, если приставы взыскали чужой долг", "Чужой долг", "Соберите доказательства ошибки в личности или реквизитах и требуйте прекращения взыскания, возврата денег и исправления данных.", ["zayavlenie-o-vozvrate-izlishne-uderzhannyh-deneg", "zhaloba-na-sudebnogo-pristava"], "high"],

  // Работа
  ["ne-vyplatili-zarplatu", "rabota", "Что делать, если не выплатили зарплату при увольнении", "Невыплата зарплаты", "Нужно зафиксировать сумму долга, запросить расчетные документы и выбрать способ защиты: претензия, трудовая инспекция, прокуратура или суд.", ["pretenziya-rabotodatelyu-o-vyplate-zarplaty", "zhaloba-v-trudovuyu-inspekciyu"]],
  ["zaderzhivayut-zarplatu", "rabota", "Куда обращаться, если задерживают зарплату", "Задержка зарплаты", "Соберите расчетные документы и направьте письменное требование работодателю, затем жалобу или иск о взыскании долга и компенсации.", ["pretenziya-rabotodatelyu-o-vyplate-zarplaty", "isk-o-vzyskanii-zarabotnoy-platy"]],
  ["nezakonno-uvolili", "rabota", "Что делать, если незаконно уволили с работы", "Незаконное увольнение", "Нужно быстро получить приказ, трудовые документы и оценить срок для восстановления на работе через суд.", ["zayavlenie-o-vosstanovlenii-na-rabote", "zhaloba-v-trudovuyu-inspekciyu"], "high"],
  ["zastavlyayut-uvolitsya", "rabota", "Что делать, если заставляют уволиться по собственному желанию", "Принуждают к увольнению", "Не подписывайте заявление под давлением, фиксируйте угрозы и собирайте доказательства принуждения.", ["zhaloba-v-trudovuyu-inspekciyu", "zhaloba-v-prokuraturu-na-rabotodatelya"], "high"],
  ["sokratili-bez-vyplat", "rabota", "Что делать, если сократили без положенных выплат", "Сокращение без выплат", "Проверьте уведомление, приказ, расчет и основания сокращения, затем требуйте выплаты и компенсации.", ["pretenziya-rabotodatelyu-o-vyplate-zarplaty", "isk-o-vzyskanii-zarabotnoy-platy"]],
  ["ne-dayut-otpusk", "rabota", "Что делать, если работодатель не дает отпуск", "Не дают отпуск", "Проверьте график отпусков и основания отказа, затем направьте заявление и жалобу при нарушении.", ["zhaloba-v-trudovuyu-inspekciyu", "zhaloba-v-prokuraturu-na-rabotodatelya"]],
  ["ne-oplatili-bolnichnyy", "rabota", "Что делать, если не оплатили больничный", "Не оплатили больничный", "Нужно проверить электронный больничный, стаж, расчет и передачу сведений работодателем или фондом.", ["pretenziya-rabotodatelyu-o-vyplate-zarplaty", "zhaloba-v-trudovuyu-inspekciyu"]],
  ["ne-vydayut-trudovuyu-knizhku", "rabota", "Что делать, если не выдают трудовую книжку или документы", "Не выдают документы", "Запросите документы письменно и фиксируйте задержку, потому что за нее можно требовать компенсацию.", ["zayavlenie-o-vydache-trudovoy-knizhki", "zhaloba-v-trudovuyu-inspekciyu"]],
  ["rabotali-bez-dogovora", "rabota", "Как доказать работу без трудового договора", "Работа без договора", "Соберите переписку, графики, платежи, пропуска и показания, чтобы подтвердить трудовые отношения.", ["isk-o-vzyskanii-zarabotnoy-platy", "zhaloba-v-trudovuyu-inspekciyu"], "high"],
  ["rabotodatel-trebuet-vernut-dengi", "rabota", "Что делать, если работодатель требует вернуть деньги", "Работодатель требует деньги", "Проверьте основание требования, расчет и документы, не признавайте долг без проверки и готовьте письменную позицию.", ["vozrazhenie-na-isk", "pretenziya-rabotodatelyu-o-vyplate-zarplaty"]],
  ["prinuzhdayut-k-pererabotkam", "rabota", "Что делать, если принуждают к переработкам", "Принуждают к переработкам", "Фиксируйте график, задания и фактическое время работы, затем требуйте оплату или жалуйтесь на нарушение режима труда.", ["zhaloba-v-trudovuyu-inspekciyu", "pretenziya-rabotodatelyu-o-vyplate-zarplaty"]],
  ["diskriminaciya-na-rabote", "rabota", "Что делать при дискриминации на работе", "Дискриминация на работе", "Нужно фиксировать конкретные действия, решения работодателя и связь с запрещенным основанием различия.", ["zhaloba-v-trudovuyu-inspekciyu", "zhaloba-v-prokuraturu-na-rabotodatelya"], "high"],

  // Семья
  ["razvod", "semya-i-deti", "Развод", "Развод", "Развод оформляют через ЗАГС или через суд — зависит от наличия детей, согласия второго супруга и споров о детях или имуществе.", ["isk-o-rastorzhenii-braka", "zayavlenie-o-vzyskanii-alimentov", "zayavlenie-ob-opredelenii-mesta-zhitelstva-rebenka", "zayavlenie-ob-ustanovlenii-poryadka-obscheniya-s-rebenkom", "isk-o-razdele-imuschestva"], "medium"],
  ["razdel-imushchestva-suprugov", "semya-i-deti", "Раздел имущества супругов", "Раздел имущества", "Имущество, нажитое в браке, можно разделить по соглашению у нотариуса или через суд — независимо от того, на кого оно оформлено.", ["isk-o-razdele-imuschestva", "iskovoe-zayavlenie"], "high"],
  ["mesto-zhitelstva-rebenka", "semya", "Как определить место жительства ребенка после развода", "Место жительства ребенка", "Суд оценивает интересы ребенка, условия проживания, участие родителей и доказательства фактического ухода.", ["zayavlenie-ob-opredelenii-mesta-zhitelstva-rebenka", "iskovoe-zayavlenie"], "high"],
  ["poryadok-obscheniya-s-rebenkom", "semya", "Как установить порядок общения с ребенком", "Общение с ребенком", "Нужно предложить реалистичный график общения и доказать, что он отвечает интересам ребенка.", ["zayavlenie-ob-ustanovlenii-poryadka-obscheniya-s-rebenkom", "iskovoe-zayavlenie"]],
  ["lishenie-roditelskih-prav", "semya", "Когда можно лишить родительских прав", "Лишение родительских прав", "Это крайняя мера: нужны серьезные основания и доказательства, а в деле участвуют органы опеки и прокурор.", ["isk-o-lishenii-roditelskih-prav", "zhaloba-v-prokuraturu"], "high"],
  ["osporit-otcovstvo", "semya", "Как оспорить отцовство в суде", "Оспорить отцовство", "Потребуется иск, доказательства и часто генетическая экспертиза, а суд будет учитывать интересы ребенка.", ["iskovoe-zayavlenie", "zayavlenie-ob-opredelenii-mesta-zhitelstva-rebenka"], "high"],
  ["ustanovit-otcovstvo", "semya", "Как установить отцовство и взыскать алименты", "Установить отцовство", "Если отец не признает ребенка добровольно, вопрос решается через суд с доказательствами и возможной экспертизой.", ["iskovoe-zayavlenie", "zayavlenie-o-vzyskanii-alimentov"]],
  ["brachnyy-dogovor", "semya", "Когда нужен брачный договор и как его оформить", "Брачный договор", "Брачный договор помогает заранее определить имущественный режим, но должен быть нотариально удостоверен и не нарушать закон.", ["pretenziya-kontragentu-po-dogovoru", "isk-o-razdele-imuschestva"], "low"],
  ["suprug-skryvaet-imuschestvo", "semya", "Что делать, если супруг скрывает имущество при разводе", "Скрытое имущество", "Нужно собирать сведения о счетах, сделках и покупках, а в суде заявлять ходатайства об истребовании доказательств.", ["isk-o-razdele-imuschestva", "hodataystvo-o-vosstanovlenii-sroka"], "high"],

  // ЖКХ
  ["zatopili-sosedi", "zhkh", "Что делать, если вашу квартиру затопили соседи или управляющая компания", "Залив квартиры", "Нужно сразу зафиксировать залив актом, оценить ущерб и предъявить требование виновному лицу или управляющей компании.", ["akt-o-zalive-kvartiry", "isk-o-vozmeschenii-uscherba-posle-zaliva"]],
  ["uk-ne-delaet-remont", "zhkh", "Что делать, если управляющая компания не делает ремонт", "УК не делает ремонт", "Зафиксируйте дефекты, заявки и ответы УК, затем направьте претензию и жалобу в жилищную инспекцию.", ["pretenziya-v-upravlyayuschuyu-kompaniyu", "zhaloba-v-zhilischnuyu-inspekciyu"]],
  ["plesen-v-kvartire", "zhkh", "Что делать, если в квартире появилась плесень", "Плесень в квартире", "Нужно установить причину плесени, вызвать УК для акта и требовать устранения нарушения или возмещения ущерба.", ["pretenziya-v-upravlyayuschuyu-kompaniyu", "zhaloba-v-zhilischnuyu-inspekciyu"]],
  ["zavyshennye-nachisleniya-zhkh", "zhkh", "Как оспорить завышенные начисления за ЖКХ", "Завышенные начисления ЖКХ", "Запросите расчет, показания приборов и основания начислений, затем требуйте перерасчет и письменный ответ.", ["pretenziya-o-pereraschete-kommunalnyh-uslug", "zhaloba-v-zhilischnuyu-inspekciyu"]],
  ["ne-delayut-pereraschet", "zhkh", "Что делать, если не делают перерасчет коммунальных услуг", "Нет перерасчета", "Подайте заявление с подтверждающими документами и требуйте мотивированный отказ, который можно обжаловать.", ["pretenziya-o-pereraschete-kommunalnyh-uslug", "zhaloba-v-zhilischnuyu-inspekciyu"]],
  ["otklyuchili-vodu-ili-svet", "zhkh", "Что делать, если отключили воду или свет", "Отключили коммунальные услуги", "Проверьте законность отключения, уведомления и задолженность, затем требуйте восстановления услуги или перерасчета.", ["pretenziya-v-upravlyayuschuyu-kompaniyu", "zhaloba-v-zhilischnuyu-inspekciyu"], "high"],
  ["shumnye-sosedi", "zhkh", "Куда обращаться, если мешают шумные соседи", "Шумные соседи", "Фиксируйте нарушения тишины, вызывайте уполномоченные органы и собирайте доказательства повторяемости шума.", ["zayavlenie-v-policiyu", "zhaloba-v-zhilischnuyu-inspekciyu"]],
  ["nekachestvennoe-otoplenie", "zhkh", "Что делать, если в квартире плохое отопление", "Плохое отопление", "Замерьте температуру, вызовите аварийную службу и требуйте акт, перерасчет и устранение причины.", ["pretenziya-o-pereraschete-kommunalnyh-uslug", "pretenziya-v-upravlyayuschuyu-kompaniyu"]],
  ["protekaet-krysha", "zhkh", "Что делать, если протекает крыша в доме", "Протекает крыша", "Нужно зафиксировать протечку актом, подать заявку в УК и требовать ремонта общего имущества.", ["pretenziya-v-upravlyayuschuyu-kompaniyu", "isk-o-vozmeschenii-uscherba-posle-zaliva"]],
  ["avariynoe-zhile", "zhkh", "Что делать, если дом признан аварийным или требует расселения", "Аварийное жилье", "Проверьте статус дома, программу расселения и решения администрации, затем обжалуйте бездействие при нарушении сроков.", ["zhaloba-v-prokuraturu", "iskovoe-zayavlenie"], "high"],
  ["nezakonnoe-sobranie-sobstvennikov", "zhkh", "Как оспорить незаконное собрание собственников", "Собрание собственников", "Проверьте уведомление, кворум, протокол и сроки оспаривания решения общего собрания.", ["iskovoe-zayavlenie", "zhaloba-v-zhilischnuyu-inspekciyu"], "high"],
  ["navyazali-platnye-uslugi-uk", "zhkh", "Что делать, если УК навязала платные услуги", "Навязанные услуги УК", "Запросите основание начислений и решение собственников, затем требуйте исключить незаконные платежи.", ["pretenziya-o-pereraschete-kommunalnyh-uslug", "zhaloba-v-zhilischnuyu-inspekciyu"]],

  // Наследство
  ["vstuplenie-v-nasledstvo", "nasledstvo", "Как вступить в наследство и не пропустить срок", "Вступление в наследство", "Наследство обычно принимают через нотариуса в течение 6 месяцев, а при пропуске срока может потребоваться суд или согласие других наследников.", ["zayavlenie-o-prinyatii-nasledstva", "isk-o-priznanii-prava-na-nasledstvo"]],
  ["propuschen-srok-nasledstva", "nasledstvo", "Что делать, если пропущен срок вступления в наследство", "Пропущен срок наследства", "Нужно оценить причины пропуска, фактическое принятие наследства и возможность восстановить срок через суд.", ["zayavlenie-o-vosstanovlenii-sroka-prinyatiya-nasledstva", "isk-o-priznanii-prava-na-nasledstvo"], "high"],
  ["spor-mezhdu-naslednikami", "nasledstvo", "Как решить спор между наследниками", "Спор наследников", "Проверьте состав наследства, доли, завещание и документы, затем выбирайте переговоры, нотариальное соглашение или суд.", ["isk-o-priznanii-prava-na-nasledstvo", "iskovoe-zayavlenie"]],
  ["osporit-zaveschanie", "nasledstvo", "Как оспорить завещание", "Оспорить завещание", "Нужно доказать конкретное основание недействительности, а не просто несогласие с волей наследодателя.", ["isk-ob-osparivanii-zaveschaniya", "iskovoe-zayavlenie"], "high"],
  ["nasledstvo-bez-zaveschaniya", "nasledstvo", "Как делится наследство, если нет завещания", "Нет завещания", "Наследники призываются по очередям, поэтому важно подтвердить родство и проверить, кто уже подал заявление нотариусу.", ["zayavlenie-o-prinyatii-nasledstva", "isk-o-priznanii-prava-na-nasledstvo"]],
  ["nasledstvo-s-dolgami", "nasledstvo", "Что делать, если наследство оказалось с долгами", "Наследство с долгами", "Наследник отвечает по долгам в пределах стоимости принятого имущества, но размер и состав долгов нужно проверять.", ["zayavlenie-ob-otkaze-ot-nasledstva", "isk-o-priznanii-prava-na-nasledstvo"], "high"],
  ["obyazatelnaya-dolya-v-nasledstve", "nasledstvo", "Кто имеет право на обязательную долю в наследстве", "Обязательная доля", "Право на обязательную долю зависит от статуса наследника, возраста, нетрудоспособности и состава наследства.", ["isk-o-priznanii-prava-na-nasledstvo", "zayavlenie-o-prinyatii-nasledstva"]],
  ["naslednik-ne-oformlyaet-dokumenty", "nasledstvo", "Что делать, если наследник не оформляет документы", "Наследник не оформляет документы", "Нужно понять, мешает ли бездействие оформлению вашей доли, и при необходимости обращаться к нотариусу или в суд.", ["isk-o-priznanii-prava-na-nasledstvo", "zayavlenie-o-prinyatii-nasledstva"]],
  ["razdel-nasledstvennogo-imuschestva", "nasledstvo", "Как разделить наследственное имущество между наследниками", "Раздел наследства", "Раздел возможен соглашением или через суд, если наследники не договорились о долях и порядке пользования.", ["isk-o-priznanii-prava-na-nasledstvo", "iskovoe-zayavlenie"]],
  ["notarius-otkazal-v-nasledstve", "nasledstvo", "Что делать, если нотариус отказал в наследстве", "Отказ нотариуса", "Попросите письменное постановление об отказе, проверьте основание и готовьте жалобу или судебное заявление.", ["isk-o-priznanii-prava-na-nasledstvo", "zhaloba-v-prokuraturu"], "high"],

  // Недвижимость
  ["pokupka-kvartiry-s-riskami", "nedvizhimost", "Как проверить квартиру перед покупкой", "Проверка квартиры", "Проверьте ЕГРН, основание права, долги, прописанных лиц, судебные споры и риски оспаривания сделки.", ["pretenziya-kontragentu-po-dogovoru", "iskovoe-zayavlenie"], "high"],
  ["pokupka-kvartiry-s-matkapitalom", "nedvizhimost", "Как проверить квартиру с материнским капиталом перед покупкой", "Квартира с маткапиталом", "Нужно проверить выделение долей детям, согласие органов опеки и цепочку сделок, иначе есть риск оспаривания покупки.", ["isk-o-razdele-imuschestva", "iskovoe-zayavlenie"], "high"],
  ["prodavec-ne-osvobozhdaet-kvartiru", "nedvizhimost", "Что делать, если продавец не освобождает квартиру после сделки", "Продавец не выезжает", "Проверьте условия договора, акт приема-передачи и сроки освобождения, затем направьте требование или иск.", ["pretenziya-kontragentu-po-dogovoru", "iskovoe-zayavlenie"]],
  ["arendodatel-ne-vozvraschaet-zalog", "nedvizhimost", "Как вернуть залог за аренду квартиры", "Не возвращают залог", "Соберите договор, акт возврата, переписку и доказательства состояния квартиры, затем направьте претензию.", ["pretenziya-kontragentu-po-dogovoru", "iskovoe-zayavlenie"]],
  ["arendator-ne-platit", "nedvizhimost", "Что делать, если арендатор не платит за квартиру", "Арендатор не платит", "Проверьте договор, задолженность и порядок расторжения, затем направьте требование и готовьте иск при отказе.", ["pretenziya-kontragentu-po-dogovoru", "iskovoe-zayavlenie"]],
  ["vyselenie-iz-kvartiry", "nedvizhimost", "Когда можно выселить человека из квартиры", "Выселение из квартиры", "Основания выселения зависят от права проживания, регистрации, договора и статуса жилья.", ["iskovoe-zayavlenie", "vozrazhenie-na-isk"], "high"],
  ["spor-o-dole-v-kvartire", "nedvizhimost", "Как решить спор о доле в квартире", "Спор о доле", "Нужно проверить документы о собственности, порядок пользования и возможность выдела, продажи или компенсации.", ["iskovoe-zayavlenie", "isk-o-razdele-imuschestva"]],
  ["nezakonnaya-pereplanirovka", "nedvizhimost", "Что делать с незаконной перепланировкой квартиры", "Незаконная перепланировка", "Проверьте технические документы и возможность узаконить перепланировку либо устранить нарушение.", ["iskovoe-zayavlenie", "zhaloba-v-zhilischnuyu-inspekciyu"]],
  ["oshibka-v-egrn", "nedvizhimost", "Как исправить ошибку в ЕГРН", "Ошибка в ЕГРН", "Нужно определить, ошибка техническая или реестровая, собрать документы и обратиться в Росреестр или суд.", ["iskovoe-zayavlenie", "zhaloba-v-prokuraturu"]],
  ["sosed-zahvatil-uchastok", "nedvizhimost", "Что делать, если сосед захватил часть участка", "Захват участка", "Проверьте межевание, границы участка и документы, затем требуйте устранить нарушение добровольно или через суд.", ["iskovoe-zayavlenie", "pretenziya-kontragentu-po-dogovoru"], "high"],
  ["rastorzhenie-dogovora-kupli-prodazhi", "nedvizhimost", "Как расторгнуть договор купли-продажи недвижимости", "Расторжение сделки", "Проверьте основания расторжения, нарушения договора и последствия возврата денег или имущества.", ["pretenziya-kontragentu-po-dogovoru", "iskovoe-zayavlenie"], "high"],

  // Покупки и услуги
  ["vernut-dengi-za-tovar", "pokupki-uslugi", "Как вернуть деньги за товар или услугу ненадлежащего качества", "Возврат денег", "Начните с письменной претензии: укажите недостаток, требование, срок ответа и приложите доказательства покупки.", ["pretenziya-prodavcu-o-vozvrate-deneg", "isk-o-zaschite-prav-potrebitelya"]],
  ["tovar-slomalsya-na-garantii", "pokupki-uslugi", "Что делать, если товар сломался на гарантии", "Гарантийный товар", "Проверьте гарантийный срок, характер недостатка и требования к продавцу или сервисному центру.", ["pretenziya-prodavcu-o-vozvrate-deneg", "zayavlenie-o-vozvrate-tovara"]],
  ["nekachestvennaya-usluga", "pokupki-uslugi", "Что делать, если услуга оказана некачественно", "Некачественная услуга", "Зафиксируйте недостатки услуги, направьте претензию и требуйте устранения, уменьшения цены или возврата денег.", ["pretenziya-po-nekachestvennoy-usluge", "isk-o-zaschite-prav-potrebitelya"]],
  ["marketpleys-otkazal-v-vozvrate", "pokupki-uslugi", "Что делать, если маркетплейс отказал в возврате", "Отказ маркетплейса", "Проверьте правила площадки, продавца, сроки возврата и зафиксируйте переписку до претензии.", ["pretenziya-prodavcu-o-vozvrate-deneg", "zhaloba-v-rospotrebnadzor"]],
  ["obmanuli-pri-pokupke", "pokupki-uslugi", "Что делать, если обманули при покупке товара или услуги", "Обман при покупке", "Соберите доказательства оплаты, переписки и обещаний продавца, затем выберите претензию, жалобу или заявление.", ["pretenziya-prodavcu-o-vozvrate-deneg", "zayavlenie-v-policiyu"], "high"],
  ["ne-dostavili-oplachennyy-tovar", "pokupki-uslugi", "Что делать, если не доставили оплаченный товар", "Товар не доставили", "Проверьте срок доставки и данные продавца, направьте требование о передаче товара или возврате денег.", ["pretenziya-prodavcu-o-vozvrate-deneg", "zhaloba-v-rospotrebnadzor"]],
  ["navyazali-dopolnitelnuyu-uslugu", "pokupki-uslugi", "Как отказаться от навязанной дополнительной услуги", "Навязанная услуга", "Проверьте, было ли отдельное согласие, и требуйте возврат денег за услугу, которую навязали без реального выбора.", ["pretenziya-po-nekachestvennoy-usluge", "isk-o-zaschite-prav-potrebitelya"]],
  ["turoperator-ne-vozvraschaet-dengi", "pokupki-uslugi", "Что делать, если туроператор не возвращает деньги", "Возврат от туроператора", "Проверьте договор, причину отмены тура и сроки возврата, затем направьте претензию туроператору или агенту.", ["pretenziya-po-nekachestvennoy-usluge", "isk-o-zaschite-prav-potrebitelya"]],
  ["servisnyy-centr-zatyagivaet-remont", "pokupki-uslugi", "Что делать, если сервисный центр затягивает ремонт", "Затягивают ремонт", "Проверьте сроки ремонта, акт приема товара и гарантийные условия, затем требуйте возврат денег или неустойку.", ["pretenziya-prodavcu-o-vozvrate-deneg", "zayavlenie-o-vozvrate-tovara"]],
  ["prodavec-ne-prinimaet-pretenziyu", "pokupki-uslugi", "Что делать, если продавец отказывается принимать претензию", "Не принимают претензию", "Направьте претензию способом, который подтверждает отправку и содержание: почтой, через кабинет или курьером.", ["pretenziya-prodavcu-o-vozvrate-deneg", "zhaloba-v-rospotrebnadzor"]],

  // Авто и штрафы
  ["prishol-shtraf-gibdd", "avto-shtrafy", "Что делать, если пришел штраф ГИБДД", "Штраф ГИБДД", "Проверьте дату постановления, основание штрафа и доказательства, чтобы понять, платить или обжаловать.", ["zhaloba-na-postanovlenie-gibdd", "hodataystvo-o-vosstanovlenii-sroka"]],
  ["osporit-shtraf-gibdd", "avto-shtrafy", "Как оспорить штраф ГИБДД или постановление по ДТП", "Оспорить штраф", "Нужно проверить срок обжалования, получить постановление и собрать доказательства ошибки: фото, видео, схему, объяснения и документы.", ["zhaloba-na-postanovlenie-gibdd", "hodataystvo-o-vosstanovlenii-sroka"]],
  ["dtp-bez-strahovki", "avto-shtrafy", "Что делать при ДТП без страховки", "ДТП без страховки", "Нужно зафиксировать обстоятельства ДТП, ущерб и данные участников, потому что взыскание может идти напрямую с виновника.", ["iskovoe-zayavlenie", "pretenziya-v-strahovuyu-kompaniyu"], "high"],
  ["strahovaya-zanizila-vyplatu", "avto-shtrafy", "Что делать, если страховая занизила выплату по ДТП", "Занижена выплата", "Получите расчет страховой, независимую оценку и направьте претензию до обращения в суд.", ["pretenziya-v-strahovuyu-kompaniyu", "iskovoe-zayavlenie"]],
  ["vinovnik-dtp-ne-platit", "avto-shtrafy", "Как взыскать ущерб, если виновник ДТП не платит", "Виновник ДТП не платит", "Соберите документы о ДТП и оценку ущерба, затем направьте требование виновнику и готовьте иск.", ["iskovoe-zayavlenie", "pretenziya-kontragentu-po-dogovoru"]],
  ["lishayut-voditelskih-prav", "avto-shtrafy", "Что делать, если лишают водительских прав", "Лишение прав", "Проверьте протокол, доказательства, сроки и процессуальные нарушения, потому что защита строится на деталях дела.", ["zhaloba-na-postanovlenie-gibdd", "vozrazhenie-na-isk"], "high"],
  ["evakuirovali-avtomobil", "avto-shtrafy", "Что делать, если автомобиль эвакуировали", "Эвакуация авто", "Проверьте основание эвакуации, постановление и расходы, затем решайте вопрос возврата и обжалования.", ["zhaloba-na-postanovlenie-gibdd", "zayavlenie-o-vozvrate-izlishne-uderzhannyh-deneg"]],
  ["kupili-avto-s-zapretom", "avto-shtrafy", "Что делать, если купили автомобиль с запретом регистрации", "Авто с запретом", "Проверьте основание запрета, продавца и договор, затем требуйте снятия запрета или расторжения сделки.", ["pretenziya-kontragentu-po-dogovoru", "iskovoe-zayavlenie"], "high"],
  ["skrytye-defekty-avtomobilya", "avto-shtrafy", "Что делать, если у автомобиля скрытые дефекты после покупки", "Скрытые дефекты авто", "Зафиксируйте дефекты экспертизой и проверьте, кто продавец: автосалон, предприниматель или частное лицо.", ["pretenziya-prodavcu-o-vozvrate-deneg", "isk-o-zaschite-prav-potrebitelya"]],
  ["avtosalon-navyazal-uslugi", "avto-shtrafy", "Как вернуть деньги за навязанные услуги автосалона", "Навязанные услуги автосалона", "Проверьте договоры и согласия, затем направьте отказ от дополнительных услуг и требование о возврате денег.", ["pretenziya-prodavcu-o-vozvrate-deneg", "isk-o-zaschite-prav-potrebitelya"]],

  // Суды
  ["povestka-v-sud", "sudy", "Что делать, если получили повестку в суд", "Повестка в суд", "Нужно понять статус в деле, предмет спора и сроки подачи документов, чтобы не пропустить защиту.", ["vozrazhenie-na-isk", "hodataystvo-ob-otlozhenii-sudebnogo-zasedaniya"], "high"],
  ["nuzhno-podat-isk", "sudy", "Как правильно подать иск в суд", "Подать иск", "Определите ответчика, требования, подсудность, доказательства и госпошлину до подачи иска.", ["iskovoe-zayavlenie", "hodataystvo-o-vosstanovlenii-sroka"]],
  ["podat-vozrazheniya-v-sud", "sudy", "Как подготовить возражения в суд по гражданскому делу", "Возражения в суд", "Возражения должны отвечать на требования истца, ссылаться на факты и доказательства, а не просто выражать несогласие.", ["vozrazhenie-na-isk", "hodataystvo-ob-otlozhenii-sudebnogo-zasedaniya"]],
  ["propuschen-srok-obzhalovaniya", "sudy", "Что делать, если пропущен срок обжалования", "Пропущен срок", "Нужно оценить уважительность причины пропуска и подать ходатайство о восстановлении срока вместе с жалобой.", ["hodataystvo-o-vosstanovlenii-sroka", "apellyacionnaya-zhaloba"], "high"],
  ["podat-apellyaciyu", "sudy", "Как подать апелляционную жалобу на решение суда", "Апелляция", "Проверьте срок, мотивированное решение, ошибки суда и подготовьте жалобу с конкретными доводами.", ["apellyacionnaya-zhaloba", "hodataystvo-o-vosstanovlenii-sroka"], "high"],
  ["zaochnoe-reshenie-suda", "sudy", "Как отменить заочное решение суда", "Заочное решение", "Нужно проверить дату получения решения и подать заявление об отмене или апелляцию в зависимости от стадии.", ["hodataystvo-o-vosstanovlenii-sroka", "apellyacionnaya-zhaloba"], "high"],
  ["vosstanovit-srok-v-sude", "sudy", "Как восстановить пропущенный процессуальный срок", "Восстановить срок", "Суд восстановит срок только при уважительной причине, подтвержденной документами.", ["hodataystvo-o-vosstanovlenii-sroka", "apellyacionnaya-zhaloba"]],
  ["poluchit-ispolnitelnyy-list", "sudy", "Как получить исполнительный лист после суда", "Исполнительный лист", "После вступления решения в силу нужно подать заявление о выдаче исполнительного листа и проверить правильность реквизитов.", ["zayavlenie-o-vydache-ispolnitelnogo-lista", "zhaloba-na-sudebnogo-pristava"]],
  ["otmenit-sudebnyy-prikaz", "sudy", "Как отменить судебный приказ через суд", "Отменить судебный приказ", "Подайте возражения в суд, вынесший приказ, и приложите ходатайство о восстановлении срока при необходимости.", ["vozrazhenie-na-sudebnyy-prikaz", "zayavlenie-o-vosstanovlenii-sroka-na-otmenu-sudebnogo-prikaza"], "high"],
  ["mirovoe-soglashenie", "sudy", "Когда стоит заключать мировое соглашение в суде", "Мировое соглашение", "Нужно проверить условия, последствия и исполнимость соглашения, потому что после утверждения оно имеет силу судебного акта.", ["iskovoe-zayavlenie", "zayavlenie-o-rassrochke-ispolneniya-resheniya"]],

  // Медицина
  ["nekachestvennoe-lechenie", "medicina", "Что делать при некачественном лечении или врачебной ошибке", "Некачественное лечение", "Сначала получите медицинские документы и зафиксируйте последствия, затем оцените жалобу, экспертизу и возможное требование о возмещении вреда.", ["zhaloba-na-otkaz-v-medicinskoy-pomoschi", "zayavlenie-o-vydache-medicinskih-dokumentov"], "high"],
  ["otkazali-v-medicinskoy-pomoschi", "medicina", "Что делать, если отказали в медицинской помощи", "Отказ в помощи", "Зафиксируйте отказ, получите письменные документы и обращайтесь к руководству медорганизации или в надзорный орган.", ["zhaloba-na-otkaz-v-medicinskoy-pomoschi", "zayavlenie-o-vydache-medicinskih-dokumentov"], "high"],
  ["vrachebnaya-oshibka", "medicina", "Как доказать врачебную ошибку", "Врачебная ошибка", "Потребуются медицинские документы, заключения специалистов и доказательства связи между ошибкой и вредом.", ["zayavlenie-o-vydache-medicinskih-dokumentov", "iskovoe-zayavlenie"], "high"],
  ["ne-dayut-medicinskie-dokumenty", "medicina", "Что делать, если не дают медицинские документы", "Не дают меддокументы", "Подайте письменное заявление о выдаче копий, зафиксируйте отказ и жалуйтесь при нарушении срока.", ["zayavlenie-o-vydache-medicinskih-dokumentov", "zhaloba-na-otkaz-v-medicinskoy-pomoschi"]],
  ["navyazali-platnoe-lechenie", "medicina", "Что делать, если навязали платное лечение", "Навязали платное лечение", "Проверьте информированное согласие, договор и возможность получить услугу по ОМС, затем требуйте возврат денег при нарушении.", ["pretenziya-po-nekachestvennoy-usluge", "zhaloba-v-rospotrebnadzor"]],
  ["oshibka-v-diagnoze", "medicina", "Что делать, если врач поставил ошибочный диагноз", "Ошибка в диагнозе", "Получите документы, второе мнение и оцените, привела ли ошибка к вреду или лишним расходам.", ["zayavlenie-o-vydache-medicinskih-dokumentov", "zhaloba-na-otkaz-v-medicinskoy-pomoschi"], "high"],
  ["otkazali-v-oms", "medicina", "Что делать, если отказали в лечении по ОМС", "Отказ по ОМС", "Запросите письменный отказ и обращайтесь в страховую медицинскую организацию или территориальный фонд ОМС.", ["zhaloba-na-otkaz-v-medicinskoy-pomoschi", "zayavlenie-o-vydache-medicinskih-dokumentov"]],
  ["vred-zdorovyu-posle-lecheniya", "medicina", "Как взыскать вред здоровью после лечения", "Вред здоровью", "Нужно доказать нарушение, вред, расходы и причинную связь между лечением и последствиями.", ["iskovoe-zayavlenie", "zayavlenie-o-vydache-medicinskih-dokumentov"], "high"],
  ["ne-vydali-bolnichnyy", "medicina", "Что делать, если не выдали больничный лист", "Не выдали больничный", "Проверьте основания отказа, медицинские записи и порядок оформления электронного больничного.", ["zhaloba-na-otkaz-v-medicinskoy-pomoschi", "zayavlenie-o-vydache-medicinskih-dokumentov"]],
  ["vrachebnaya-tayna-narushena", "medicina", "Что делать, если нарушена врачебная тайна", "Врачебная тайна", "Зафиксируйте, какие сведения раскрыты, кому и каким способом, затем подайте жалобу или требование о компенсации.", ["zhaloba-na-otkaz-v-medicinskoy-pomoschi", "iskovoe-zayavlenie"], "high"],

  // Социальные выплаты
  ["otkaz-v-posobii", "socialnye-vyplaty", "Как обжаловать отказ в пособии, пенсии или социальной выплате", "Отказ в выплате", "Нужно получить письменный отказ, проверить основание и приложить документы, подтверждающие право на выплату.", ["zhaloba-na-otkaz-v-socialnoy-vyplate", "zayavlenie-o-pereraschete-pensii"]],
  ["ne-naznachili-pensiyu", "socialnye-vyplaty", "Что делать, если не назначили пенсию", "Не назначили пенсию", "Получите письменное решение, проверьте стаж, баллы и документы, затем подайте заявление о пересмотре или жалобу.", ["zayavlenie-o-pereraschete-pensii", "zhaloba-na-otkaz-v-socialnoy-vyplate"]],
  ["zaderzhivayut-vyplatu", "socialnye-vyplaty", "Куда обращаться, если задерживают социальную выплату", "Задержка выплаты", "Проверьте статус заявления и платежа, запросите письменное объяснение и фиксируйте дату обращения.", ["zhaloba-na-otkaz-v-socialnoy-vyplate", "zayavlenie-o-pereraschete-pensii"]],
  ["trebuyut-vernut-posobie", "socialnye-vyplaty", "Что делать, если требуют вернуть пособие", "Вернуть пособие", "Проверьте основание переплаты, расчет и вашу вину, потому что не каждую выплату можно взыскать обратно.", ["zhaloba-na-otkaz-v-socialnoy-vyplate", "vozrazhenie-na-isk"]],
  ["oshibka-v-stazhe", "socialnye-vyplaty", "Как исправить ошибку в трудовом стаже для пенсии", "Ошибка в стаже", "Соберите трудовые документы, архивные справки и подайте заявление о корректировке сведений.", ["zayavlenie-o-pereraschete-pensii", "zhaloba-na-otkaz-v-socialnoy-vyplate"]],
  ["otkazali-v-invalidnosti", "socialnye-vyplaty", "Как обжаловать отказ в инвалидности", "Отказ в инвалидности", "Нужно получить решение МСЭ, медицинские документы и подать жалобу или заявление о переосвидетельствовании.", ["zhaloba-na-otkaz-v-socialnoy-vyplate", "zayavlenie-o-vydache-medicinskih-dokumentov"], "high"],
  ["ne-dayut-lgotu", "socialnye-vyplaty", "Что делать, если не дают положенную льготу", "Отказ в льготе", "Проверьте основание льготы, статус заявителя и комплект документов, затем требуйте письменный отказ.", ["zhaloba-na-otkaz-v-socialnoy-vyplate", "zhaloba-v-prokuraturu"]],
  ["pereplata-po-socvyplatam", "socialnye-vyplaty", "Что делать при переплате по социальным выплатам", "Переплата по выплатам", "Нужно проверить расчет переплаты, причину ошибки и порядок удержания или возврата.", ["zhaloba-na-otkaz-v-socialnoy-vyplate", "vozrazhenie-na-isk"]],
  ["otkaz-v-materinskom-kapitale", "socialnye-vyplaty", "Как обжаловать отказ в материнском капитале", "Отказ в маткапитале", "Получите письменный отказ и проверьте документы о праве, целях использования и членах семьи.", ["zhaloba-na-otkaz-v-socialnoy-vyplate", "iskovoe-zayavlenie"]],
  ["ne-uchityvayut-dohody-pravilno", "socialnye-vyplaty", "Что делать, если доходы для пособия учли неправильно", "Ошибка в доходах", "Запросите расчет, проверьте период и состав доходов, затем подайте заявление о пересмотре.", ["zhaloba-na-otkaz-v-socialnoy-vyplate", "zayavlenie-o-pereraschete-pensii"]],

  // Миграция
  ["oformit-rvp", "migraciya", "Как оформить РВП и избежать отказа", "Оформить РВП", "Проверьте основание, квоту, документы и сроки подачи, чтобы не получить отказ из-за формальной ошибки.", ["zayavlenie-o-prodlenii-registracii", "zhaloba-v-prokuraturu"]],
  ["oformit-vnzh", "migraciya", "Как оформить ВНЖ в России", "Оформить ВНЖ", "Нужно подтвердить основание, срок проживания, доходы и корректность миграционного учета.", ["zayavlenie-o-prodlenii-registracii", "zhaloba-v-prokuraturu"]],
  ["otkazali-v-grazhdanstve", "migraciya", "Что делать, если отказали в гражданстве", "Отказ в гражданстве", "Получите письменный отказ, проверьте основание и оцените, можно ли исправить документы или обжаловать решение.", ["zhaloba-v-prokuraturu", "iskovoe-zayavlenie"], "high"],
  ["narushen-srok-migracionnogo-ucheta", "migraciya", "Что делать при нарушении срока миграционного учета", "Срок миграционного учета", "Оцените длительность просрочки, причины и документы, чтобы снизить риск штрафа или выдворения.", ["zayavlenie-o-prodlenii-registracii", "zhaloba-v-prokuraturu"], "high"],
  ["shtraf-za-migracionnye-pravila", "migraciya", "Как обжаловать штраф за нарушение миграционных правил", "Миграционный штраф", "Проверьте протокол, сроки, переводчика и доказательства нарушения, затем подайте жалобу при основаниях.", ["zhaloba-v-prokuraturu", "hodataystvo-o-vosstanovlenii-sroka"], "high"],
  ["annulirovali-razreshenie", "migraciya", "Что делать, если аннулировали разрешение на проживание", "Аннулировали разрешение", "Нужно получить решение, проверить основания аннулирования и срок на обжалование.", ["zhaloba-v-prokuraturu", "iskovoe-zayavlenie"], "high"],
  ["deportaciya-ili-vydvorenie", "migraciya", "Что делать при угрозе депортации или выдворения", "Выдворение", "Срочно проверьте документы, сроки обжалования и основания для смягчения последствий.", ["zhaloba-v-prokuraturu", "apellyacionnaya-zhaloba"], "high", "today"],
  ["prodlit-registraciyu", "migraciya", "Как продлить регистрацию иностранному гражданину", "Продлить регистрацию", "Проверьте основание продления, принимающую сторону и сроки подачи документов.", ["zayavlenie-o-prodlenii-registracii", "zhaloba-v-prokuraturu"]],
  ["rabotodatel-narushil-migracionnye-pravila", "migraciya", "Что делать, если работодатель нарушил миграционные правила", "Работодатель и миграция", "Нужно оценить, кто отвечает за нарушение, какие документы оформлены и есть ли риск штрафа или выдворения.", ["zhaloba-v-prokuraturu", "zhaloba-v-trudovuyu-inspekciyu"], "high"],
  ["poteryali-migracionnye-dokumenty", "migraciya", "Что делать, если потеряли миграционные документы", "Потеря документов", "Зафиксируйте утрату и восстановите документы, не затягивая со сроками миграционного учета.", ["zayavlenie-o-prodlenii-registracii", "zhaloba-v-prokuraturu"], "high"],

  // Воинский учет
  ["prishla-povestka", "voinskiy-uchet", "Что делать, если пришла повестка", "Повестка", "Проверьте способ вручения, содержание повестки и документы, которые нужно подготовить до явки.", ["zhaloba-na-reshenie-prizyvnoy-komissii", "raport-voennosluzhaschego"], "high", "today"],
  ["obzhalovat-reshenie-prizyvnoy-komissii", "voinskiy-uchet", "Как обжаловать решение призывной комиссии", "Решение призывной комиссии", "Нужно получить копию решения, собрать медицинские и иные документы и подать жалобу в срок.", ["zhaloba-na-reshenie-prizyvnoy-komissii", "hodataystvo-o-vosstanovlenii-sroka"], "high"],
  ["reshenie-vvk", "voinskiy-uchet", "Как обжаловать решение ВВК или категорию годности", "Обжалование ВВК", "Нужно получить копию решения, собрать медицинские документы и подать жалобу или заявление в зависимости от статуса и стадии.", ["zhaloba-na-reshenie-prizyvnoy-komissii", "raport-voennosluzhaschego"], "high"],
  ["otkazali-v-otsrochke", "voinskiy-uchet", "Что делать, если отказали в отсрочке от призыва", "Отказ в отсрочке", "Проверьте основание отсрочки, документы и решение комиссии, затем готовьте жалобу.", ["zhaloba-na-reshenie-prizyvnoy-komissii", "hodataystvo-o-vosstanovlenii-sroka"], "high"],
  ["trebuyut-yavitsya-bez-povestki", "voinskiy-uchet", "Обязан ли являться в военкомат без повестки", "Явка без повестки", "Нужно оценить форму вызова, статус гражданина и последствия неявки, не ограничиваясь устными требованиями.", ["zhaloba-na-reshenie-prizyvnoy-komissii", "zhaloba-v-prokuraturu"], "high"],
  ["oshibka-v-voennom-bilete", "voinskiy-uchet", "Как исправить ошибку в военном билете", "Ошибка в военном билете", "Подайте заявление с подтверждающими документами и требуйте внесения исправлений в учетные сведения.", ["raport-voennosluzhaschego", "zhaloba-v-prokuraturu"]],
  ["ne-snimayut-s-voinskogo-ucheta", "voinskiy-uchet", "Что делать, если не снимают с воинского учета", "Не снимают с учета", "Проверьте основание снятия, место жительства и документы, затем подайте заявление или жалобу.", ["raport-voennosluzhaschego", "zhaloba-v-prokuraturu"]],
  ["alternativnaya-grazhdanskaya-sluzhba", "voinskiy-uchet", "Как подать заявление на альтернативную гражданскую службу", "Альтернативная служба", "Нужно соблюдать срок подачи и подробно обосновать убеждения или вероисповедание документами.", ["zhaloba-na-reshenie-prizyvnoy-komissii", "raport-voennosluzhaschego"]],
  ["prizyvayut-s-zabolevaniem", "voinskiy-uchet", "Что делать, если призывают при наличии заболевания", "Призыв с заболеванием", "Соберите медицинские документы и требуйте учета диагноза при освидетельствовании и решении комиссии.", ["zhaloba-na-reshenie-prizyvnoy-komissii", "zayavlenie-o-vydache-medicinskih-dokumentov"], "high"],
  ["narushili-poryadok-medkomissii", "voinskiy-uchet", "Как обжаловать нарушение порядка медкомиссии", "Нарушение медкомиссии", "Фиксируйте, какие обследования не провели, какие документы не приняли и какое решение вынесли.", ["zhaloba-na-reshenie-prizyvnoy-komissii", "zhaloba-v-prokuraturu"], "high"],

  // Бизнес
  ["kontragent-ne-platit", "biznes", "Что делать, если контрагент не платит по договору", "Контрагент не платит", "Проверьте договор, акты, переписку и срок оплаты, затем направьте претензию и готовьте иск.", ["pretenziya-kontragentu-po-dogovoru", "iskovoe-zayavlenie"]],
  ["dolg-po-dogovoru", "biznes", "Как взыскать долг по договору с контрагента", "Долг по договору", "Нужно проверить договор, акты, переписку, срок оплаты и претензионный порядок, затем готовить претензию или иск.", ["pretenziya-kontragentu-po-dogovoru", "iskovoe-zayavlenie"]],
  ["postavschik-narushil-srok", "biznes", "Что делать, если поставщик нарушил срок поставки", "Нарушен срок поставки", "Проверьте срок, ответственность и доказательства просрочки, затем направьте претензию с расчетом требований.", ["pretenziya-kontragentu-po-dogovoru", "iskovoe-zayavlenie"]],
  ["klient-trebuet-vozvrat", "biznes", "Что делать, если клиент требует возврат денег", "Клиент требует возврат", "Проверьте договор, акт оказания услуг, переписку и основания требования, затем подготовьте мотивированный ответ.", ["pretenziya-kontragentu-po-dogovoru", "vozrazhenie-na-isk"]],
  ["nalogovaya-zablokirovala-schet", "biznes", "Что делать, если налоговая заблокировала счет", "Блокировка счета налоговой", "Нужно выяснить основание блокировки, устранить нарушение или обжаловать решение налогового органа.", ["zhaloba-v-prokuraturu", "pretenziya-kontragentu-po-dogovoru"], "high"],
  ["nalogovaya-proverka", "biznes", "Как подготовиться к налоговой проверке", "Налоговая проверка", "Проверьте требование налоговой, сроки ответа, документы и риски до передачи пояснений.", ["pretenziya-kontragentu-po-dogovoru", "zhaloba-v-prokuraturu"], "high"],
  ["podgotovit-pretenziyu-kontragentu", "biznes", "Как подготовить претензию контрагенту", "Претензия контрагенту", "Претензия должна содержать договор, нарушение, сумму, срок исполнения и предупреждение о дальнейшем обращении.", ["pretenziya-kontragentu-po-dogovoru", "iskovoe-zayavlenie"]],
  ["rastorgnut-dogovor", "biznes", "Как расторгнуть договор с контрагентом", "Расторгнуть договор", "Проверьте условия договора, нарушение и порядок уведомления, чтобы расторжение не создало встречные требования.", ["pretenziya-kontragentu-po-dogovoru", "iskovoe-zayavlenie"]],
  ["partner-narushil-dogovorennosti", "biznes", "Что делать, если партнер нарушил договоренности", "Партнер нарушил договоренности", "Нужно отделить устные договоренности от доказуемых обязательств и собрать переписку, платежи, документы.", ["pretenziya-kontragentu-po-dogovoru", "iskovoe-zayavlenie"]],
  ["spor-mezhdu-uchreditelyami", "biznes", "Как решить спор между учредителями компании", "Спор учредителей", "Проверьте устав, корпоративные документы, доли и решения органов управления до переговоров или суда.", ["iskovoe-zayavlenie", "pretenziya-kontragentu-po-dogovoru"], "high"],

  // Уголовные риски
  ["vyzvali-na-dopros", "ugolovnye-riski", "Что делать, если вызвали на допрос", "Вызвали на допрос", "До дачи показаний важно понять свой статус, основания вызова и право на адвоката.", ["zhaloba-na-deystviya-policii", "zayavlenie-v-policiyu"], "high", "today"],
  ["prishli-s-obyskom", "ugolovnye-riski", "Что делать, если пришли с обыском", "Обыск", "Проверьте постановление, статус участников, понятых и фиксируйте все изъятия в протоколе.", ["zhaloba-na-deystviya-policii", "zayavlenie-v-policiyu"], "high", "today"],
  ["podat-zayavlenie-v-policiyu", "ugolovnye-riski", "Как подать заявление в полицию", "Заявление в полицию", "Опишите событие, дату, место, участников и доказательства, затем получите талон-уведомление.", ["zayavlenie-v-policiyu", "zhaloba-na-deystviya-policii"]],
  ["otkazali-v-vozbuzhdenii-dela", "ugolovnye-riski", "Как обжаловать отказ в возбуждении уголовного дела", "Отказ в возбуждении дела", "Получите постановление об отказе, проверьте мотивировку и подайте жалобу руководителю, прокурору или в суд.", ["zhaloba-na-deystviya-policii", "zayavlenie-v-policiyu"], "high"],
  ["obvinyayut-v-moshennichestve", "ugolovnye-riski", "Что делать, если обвиняют в мошенничестве", "Обвиняют в мошенничестве", "Нужно срочно определить статус, не давать необдуманных объяснений и собрать документы по сделке или спору.", ["zhaloba-na-deystviya-policii", "vozrazhenie-na-isk"], "high", "today"],
  ["poterpevshiy-vzyskat-uscherb", "ugolovnye-riski", "Как потерпевшему взыскать ущерб по уголовному делу", "Взыскать ущерб", "Соберите доказательства размера ущерба и заявите гражданский иск или отдельное требование.", ["iskovoe-zayavlenie", "zayavlenie-v-policiyu"]],
  ["ugrozhayut-ugolovnym-delom", "ugolovnye-riski", "Что делать, если угрожают уголовным делом", "Угрожают делом", "Зафиксируйте угрозы, проверьте реальность претензий и не передавайте деньги без правовой оценки.", ["zayavlenie-v-policiyu", "zhaloba-na-deystviya-policii"], "high"],
  ["obzhalovat-deystviya-policii", "ugolovnye-riski", "Как обжаловать действия полиции", "Жалоба на полицию", "Нужно описать конкретное действие, дату, должностное лицо и приложить доказательства нарушения.", ["zhaloba-na-deystviya-policii", "zhaloba-v-prokuraturu"], "high"],
  ["izyali-telefon-ili-dokumenty", "ugolovnye-riski", "Что делать, если изъяли телефон или документы", "Изъяли телефон", "Проверьте протокол, основание изъятия, перечень вещей и порядок возврата имущества.", ["zhaloba-na-deystviya-policii", "zayavlenie-v-policiyu"], "high"],
  ["trebuyut-obyasnenie", "ugolovnye-riski", "Что делать, если требуют дать объяснение", "Требуют объяснение", "Перед объяснением нужно понять статус, предмет проверки и риски самооговора.", ["zhaloba-na-deystviya-policii", "zayavlenie-v-policiyu"], "high", "today"]
 ] satisfies LegalProblemTuple[]).map(([slug, categorySlug, title, shortTitle, shortAnswer, relatedDocumentSlugs, riskLevel, urgency]) => ({
  slug,
  categorySlug,
  title,
  shortTitle,
  shortAnswer,
  relatedDocumentSlugs,
  riskLevel,
  urgency,
  legalReferenceKeys: problemLegalReferenceKeys[slug] ?? []
} as LegalProblemSpec));

const existingSpecKeys = new Set(specs.map((spec) => `${normalizeLegalCategorySlug(spec.categorySlug)}/${spec.slug}`));

const targetProblemPriority = new Map(
  (targetProblemStructure.categories as TargetCategory[]).flatMap((category) =>
    category.situations.map((situation) => [`${normalizeLegalCategorySlug(category.slug)}/${situation.slug}`, situation.priority] as const)
  )
);

const targetProblemSpecs: LegalProblemSpec[] = (targetProblemStructure.categories as TargetCategory[]).flatMap((category) => {
  const categorySlug = normalizeLegalCategorySlug(category.slug);
  const legalCategory = legalCategories.find((item) => item.slug === categorySlug);
  if (!legalCategory) return [];

  return category.situations
    .filter((situation) => !existingSpecKeys.has(`${categorySlug}/${situation.slug}`))
    .map((situation) => makeTargetProblemSpec(category, situation, legalCategory));
});

const mergedIntoAlimonyProblemSlugs = new Set([
  "alimenty-ne-platyat",
  "vzyiskat-alimenty",
  "dolg-po-alimentam",
  "dolgi-po-alimentam"
]);

const mergedIntoPaternityProblemSlugs = new Set([
  "osporit-otcovstvo",
  "ustanovit-otcovstvo"
]);

const allProblemSpecs = [...specs, ...targetProblemSpecs].filter(
  (spec) => !mergedIntoAlimonyProblemSlugs.has(spec.slug) && !mergedIntoPaternityProblemSlugs.has(spec.slug)
);

function makeTargetProblemSpec(category: TargetCategory, situation: TargetSituation, legalCategory: (typeof legalCategories)[number]): LegalProblemSpec {
  const categorySlug = normalizeLegalCategorySlug(category.slug);
  const title = situation.title;
  const shortAnswer = buildTargetShortAnswer(title, legalCategory.title);

  return {
    slug: situation.slug,
    categorySlug,
    title,
    shortTitle: title,
    shortAnswer,
    relatedDocumentSlugs: getCategoryFallbackDocuments(categorySlug),
    riskLevel: categoryRisk[categorySlug],
    urgency: urgentCategories.has(categorySlug) ? "few_days" : "standard",
    legalReferenceKeys: problemLegalReferenceKeys[situation.slug] ?? [],
    relatedQuestionTopics: [...new Set([title, ...legalCategory.questionTopics])],
    relatedLawyerSpecializations: legalCategory.lawyerSpecializations
  };
}

function buildTargetShortAnswer(situationTitle: string, categoryTitle: string) {
  const normalizedTitle = situationTitle.toLowerCase();

  return `Разберите ситуацию «${normalizedTitle}»: проверьте документы, сроки, риски и порядок обращения по теме «${categoryTitle}».`;
}

function makeProblem(spec: LegalProblemSpec): Omit<LegalProblem, "relatedProblemSlugs"> {
  const categorySlug = normalizeLegalCategorySlug(spec.categorySlug);
  const category = legalCategories.find((item) => item.slug === categorySlug);
  const categoryTitle = category?.title ?? "Юридическая ситуация";
  const documents = [
    ...new Set([...(spec.relatedDocumentSlugs.length ? spec.relatedDocumentSlugs : getCategoryFallbackDocuments(categorySlug, spec.categorySlug))])
  ];
  const documentNames = documents.map((slug) => documentTitles[slug]).filter(Boolean);
  const riskLevel = spec.riskLevel ?? categoryRisk[categorySlug] ?? categoryRisk[spec.categorySlug] ?? "medium";
  const urgency = spec.urgency ?? (urgentCategories.has(categorySlug) || urgentCategories.has(spec.categorySlug) ? "few_days" : "standard");

  return {
    slug: spec.slug,
    categorySlug,
    title: spec.title,
    h1: spec.title,
    shortTitle: spec.shortTitle,
    shortAnswer: spec.shortAnswer,
    description: `${spec.shortAnswer} На странице собраны сроки, риски, документы, частые ошибки, похожие вопросы и юристы по теме «${categoryTitle}».`,
    seoTitle: `${spec.title} — сроки, риски и документы`,
    seoDescription: `${spec.shortAnswer} Что проверить, какие документы подготовить и когда подключить юриста.`,
    riskLevel,
    urgency,
    whatToKnow: [
      "Сначала важно получить письменные документы и зафиксировать даты: от них зависят сроки и порядок защиты.",
      `Ситуация относится к категории «${categoryTitle}», поэтому нужно проверять не только основной спор, но и связанные последствия.`,
      "Если есть официальное решение, претензия, постановление, договор или отказ, его нужно разобрать до подачи жалобы или иска."
    ],
    deadlines: [
      urgency === "today" ? "Проверить документы и сроки желательно в день получения требования или вызова." : "Сроки зависят от даты получения документа, отказа, постановления или момента нарушения права.",
      "Если срок уже пропущен, одновременно с основным документом может понадобиться ходатайство о восстановлении срока.",
      "Не откладывайте фиксацию доказательств: переписка, акты, выписки и уведомления часто нужны сразу."
    ],
    risks: [
      riskLevel === "high" ? "При ошибке можно потерять срок, деньги, имущество, статус или процессуальную позицию." : "При затягивании спор может перейти в суд, исполнительное производство или формальный отказ.",
      "Устные договоренности и обращения без подтверждения сложнее доказать.",
      "Неправильно выбранный документ может затянуть решение и создать дополнительные расходы."
    ],
    steps: [
      "Соберите документы, переписку, платежи, уведомления и другие доказательства.",
      "Определите дату нарушения и проверьте процессуальные или претензионные сроки.",
      "Сформулируйте желаемый результат: отменить акт, взыскать деньги, получить документ, прекратить нарушение или снизить риск.",
      "Подготовьте письменное обращение, претензию, жалобу, заявление или иск.",
      "Если спор сложный, сумма значительная или срок короткий, покажите документы юристу до подачи."
    ],
    documents: documentNames.length
      ? [...documentNames, "Документы, подтверждающие факты и даты", "Переписка, платежи, акты или постановления"]
      : ["Письменное заявление или претензия", "Документы, подтверждающие факты и даты", "Переписка, платежи, акты или постановления"],
    mistakes: [
      "Действовать только устно и не сохранять подтверждение обращения.",
      "Пропустить срок обжалования или подачи документов.",
      "Подписывать признание долга, согласие или отказ без проверки последствий."
    ],
    faq: [
      {
        question: `С чего начать, если ${spec.shortTitle.toLowerCase()}?`,
        answer: "Начните с документов и дат: получите копии решений, договоров, отказов, постановлений или переписки, затем проверьте срок для обращения."
      },
      {
        question: "Какие документы понадобятся?",
        answer: documentNames.length
          ? `Обычно нужны: ${documentNames.slice(0, 2).join(", ")}, а также доказательства фактов, сроков, платежей или переписки.`
          : "Обычно нужны письменное обращение, подтверждение фактов, переписка, платежные документы и официальный ответ или отказ."
      },
      {
        question: "Когда стоит обратиться к юристу?",
        answer: riskLevel === "high"
          ? "Обратиться стоит до подачи документов: в этой ситуации высокий риск ошибки, пропуска срока или неблагоприятных последствий."
          : "Юрист нужен, если сумма значительная, есть официальный отказ, спор дошел до суда или вы не уверены в сроках."
      }
    ],
    relatedDocumentSlugs: documents,
    legalReferenceKeys: spec.legalReferenceKeys ?? [],
    relatedQuestionTopics: spec.relatedQuestionTopics ?? category?.questionTopics ?? [],
    relatedLawyerSpecializations: spec.relatedLawyerSpecializations ?? category?.lawyerSpecializations ?? []
  };
}

type GeneratedLegalProblem = Omit<LegalProblem, "relatedProblemSlugs">;
type LegalProblemOverride = Partial<Omit<GeneratedLegalProblem, "slug" | "categorySlug">>;

const topProblemOverrides: Record<string, LegalProblemOverride> = {
  "dolgi/sudebnyy-prikaz": {
    description: "Сначала проверьте дату получения приказа и суд, который его вынес. Если срок на возражения пропущен, вместе с возражениями может понадобиться заявление о восстановлении срока.",
    relatedDocumentSlugs: ["vozrazhenie-na-sudebnyy-prikaz", "zayavlenie-o-vosstanovlenii-sroka-na-otmenu-sudebnogo-prikaza"],
    whatToKnow: [
      "Срок на возражения считают от даты получения копии судебного приказа, а не от даты, когда вы впервые увидели долг в банке или у приставов.",
      "Для отмены приказа обычно не нужно подробно спорить с долгом: важно письменно заявить несогласие и подтвердить дату получения.",
      "Если приказ уже у приставов, после отмены нужно передать определение об отмене приставу и банку."
    ],
    deadlines: [
      "Обычно возражения подают в течение 10 дней с даты получения копии судебного приказа.",
      "Если срок уже пропущен, не откладывайте: может потребоваться отдельное заявление о восстановлении срока.",
      "Сохраните конверт, почтовое уведомление, скриншот Госуслуг или иной документ, подтверждающий дату получения."
    ],
    risks: [
      "Если ничего не сделать, приказ может перейти к приставам, списаниям с карт и ограничениям по счетам.",
      "Без подтверждения даты получения суд может отказать в восстановлении срока.",
      "После отмены приказа кредитор вправе обратиться уже с иском, поэтому документы по долгу нужно сохранить."
    ],
    steps: [
      "Найдите копию судебного приказа и определите дату фактического получения.",
      "Проверьте номер дела, суд, взыскателя, сумму и основание долга.",
      "Сформируйте возражение на судебный приказ, а при пропуске срока добавьте заявление о восстановлении срока.",
      "Подайте документы в суд, вынесший приказ, и сохраните подтверждение отправки.",
      "После отмены приказа передайте определение приставу или банку, если уже начались списания."
    ],
    mistakes: [
      "Ждать звонка от суда или пристава вместо подачи письменных возражений.",
      "Оспаривать долг устно и не сохранять подтверждение отправки документов.",
      "Не просить восстановить срок, если приказ получен давно или узнали о нем после списания."
    ]
  },
  "pristavy/spisali-dengi-pristavy": {
    description: "Сначала выясните номер исполнительного производства и основание списания. Если списание ошибочное или удержали больше допустимого, подайте заявление приставу и жалобу с подтверждающими документами.",
    relatedDocumentSlugs: ["zhaloba-na-sudebnogo-pristava", "zayavlenie-o-vozvrate-izlishne-uderzhannyh-deneg"],
    whatToKnow: [
      "Нужно понять, списаны деньги по судебному приказу, решению суда, штрафу или другому исполнительному документу.",
      "Часть доходов защищена законом или ограничена по размеру удержаний, но приставу нужно показать документы о происхождении денег.",
      "Если судебный акт отменен, приставу нужно передать копию определения и просить прекратить взыскание или вернуть удержанное."
    ],
    deadlines: [
      "Жалобу на постановление, действие или бездействие пристава лучше подавать сразу после того, как стало известно о списании.",
      "Если списание связано с судебным приказом, отдельно проверьте срок на его отмену.",
      "Чем быстрее направить документы о зарплате, пособиях или ошибке, тем меньше риск повторных списаний."
    ],
    risks: [
      "Повторные списания могут продолжиться, пока пристав не получит заявление и подтверждающие документы.",
      "Без выписки банка и постановления пристава сложно доказать ошибку и размер удержаний.",
      "Если пропустить срок обжалования, придется дополнительно объяснять причины пропуска."
    ],
    steps: [
      "Получите банковскую выписку по списанию и номер исполнительного производства.",
      "Запросите у пристава постановление и копию исполнительного документа.",
      "Проверьте, не удержаны ли защищенные выплаты или сумма сверх допустимого предела.",
      "Подготовьте жалобу на пристава или заявление о возврате излишне удержанных денег.",
      "Сохраните подтверждение подачи и контролируйте ответ в ФССП."
    ]
  },
  "pristavy/arestovali-zarplatnuyu-kartu": {
    description: "Главное — подтвердить приставу, что счет зарплатный, и подать заявление о сохранении прожиточного минимума или ограничении удержаний. Сам факт ареста карты не всегда означает, что удержания рассчитаны верно.",
    whatToKnow: [
      "Банк видит арест счета, но не всегда знает, что на него поступает зарплата.",
      "Приставу нужны справка работодателя, выписка по счету и заявление о сохранении прожиточного минимума.",
      "Если удерживают больше положенного, можно требовать перерасчет и возврат излишне списанного."
    ],
    deadlines: [
      "Подайте заявление приставу как можно быстрее, чтобы снизить риск повторных удержаний.",
      "Если есть постановление пристава, срок обжалования лучше считать с даты, когда вы о нем узнали.",
      "Документы о зарплатном характере счета стоит приложить сразу, а не ждать ответа банка."
    ],
    risks: [
      "Без заявления пристав может продолжить удержания в прежнем размере.",
      "Если карта используется для разных поступлений, нужно отдельно доказать, какие суммы являются зарплатой.",
      "Устное обращение в банк не заменяет письменного заявления приставу."
    ],
    steps: [
      "Получите у работодателя справку о перечислении зарплаты на этот счет.",
      "Скачайте выписку банка с поступлениями и удержаниями.",
      "Подайте приставу заявление о сохранении прожиточного минимума или снижении удержаний.",
      "При отказе подготовьте жалобу старшему приставу или в суд.",
      "Проверьте, сняты ли ограничения после ответа пристава."
    ]
  },
  "rabota/ne-vyplatili-zarplatu": {
    description: "Зафиксируйте сумму долга и дату увольнения, запросите расчетные листки и приказ. По трудовым спорам сроки обращения ограничены, поэтому жалобу или иск лучше готовить без затягивания.",
    relatedDocumentSlugs: ["zhaloba-v-trudovuyu-inspekciyu", "pretenziya-rabotodatelyu-o-vyplate-zarplaty", "isk-o-vzyskanii-zarabotnoy-platy"],
    whatToKnow: [
      "При увольнении работодатель должен произвести окончательный расчет и выдать документы.",
      "Можно требовать не только долг по зарплате, но и компенсацию за задержку выплат.",
      "Если работодатель не выдает документы, запросите их письменно и сохраните подтверждение отправки."
    ],
    deadlines: [
      "По зарплате и увольнению сроки обращения могут быть ограничены, особенно если нужен суд.",
      "Жалобу в трудовую инспекцию можно готовить сразу после нарушения, не ожидая устных обещаний.",
      "Если срок уже близко, лучше параллельно готовить судебные документы."
    ],
    risks: [
      "Устные обещания выплатить позже не останавливают течение сроков.",
      "Без расчетных документов и выписок сложнее подтвердить размер долга.",
      "Если компания ликвидируется или скрывает активы, затягивание повышает риск фактического невзыскания."
    ],
    steps: [
      "Соберите трудовой договор, приказ об увольнении, расчетные листки и банковские выписки.",
      "Направьте работодателю письменное требование о выплате долга и выдаче документов.",
      "Подготовьте жалобу в трудовую инспекцию или прокуратуру.",
      "Если долг не выплачен, оцените подачу иска о взыскании зарплаты и компенсации.",
      "Покажите документы юристу, если работодатель спорит с суммой или срок уже близок."
    ]
  },
  "rabota/zaderzhivayut-zarplatu": {
    description: "Начните с фиксации даты и суммы задержки. Важно не ограничиваться устными разговорами: письменное требование, жалоба и расчет компенсации помогают быстрее выбрать следующий шаг.",
    whatToKnow: [
      "Задержка зарплаты — это не только невыплата всей суммы, но и нарушение установленных дат выплаты.",
      "Работник может требовать компенсацию за каждый день задержки.",
      "Если задержка повторяется, стоит собрать доказательства системности: расчетные листки, выписки и переписку."
    ],
    deadlines: [
      "Фиксируйте нарушение сразу после даты, когда зарплата должна была быть выплачена.",
      "Сроки судебной защиты по трудовым спорам ограничены, поэтому не ждите месяцами.",
      "Если работодатель обещает выплатить позже, попросите письменный график или ответ."
    ],
    risks: [
      "Без письменных обращений работодатель может отрицать размер долга или дату обещанной выплаты.",
      "При затяжной задержке может понадобиться не только жалоба, но и иск.",
      "Если работодатель меняет юрлицо или закрывается, промедление ухудшает позицию работника."
    ]
  },
  "rabota/nezakonno-uvolili": {
    description: "Сразу получите приказ об увольнении, трудовые документы и проверьте дату увольнения. Для восстановления на работе срок обращения в суд особенно короткий, поэтому медлить рискованно.",
    whatToKnow: [
      "Нужно проверить основание увольнения, процедуру, уведомления, объяснения и документы работодателя.",
      "Для восстановления на работе важно подтвердить дату получения приказа или трудовой книжки.",
      "Жалоба в инспекцию не всегда заменяет обращение в суд, если нужно восстановление."
    ],
    deadlines: [
      "По спорам о восстановлении на работе срок обращения в суд ограничен и считается от получения документов об увольнении.",
      "Если срок пропущен, нужно оценить уважительные причины и возможность восстановления.",
      "Запросите документы письменно сразу после увольнения."
    ],
    risks: [
      "Пропуск срока может стать самостоятельным основанием для отказа.",
      "Подпись в документах без оговорок может осложнить спор, если вы фактически не согласны с увольнением.",
      "Если работодатель оформил увольнение как добровольное, придется доказывать давление или нарушение процедуры."
    ],
    steps: [
      "Получите приказ об увольнении, расчетные документы и копии кадровых документов.",
      "Зафиксируйте дату получения приказа и трудовой книжки или сведений о трудовой деятельности.",
      "Соберите переписку, уведомления, объяснительные и доказательства давления, если оно было.",
      "Подготовьте заявление о восстановлении на работе или жалобу, если нужен контроль инспекции.",
      "Покажите документы юристу до подачи, если срок короткий или основание увольнения спорное."
    ]
  },
  "rabota/rabotali-bez-dogovora": {
    description: "Если трудовой договор не оформили, нужно доказывать сам факт работы: график, переписку, выплаты, поручения, пропуск, свидетелей и связь с работодателем.",
    whatToKnow: [
      "Отсутствие письменного договора не всегда означает отсутствие трудовых отношений.",
      "Важны признаки работы: подчинение графику, выполнение поручений, регулярные выплаты, рабочее место.",
      "Соберите доказательства до конфликта, пока доступ к переписке и документам не потерян."
    ],
    deadlines: [
      "Сроки по трудовым требованиям ограничены, поэтому дату прекращения работы и невыплаты нужно определить сразу.",
      "Чем раньше собрать доказательства, тем проще подтвердить отношения.",
      "Если работодатель отрицает факт работы, не затягивайте с письменными обращениями."
    ],
    risks: [
      "Без доказательств работодатель может утверждать, что были разовые услуги, стажировка или гражданский договор.",
      "Свидетельских показаний часто недостаточно без переписки, выплат или рабочих документов.",
      "При долгой паузе сложнее восстановить график, суммы и период работы."
    ]
  },
  "semya/alimenty-ne-platyat": {
    title: "Алименты не платят",
    h1: "Алименты не платят: что делать",
    shortTitle: "Алименты не платят",
    shortAnswer: "Если алименты назначены судом или соглашением, но не платятся — передайте исполнительный документ приставу. Пристав рассчитает долг, арестует счета и имущество, ограничит выезд и лишит прав на вождение.",
    description: "ЧТО ВАЖНО ПОНЯТЬ СРАЗУ: долг по алиментам не прощается и не «обнуляется» — он продолжает копиться. Совершеннолетие ребёнка долг за прошлые годы не списывает. ЕСЛИ ДОКУМЕНТ УЖЕ ЕСТЬ: предъявите исполнительный лист или судебный приказ приставу-исполнителю по месту жительства должника. Или напрямую работодателю должника (если место работы известно). Пристав вправе арестовать счета, запретить выезд, лишить прав на вождение, обратить взыскание на имущество. ЕСЛИ ПРИСТАВ БЕЗДЕЙСТВУЕТ: подайте жалобу старшему судебному приставу, в прокуратуру или в суд. Бездействие пристава оспаривается в административном порядке. НЕУСТОЙКА: за каждый день просрочки начисляется 0,1% от суммы долга. Неустойку взыскивают отдельным иском. ЕСЛИ ДОКУМЕНТА НЕТ: если алименты никогда не взыскивались — сначала обратитесь за приказом или иском. Эта страница для тех, у кого документ уже есть.",
    seoTitle: "Алименты не платят — что делать, как взыскать долг и пожаловаться на пристава",
    seoDescription: "Что делать, если алименты не платят: как предъявить исполнительный лист приставу, рассчитать долг, взыскать неустойку, пожаловаться на бездействие пристава и добиться принудительного взыскания.",
    riskLevel: "high",
    urgency: "today",
    urgencyNote: "Долг по алиментам накапливается каждый день. Чем раньше подадите документы приставу — тем раньше начнутся меры принудительного взыскания.",
    heroNote: {
      title: "Выберите нужную страницу",
      text: "Эта страница — для тех, у кого уже есть судебный приказ, решение суда или нотариальное соглашение, но деньги не приходят. Если алименты ещё не взысканы и исполнительного документа нет — перейдите в [«Взыскать алименты»](/problems/semya-i-deti/vzyiskat-alimenty). Если накопился большой долг и нужна неустойка — эта же страница поможет."
    },
    whatToKnow: [
      "Взыскание долга по алиментам начинается с предъявления исполнительного документа (приказ, исполнительный лист, нотариальное соглашение) приставу или работодателю должника.",
      "Пристав обязан возбудить исполнительное производство в течение 3 рабочих дней с момента получения заявления и документа.",
      "Меры принудительного взыскания: арест банковских счетов, удержание из зарплаты и пенсии (до 70% при долгах по алиментам), запрет выезда за рубеж при долге от 10 000 руб., лишение водительских прав при долге от 10 000 руб., арест имущества.",
      "Неустойка за просрочку алиментов — 0,1% от суммы долга за каждый день. Взыскивается отдельным иском. Срок давности не распространяется на саму задолженность.",
      "Совершеннолетие ребёнка не прекращает долг, накопившийся до 18 лет. После 18 лет взрослый ребёнок вправе сам взыскивать долг.",
      "Если пристав бездействует: подайте жалобу старшему приставу, в прокуратуру или обжалуйте бездействие в суде. Жалобу подавайте письменно с отметкой о принятии.",
      "Если должник официально не работает — пристав взыскивает от расчётной суммы (исходя из средней зарплаты по РФ). Скрытие доходов — уголовно наказуемо при злостном уклонении.",
      "Злостное уклонение от уплаты алиментов — уголовная ответственность по ст. 157 УК РФ (обязательные работы, исправительные работы, арест до 3 месяцев или лишение свободы до 1 года)."
    ],
    deadlines: [
      "Задолженность рассчитывается приставом с даты вынесения судебного акта или заключения соглашения — накопленный долг не ограничен сроком давности.",
      "Жалоба на бездействие пристава — в течение 10 дней с момента, когда стало известно о бездействии.",
      "Иск о взыскании неустойки — срок исковой давности 3 года по каждому просроченному платежу.",
      "Пристав обязан возбудить производство в течение 3 рабочих дней после получения документов."
    ],
    risks: [
      "Без исполнительного документа пристав не вправе начать взыскание — нужен приказ, решение суда или нотариальное соглашение.",
      "Если не контролировать производство, пристав может формально числить дело открытым без реальных мер.",
      "Должник может обжаловать расчёт задолженности — важно, чтобы пристав документально фиксировал каждый период.",
      "Неустойку нужно взыскивать отдельным иском — автоматически она не начисляется в пользу взыскателя."
    ],
    steps: [
      "Убедитесь, что у вас есть исполнительный документ: судебный приказ, исполнительный лист или нотариальное соглашение.",
      "Подайте заявление о возбуждении исполнительного производства приставу по месту жительства должника, приложив документ.",
      "Или предъявьте исполнительный лист напрямую в бухгалтерию работодателя должника — это ускоряет удержание.",
      "Контролируйте производство: запросите постановление о возбуждении, следите за мерами (арест счетов, ограничение выезда).",
      "Если пристав бездействует — подайте письменную жалобу старшему приставу с отметкой о принятии.",
      "Рассчитайте и взыщите неустойку 0,1%/день через отдельный иск в суд.",
      "При злостном уклонении — подайте заявление приставу о привлечении должника к административной (ст. 5.35.1 КоАП) или уголовной ответственности (ст. 157 УК)."
    ],
    documents: [
      "Исполнительный лист, судебный приказ или нотариальное соглашение об алиментах",
      "Заявление о возбуждении исполнительного производства",
      "Паспорт взыскателя",
      "Свидетельство о рождении ребёнка",
      "Сведения о должнике: адрес, место работы, счета (при наличии)",
      "Жалоба на бездействие пристава (при необходимости)"
    ],
    mistakes: [
      "Не передавать исполнительный документ приставу, ожидая, что должник заплатит сам.",
      "Не контролировать ход исполнительного производства — дело может «зависнуть».",
      "Не подавать жалобу на бездействие пристава письменно — устные обращения юридической силы не имеют.",
      "Не взыскивать неустойку — она начисляется за каждый день просрочки и может быть значительной.",
      "Думать, что после совершеннолетия ребёнка долг списывается — это не так."
    ],
    faq: [
      {
        question: "Что делать, если пристав ничего не делает?",
        answer: "Подайте письменную жалобу старшему судебному приставу (руководителю отдела). Если не помогает — в прокуратуру или в суд с административным иском о признании бездействия незаконным."
      },
      {
        question: "Можно ли предъявить документ напрямую работодателю должника?",
        answer: "Да. Исполнительный лист или судебный приказ можно предъявить напрямую в бухгалтерию работодателя — это часто быстрее, чем через пристава."
      },
      {
        question: "Как рассчитать неустойку по алиментам?",
        answer: "0,1% от суммы задолженности за каждый день просрочки. Расчёт делает пристав или вы сами. Неустойка взыскивается отдельным иском в суд."
      },
      {
        question: "Что будет должнику, если он злостно уклоняется?",
        answer: "Административная ответственность (обязательные работы, арест до 15 суток) или уголовная по ст. 157 УК РФ — обязательные работы, исправительные работы или лишение свободы до 1 года."
      },
      {
        question: "Долг списывается после совершеннолетия ребёнка?",
        answer: "Нет. Долг сохраняется в полном объёме. После 18 лет ребёнок вправе сам обращаться к приставу и в суд за взысканием накопленного долга."
      }
    ],
    relatedDocumentSlugs: ["zhaloba-na-sudebnogo-pristava", "zayavlenie-o-vzyskanii-alimentov"],
    relatedQuestionTopics: ["алименты не платят", "долг по алиментам", "жалоба на пристава алименты", "неустойка по алиментам", "злостное уклонение алименты", "ограничение выезда должника алименты", "взыскать долг по алиментам"],
    relatedLawyerSpecializations: ["семейное право", "алименты", "исполнительное производство"],
    legalReferenceKeys: ["sk_80", "sk_81", "sk_83", "sk_113", "sk_114", "sk_115", "fz229_30", "fz229_50", "fz229_64", "fz229_67", "fz229_99", "fz229_121"],
    selfHelpConditions: [
      "исполнительный документ есть, место работы должника известно — можно предъявить напрямую работодателю;",
      "подаёте стандартное заявление приставу о возбуждении производства."
    ],
    lawyerConditions: [
      "пристав бездействует и нужна жалоба или административный иск;",
      "должник скрывает доходы и нужно привлечь к уголовной ответственности;",
      "нужно взыскать неустойку через суд;",
      "должник обжалует расчёт задолженности."
    ]
  },
  "semya/vzyiskat-alimenty": {
    title: "Взыскать алименты",
    h1: "Взыскать алименты на ребёнка",
    shortTitle: "Взыскать алименты",
    shortAnswer: "Алименты взыскиваются тремя способами: нотариальное соглашение (быстро, если договорились), судебный приказ (без заседания, если нет спора) или иск (если есть спор о размере или плательщик скрывает доходы).",
    description: "НОТАРИАЛЬНОЕ СОГЛАШЕНИЕ: самый быстрый путь — если родители договорились о размере. Соглашение, удостоверенное нотариусом, имеет силу исполнительного листа. Не нужно идти в суд. СУДЕБНЫЙ ПРИКАЗ: подаётся мировому судье без заседания и без вызова сторон. Выдаётся в течение 5 дней. Минус: плательщик вправе отменить приказ в течение 10 дней без объяснения причин — тогда нужен полноценный иск. ИСКО: при споре о размере, нерегулярных доходах или уклонении от приказа. Суд может назначить алименты в твёрдой сумме. Алименты взыскиваются с даты подачи иска — не с даты рождения ребёнка. АЛИМЕНТЫ ДО СУДА: можно взыскать за 3 предыдущих года, если доказано, что в этот период принимались меры к получению, но плательщик уклонялся.",
    seoTitle: "Как взыскать алименты на ребёнка — приказ, иск или соглашение",
    seoDescription: "Как взыскать алименты: нотариальное соглашение, судебный приказ или иск. Размер алиментов в долях и твёрдой сумме, документы, сроки и что делать если плательщик скрывает доходы.",
    riskLevel: "medium",
    urgency: "today",
    urgencyNote: "Алименты взыскиваются с даты подачи заявления или иска — чем раньше обратитесь, тем раньше начнётся отсчёт.",
    heroNote: {
      title: "Выберите нужную страницу",
      text: "Эта страница — про первичное взыскание алиментов, когда исполнительного документа ещё нет. Если алименты уже взысканы, но плательщик не платит — перейдите в [«Алименты не платят»](/problems/semya-i-deti/alimenty-ne-platyat). Если накопился долг — в [«Долг по алиментам»](/problems/semya-i-deti/dolg-po-alimentam)."
    },
    whatToKnow: [
      "Алименты взыскиваются с момента подачи заявления или иска в суд — не с даты рождения ребёнка и не с даты расставания родителей.",
      "Три способа: нотариальное соглашение (если договорились), судебный приказ (если нет спора), иск (если есть спор или приказ отменён).",
      "Стандартный размер в долях: на одного ребёнка — ¼ дохода, на двух — ⅓, на трёх и более — ½. Суд может отступить от долей.",
      "Твёрдая денежная сумма назначается, если у плательщика нет постоянного дохода, доход нерегулярный, скрывается или получается в иностранной валюте.",
      "Судебный приказ — быстрее всего: выдаётся без заседания за 5 дней. Но плательщик может отменить его в 10-дневный срок без объяснений — и тогда нужен иск.",
      "За 3 предыдущих года алименты можно взыскать, если доказать, что вы обращались к плательщику за содержанием, но он уклонялся. Просто устные просьбы — слабое доказательство.",
      "Нотариальное соглашение об алиментах — исполнительный документ без суда. При его неисполнении сразу обращайтесь к приставу или работодателю плательщика.",
      "После получения приказа или решения суда нужно предъявить исполнительный документ: приставу или напрямую работодателю плательщика (если место работы известно)."
    ],
    deadlines: [
      "Судебный приказ — выдаётся в течение 5 дней с момента подачи заявления мировому судье.",
      "Плательщик вправе отменить приказ в течение 10 дней с момента получения.",
      "Иск о взыскании алиментов — рассматривается мировым судьёй в течение 1 месяца.",
      "Алименты за прошлые 3 года — только при наличии доказательств попыток получить содержание в этот период."
    ],
    risks: [
      "Судебный приказ может быть отменён плательщиком без объяснений — тогда придётся подавать иск.",
      "Без документов о доходах плательщика сложнее обосновать твёрдую сумму — суд может назначить алименты в долях.",
      "Устные договорённости о содержании ребёнка юридической силы не имеют — нужно нотариальное соглашение или судебный акт.",
      "Если плательщик официально не работает — взыскание сложнее, но не невозможно: алименты назначаются от средней зарплаты по России."
    ],
    steps: [
      "Попробуйте договориться о нотариальном соглашении об алиментах — это быстрее и дешевле суда.",
      "Если соглашение невозможно — подайте заявление о выдаче судебного приказа мировому судье по месту жительства плательщика или своему.",
      "Если приказ отменён или есть спор — подайте исковое заявление о взыскании алиментов с требованием о нужном способе (доли или твёрдая сумма).",
      "Получите исполнительный документ (приказ или исполнительный лист).",
      "Предъявите документ приставу или напрямую в бухгалтерию работодателя плательщика."
    ],
    documents: [
      "Заявление о выдаче судебного приказа или исковое заявление",
      "Свидетельство о рождении ребёнка",
      "Свидетельство о заключении/расторжении брака",
      "Паспорт заявителя",
      "Документы о доходах плательщика (если известны: справка 2-НДФЛ, сведения о работе)",
      "Сведения о расходах на ребёнка (при взыскании твёрдой суммы)"
    ],
    mistakes: [
      "Ждать и не подавать заявление — алименты взыскиваются только с даты подачи, прошлое не компенсируется.",
      "Полагаться на устные договорённости вместо нотариального соглашения.",
      "Не передавать исполнительный лист приставу или работодателю — сам по себе документ денег не даёт.",
      "Не знать, что приказ можно отменить — готовьтесь к иску, если плательщик этим воспользуется."
    ],
    faq: [
      {
        question: "С какого момента начисляются алименты?",
        answer: "С даты подачи заявления в суд или нотариусу. Дата рождения ребёнка или расставания родителей значения не имеет."
      },
      {
        question: "Можно ли взыскать алименты за прошлые годы?",
        answer: "Да, но не более чем за 3 года до даты обращения и только если доказано, что вы обращались за содержанием, а плательщик уклонялся."
      },
      {
        question: "Чем судебный приказ отличается от иска?",
        answer: "Приказ выдаётся без заседания за 5 дней, но плательщик может его отменить без объяснений. Иск рассматривается дольше, но решение устойчивее."
      },
      {
        question: "Можно ли взыскать алименты, если плательщик не работает официально?",
        answer: "Да. Суд назначает алименты от среднемесячной зарплаты по России или в твёрдой сумме. Приставы ищут имущество и банковские счета должника."
      },
      {
        question: "Нужно ли разводиться для взыскания алиментов?",
        answer: "Нет. Алименты взыскиваются независимо от того, состоят ли родители в браке или нет."
      }
    ],
    relatedDocumentSlugs: ["zayavlenie-o-vzyskanii-alimentov", "iskovoe-zayavlenie"],
    relatedQuestionTopics: ["взыскать алименты", "алименты на ребёнка", "судебный приказ алименты", "иск об алиментах", "алименты если не работает", "твёрдая сумма алиментов", "нотариальное соглашение об алиментах"],
    relatedLawyerSpecializations: ["семейное право", "алименты"],
    legalReferenceKeys: ["sk_80", "sk_81", "sk_83", "sk_99", "sk_100", "gpk_23", "gpk_131", "gpk_132"],
    selfHelpConditions: [
      "нет спора о размере алиментов и плательщик имеет официальный доход — судебный приказ подходит;",
      "оба родителя готовы подписать нотариальное соглашение."
    ],
    lawyerConditions: [
      "плательщик скрывает доходы и нужна твёрдая сумма алиментов;",
      "судебный приказ отменён и нужен иск;",
      "нужно взыскать алименты за прошлые 3 года с доказательством уклонения;",
      "плательщик оспаривает отцовство."
    ]
  },
  "semya-i-deti/dolg-po-alimentam": {
    title: "Долг по алиментам",
    h1: "Долг по алиментам",
    shortTitle: "Долг по алиментам",
    shortAnswer: "Долг по алиментам возникает, когда алименты уже установлены судом, приказом или нотариальным соглашением, но плательщик не перечисляет деньги, платит не полностью или скрывает доходы.",
    description: "Эта страница для тех, у кого уже есть исполнительный документ, но деньги не приходят. Если алименты ещё не взысканы — перейдите в ситуацию «Алименты».",
    seoTitle: "Долг по алиментам — как взыскать задолженность, неустойку и пожаловаться на пристава",
    seoDescription: "Что делать, если алименты не платят: как получить расчёт задолженности, взыскать долг и неустойку, подать заявление приставу, пожаловаться на бездействие и применить меры к должнику.",
    riskLevel: "high",
    urgency: "today",
    legalReferenceKeys: ["sk_80", "sk_113", "sk_114", "sk_115", "sk_99", "sk_100", "fz229_30", "fz229_64", "fz229_67", "fz229_99", "fz229_121"],
    relatedDocumentSlugs: ["zhaloba-na-sudebnogo-pristava", "zayavlenie-o-vzyskanii-alimentov"],
    relatedQuestionTopics: [
      "задолженность по алиментам", "долг по алиментам", "алименты не платят",
      "расчёт задолженности по алиментам", "жалоба на пристава алименты",
      "неустойка по алиментам", "приставы алименты", "должник не работает алименты",
      "должник скрывает доход алименты", "ответственность за неуплату алиментов",
      "долг по алиментам после 18 лет", "ограничение выезда должника",
      "работодатель не удерживает алименты", "исполнительный лист алименты"
    ],
    relatedLawyerSpecializations: ["семейное право", "алименты", "исполнительное производство", "жалобы на приставов"],
    heroNote: {
      title: "Долг не исчезает сам",
      text: "Задолженность по алиментам продолжает накапливаться, пока пристав не взыщет её принудительно. Совершеннолетие ребёнка не списывает долг, накопившийся до 18 лет. Чем раньше подадите заявление о расчёте и мерах — тем лучше."
    },
    whatToKnow: [
      "Для взыскания долга нужен исполнительный документ: судебный приказ, исполнительный лист или нотариальное соглашение. Без него пристав не может начать взыскание.",
      "Официальный расчёт задолженности делает судебный пристав. Его нужно запрашивать письменным заявлением — сам он этого может не сделать вовремя.",
      "Отсутствие официальной работы не освобождает должника от алиментов. Долг накапливается, а пристав обязан искать доходы и имущество.",
      "Нотариальное соглашение об алиментах имеет силу исполнительного листа — его можно предъявить приставам или напрямую работодателю.",
      "Долг по алиментам не исчезает после совершеннолетия ребёнка, если задолженность образовалась до 18 лет.",
      "При просрочке алиментов можно требовать неустойку — взыскивается через суд на основании расчёта пристава.",
      "Пристав обязан принимать меры: запросы в банки, ФНС, Росреестр, ГИБДД, аресты и ограничения. Но взыскатель должен активно подавать заявления и контролировать производство.",
      "Если пристав бездействует — жалуйтесь старшему приставу, в прокуратуру или оспаривайте в суде.",
      "При систематической неуплате возможна административная, а затем уголовная ответственность должника."
    ],
    deadlines: [
      "Задолженность взыскивается за весь период неуплаты, если исполнительный документ был предъявлен вовремя.",
      "Долг, накопившийся по вине должника, не ограничен сроком давности в рамках исполнительного производства.",
      "Для взыскания неустойки нужен расчёт задолженности от пристава и отдельный иск в суд.",
      "Срок предъявления исполнительного листа — три года. Следите, чтобы документ был в производстве."
    ],
    risks: [
      "Без заявления о расчёте задолженности пристав может не оформить долг официально — и взыскать его будет сложнее.",
      "Чем дольше должник не платит, тем больше долг. При этом имущество и доходы могут исчезать.",
      "Если пропустить срок для жалобы на пристава или подачи иска о неустойке, часть требований может быть утеряна."
    ],
    steps: [
      "Найдите исполнительный документ: судебный приказ, исполнительный лист или нотариальное соглашение.",
      "Уточните у пристава: возбуждено ли исполнительное производство, кто пристав, какой отдел ФССП.",
      "Подайте заявление о расчёте задолженности по алиментам — получите официальный документ с суммой долга.",
      "Передайте приставу все известные сведения о должнике: работа, счета, автомобиль, недвижимость, бизнес, ИНН, телефоны.",
      "Потребуйте меры взыскания: запросы в банки, ФНС, Росреестр, ГИБДД, работодателю; аресты и ограничения.",
      "Проверьте, что пристав сделал: направлял ли запросы, выносил ли постановления, применял ли ограничения.",
      "Если пристав бездействует — подайте жалобу старшему приставу, затем в прокуратуру или суд.",
      "Если долг подтверждён — подготовьте расчёт неустойки и подайте иск в суд.",
      "Если должник злостно уклоняется — добивайтесь рассмотрения вопроса об административной или уголовной ответственности.",
      "Контролируйте производство регулярно: проверяйте постановления, удержания, аресты, ответы банков и работодателей."
    ],
    documents: [
      "Заявление приставу о расчёте задолженности по алиментам",
      "Заявление о применении мер принудительного взыскания (запросы, аресты, ограничения)",
      "Жалоба на бездействие судебного пристава — старшему приставу, в прокуратуру или суд",
      "Судебный приказ, исполнительный лист или нотариальное соглашение",
      "Банковские выписки и документы о поступивших платежах",
      "Расчёт неустойки и исковое заявление о взыскании неустойки по алиментам",
      "Сведения о должнике: место работы, счета, имущество, ИНН, телефоны"
    ],
    mistakes: [
      "Ждать, что пристав сам найдёт все доходы и имущество — нужно активно передавать сведения.",
      "Не подавать заявление о расчёте задолженности — без него взыскать неустойку и долг сложнее.",
      "Не сохранять копии всех заявлений, квитанций, ответов пристава и банковских выписок.",
      "Не проверять, направил ли пристав исполнительный документ работодателю или в банк.",
      "Не обжаловать бездействие пристава — оставлять без реакции затягивание производства.",
      "Считать, что долг исчезает после 18-летия ребёнка.",
      "Требовать неустойку без официального расчёта задолженности от пристава.",
      "Не передавать приставу информацию о неофициальных доходах, счетах или имуществе должника.",
      "Путать первичное взыскание алиментов и взыскание накопившейся задолженности.",
      "Не использовать меры ограничения выезда, водительских прав, ареста счетов, когда есть основания."
    ],
    faq: [
      {
        question: "Что делать, если алименты не платят?",
        answer: "Проверьте исполнительный документ, обратитесь к приставу, подайте заявление о расчёте задолженности и потребуйте меры взыскания. Если пристав бездействует — жалуйтесь старшему приставу, в прокуратуру или суд."
      },
      {
        question: "Как узнать сумму долга по алиментам?",
        answer: "Официальный расчёт задолженности делает судебный пристав. Подайте письменное заявление о расчёте долга и получите постановление с суммой."
      },
      {
        question: "Можно ли взыскать долг, если ребёнку уже 18 лет?",
        answer: "Да. Если задолженность образовалась до совершеннолетия ребёнка, она не исчезает. Долг можно продолжать взыскивать в рамках исполнительного производства."
      },
      {
        question: "Что делать, если пристав ничего не делает?",
        answer: "Подайте письменное заявление о совершении исполнительных действий, затем жалобу старшему приставу. Если результата нет — обращайтесь в прокуратуру или суд."
      },
      {
        question: "Можно ли взыскать неустойку по алиментам?",
        answer: "Да, при просрочке алиментов можно требовать неустойку. Для этого нужен расчёт задолженности от пристава и отдельный иск в суд. Актуальный размер проверяйте по СК РФ."
      },
      {
        question: "Что делать, если должник не работает официально?",
        answer: "Отсутствие официальной работы не освобождает от алиментов. Передайте приставу все известные сведения о доходах и имуществе. Долг накапливается и подлежит взысканию."
      },
      {
        question: "Может ли пристав ограничить должнику выезд за границу?",
        answer: "Да, при наличии оснований по закону об исполнительном производстве. Проверьте размер задолженности и условия применения этой меры по актуальной редакции закона."
      },
      {
        question: "Что делать, если работодатель не удерживает алименты?",
        answer: "Проверьте, получил ли работодатель исполнительный документ или постановление пристава. Если получил, но не удерживает — жалуйтесь приставу и требуйте проверки работодателя."
      },
      {
        question: "Как взыскать долг, если должник в другом регионе?",
        answer: "Передайте приставу все известные сведения о должнике. Пристав может направить поручения в другой отдел ФССП или добиться передачи производства по месту нахождения должника."
      },
      {
        question: "Можно ли привлечь должника к уголовной ответственности?",
        answer: "Возможно при наличии оснований по УК РФ и после применения административной ответственности. Конкретный порядок проверяйте по актуальным КоАП РФ и УК РФ совместно с приставом."
      },
      {
        question: "Что делать, если должник платит маленькими суммами?",
        answer: "Проверьте, покрывают ли суммы текущие алименты и долг. Если задолженность продолжает расти — требуйте официальный расчёт, меры взыскания и при наличии оснований неустойку."
      },
      {
        question: "Алименты ещё не взысканы — эта страница подходит?",
        answer: "Нет. Эта страница для ситуации, когда алименты уже назначены, но не платятся. Если алименты ещё не оформлены — перейдите в ситуацию «Алименты», чтобы выбрать способ взыскания."
      }
    ],
    selfHelpConditions: [
      "есть исполнительный документ и известен пристав;",
      "должник официально работает и место работы известно;",
      "нужно подать заявление о расчёте задолженности;",
      "нужно передать исполнительный документ работодателю напрямую;",
      "долг небольшой и нет спора по расчёту;",
      "пристав отвечает на заявления и принимает меры."
    ],
    lawyerConditions: [
      "долг большой и копится давно;",
      "приставы бездействуют и жалобы не дают результата;",
      "должник скрывает доходы или работает неофициально;",
      "должник является ИП, самозанятым или военнослужащим;",
      "должник уехал в другой регион или за границу;",
      "нужно взыскать неустойку через суд;",
      "нужно оспорить расчёт задолженности;",
      "должник пытается уменьшить или списать долг;",
      "нужно привлечь должника к административной или уголовной ответственности;",
      "ребёнку уже 18 лет, но долг остался и должник отказывается платить;",
      "нужно обжаловать действия пристава в суде."
    ]
  },
  "semya-i-deti/alimenty": {
    title: "Алименты",
    h1: "Алименты",
    shortTitle: "Алименты",
    shortAnswer: "Алименты — это деньги на содержание ребёнка, бывшего супруга, нетрудоспособного родителя или другого члена семьи. Чаще всего взыскивают на несовершеннолетних детей: по соглашению у нотариуса, через судебный приказ или через иск в суд.",
    description: "Единая страница по алиментам: первичное взыскание, нотариальное соглашение, судебный приказ, иск, твёрдая сумма, алименты за прошлый период, долг, неустойка, приставы, скрытые доходы, самозанятый или ИП, изменение размера и дополнительные расходы.",
    seoTitle: "Алименты — взыскание, долг, неуплата, приставы, документы и порядок действий",
    seoDescription: "Единая страница по алиментам: как взыскать алименты, оформить соглашение, выбрать судебный приказ или иск, получить долг и неустойку, работать с приставами, подтвердить скрытые доходы, изменить размер выплат и взыскать дополнительные расходы.",
    riskLevel: "high",
    urgency: "standard",
    urgencyNote: "Обычная, если алименты только планируют оформить. Высокая, если уже есть долг, должник скрывает доходы, ребёнок не получает содержание или приставы бездействуют — нужно действовать немедленно.",
    legalReferenceKeys: ["sk_80", "sk_81", "sk_83", "sk_86", "sk_99", "sk_100", "sk_106", "sk_107", "sk_113", "sk_114", "sk_115", "gpk_23", "gpk_29", "gpk_131", "gpk_132", "nk_333_36", "fz229_30", "fz229_50", "fz229_64", "fz229_67", "fz229_99", "fz229_121"],
    relatedDocumentSlugs: ["zayavlenie-o-vzyskanii-alimentov", "iskovoe-zayavlenie", "zhaloba-na-sudebnogo-pristava"],
    relatedQuestionTopics: [
      "алименты", "алименты на ребенка", "взыскание алиментов", "судебный приказ на алименты",
      "алименты в твердой денежной сумме", "долг по алиментам", "задолженность по алиментам",
      "неустойка по алиментам", "алименты если отец не работает", "алименты с ИП",
      "алименты с самозанятого", "установление отцовства и алименты", "приставы алименты",
      "алименты не платят", "жалоба на пристава алименты", "взыскать долг по алиментам", "злостное уклонение алименты",
      "увеличить алименты", "уменьшить алименты", "алименты за прошлый период", "дополнительные расходы на ребенка"
    ],
    relatedLawyerSpecializations: ["семейное право", "алименты", "исполнительное производство"],
    heroNote: {
      title: "Все ситуации по алиментам на одной странице",
      text: "Здесь собраны первичное взыскание, алименты по соглашению, судебный приказ или иск, твёрдая сумма, долг и неустойка, работа с приставами, скрытые доходы, самозанятый или ИП, изменение размера выплат и дополнительные расходы."
    },
    whatToKnow: [
      "На этой странице собраны основные ситуации: взыскать алименты впервые, оформить соглашение, выбрать приказ или иск, взыскать долг и неустойку, пожаловаться на пристава, изменить размер выплат, взыскать дополнительные расходы и разобраться с доходами ИП, самозанятого или безработного плательщика.",
      "Родители обязаны содержать несовершеннолетних детей независимо от того, состоят они в браке, разведены или никогда не были женаты.",
      "Алименты можно взыскать без развода — расторжение брака не является обязательным условием.",
      "Если отец не указан в свидетельстве о рождении или отцовство оспаривается, сначала может потребоваться установить отцовство.",
      "Алименты обычно присуждаются с момента обращения в суд. За прошлый период — только в пределах трёх лет при доказательстве попыток получить деньги добровольно.",
      "Нотариальное соглашение об алиментах имеет силу исполнительного листа — при неуплате его можно напрямую предъявить приставам или работодателю.",
      "Судебный приказ быстрее иска, но должник вправе отменить его, просто подав возражения. После отмены нужно подавать иск.",
      "Если плательщик не работает официально или скрывает доход — часто стоит рассмотреть алименты в твёрдой денежной сумме.",
      "Задолженность по алиментам рассчитывает пристав. На сумму долга можно взыскать неустойку, но суд вправе её уменьшить.",
      "Отсутствие официальной работы не освобождает родителя от алиментов.",
      "На одного ребёнка — ¼ дохода, на двух — ⅓, на трёх и более — ½. Суд может изменить эти доли."
    ],
    deadlines: [
      "Алименты присуждаются с момента обращения в суд — не ждите, если второй родитель уклоняется.",
      "За прошлый период можно взыскать алименты в пределах трёх лет — при условии, что вы пытались получить деньги добровольно, а плательщик уклонялся.",
      "Истцы по искам о взыскании алиментов освобождены от госпошлины (ст. 333.36 НК РФ). При дополнительных требованиях — проверить отдельно.",
      "Судебный приказ выдаётся быстрее, чем решается иск. Но если должник подаст возражения — приказ отменят."
    ],
    risks: [
      "Устная договорённость или расписка не дают права предъявить документ приставам — нужно нотариальное соглашение или судебный акт.",
      "Долг по алиментам копится с процентами: чем дольше ждать с исполнением, тем больше сумма.",
      "Если пропустить момент отмены судебного приказа и не подать иск, время на взыскание будет потеряно."
    ],
    steps: [
      "Определите, какой результат нужен: взыскать алименты впервые, оформить соглашение, получить долг, изменить размер выплат или взыскать неустойку.",
      "Проверьте, можно ли договориться. Если да — оформите нотариальное соглашение об уплате алиментов.",
      "Если договориться нельзя — выберите между судебным приказом и иском. Приказ подходит для простого взыскания в долях без спора. Иск — для твёрдой суммы, спора или отменённого приказа.",
      "Соберите документы: свидетельство о рождении ребёнка, сведения о родителях, документы о браке/разводе, данные о доходах и расходах.",
      "Подайте заявление. Иск о взыскании алиментов можно подать по месту жительства истца или ответчика.",
      "Получите исполнительный документ: судебный приказ, исполнительный лист или сохраните нотариальное соглашение.",
      "Передайте документ приставам или напрямую работодателю должника, если известно место работы.",
      "Контролируйте исполнение: проверяйте удержания, задолженность и меры к должнику.",
      "Если долг растёт — требуйте расчёт задолженности, неустойку, ограничения для должника и проверку его доходов."
    ],
    documents: [
      "Заявление о выдаче судебного приказа — для простого взыскания алиментов на ребёнка в долях от дохода",
      "Исковое заявление о взыскании алиментов — если нужен иск или приказ был отменён",
      "Свидетельство о рождении ребёнка, документы о браке или разводе",
      "Документы о доходах и расходах, если взыскивается твёрдая денежная сумма",
      "Доказательства попыток получить деньги добровольно — если взыскиваются алименты за прошлый период",
      "Исполнительный документ (приказ, лист или соглашение) + заявление приставам",
      "Жалоба на бездействие пристава — если долг растёт, а мер нет"
    ],
    mistakes: [
      "Договариваться устно и не оформлять алименты нотариально или через суд.",
      "Подать заявление о судебном приказе, когда нужен иск (твёрдая сумма, спор, отцовство).",
      "Не учитывать, что должник может отменить судебный приказ простыми возражениями.",
      "Не приложить свидетельство о рождении ребёнка к заявлению.",
      "Не указать данные должника — адрес, место работы, — которые помогают суду и приставам.",
      "Просить твёрдую сумму без доказательств расходов на ребёнка и доходов сторон.",
      "Считать, что алименты начисляются автоматически за все прошлые годы.",
      "Не передать исполнительный документ приставам или работодателю после получения.",
      "Не обжаловать бездействие пристава, когда долг копится.",
      "Считать, что отсутствие официальной работы освобождает родителя от алиментов."
    ],
    faq: [
      {
        question: "Можно ли взыскать алименты без развода?",
        answer: "Да. Алименты взыскиваются независимо от того, состоят родители в браке или уже развелись. Главное — подтвердить обязанность содержать ребёнка."
      },
      {
        question: "Что лучше: судебный приказ или иск?",
        answer: "Судебный приказ подходит для простого взыскания на несовершеннолетнего ребёнка в долях, если нет спора. Если нужна твёрдая сумма, есть спор, приказ отменён или нужно установить отцовство — подают иск."
      },
      {
        question: "Сколько алиментов положено на одного ребёнка?",
        answer: "На одного ребёнка — четверть дохода, на двух — треть, на трёх и более — половина. Суд может изменить размер с учётом обстоятельств сторон."
      },
      {
        question: "Можно ли взыскать алименты в твёрдой денежной сумме?",
        answer: "Да, если взыскание в долях затруднительно или нарушает интересы ребёнка: нерегулярный доход, неофициальный заработок, доход в валюте или натуре, скрытые доходы."
      },
      {
        question: "С какого момента начисляются алименты?",
        answer: "Обычно с момента обращения в суд. За прошлый период — в пределах трёх лет, если доказать, что получатель пытался добиться выплат, а плательщик уклонялся."
      },
      {
        question: "Нужно ли платить госпошлину за иск о взыскании алиментов?",
        answer: "Нет. Истцы по искам о взыскании алиментов освобождены от госпошлины. Если заявлены дополнительные требования — нужно проверить отдельно."
      },
      {
        question: "Что делать, если алименты не платят?",
        answer: "Предъявите исполнительный документ приставам или работодателю должника. Контролируйте расчёт задолженности и при необходимости требуйте меры принудительного взыскания."
      },
      {
        question: "Можно ли взыскать долг по алиментам?",
        answer: "Да. При наличии исполнительного документа или нотариального соглашения пристав рассчитывает задолженность. Можно также взыскать неустойку за просрочку."
      },
      {
        question: "Что делать, если отец официально не работает?",
        answer: "Отсутствие официальной работы не освобождает от алиментов. Можно рассмотреть твёрдую денежную сумму, собрать доказательства реальных доходов и работать через приставов."
      },
      {
        question: "Можно ли уменьшить или увеличить алименты?",
        answer: "Да, если изменились обстоятельства: доход, семейное положение, состояние здоровья, потребности ребёнка. Подаётся отдельное заявление в суд."
      },
      {
        question: "Можно ли оформить алименты без суда?",
        answer: "Да. Если стороны договорились — заключается нотариальное соглашение об уплате алиментов. Оно имеет силу исполнительного листа."
      },
      {
        question: "Можно ли взыскать алименты с самозанятого или ИП?",
        answer: "Да, но может потребоваться подтвердить реальные доходы. В таких случаях часто рассматривают твёрдую денежную сумму или смешанный способ взыскания."
      }
    ],
    selfHelpConditions: [
      "нужно взыскать алименты на несовершеннолетнего ребёнка впервые;",
      "родство подтверждено свидетельством о рождении;",
      "известен адрес или место работы второго родителя;",
      "нет спора об отцовстве;",
      "не нужно доказывать скрытые доходы;",
      "алименты взыскиваются в стандартных долях от дохода;",
      "нет спора о месте жительства ребёнка."
    ],
    lawyerConditions: [
      "плательщик не работает официально или скрывает доход;",
      "нужна твёрдая денежная сумма или смешанный способ взыскания;",
      "судебный приказ уже отменён;",
      "нужно взыскать алименты за прошлый период;",
      "накопился долг по алиментам или нужна неустойка;",
      "должник живёт в другом регионе или за границей;",
      "нужно установить отцовство;",
      "нужно взыскать дополнительные расходы на лечение, обучение или уход;",
      "плательщик — военнослужащий, ИП или самозанятый;",
      "приставы бездействуют или должник скрывает имущество;",
      "плательщик просит уменьшить алименты."
    ]
  },
  "semya-i-deti/razvod": {
    title: "Развод",
    h1: "Развод",
    shortTitle: "Развод",
    shortAnswer: "Если нет общих несовершеннолетних детей и оба супруга согласны — обычно ЗАГС. Если есть дети, второй супруг против или есть спор о ребёнке — суд.",
    description: "Развод через ЗАГС занимает около месяца и доступен, когда нет общих детей до 18 лет и оба супруга согласны. Во всех остальных случаях — суд: мировой судья, если нет спора о детях, или районный суд, если есть спор о месте жительства ребёнка. Вместе с разводом можно заявить алименты, раздел имущества и определить порядок общения с ребёнком — или оформить это отдельно. Муж не вправе подать на развод без согласия жены во время её беременности и в течение года после рождения ребёнка.",
    seoTitle: "Развод через ЗАГС и суд — документы, сроки, госпошлина и порядок действий",
    seoDescription: "Как оформить развод через ЗАГС или суд: когда нужен иск, куда подавать заявление, какие документы подготовить, сколько длится развод, что делать с детьми, алиментами и имуществом.",
    relatedDocumentSlugs: [
      "isk-o-rastorzhenii-braka",
      "zayavlenie-o-vzyskanii-alimentov",
      "zayavlenie-ob-opredelenii-mesta-zhitelstva-rebenka",
      "zayavlenie-ob-ustanovlenii-poryadka-obscheniya-s-rebenkom",
      "isk-o-razdele-imuschestva"
    ],
    relatedQuestionTopics: ["развод", "расторжение брака", "развод с детьми", "развод через суд", "развод через ЗАГС", "алименты", "раздел имущества", "место жительства ребенка"],
    relatedLawyerSpecializations: ["семейное право", "алименты", "раздел имущества", "развод"],
    whatToKnow: [
      "Сам развод и споры о детях, алиментах и имуществе — это разные юридические вопросы. Их можно объединять, но иногда выгоднее подать отдельные заявления.",
      "Если второй супруг против развода, суд может дать срок для примирения, но несогласие супруга само по себе не означает, что развод невозможен.",
      "Если оба согласны на развод, но есть общие несовершеннолетние дети, всё равно обычно нужен суд.",
      "Если нет детей до 18 лет и оба согласны, чаще всего быстрее идти в ЗАГС, а не в суд.",
      "Муж не может подать иск о разводе без согласия жены во время её беременности и в течение года после рождения ребенка.",
      "Брак, расторгнутый через суд, прекращается после вступления решения суда в законную силу, а затем развод нужно зарегистрировать в ЗАГСе.",
      "Если есть совместное имущество, ипотека, кредиты или бизнес, не стоит подписывать соглашения и отказы без проверки последствий.",
      "Если есть спор о ребёнке, важно заранее подготовить доказательства: с кем ребёнок проживает, кто занимается воспитанием, какие условия у каждого родителя."
    ],
    deadlines: [
      "Через ЗАГС: развод регистрируется по истечении месяца после подачи заявления.",
      "Через суд: если второй супруг против, суд может дать срок для примирения; после решения нужно дождаться вступления его в законную силу, затем зарегистрировать развод в ЗАГСе.",
      "Госпошлина: при подаче иска о расторжении брака оплачивается госпошлина; после решения суда может потребоваться отдельная госпошлина за регистрацию в ЗАГСе. Актуальный размер проверяйте по НК РФ и реквизитам конкретного суда или ЗАГСа."
    ],
    risks: [
      "Устные договоренности о детях и имуществе могут перестать работать после конфликта — их нужно закреплять письменно.",
      "Без доказательств проживания ребёнка с истцом позиция при споре о детях будет слабее.",
      "Подписание соглашений о детях или имуществе без понимания последствий может затруднить изменение условий в будущем."
    ],
    steps: [
      "Определите способ развода: через ЗАГС или через суд. Если нет общих детей до 18 лет и оба согласны — обычно можно через ЗАГС или Госуслуги.",
      "Если нужен суд, определите подсудность: без спора о детях — обычно мировой судья; при споре о месте жительства ребёнка — районный суд.",
      "Подготовьте иск: укажите дату брака, сведения о детях, причины развода, позицию второго супруга, наличие или отсутствие спора о детях и имуществе.",
      "Оплатите госпошлину по реквизитам конкретного суда или судебного участка.",
      "Направьте копию иска второму супругу и сохраните подтверждение отправки.",
      "Подайте иск в суд: лично, через представителя, почтой или электронно, если суд поддерживает такую подачу.",
      "Примите участие в заседании. Если второй супруг против, будьте готовы подтвердить, что семья фактически распалась и примирение невозможно.",
      "После вступления решения суда в законную силу зарегистрируйте развод в ЗАГСе и получите свидетельство."
    ],
    documents: [
      "Для ЗАГС: паспорта, свидетельство о браке, совместное заявление или заявление одного супруга в предусмотренных законом случаях, квитанция об оплате госпошлины.",
      "Для суда: исковое заявление, свидетельство о браке, копии свидетельств о рождении детей, данные ответчика, квитанция об оплате госпошлины, подтверждение направления копии иска ответчику.",
      "При дополнительных требованиях: документы о доходах для алиментов, документы на имущество, выписка ЕГРН, кредитный или ипотечный договор, доказательства участия в воспитании ребёнка."
    ],
    mistakes: [
      "Подать заявление в суд, хотя можно было быстрее развестись через ЗАГС.",
      "Подать иск мировому судье, когда есть спор о ребёнке и нужен районный суд.",
      "Не указать, есть ли спор о детях и имуществе — это влияет на подсудность и состав документов.",
      "Не приложить свидетельство о браке к исковому заявлению.",
      "Не подтвердить отправку копии иска ответчику.",
      "Оплатить госпошлину по неправильным реквизитам.",
      "Объединить развод, алименты, спор о ребёнке и раздел имущества без проверки подсудности.",
      "Подписать соглашение о детях или имуществе без понимания последствий.",
      "Считать, что развод автоматически решает вопросы алиментов и раздела имущества."
    ],
    faq: [
      {
        question: "Можно ли развестись без согласия второго супруга?",
        answer: "Да, если второй супруг против, развод возможен через суд. Суд может дать срок для примирения, но если примирение не произошло и истец настаивает на разводе, брак может быть расторгнут."
      },
      {
        question: "Куда подавать на развод, если есть дети?",
        answer: "Если есть общие несовершеннолетние дети, обычно нужно обращаться в суд. Если спора о детях нет, дело чаще относится к мировому судье. Если есть спор о месте жительства ребёнка или порядке общения, может понадобиться районный суд."
      },
      {
        question: "Можно ли подать на развод через ЗАГС, если детей нет?",
        answer: "Да, если оба супруга согласны и у них нет общих несовершеннолетних детей. Если второй супруг уклоняется или не согласен, вопрос решается через суд."
      },
      {
        question: "Можно ли подать иск по своему месту жительства?",
        answer: "Иногда да. Например, если с истцом проживает несовершеннолетний ребёнок или состояние здоровья не позволяет ехать к месту жительства ответчика."
      },
      {
        question: "Нужно ли сразу делить имущество при разводе?",
        answer: "Не всегда. Развод и раздел имущества можно заявить вместе, но иногда выгоднее разделить процессы. Это зависит от состава имущества, цены требований, ипотеки, кредитов и позиции второго супруга."
      },
      {
        question: "Можно ли одновременно подать на алименты?",
        answer: "Да, алименты можно заявить отдельно или вместе с другими требованиями. Нужно проверить, какой порядок лучше: судебный приказ, исковое заявление или соглашение об алиментах."
      },
      {
        question: "Когда брак считается расторгнутым через суд?",
        answer: "При разводе через суд брак прекращается после вступления решения суда в законную силу. После этого расторжение брака регистрируется в ЗАГСе."
      },
      {
        question: "Может ли муж подать на развод, если жена беременна?",
        answer: "Без согласия жены муж не может подать иск о разводе во время беременности жены и в течение года после рождения ребёнка."
      },
      {
        question: "Сколько стоит развод?",
        answer: "Расходы зависят от способа развода: через ЗАГС или через суд, а также от дополнительных требований. Актуальную госпошлину нужно проверять по НК РФ и реквизитам конкретного суда или ЗАГСа."
      },
      {
        question: "Что делать, если свидетельство о браке у второго супруга?",
        answer: "Можно получить повторное свидетельство в ЗАГСе или указать в иске, что оригинал находится у ответчика. Конкретный вариант зависит от обстоятельств и требований суда."
      }
    ],
    heroNote: {
      title: "Что важно проверить сразу",
      text: "Есть ли общие дети до 18 лет — от этого зависит, нужен суд или ЗАГС. Согласен ли второй супруг и известен ли его адрес. Есть ли споры о детях, имуществе или ипотеке — это влияет на подсудность и список документов."
    },
    selfHelpConditions: [
      "оба супруга согласны на развод;",
      "нет спора о детях;",
      "нет спора о крупном имуществе;",
      "известен адрес второго супруга;",
      "есть свидетельство о браке и документы на детей;",
      "нужно только расторгнуть брак, без сложных дополнительных требований.",
      "важно внимательно проверить подсудность, госпошлину и приложения к иску, чтобы заявление не оставили без движения."
    ],
    lawyerConditions: [
      "второй супруг против развода;",
      "неизвестен адрес ответчика;",
      "есть спор о том, с кем будет жить ребёнок;",
      "второй родитель ограничивает общение с ребёнком;",
      "нужно одновременно взыскать алименты и нет уверенности в порядке взыскания;",
      "есть квартира, ипотека, кредиты, автомобиль, бизнес или доли в имуществе;",
      "супруг продал имущество перед разводом;",
      "есть брачный договор или соглашение о разделе имущества;",
      "один из супругов живёт за границей;",
      "есть риск, что второй супруг вывезет ребёнка или скрывает доходы;",
      "суд уже оставил иск без движения или вернул заявление."
    ]
  },
  "semya-i-deti/razdel-imushchestva-suprugov": {
    title: "Раздел имущества супругов",
    h1: "Раздел имущества супругов",
    shortTitle: "Раздел имущества",
    shortAnswer: "Раздел имущества нужен, если супруги хотят определить, кому останется квартира, машина, деньги, бизнес, ипотека или кредиты — при разводе, во время брака или при подготовке к нему. Имущество можно разделить по соглашению у нотариуса или через суд, если договориться не получается.",
    description: "На этой странице разберём, что считается совместно нажитым, что не делится, как делятся квартира, ипотека, кредиты, вклады, бизнес и доли, какие документы нужны и когда срочно обратиться к юристу.",
    seoTitle: "Раздел имущества супругов — квартира, ипотека, долги и порядок действий",
    seoDescription: "Как разделить имущество супругов после развода или в браке: что считается совместно нажитым, что не делится, куда подавать иск, какие документы нужны, как делятся квартира, ипотека, кредиты и бизнес.",
    riskLevel: "high",
    urgency: "standard",
    urgencyNote: "Обычная, если стороны собирают документы спокойно. Высокая, если имущество продают, переоформляют, выводят деньги или истекает срок исковой давности — действовать нужно немедленно.",
    legalReferenceKeys: ["sk_33", "sk_34", "sk_35", "sk_36", "sk_37", "sk_38", "sk_39", "gpk_23", "gpk_28", "gpk_30", "gpk_131", "gpk_132", "nk_333_19"],
    relatedDocumentSlugs: ["isk-o-razdele-imuschestva", "iskovoe-zayavlenie"],
    relatedQuestionTopics: [
      "раздел имущества", "раздел имущества при разводе", "раздел квартиры при разводе",
      "ипотека при разводе", "раздел машины при разводе", "кредиты супругов при разводе",
      "делится ли подаренная квартира", "делится ли имущество до брака", "брачный договор",
      "имущество оформлено на одного супруга", "материнский капитал при разводе"
    ],
    relatedLawyerSpecializations: ["семейное право", "раздел имущества", "развод", "споры о недвижимости"],
    heroNote: {
      title: "Действуйте сразу, если имущество продают",
      text: "Если второй супруг продаёт, дарит или переоформляет имущество — нужно немедленно подать иск и заявить обеспечительные меры (арест). Сделку без вашего согласия можно оспорить, но только в течение года с момента, когда вы о ней узнали."
    },
    whatToKnow: [
      "Разделу подлежит совместно нажитое имущество — всё, что куплено в браке на общие средства, независимо от того, на чьё имя оформлено.",
      "Личное имущество (добрачное, полученное в дар или по наследству) обычно не делится, но если в браке оно значительно улучшено за счёт общих денег — может стать предметом спора.",
      "По общему правилу доли супругов равны, но суд вправе отступить от равенства в интересах детей или при доказанном недобросовестном поведении одного из супругов.",
      "Раздел можно проводить во время брака, одновременно с разводом или после расторжения брака — срок исковой давности три года.",
      "Три года считаются не с даты развода, а с момента, когда супруг узнал или должен был узнать о нарушении своего права.",
      "Общие долги и ипотека тоже делятся — пропорционально присуждённым долям, но изменение кредитного договора требует согласия банка.",
      "Если есть брачный договор — сначала проверьте его условия и возможность оспаривания.",
      "Детские вещи и вклады на имя несовершеннолетних детей между супругами не делятся.",
      "Если второй супруг продал общее имущество без вашего согласия, сделку можно оспорить в течение года с момента, когда вы о ней узнали.",
      "Если квартира в ипотеке — нужно учитывать позицию банка, остаток долга, первоначальный взнос, материнский капитал и фактические платежи."
    ],
    deadlines: [
      "Срок исковой давности — три года. Он считается не с даты расторжения брака, а с момента, когда вы узнали о нарушении своего права на имущество.",
      "Для оспаривания сделок по продаже или дарению общего имущества без вашего согласия — один год с момента, когда узнали о сделке.",
      "При угрозе продажи имущества — ходатайство об обеспечительных мерах подаётся одновременно с иском, суд рассматривает его оперативно.",
      "Госпошлина рассчитывается от цены иска по ст. 333.19 НК РФ. Цена иска — стоимость доли, на которую вы претендуете."
    ],
    risks: [
      "Без официального раздела оба супруга формально имеют права на общее имущество — любой может продать его без согласия другого.",
      "Чем дольше откладывать иск, тем больше активов может быть переоформлено, продано или выведено.",
      "Пропуск срока исковой давности не лишает права подать иск, но ответчик вправе заявить об истечении срока — и суд откажет в иске."
    ],
    steps: [
      "Составьте список всего имущества: квартира, дом, участок, машина, гараж, техника, мебель, вклады, счета, ипотека, кредиты, бизнес, доли, ценные бумаги.",
      "Отделите личное имущество от общего: что было до брака, получено в дар или по наследству — обычно не делится.",
      "Соберите документы: выписки ЕГРН, договоры купли-продажи, ПТС, банковские выписки, кредитные договоры, чеки, справки об остатке долга.",
      "Определите, есть ли брачный договор или готовое соглашение — если да, сначала проверьте его условия.",
      "Оцените имущество: для иска нужна цена иска, по спорным объектам — отчёт оценщика.",
      "Если договориться можно — составьте соглашение о разделе имущества и удостоверьте его у нотариуса.",
      "Если договориться нельзя — подготовьте иск. Укажите состав имущества, стоимость, дату приобретения, на кого оформлено и как просите разделить.",
      "Определите суд: до 50 000 ₽ — мировой судья, свыше — районный суд. По недвижимости проверьте правило об исключительной подсудности (ст. 30 ГПК РФ).",
      "Оплатите госпошлину от цены иска, направьте копию иска ответчику и сохраните подтверждение.",
      "Если есть риск продажи имущества — заявите ходатайство об обеспечительных мерах одновременно с подачей иска."
    ],
    documents: [
      "Иск о разделе совместно нажитого имущества с расчётом цены иска и госпошлины",
      "Свидетельство о браке / о расторжении брака, паспорт истца",
      "Выписка ЕГРН на недвижимость, договор купли-продажи или ДДУ",
      "Ипотечный договор, кредитный договор, справка об остатке задолженности",
      "ПТС или СТС на автомобиль, данные о регистрации в ГИБДД",
      "Банковские выписки, договоры вклада, справки о счетах",
      "Документы на бизнес: выписка ЕГРЮЛ, устав, документы о доле в ООО, сведения о стоимости",
      "Документы о ремонте, реконструкции или значительных вложениях в личное имущество",
      "Отчёт об оценке имущества (если стоимость спорная или нужна для расчёта госпошлины)",
      "Ходатайство об обеспечении иска (при риске продажи или вывода активов)"
    ],
    mistakes: [
      "Считать, что имущество принадлежит тому, на кого оно оформлено — по закону оно может быть общим.",
      "Не включить в раздел банковские счета, вклады, автомобиль, бизнес или долги.",
      "Думать, что развод автоматически делит имущество между супругами.",
      "Ждать три года после развода и пропустить срок давности.",
      "Не заявить обеспечительные меры, когда супруг продаёт или переоформляет имущество.",
      "Подписать соглашение без нотариального удостоверения — оно не имеет силы.",
      "Не оценить имущество перед подачей иска и неправильно рассчитать цену иска и госпошлину.",
      "Подать иск не в тот суд — перепутать мирового и районного судью или забыть про подсудность по недвижимости.",
      "Не уведомить банк при разделе ипотечного жилья.",
      "Не учесть материнский капитал и интересы детей при разделе жилья.",
      "Объединить развод, алименты, спор о детях и раздел имущества без проверки подсудности."
    ],
    faq: [
      {
        question: "Можно ли разделить имущество без развода?",
        answer: "Да. Раздел общего имущества возможен как во время брака, так и после его расторжения. Если супруги договорились — оформляется нотариальное соглашение, если нет — через суд."
      },
      {
        question: "Всё ли имущество делится пополам?",
        answer: "По общему правилу доли равны, но суд может отступить от равенства при наличии оснований. Кроме того, не всё имущество является совместно нажитым."
      },
      {
        question: "Делится ли квартира, оформленная на одного супруга?",
        answer: "Да, может делиться, если куплена в браке за общие средства. Само оформление на одного супруга не исключает права второго."
      },
      {
        question: "Делится ли имущество, купленное до брака?",
        answer: "Обычно нет. Но если в браке были значительные вложения, которые увеличили его стоимость, может возникнуть спор о признании имущества общим или о компенсации."
      },
      {
        question: "Делится ли подаренная или унаследованная квартира?",
        answer: "Обычно это личное имущество супруга и разделу не подлежит. Но нужно проверить вложения в ремонт и реконструкцию за счёт общих средств."
      },
      {
        question: "Как делится ипотека при разводе?",
        answer: "Нужно учитывать, когда оформлена ипотека, кто заёмщик, откуда средства на первоначальный взнос, есть ли материнский капитал и каков остаток долга. Изменение условий кредита требует согласия банка."
      },
      {
        question: "Делятся ли кредиты супругов?",
        answer: "Не каждый кредит автоматически общий. Нужно доказать, что деньги потрачены на нужды семьи. Общие долги распределяются пропорционально присуждённым долям."
      },
      {
        question: "Что делать, если супруг продал имущество перед разводом?",
        answer: "Нужно проверить, требовалось ли согласие и можно ли оспорить сделку. Срок давности для оспаривания — один год с момента, когда узнали о сделке. Можно требовать компенсацию."
      },
      {
        question: "Какой срок исковой давности по разделу имущества?",
        answer: "Три года. В сложных случаях важно определить, с какого момента он начал течь — это не всегда дата развода."
      },
      {
        question: "Куда подавать иск о разделе имущества?",
        answer: "До 50 000 ₽ — мировой судья. Выше или сложный спор — районный суд. Если в споре участвует недвижимость, нужно проверить правило о подсудности по месту нахождения объекта (ст. 30 ГПК РФ)."
      },
      {
        question: "Можно ли разделить имущество соглашением?",
        answer: "Да. Если супруги договорились, заключается нотариально удостоверенное соглашение о разделе — без суда."
      },
      {
        question: "Нужно ли делить имущество одновременно с разводом?",
        answer: "Нет. Развод и раздел имущества можно заявить вместе или отдельно. Иногда выгоднее разделить процессы, если имущество сложное."
      }
    ],
    selfHelpConditions: [
      "имущество немногое и документы на него доступны;",
      "оба супруга согласны, кому что достанется, и готовы к соглашению у нотариуса;",
      "нет ипотеки, бизнеса, долей, крупных долгов и скрытых активов;",
      "имущество не продаётся и не переоформляется;",
      "стоимость имущества понятна и не вызывает споров;",
      "спор ограничен простой компенсацией или разделом бытового имущества."
    ],
    lawyerConditions: [
      "есть квартира, дом, земельный участок или ипотека;",
      "использовался материнский капитал;",
      "супруг продал, подарил, переоформил имущество или скрывает активы;",
      "имущество оформлено на родственников или третьих лиц;",
      "есть бизнес, доля в ООО, ИП или корпоративные права;",
      "есть крупные кредиты, займы или поручительства;",
      "второй супруг скрывает доходы, счета или имущество;",
      "есть брачный договор, который нужно проверить или оспорить;",
      "имущество куплено до брака, но ремонт или платежи были в браке;",
      "нужно срочно запретить регистрационные действия с недвижимостью или автомобилем;",
      "нужно разделить имущество за границей;",
      "второй супруг действует через представителя."
    ]
  },
  "semya-i-deti/opredelenie-mesta-zhitelstva-rebenka": {
    title: "Определение места жительства ребёнка",
    h1: "Определение места жительства ребёнка",
    shortTitle: "Место жительства ребёнка",
    shortAnswer: "Место жительства ребёнка определяют, когда родители живут отдельно и не могут договориться, с кем ребёнок будет постоянно проживать. Можно заключить соглашение или обратиться в суд. Суд оценивает не удобство родителей, а интересы ребёнка: привязанность, условия жизни, участие каждого родителя в воспитании, школу, здоровье, режим, мнение ребёнка и заключение органа опеки.",
    description: "Спор о постоянном проживании ребёнка решается соглашением родителей или в районном суде с обязательным участием органа опеки. Суд исходит из интересов ребёнка: оценивает, кто фактически ухаживает за ним каждый день, водит в школу, врача и кружки, кто несёт расходы и как выстроены отношения с ребёнком. Орган опеки обследует условия жизни обоих родителей и готовит заключение. Мнение ребёнка старше 10 лет суд обязан выслушать. После вынесения решения важно контролировать его исполнение — если второй родитель уклоняется, нужны приставы.",
    seoTitle: "Определение места жительства ребёнка — с кем останется ребёнок после развода",
    seoDescription: "Как определить место жительства ребёнка с матерью или отцом: когда нужно соглашение, когда подавать иск, что учитывает суд, как участвует орган опеки и какие доказательства подготовить.",
    riskLevel: "high",
    urgency: "standard",
    urgencyNote: "Срочность повышается, если второй родитель забрал ребёнка и не возвращает, есть риск вывоза в другой регион или страну, ребёнку угрожает опасность, родитель скрывает его местонахождение или суд уже назначен. В таких случаях нужно действовать немедленно.",
    heroNote: {
      title: "Что важно понять сразу",
      text: "Эта страница — про спор о том, с кем ребёнок будет постоянно жить. Определение места жительства не лишает второго родителя прав: он сохраняет право на общение и участие в воспитании. Если нужен только развод — см. «Развод». Если нужен график встреч — «Порядок общения с ребёнком». Если нужно взыскать содержание — «Алименты»."
    },
    whatToKnow: [
      "Суд решает вопрос исходя из интересов ребёнка — не из равенства прав родителей и не из пола родителя. У матери и отца равные права.",
      "Орган опеки обязательно участвует в деле: обследует жилищные условия обоих родителей, беседует с родителями и ребёнком, составляет акт и заключение для суда.",
      "Суд учитывает: возраст ребёнка, привязанность к каждому родителю и братьям/сёстрам, кто фактически ухаживает за ребёнком каждый день, кто водит в школу, сад, поликлинику, условия жизни, режим работы родителей, психологическую обстановку, состояние здоровья, привычную среду — школу, друзей, кружки.",
      "Мнение ребёнка старше 10 лет суд обязан выслушать и учесть, если это не противоречит его интересам. Суд оценивает, не находится ли ребёнок под давлением.",
      "Нет автоматического правила — «маленький ребёнок остаётся с матерью» или «ребёнок старше определённого возраста — с отцом». Суд исходит из интересов конкретного ребёнка.",
      "Если ребёнок фактически живёт с одним из родителей, суд учитывает сложившийся уклад и не меняет его без весомых оснований.",
      "Решение о месте жительства можно пересмотреть, если обстоятельства существенно изменились: переезд, изменение условий жизни, смена поведения родителя.",
      "При риске вывоза ребёнка в другой регион или страну можно просить суд о временных обеспечительных мерах.",
      "Эта страница не заменяет «Порядок общения с ребёнком» — место жительства определяет, где ребёнок живёт постоянно, а порядок общения — как второй родитель с ним видится."
    ],
    deadlines: [
      "Специального срока исковой давности нет — иск можно подать в любое время до совершеннолетия ребёнка.",
      "Если есть риск вывоза ребёнка за границу или удержания — действовать нужно немедленно, просить обеспечительные меры.",
      "Рассмотрение спора в суде может занять несколько месяцев, с учётом участия органа опеки, обследований и экспертиз.",
      "Госпошлина: требование об определении места жительства ребёнка относится к неимущественным требованиям. Размер госпошлины — по актуальной редакции ст. 333.19 НК РФ на дату подачи иска. Если вместе заявлены алименты, развод или раздел имущества, госпошлина рассчитывается отдельно по каждому требованию."
    ],
    risks: [
      "Без официально оформленного соглашения или решения суда каждый родитель формально имеет равные права — это создаёт конфликты при вопросах о школе, лечении, выезде.",
      "Без доказательств фактического участия в воспитании позиция родителя в суде будет слабее, даже если он реально занимался ребёнком.",
      "Вывоз ребёнка без согласия другого родителя и без решения суда может расцениваться как нарушение прав.",
      "Настраивание ребёнка против второго родителя суд замечает и расценивает против того, кто это делает.",
      "Ограничение общения ребёнка со вторым родителем без оснований может быть оценено против вас при решении о месте жительства."
    ],
    steps: [
      "Определите цель: закрепить проживание ребёнка с вами, вернуть ребёнка, предотвратить вывоз, договориться мирно или подготовиться к суду.",
      "Проверьте, можно ли договориться. Если родители готовы, оформите письменное соглашение о месте жительства ребёнка и отдельно — порядке общения второго родителя.",
      "Не ограничивайте общение без оснований. Если нет угрозы ребёнку, полное ограничение контакта со вторым родителем может быть оценено против вас. Фиксируйте конфликт письменно.",
      "Соберите доказательства фактического ухода: кто водит в школу, садик, врача, кружки, кто несёт расходы, кто занимается бытом и режимом ребёнка.",
      "Подготовьте условия к обследованию органа опеки: место для сна и занятий ребёнка, документы о школе, садике, лечении, режиме, доходах и занятости.",
      "Подготовьте иск. В нём — с кем должен жить ребёнок, почему это отвечает его интересам, условия у каждого родителя и доказательства.",
      "Определите суд. Спор об определении места жительства ребёнка обычно рассматривает районный суд. Территориальная подсудность — по месту жительства ответчика, с учётом сопутствующих требований.",
      "Если есть риск вывоза или удержания ребёнка — заявите ходатайство об обеспечительных мерах.",
      "В суде фокусируйтесь на интересах ребёнка, не только на обвинениях второго родителя. Показывайте, почему ваш вариант стабильнее и безопаснее.",
      "После решения суда контролируйте исполнение. Если второй родитель не исполняет решение — обращайтесь к приставам."
    ],
    documents: [
      "Паспорт истца",
      "Свидетельство о рождении ребёнка",
      "Свидетельство о заключении или расторжении брака (при наличии)",
      "Документы о регистрации ребёнка",
      "Исковое заявление об определении места жительства ребёнка",
      "Подтверждение направления копии иска ответчику",
      "Документы на жильё истца (договор, выписка ЕГРН, договор найма)",
      "Справка о доходах или занятости",
      "Справка из школы или детского сада, характеристика",
      "Сведения о кружках, секциях, медицинских учреждениях",
      "Медицинские документы ребёнка",
      "Доказательства участия в воспитании: переписка, квитанции об оплате кружков и лечения, фотографии",
      "Характеристика с работы, от соседей или из школы (при наличии)",
      "При наличии рисков: переписка с угрозами, заявления в полицию или опеку, медицинские справки, документы о попытке вывоза ребёнка"
    ],
    mistakes: [
      "Считать, что ребёнок автоматически останется с матерью — суд оценивает интересы ребёнка, а не пол родителя.",
      "Считать, что более высокий доход или лучшая квартира автоматически решают спор.",
      "Не собирать доказательства фактического участия в воспитании до подачи иска.",
      "Игнорировать орган опеки или не готовиться к обследованию условий жизни.",
      "Настраивать ребёнка против второго родителя — суд это замечает и расценивает негативно.",
      "Запрещать общение со вторым родителем без решения суда и без оснований.",
      "Не фиксировать угрозы, вывоз ребёнка, давление или попытки удержания.",
      "Подавать иск без документов о школе, садике, здоровье и режиме ребёнка.",
      "Не заявлять обеспечительные меры при риске вывоза или удержания ребёнка.",
      "Не учитывать мнение ребёнка старше 10 лет при подготовке позиции.",
      "Строить позицию только на обвинениях второго родителя, а не на интересах ребёнка.",
      "Смешивать место жительства ребёнка, алименты, порядок общения и развод без проверки стратегии.",
      "Не контролировать исполнение решения суда после его вынесения."
    ],
    faq: [
      {
        question: "С кем суд оставит ребёнка — с матерью или с отцом?",
        answer: "Суд не исходит из автоматического преимущества матери или отца. Он оценивает интересы ребёнка: привязанность, условия жизни, кто фактически заботится о ребёнке, здоровье, школу, режим и заключение органа опеки. У родителей равные права."
      },
      {
        question: "Можно ли определить место жительства ребёнка без суда?",
        answer: "Да. Если родители договорились, можно оформить письменное соглашение о том, с кем ребёнок живёт и как второй родитель с ним общается. Если договориться не получается — спор решается в суде."
      },
      {
        question: "В какой суд подавать иск?",
        answer: "Спор об определении места жительства ребёнка рассматривает районный суд. По общему правилу иск подают по месту жительства ответчика. Подсудность нужно проверить с учётом сопутствующих требований."
      },
      {
        question: "Учитывается ли мнение ребёнка?",
        answer: "Да. Ребёнок вправе выражать своё мнение. Если ребёнку исполнилось 10 лет, его мнение учитывается обязательно, если не противоречит его интересам. Суд оценивает, не находится ли ребёнок под давлением."
      },
      {
        question: "Может ли отец определить место жительства ребёнка с собой?",
        answer: "Да. У родителей равные права и обязанности. Суд оценивает не пол родителя, а интересы ребёнка и условия, которые каждый может обеспечить."
      },
      {
        question: "Что делает орган опеки?",
        answer: "Орган опеки участвует в деле, обследует условия жизни ребёнка и родителей, составляет акт и готовит заключение для суда. Суд оценивает это заключение вместе с другими доказательствами — оно важно, но не заменяет решение суда."
      },
      {
        question: "Нужно ли одновременно подавать на алименты?",
        answer: "Не обязательно, но часто место жительства ребёнка связано с алиментами. Если ребёнок будет жить с одним родителем, второй обычно участвует в содержании ребёнка. Стратегию лучше проверить отдельно."
      },
      {
        question: "Чем место жительства отличается от порядка общения?",
        answer: "Место жительства определяет, с кем ребёнок постоянно живёт. Порядок общения определяет, когда и как второй родитель видится с ребёнком, звонит, забирает на выходные или каникулы. Это разные требования."
      },
      {
        question: "Что делать, если второй родитель забрал ребёнка?",
        answer: "Нужно оценить угрозу ребёнку, зафиксировать обстоятельства, обратиться в орган опеки, при наличии опасности — в полицию, и готовить обращение в суд. При риске вывоза нужно просить обеспечительные меры."
      },
      {
        question: "Что важнее для суда — доход или жильё?",
        answer: "Доход и жильё важны, но не являются единственными критериями. Суд оценивает совокупность: уход, привязанность, стабильность, школу, здоровье, безопасность и реальное участие каждого родителя в жизни ребёнка."
      },
      {
        question: "Что делать, если второй родитель не исполняет решение суда?",
        answer: "Нужно получить исполнительный документ и обратиться к судебным приставам. Если приставы бездействуют — подавать жалобы. При систематическом неисполнении суд может пересмотреть вопрос о месте жительства."
      }
    ],
    relatedDocumentSlugs: [
      "zayavlenie-ob-opredelenii-mesta-zhitelstva-rebenka",
      "zayavlenie-ob-ustanovlenii-poryadka-obscheniya-s-rebenkom",
      "isk-o-lishenii-roditelskih-prav",
      "iskovoe-zayavlenie",
      "zayavlenie-o-vydache-ispolnitelnogo-lista",
      "zayavlenie-v-policiyu"
    ],
    legalReferenceKeys: [
      "sk_57", "sk_61", "sk_63", "sk_65", "sk_66", "sk_78",
      "gpk_24", "gpk_28", "gpk_29", "gpk_131", "gpk_132", "gpk_139", "gpk_140",
      "nk_333_19"
    ],
    relatedQuestionTopics: [
      "с кем останется ребенок после развода",
      "место жительства ребенка с матерью",
      "место жительства ребенка с отцом",
      "отец забрал ребенка",
      "мать не отдает ребенка",
      "орган опеки место жительства ребенка",
      "мнение ребенка в суде",
      "ребенок хочет жить с отцом",
      "ребенок хочет жить с матерью",
      "иск об определении места жительства ребенка",
      "переезд ребенка с одним родителем",
      "исполнение решения суда о ребенке"
    ],
    relatedLawyerSpecializations: ["семейное право", "защита прав детей", "споры о детях"],
    selfHelpConditions: [
      "оба родителя готовы договориться и составить письменное соглашение;",
      "ситуация стабильная и ребёнок фактически живёт с одним из родителей без конфликтов;",
      "нет угрозы вывоза ребёнка или смены его места жительства без уведомления;",
      "нет насилия, зависимости или давления на ребёнка;",
      "нужно только оформить соглашение или подготовить базовые документы."
    ],
    lawyerConditions: [
      "второй родитель забрал ребёнка и не возвращает;",
      "есть риск вывоза ребёнка в другой регион, город или за рубеж;",
      "второй родитель настраивает ребёнка против вас;",
      "ребёнок боится одного из родителей или есть обвинения в насилии;",
      "орган опеки занял неожиданную или неблагоприятную позицию;",
      "нужно заявить обеспечительные меры;",
      "ребёнку больше 10 лет и важно правильно учесть его мнение;",
      "есть параллельный спор об алиментах, разводе, порядке общения или лишении прав;",
      "второй родитель скрывает адрес ребёнка или действует через юриста;",
      "суд уже назначен или иск подал второй родитель."
    ]
  },
  "semya-i-deti/mesto-zhitelstva-rebenka": {
    title: "Определение места жительства ребёнка",
    h1: "Определение места жительства ребёнка",
    shortTitle: "Место жительства ребёнка",
    shortAnswer: "Место жительства ребёнка определяется соглашением родителей или судом. Суд исходит прежде всего из интересов ребёнка: его возраста, привязанности, условий жизни и участия каждого родителя в воспитании.",
    description: "Если родители не могут договориться, вопрос решает суд с обязательным участием органов опеки. Суд учитывает возраст ребёнка, его привязанности, условия и режим жизни каждого родителя, занятость, состояние здоровья, жилищные условия и доказательства реального участия в воспитании. Решение можно пересмотреть, если обстоятельства существенно изменились.",
    seoTitle: "Определение места жительства ребёнка после развода — суд, документы, порядок",
    seoDescription: "Как определить место жительства ребёнка через суд или соглашение: какие доказательства нужны, роль органов опеки, как суд принимает решение и можно ли его пересмотреть.",
    relatedDocumentSlugs: ["zayavlenie-ob-opredelenii-mesta-zhitelstva-rebenka", "iskovoe-zayavlenie"],
    relatedQuestionTopics: ["место жительства ребенка", "с кем остается ребенок при разводе", "раздел детей", "определение места жительства", "органы опеки"],
    relatedLawyerSpecializations: ["семейное право", "защита прав детей", "споры о детях"],
    heroNote: {
      title: "Что важно понять сразу",
      text: "Суд не «делит» детей — он определяет, с кем ребёнок будет постоянно жить. Второй родитель сохраняет право на общение и участие в воспитании. Органы опеки обследуют условия жизни обоих родителей."
    },
    whatToKnow: [
      "Суд решает вопрос исходя из интересов ребёнка, а не из равенства прав родителей. Оба родителя имеют равные права, но место жительства определяется индивидуально.",
      "Органы опеки и попечительства обязательно участвуют в деле: они обследуют жилищные условия и дают заключение о том, с кем целесообразнее проживать ребёнку.",
      "Ключевые факторы: возраст ребёнка, его привязанности, режим и условия жизни каждого родителя, их занятость, состояние здоровья, участие в воспитании.",
      "Мнение ребёнка старше 10 лет суд обязан выслушать и учесть.",
      "Даже если суд определил место жительства с одним из родителей, второй сохраняет право на общение с ребёнком и участие в его жизни.",
      "Решение можно пересмотреть, если обстоятельства существенно изменились: переезд, изменение условий жизни, смена поведения родителя."
    ],
    deadlines: [
      "Специального срока давности нет — иск можно подать в любое время до совершеннолетия ребёнка.",
      "Если ребёнок фактически живёт с одним из родителей, суд учитывает сложившийся уклад и не стремится его менять без весомых оснований.",
      "При угрозе вывоза ребёнка за границу или смене места жительства действовать нужно незамедлительно — можно просить суд о временных мерах."
    ],
    risks: [
      "Без официального решения или соглашения каждый родитель формально имеет равные права на ребёнка, что создаёт конфликты при спорах о выезде, школе, лечении.",
      "Без доказательств участия в воспитании позиция родителя в суде будет слабее, даже если он фактически занимался ребёнком.",
      "Вывоз ребёнка за границу без согласия другого родителя без решения суда может расцениваться как нарушение прав."
    ],
    steps: [
      "Попробуйте договориться с другим родителем и оформить соглашение в письменном виде (можно нотариально).",
      "Если договориться не удаётся, подайте иск об определении места жительства ребёнка в районный суд.",
      "Подготовьте доказательства вашего участия в воспитании: фото, переписку, справки из школы и поликлиники, показания свидетелей.",
      "Убедитесь, что ваши жилищные условия соответствуют требованиям: суд направит органы опеки на обследование.",
      "При необходимости заявите ходатайство об определении временного места жительства ребёнка на период суда.",
      "Участвуйте в обследовании органов опеки и подготовьте документы о доходах, жилье и условиях воспитания.",
      "Если ребёнку больше 10 лет, его мнение будет заслушано судом — поговорите с ним заранее."
    ],
    documents: [
      "Исковое заявление об определении места жительства ребёнка",
      "Свидетельство о рождении ребёнка",
      "Свидетельство о браке или о расторжении брака",
      "Документы на жильё истца (договор, выписка ЕГРН, договор найма)",
      "Справка о доходах",
      "Характеристики от работодателя, из школы, поликлиники",
      "Доказательства участия в воспитании: фото, переписка, квитанции об оплате кружков и лечения"
    ],
    mistakes: [
      "Не собирать доказательства участия в воспитании до подачи иска.",
      "Игнорировать обследование органов опеки или встречать их без подготовки.",
      "Настраивать ребёнка против другого родителя — суд это замечает и расценивает негативно.",
      "Ограничивать общение ребёнка со вторым родителем без решения суда.",
      "Рассчитывать только на факт проживания ребёнка с вами — нужны именно доказательства участия в воспитании.",
      "Не заявлять ходатайство о временном месте жительства, когда есть риск вывоза ребёнка."
    ],
    faq: [
      {
        question: "С кем чаще всего оставляют детей — с матерью или отцом?",
        answer: "Суды чаще определяют место жительства детей с матерью, особенно маленьких. Но это не правило — отец может добиться положительного решения, если докажет активное участие в воспитании и лучшие условия."
      },
      {
        question: "Может ли ребёнок сам выбрать, с кем жить?",
        answer: "Мнение ребёнка старше 10 лет суд обязан выслушать и учесть. Но оно не является обязательным — суд оценивает его в совокупности с другими обстоятельствами."
      },
      {
        question: "Можно ли изменить решение суда о месте жительства ребёнка?",
        answer: "Да, если обстоятельства существенно изменились: родитель переехал, изменились жилищные условия, появились новые факты, связанные с воспитанием. Нужно подавать новый иск."
      },
      {
        question: "Что делают органы опеки при рассмотрении дела?",
        answer: "Органы опеки обследуют жилищные условия обоих родителей и дают заключение о том, где лучше жить ребёнку. Это не решение, а мнение — суд его учитывает, но не обязан следовать."
      },
      {
        question: "Что делать, если второй родитель не отдаёт ребёнка?",
        answer: "Обратитесь в суд с иском об определении места жительства и заявите ходатайство о временных мерах. Если есть решение суда, которое не исполняется, привлекайте службу судебных приставов."
      }
    ],
    selfHelpConditions: [
      "оба родителя готовы договориться и составить письменное соглашение;",
      "ситуация стабильная и ребёнок фактически живёт с одним из родителей без конфликтов;",
      "нет угрозы вывоза ребёнка или смены его места жительства без уведомления."
    ],
    lawyerConditions: [
      "второй родитель не отдаёт ребёнка или угрожает вывезти его за границу;",
      "есть спор о том, кто реально занимался воспитанием;",
      "второй родитель действует через юриста;",
      "нужно заявить временные меры по обеспечению иска;",
      "органы опеки дали неожиданное заключение, с которым вы не согласны;",
      "предстоит обжалование решения суда."
    ]
  },
  "semya-i-deti/poryadok-obshcheniya-s-rebenkom": {
    title: "Порядок общения с ребёнком",
    h1: "Порядок общения с ребёнком",
    shortTitle: "Общение с ребёнком",
    shortAnswer: "Порядок общения с ребёнком нужен, когда родители живут отдельно и не могут договориться, как второй родитель будет видеться с ребёнком, звонить, забирать на выходные, праздники или каникулы. Такой порядок оформляют соглашением или через суд. Суд оценивает интересы ребёнка: возраст, режим, здоровье, привязанность и заключение органа опеки.",
    description: "Спор о порядке общения с ребёнком — это не спор о том, с кем ребёнок живёт, а спор о том, как родитель, живущий отдельно, участвует в его жизни. В соглашении или решении суда можно закрепить дни и часы встреч, звонки, видеосвязь, выходные, праздники, каникулы, ночёвки и условия передачи ребёнка. Если второй родитель препятствует общению, это фиксируется и оспаривается в суде. Если решение суда уже есть, но не исполняется — нужны приставы.",
    seoTitle: "Порядок общения с ребёнком — график встреч, суд и права родителя",
    seoDescription: "Как установить порядок общения с ребёнком после развода или раздельного проживания: график встреч, звонки, выходные, каникулы, суд, орган опеки, документы и что делать, если второй родитель мешает.",
    riskLevel: "high",
    urgency: "standard",
    urgencyNote: "Срочность повышается, если второй родитель полностью не даёт видеться с ребёнком, скрывает его, настраивает против вас, есть угрозы или риск вывоза в другой город. Длительный перерыв в общении ослабляет связь с ребёнком — медлить не стоит.",
    heroNote: {
      title: "Что важно понять сразу",
      text: "Эта страница — про то, как родитель, живущий отдельно, будет видеться с ребёнком, звонить и участвовать в его жизни. Если спор о том, с кем ребёнок будет постоянно жить — см. «Определение места жительства ребёнка». Если нужно взыскать содержание — «Алименты». Право на общение с ребёнком не зависит от уплаты алиментов: нельзя запрещать встречи из-за долга и наоборот."
    },
    whatToKnow: [
      "Оба родителя имеют равное право на общение с ребёнком независимо от того, с кем он живёт и платятся ли алименты.",
      "В соглашении или решении суда можно закрепить: дни и часы встреч, место, кто забирает и возвращает ребёнка, звонки, видеосвязь, выходные, праздники, каникулы, ночёвки, поездки и условия при болезни ребёнка.",
      "Чем конкретнее сформулирован порядок общения, тем меньше конфликтов. Формулировки «по договорённости» или «в удобное время» почти всегда снова приводят к спору.",
      "Суд оценивает интересы ребёнка: возраст, режим, здоровье, привязанности, расстояние между домами родителей, занятость, безопасность и мнение ребёнка.",
      "Суд может установить постепенный график: сначала короткие встречи, затем длительнее, позже выходные или каникулы — если ребёнок маленький, давно не общался с родителем или конфликт сильный.",
      "Мнение ребёнка старше 10 лет суд обязан выслушать. Нежелание общаться не всегда означает автоматический запрет — суд выясняет причины: давление, страх, перерыв или реальная угроза.",
      "Орган опеки обязательно участвует в деле, обследует условия жизни и готовит заключение для суда.",
      "Ограничить или полностью запретить общение можно только через суд и только при доказанной угрозе здоровью, безопасности или нравственному развитию ребёнка.",
      "Бабушки, дедушки, братья, сёстры и другие близкие родственники тоже имеют право на общение с ребёнком. Если родители препятствуют, вопрос решается через орган опеки или суд.",
      "Если решение суда уже есть, но второй родитель его не исполняет — нужны приставы. При злостном неисполнении суд может пересмотреть место жительства ребёнка."
    ],
    deadlines: [
      "Специального срока давности для иска о порядке общения нет — обратиться в суд можно в любое время.",
      "Если второй родитель системно препятствует общению, лучше не затягивать: длительный перерыв ослабляет связь ребёнка с родителем.",
      "Установленный порядок общения можно изменить в суде, если изменились обстоятельства: возраст ребёнка, режим учёбы, здоровье, переезд или другие значимые факты.",
      "Госпошлина: требование об определении порядка общения с ребёнком относится к неимущественным. Размер — по актуальной редакции ст. 333.19 НК РФ на дату подачи. При сопутствующих требованиях госпошлина рассчитывается по каждому требованию отдельно."
    ],
    risks: [
      "Без закреплённого графика любое несогласие между родителями превращается в конфликт без механизма разрешения.",
      "Расплывчатые формулировки в соглашении или решении суда снова приводят к спору — нужна конкретика по дням, часам и месту.",
      "Системное препятствование общению без оснований суд может расценить как нарушение интересов ребёнка, что влияет на решение о месте жительства.",
      "Нарушение судебного решения о порядке общения влечёт административную ответственность и может стать основанием для пересмотра места жительства ребёнка.",
      "Настраивание ребёнка против второго родителя суд замечает и оценивает против того, кто это делает."
    ],
    steps: [
      "Определите цель: установить график впервые, изменить старый порядок, устранить препятствия или исполнить уже вынесенное решение суда.",
      "Предложите конкретный график второму родителю письменно: укажите дни, часы, место, звонки, видеосвязь, каникулы, праздники, ночёвки и порядок передачи ребёнка.",
      "Зафиксируйте реакцию: сохраняйте переписку, отказы, предложения. Нужны доказательства того, что вы пытались договориться.",
      "Подготовьте доказательства связи с ребёнком: участие в жизни ребёнка, знание его режима, потребностей, школы, здоровья.",
      "Подготовьте условия для встреч: место, питание, безопасность, спальное место при ночёвках.",
      "Обратитесь в орган опеки, если конфликт острый — они могут помочь урегулировать спор и дают заключение для суда.",
      "Подготовьте иск об определении порядка общения с конкретным графиком — не абстрактное «право видеться», а точные условия.",
      "В суде фокусируйтесь на интересах ребёнка, а не только на претензиях ко второму родителю.",
      "После решения суда контролируйте исполнение. При нарушениях — фиксируйте и обращайтесь к приставам."
    ],
    documents: [
      "Паспорт истца",
      "Свидетельство о рождении ребёнка",
      "Свидетельство о браке или расторжении брака (при наличии)",
      "Исковое заявление об определении порядка общения с ребёнком",
      "Подтверждение направления копии иска ответчику",
      "Переписка с другим родителем: просьбы о встрече, отказы, угрозы, игнорирование",
      "Обращения в орган опеки (при наличии)",
      "Заявления в полицию при угрозах (при наличии)",
      "Доказательства участия в жизни ребёнка: фото, чеки, переводы, билеты, переписка с ребёнком",
      "Справка из школы или детского сада",
      "Медицинские документы, если здоровье влияет на график",
      "Документы на жильё, справка о занятости, график работы",
      "Характеристики с работы, от соседей (при наличии)",
      "Предложение конкретного графика общения"
    ],
    mistakes: [
      "Просить суд «разрешить общаться» без предложения конкретного графика.",
      "Не учитывать возраст, режим, здоровье и школу ребёнка при составлении графика.",
      "Требовать ночёвки или длительные поездки без подготовки условий.",
      "Не фиксировать отказы второго родителя письменно.",
      "Общаться только устно и не сохранять переписку.",
      "Использовать ребёнка как инструмент давления в споре.",
      "Не готовиться к обследованию органа опеки.",
      "Настраивать ребёнка против второго родителя.",
      "Полностью запрещать общение без доказательств реальной угрозы ребёнку.",
      "Не соблюдать установленный график самому — это ослабляет позицию.",
      "Не обращаться к приставам, если решение суда не исполняется.",
      "Смешивать порядок общения с вопросом о постоянном месте жительства ребёнка.",
      "Игнорировать мнение ребёнка, особенно после 10 лет."
    ],
    faq: [
      {
        question: "Можно ли установить порядок общения без суда?",
        answer: "Да. Если родители договорились, они оформляют письменное соглашение о порядке общения с конкретными днями, часами, местом встреч, звонками, каникулами и порядком передачи ребёнка."
      },
      {
        question: "Что делать, если второй родитель не даёт видеться с ребёнком?",
        answer: "Зафиксируйте отказы и предложите конкретный график письменно. Если договориться не получается, подайте иск об определении порядка общения и устранении препятствий в суд."
      },
      {
        question: "Что именно можно указать в графике общения?",
        answer: "Можно закрепить дни и часы встреч, место, порядок передачи ребёнка, звонки, видеосвязь, выходные, праздники, каникулы, ночёвки, условия при болезни ребёнка и участие в школе или кружках."
      },
      {
        question: "В какой суд подавать иск?",
        answer: "Спор о порядке общения с ребёнком рассматривает районный суд. Иск подают по месту жительства ответчика. При сопутствующих требованиях подсудность нужно проверить отдельно."
      },
      {
        question: "Учитывается ли мнение ребёнка?",
        answer: "Да. Если ребёнку 10 лет и больше, его мнение учитывается обязательно, если не противоречит его интересам. Суд выясняет, нет ли давления со стороны второго родителя."
      },
      {
        question: "Может ли суд запретить общение с ребёнком?",
        answer: "Ограничение общения возможно только если общение причиняет вред здоровью, безопасности или нравственному развитию ребёнка. Нужны доказательства, а не просто конфликт между родителями."
      },
      {
        question: "Можно ли забирать ребёнка на выходные и с ночёвкой?",
        answer: "Да, если это соответствует интересам ребёнка, его возрасту и состоянию здоровья. Суд может установить постепенный график: сначала короткие встречи, потом выходные, потом каникулы."
      },
      {
        question: "Что делать, если решение суда не исполняется?",
        answer: "Фиксируйте нарушения и обращайтесь к приставам с исполнительным документом. Если приставы бездействуют, подавайте жалобы. При злостном неисполнении суд может пересмотреть место жительства ребёнка."
      },
      {
        question: "Чем порядок общения отличается от места жительства?",
        answer: "Место жительства определяет, с кем ребёнок постоянно живёт. Порядок общения — как родитель, живущий отдельно, видится с ребёнком, звонит ему и участвует в его воспитании."
      },
      {
        question: "Может ли бабушка или дедушка установить порядок общения с ребёнком?",
        answer: "Да. Близкие родственники, включая бабушек, дедушек, братьев и сестёр, имеют право на общение с ребёнком. Если родители препятствуют, вопрос решается через орган опеки или суд."
      },
      {
        question: "Что делать, если ребёнок не хочет общаться?",
        answer: "Нужно понять причину: возраст, страх, давление второго родителя, длительный перерыв или реальная угроза. Суд оценивает это с учётом мнения ребёнка, заключения органа опеки и доказательств."
      },
      {
        question: "Можно ли изменить уже установленный судом порядок общения?",
        answer: "Да, если изменились обстоятельства: возраст ребёнка, режим учёбы, здоровье, переезд, график работы родителя или другие значимые факты."
      }
    ],
    relatedDocumentSlugs: [
      "zayavlenie-ob-ustanovlenii-poryadka-obscheniya-s-rebenkom",
      "zayavlenie-ob-opredelenii-mesta-zhitelstva-rebenka",
      "iskovoe-zayavlenie",
      "zayavlenie-o-vydache-ispolnitelnogo-lista",
      "zhaloba-na-sudebnogo-pristava",
      "zayavlenie-v-policiyu"
    ],
    legalReferenceKeys: [
      "sk_55", "sk_57", "sk_61", "sk_63", "sk_65", "sk_66", "sk_67", "sk_78", "sk_79",
      "gpk_24", "gpk_28", "gpk_131", "gpk_132", "gpk_139", "gpk_140",
      "nk_333_19"
    ],
    relatedQuestionTopics: [
      "второй родитель не дает видеться с ребенком",
      "порядок общения через суд",
      "график общения с ребенком",
      "общение с ребенком после развода",
      "звонки и видеосвязь с ребенком",
      "общение на выходных и каникулах",
      "ребенок не хочет общаться",
      "мать препятствует общению с ребенком",
      "отец требует общения с ребенком",
      "орган опеки и порядок общения",
      "исполнение решения суда о порядке общения",
      "приставы и общение с ребенком",
      "бабушка или дедушка хотят общаться с ребенком",
      "изменить порядок общения с ребенком"
    ],
    relatedLawyerSpecializations: ["семейное право", "защита прав детей", "споры о детях"],
    selfHelpConditions: [
      "родители готовы обсуждать конкретный график;",
      "нет угрозы ребёнку;",
      "ребёнок спокойно общается с обоими родителями;",
      "нет спора о постоянном месте жительства ребёнка;",
      "нет риска вывоза или удержания ребёнка;",
      "второй родитель не скрывает ребёнка;",
      "нет насилия, зависимости или давления на ребёнка;",
      "нужно только оформить понятный график встреч, звонков и каникул."
    ],
    lawyerConditions: [
      "второй родитель не даёт видеться с ребёнком;",
      "ребёнка настраивают против вас;",
      "ребёнок боится общения или отказывается встречаться;",
      "второй родитель скрывает адрес ребёнка;",
      "есть риск вывоза ребёнка в другой город или страну;",
      "нужно изменить уже установленный судом график;",
      "решение суда не исполняется, приставы не помогают;",
      "есть обвинения в насилии, зависимости или ненадлежащем поведении;",
      "орган опеки занял неблагоприятную позицию;",
      "нужно общение с маленьким ребёнком и постепенная адаптация;",
      "нужны ночёвки, поездки или общение на длительных каникулах;",
      "родители живут в разных городах;",
      "есть параллельный спор о месте жительства, алиментах или лишении прав."
    ]
  },
  "semya-i-deti/poryadok-obscheniya-s-rebenkom": {
    title: "Порядок общения с ребёнком",
    h1: "Порядок общения с ребёнком",
    shortTitle: "Общение с ребёнком",
    shortAnswer: "Каждый родитель имеет право на общение с ребёнком независимо от того, с кем ребёнок живёт. Если родители не могут договориться — суд устанавливает конкретный график.",
    description: "Порядок общения можно закрепить соглашением между родителями или через суд. Суд определяет конкретные дни, время и место общения исходя из интересов ребёнка, его возраста, режима, расстояния между родителями и сложившегося уклада. Ограничить или лишить права на общение можно только по решению суда при наличии серьёзных оснований.",
    seoTitle: "Порядок общения с ребёнком после развода — соглашение и суд",
    seoDescription: "Как установить порядок общения с ребёнком: через соглашение или суд, какой график суд считает разумным, что делать, если второй родитель препятствует общению.",
    relatedDocumentSlugs: ["zayavlenie-ob-ustanovlenii-poryadka-obscheniya-s-rebenkom", "iskovoe-zayavlenie"],
    relatedQuestionTopics: ["порядок общения с ребенком", "отец хочет видеть ребенка", "мать не дает видеться с ребенком", "общение с ребенком после развода", "график общения"],
    relatedLawyerSpecializations: ["семейное право", "защита прав детей", "споры о детях"],
    heroNote: {
      title: "Главное",
      text: "Право на общение с ребёнком не зависит от того, платятся ли алименты и с кем ребёнок живёт. Ограничить это право без решения суда нельзя."
    },
    whatToKnow: [
      "Оба родителя имеют равное право на общение с ребёнком вне зависимости от того, с кем он живёт.",
      "Право на общение не зависит от уплаты алиментов: нельзя запрещать видеться с ребёнком из-за долга по алиментам и наоборот.",
      "Суд устанавливает конкретный график: дни недели, часы, место, порядок встреч в праздники и каникулы.",
      "Органы опеки участвуют в деле и могут быть привлечены для контроля исполнения соглашения или решения.",
      "Если родитель, с которым живёт ребёнок, систематически препятствует общению, это может стать основанием для пересмотра места жительства ребёнка.",
      "Ограничить или полностью запретить общение можно только через суд и только при угрозе жизни, здоровью или нравственному развитию ребёнка."
    ],
    deadlines: [
      "Иск об установлении порядка общения можно подать в любое время — специального срока нет.",
      "Если второй родитель систематически нарушает договорённости, фиксируйте каждый случай письменно — это доказательства для суда.",
      "При злостном неисполнении судебного решения приставы могут применить санкции к нарушителю."
    ],
    risks: [
      "Без официально закреплённого графика любое несогласие между родителями превращается в конфликт без механизма разрешения.",
      "Если один родитель систематически срывает общение, это ухудшает отношения ребёнка с другим родителем и может быть расценено судом как нарушение интересов ребёнка.",
      "Нарушение судебного решения о порядке общения влечёт административную ответственность."
    ],
    steps: [
      "Предложите второму родителю договориться и составить письменное соглашение о графике общения.",
      "Если договориться не получается, подайте иск об установлении порядка общения с ребёнком в районный суд.",
      "Предложите конкретный, реалистичный график — суд чаще поддерживает подготовленного истца.",
      "Подготовьте доказательства вашего участия в жизни ребёнка и того, что общение отвечает его интересам.",
      "При необходимости привлеките органы опеки для обследования условий общения.",
      "Если решение суда уже есть, но второй родитель его не исполняет, обратитесь к судебным приставам."
    ],
    documents: [
      "Исковое заявление об установлении порядка общения с ребёнком",
      "Свидетельство о рождении ребёнка",
      "Свидетельство о браке или о расторжении брака",
      "Доказательства участия в жизни ребёнка (переписка, фото, квитанции)",
      "Фиксация случаев, когда общение было нарушено (переписка, свидетели)"
    ],
    mistakes: [
      "Ограничивать общение ребёнка с другим родителем без решения суда.",
      "Использовать ребёнка как инструмент давления в имущественных спорах.",
      "Не фиксировать случаи, когда вам отказывали в общении.",
      "Предлагать нереалистичный или неудобный для ребёнка график — суд его не утвердит.",
      "Не привлекать органы опеки при систематических нарушениях.",
      "Считать, что долг по алиментам даёт право запрещать общение — это не так."
    ],
    faq: [
      {
        question: "Что делать, если мать не даёт видеться с ребёнком?",
        answer: "Фиксируйте каждый случай отказа письменно или через переписку. Подайте иск об установлении порядка общения. Если решение уже есть, обращайтесь к судебным приставам."
      },
      {
        question: "Можно ли общаться с ребёнком, если есть долг по алиментам?",
        answer: "Да. Право на общение с ребёнком не зависит от алиментов. Нельзя ни запрещать видеться из-за долга, ни отказывать в алиментах из-за ограничения общения."
      },
      {
        question: "Как добиться исполнения решения суда о порядке общения?",
        answer: "Обратитесь к судебным приставам с заявлением о возбуждении исполнительного производства. При злостном неисполнении суд может изменить место жительства ребёнка."
      },
      {
        question: "Можно ли запретить общение с ребёнком, если родитель пьёт или агрессивен?",
        answer: "Да, но только через суд и с доказательствами угрозы для здоровья или нравственного развития ребёнка. Самостоятельно ограничивать общение без решения суда нельзя."
      }
    ],
    selfHelpConditions: [
      "оба родителя готовы договориться и соблюдать график;",
      "нет агрессии, угроз или систематических конфликтов при передаче ребёнка;",
      "можно составить письменное соглашение без привлечения суда."
    ],
    lawyerConditions: [
      "второй родитель систематически срывает общение или угрожает;",
      "есть риск вывоза ребёнка или смены места жительства без уведомления;",
      "второй родитель действует через юриста;",
      "предстоит обжалование решения суда;",
      "нужно привлечь органы опеки или заявить о злостном неисполнении решения."
    ]
  },
  "semya-i-deti/lishenie-i-ogranichenie-roditelskih-prav": {
    title: "Лишение и ограничение родительских прав",
    h1: "Лишение и ограничение родительских прав",
    shortTitle: "Лишение родительских прав",
    shortAnswer: "Страница охватывает пять отдельных ситуаций: лишение родительских прав, ограничение родительских прав, срочная защита ребёнка при угрозе, последствия для алиментов и прав ребёнка, восстановление или отмена ограничения. Это не общий семейный конфликт — это защита ребёнка через суд с обязательным участием органа опеки и прокурора.",
    description: "Лишение родительских прав — крайняя мера, возможна только по закрытому перечню оснований СК РФ: злостное уклонение от алиментов, отказ забрать ребёнка из учреждения, злоупотребление правами, жестокое обращение, хронический алкоголизм или наркомания, преступление против ребёнка или члена семьи. Ограничение родительских прав — менее окончательная мера: ребёнка отбирают у родителя без полного лишения прав, когда оснований для лишения нет или ситуация может измениться. Срочная защита ребёнка при непосредственной угрозе жизни или здоровью — не иск в суд, а немедленное обращение в полицию и орган опеки; орган опеки вправе отобрать ребёнка без суда. Последствия: лишение прав не отменяет алименты; ребёнок сохраняет право на жильё и наследство. Восстановление или отмена ограничения — отдельный судебный процесс, если родитель изменил поведение и образ жизни.",
    seoTitle: "Лишение и ограничение родительских прав — основания, суд, опека и последствия",
    seoDescription: "Когда можно лишить или ограничить родительские права: основания, доказательства, куда обращаться, как участвуют орган опеки и прокурор, что будет с алиментами и правами ребёнка.",
    riskLevel: "high",
    urgency: "today",
    heroNote: {
      title: "Что важно понять сразу",
      text: "Эта страница — про защиту ребёнка через суд, когда поведение родителя опасно. Если спор только о месте жительства ребёнка — «Определение места жительства». Если только о встречах — «Порядок общения». Если только об алиментах — «Алименты» или «Долг по алиментам». При непосредственной угрозе жизни или здоровью ребёнка нужно немедленно обращаться в полицию и орган опеки."
    },
    whatToKnow: [
      "ЛИШЕНИЕ ПРАВ. Лишение родительских прав возможно только через суд и только по закрытому перечню оснований СК РФ: злостное уклонение от алиментов, отказ без уважительных причин забрать ребёнка из учреждения, злоупотребление правами, жестокое обращение, хронический алкоголизм или наркомания, умышленное преступление против жизни или здоровья ребёнка или члена семьи. Конфликта между родителями и несогласия с графиком общения — недостаточно.",
      "ОГРАНИЧЕНИЕ ПРАВ. Ограничение применяют, когда ребёнку опасно оставаться с родителем, но оснований для лишения нет или ситуация возникла по причинам, не зависящим от родителя: тяжёлое заболевание, психическое расстройство, стечение обстоятельств, или доказательств для лишения пока недостаточно. Если родитель не изменит поведение в течение 6 месяцев после ограничения, орган опеки обязан подать иск о лишении прав.",
      "СРОЧНАЯ ЗАЩИТА. При непосредственной угрозе жизни или здоровью ребёнка — не иск в суд, а немедленно в полицию и орган опеки. Орган опеки вправе отобрать ребёнка без суда. В течение 7 дней после этого должен быть подан иск о лишении или ограничении прав. Ждать обычного процесса при прямой угрозе нельзя.",
      "ПОСЛЕДСТВИЯ. Лишение родительских прав не освобождает от обязанности платить алименты — этот долг сохраняется. Ребёнок сохраняет имущественные права: право на жильё и право наследования. Лишённый родитель теряет право воспитывать ребёнка, представлять его интересы и в будущем требовать содержания от ребёнка как нетрудоспособный родитель.",
      "ВОССТАНОВЛЕНИЕ И ОТМЕНА. Родитель может быть восстановлен в правах, если изменил поведение, образ жизни и отношение к воспитанию ребёнка. Ограничение может быть отменено, если его основания отпали. В обоих случаях — отдельный судебный процесс с участием органа опеки и прокурора. Суд учитывает интересы ребёнка и его мнение.",
      "В деле обязательно участвуют орган опеки и прокурор. Они дают заключения, но решение принимает суд. Одного заявления второго родителя суду недостаточно: нужны материалы полиции, ФССП, органа опеки, школы, поликлиники, медицинские справки, свидетели."
    ],
    deadlines: [
      "Специального срока давности для подачи иска нет — иск можно подать в любое время.",
      "При непосредственной угрозе жизни или здоровью ребёнка орган опеки отбирает ребёнка немедленно; иск должен быть подан в суд в течение 7 дней.",
      "Если орган опеки ограничил родительские права и родитель не изменил поведение в течение 6 месяцев — орган опеки обязан подать иск о лишении прав.",
      "Госпошлина: требования о лишении и ограничении родительских прав относятся к неимущественным. Актуальный размер — по ст. 333.19 НК РФ на дату подачи. При сопутствующих требованиях (алименты, место жительства) госпошлина рассчитывается отдельно."
    ],
    risks: [
      "Суды расценивают лишение родительских прав как крайнюю меру — при слабых доказательствах в иске могут отказать или ограничиться ограничением прав.",
      "Встречный иск родителя (об общении, месте жительства или алиментах) может усложнить процесс.",
      "Слабая доказательная база или неверный выбор между лишением и ограничением прав — частая причина отказа.",
      "При наличии угрозы ребёнку и промедлении с обращением в орган опеки или полицию ситуация может ухудшиться.",
      "Доказательства (следы насилия, состояние ребёнка, свидетели) могут быть утрачены — фиксировать нужно сразу."
    ],
    steps: [
      "Определите цель: лишение, ограничение, срочная защита ребёнка, восстановление прав или отмена ограничения.",
      "Проверьте основания. Лишение возможно только по закрытому перечню СК РФ. Если оснований для лишения недостаточно — рассмотрите ограничение родительских прав.",
      "Если ребёнку угрожает опасность прямо сейчас — обращайтесь в полицию и орган опеки немедленно, не ждите суда.",
      "Обратитесь в орган опеки: попросите провести проверку, обследовать условия жизни и зафиксировать обстоятельства.",
      "Соберите доказательства: материалы ФССП и расчёт долга по алиментам, постановления полиции, медицинские документы, акты органа опеки, характеристики из школы и поликлиники, свидетельские показания.",
      "Подготовьте иск. Укажите конкретные основания из закона, факты, доказательства и требования. Если заявляете одновременно алименты или место жительства ребёнка — проверьте подсудность.",
      "Подайте иск в районный суд. В деле должны участвовать орган опеки и прокурор.",
      "Участвуйте в обследовании, заседаниях и проверках. Готовьтесь к позиции прокурора и заключению органа опеки.",
      "После решения суда: проверьте исполнение, алименты, место жительства ребёнка, передачу сведений в органы.",
      "Если ситуация изменилась — проверьте возможность восстановления прав или отмены ограничения через суд."
    ],
    documents: [
      "Паспорт истца",
      "Свидетельство о рождении ребёнка",
      "Свидетельство о браке или расторжении брака (при наличии)",
      "Исковое заявление о лишении родительских прав или об ограничении родительских прав",
      "Подтверждение направления копии иска ответчику",
      "Судебный приказ, решение суда или соглашение об алиментах (при наличии)",
      "Постановление о возбуждении исполнительного производства, расчёт задолженности, справка ФССП",
      "Постановления полиции, акты о побоях, приговоры или постановления суда",
      "Медицинские документы (справки из травмпункта, медкарта ребёнка)",
      "Акт обследования органа опеки",
      "Характеристики из школы, детского сада, поликлиники",
      "Переписка с угрозами или доказательства игнорирования ребёнка",
      "Свидетельские показания",
      "Заявления в полицию, прокуратуру, орган опеки (при наличии)"
    ],
    mistakes: [
      "Пытаться лишить родительских прав только из-за конфликта между родителями без оснований из закона.",
      "Не отличать лишение прав от ограничения — они применяются в разных ситуациях.",
      "Подавать иск без доказательств, подтверждающих конкретные основания из СК РФ.",
      "Считать, что неуплата алиментов автоматически ведёт к лишению прав — нужно доказать злостное уклонение.",
      "Не получать расчёт задолженности и материалы исполнительного производства из ФССП.",
      "Не обращаться в орган опеки до подачи иска.",
      "Не фиксировать насилие, угрозы, зависимость или опасное поведение своевременно.",
      "Использовать лишение прав как способ давления в споре о разводе, алиментах или общении.",
      "Не учитывать, что лишение прав не отменяет алименты.",
      "Не готовиться к участию прокурора и органа опеки в процессе.",
      "Не проверять, кто вправе подать конкретный иск в вашей ситуации.",
      "При непосредственной угрозе ребёнку ждать обычного судебного процесса вместо срочного обращения в полицию и опеку.",
      "Не фиксировать доказательства сразу — следы насилия, состояние ребёнка, свидетелей.",
      "Не учитывать возможность восстановления прав родителем в будущем при подготовке позиции."
    ],
    faq: [
      {
        question: "Чем лишение родительских прав отличается от ограничения?",
        answer: "При лишении родитель теряет права, основанные на родстве с ребёнком, но обязанность платить алименты сохраняется. При ограничении ребёнка отбирают у родителя без полного лишения прав — если оставление опасно, но оснований для лишения нет или ситуация может измениться."
      },
      {
        question: "Можно ли лишить родительских прав только за неуплату алиментов?",
        answer: "Неуплата алиментов может быть основанием, если является злостным уклонением: длительный долг, уклонение от приставов, сокрытие доходов. Сам факт задолженности суд оценивает в совокупности с другими обстоятельствами."
      },
      {
        question: "Можно ли лишить прав отца, если он не общается с ребёнком?",
        answer: "Возможно, если отсутствие участия подтверждает уклонение от родительских обязанностей и есть доказательства. Суд оценивает все обстоятельства: причины отсутствия общения, алименты, попытки контакта, поведение второго родителя."
      },
      {
        question: "Можно ли лишить прав мать?",
        answer: "Да. Закон одинаково применяется к матери и отцу. Суд оценивает поведение родителя, доказательства и интересы ребёнка."
      },
      {
        question: "Кто участвует в суде по таким делам?",
        answer: "В делах о лишении и ограничении родительских прав обязательно участвуют орган опеки и прокурор. Они дают заключения, но решение принимает суд."
      },
      {
        question: "Нужно ли после лишения прав платить алименты?",
        answer: "Да. Лишение родительских прав не освобождает родителя от обязанности содержать ребёнка."
      },
      {
        question: "Сохраняет ли ребёнок право на наследство после лишения родителя прав?",
        answer: "Да. Ребёнок сохраняет имущественные права, основанные на родстве, включая право наследования."
      },
      {
        question: "Можно ли восстановить родительские права?",
        answer: "Да, если родитель изменил поведение, образ жизни и отношение к воспитанию ребёнка. Восстановление происходит через суд с участием органа опеки и прокурора. Суд учитывает мнение ребёнка и его интересы."
      },
      {
        question: "Когда лучше просить ограничение, а не лишение?",
        answer: "Ограничение подойдёт, если ребёнку опасно оставаться с родителем, но доказательств для лишения недостаточно, или ситуация возникла по причинам, не зависящим от родителя. Это способ защитить ребёнка, не закрывая возможность исправления."
      },
      {
        question: "Что делать, если ребёнку прямо сейчас опасно?",
        answer: "Нужно срочно обращаться в полицию и орган опеки. При непосредственной угрозе орган опеки вправе немедленно отобрать ребёнка без суда. Ждать обычного судебного процесса нельзя."
      },
      {
        question: "Можно ли лишить прав добровольно?",
        answer: "Нельзя просто отказаться от родительских прав по заявлению. Лишение производится только судом и только при наличии оснований. Согласие родителя само по себе не заменяет судебное решение."
      },
      {
        question: "Можно ли лишить прав, если родитель алкоголик или наркозависим?",
        answer: "Хронический алкоголизм или наркомания — прямое основание в СК РФ. Нужны доказательства: медицинские документы, постановления полиции, материалы опеки, свидетели. Суд оценивает влияние зависимости на ребёнка."
      }
    ],
    relatedDocumentSlugs: [
      "isk-o-lishenii-roditelskih-prav",
      "zayavlenie-ob-opredelenii-mesta-zhitelstva-rebenka",
      "zayavlenie-o-vzyskanii-alimentov",
      "iskovoe-zayavlenie",
      "zayavlenie-v-policiyu",
      "zhaloba-na-sudebnogo-pristava",
      "zayavlenie-o-vydache-ispolnitelnogo-lista"
    ],
    legalReferenceKeys: [
      "sk_56", "sk_57", "sk_63", "sk_64", "sk_65",
      "sk_69", "sk_70", "sk_71", "sk_72", "sk_73", "sk_74", "sk_76", "sk_77", "sk_78",
      "gpk_24", "gpk_28", "gpk_131", "gpk_132",
      "nk_333_19"
    ],
    relatedQuestionTopics: [
      "лишение родительских прав",
      "ограничение родительских прав",
      "неучастие родителя в жизни ребенка",
      "злостная неуплата алиментов",
      "долг по алиментам как основание для лишения",
      "насилие в семье ребенок",
      "жестокое обращение с ребенком",
      "алкоголизм или наркомания родителя",
      "орган опеки и прокурор лишение прав",
      "восстановление родительских прав",
      "отмена ограничения родительских прав",
      "права ребенка после лишения",
      "алименты после лишения родительских прав"
    ],
    relatedLawyerSpecializations: ["семейное право", "защита прав детей", "споры о детях"],
    selfHelpConditions: [
      "нужно собрать начальные документы и обратиться в орган опеки;",
      "нужно запросить расчёт задолженности по алиментам в ФССП;",
      "нужно получить характеристики из школы, садика, поликлиники;",
      "нужно зафиксировать факты ненадлежащего поведения родителя;",
      "нужна консультация о наличии оснований и правильном выборе меры защиты."
    ],
    lawyerConditions: [
      "есть угроза ребёнку или насилие — нужны срочные действия;",
      "есть насилие, жестокое обращение, зависимость или опасное поведение;",
      "второй родитель не платит алименты, скрывается или уклоняется от приставов;",
      "орган опеки бездействует или занял неожиданную позицию;",
      "прокуратура или полиция уже участвуют;",
      "второй родитель подал встречный иск;",
      "нужно выбрать между лишением и ограничением прав;",
      "нужно восстановить родительские права или отменить ограничение;",
      "есть риск, что иск отклонят из-за слабых доказательств;",
      "спор связан с местом жительства ребёнка, порядком общения или усыновлением;",
      "ребёнок находится в учреждении или под опекой;",
      "есть риск вывоза или сокрытия ребёнка."
    ]
  },
  "semya-i-deti/lishenie-roditelskih-prav": {
    title: "Лишение родительских прав",
    h1: "Лишение родительских прав",
    shortTitle: "Лишение родительских прав",
    shortAnswer: "Лишение родительских прав — крайняя мера, возможная только по решению суда и только при наличии конкретных оснований, перечисленных в законе. Органы опеки и прокурор участвуют в деле обязательно.",
    description: "Основания для лишения: уклонение от воспитания и содержания ребёнка, отказ забрать из больницы или учреждения, злоупотребление родительскими правами, жестокое обращение, хронический алкоголизм или наркомания, совершение умышленного преступления против ребёнка или другого члена семьи. Лишение не освобождает от обязанности платить алименты. Родитель, лишённый прав, теряет все права в отношении ребёнка, но ребёнок сохраняет право на наследство.",
    seoTitle: "Лишение родительских прав — основания, порядок и последствия",
    seoDescription: "Когда можно лишить родительских прав, какие документы нужны, как проходит суд, роль органов опеки и прокурора, последствия для родителя и ребёнка.",
    relatedDocumentSlugs: ["isk-o-lishenii-roditelskih-prav", "iskovoe-zayavlenie", "zayavlenie-o-vzyskanii-alimentov"],
    relatedQuestionTopics: ["лишение родительских прав", "ограничение родительских прав", "алкоголизм родителя", "жестокое обращение с ребенком", "органы опеки"],
    relatedLawyerSpecializations: ["семейное право", "защита прав детей", "лишение родительских прав"],
    heroNote: {
      title: "Важно понять сразу",
      text: "Суд лишает прав только при наличии конкретных оснований из закона — одного конфликта или неуплаты алиментов недостаточно. Прокурор и органы опеки участвуют в каждом таком деле."
    },
    whatToKnow: [
      "Закрытый перечень оснований: уклонение от родительских обязанностей, злоупотребление правами, жестокое обращение, хронический алкоголизм или наркомания, отказ забрать ребёнка из учреждения, умышленное преступление против ребёнка или члена семьи.",
      "Участие прокурора и органов опеки обязательно — суд не рассматривает такие дела без них.",
      "Лишение не снимает обязанности платить алименты — родитель продолжает содержать ребёнка.",
      "Ребёнок сохраняет право на наследство после лишённого прав родителя.",
      "Если оснований для лишения недостаточно, суд может ограничить родительские права — менее суровая мера с возможностью восстановления.",
      "Лишённый прав родитель может быть восстановлен в правах через суд, если изменил поведение и образ жизни."
    ],
    deadlines: [
      "Специального срока давности нет — иск подаётся в любое время при наличии оснований.",
      "Фиксировать нарушения (вызовы полиции, справки из больниц, акты органов опеки) нужно как можно раньше.",
      "Ограничение прав, в отличие от лишения, может быть установлено на срок с последующим пересмотром."
    ],
    risks: [
      "Без достаточных доказательств суд откажет в иске или ограничится ограничением прав.",
      "Если основания устранены, лишённый родитель может быть восстановлен в правах.",
      "Лишение прав не прекращает алиментную обязанность и не решает имущественных вопросов."
    ],
    steps: [
      "Обратитесь в органы опеки — они обязаны реагировать на угрозу жизни и здоровью ребёнка.",
      "Соберите доказательства: акты полиции, справки из больниц, медицинские документы, заключения органов опеки, показания свидетелей, характеристики, приговоры суда при наличии.",
      "Подготовьте исковое заявление о лишении родительских прав в районный суд.",
      "Убедитесь, что в деле будут участвовать органы опеки и прокурор (суд привлекает их самостоятельно).",
      "Одновременно заявите требование о взыскании алиментов, если они не взыскивались.",
      "Будьте готовы к обследованию условий жизни ребёнка органами опеки."
    ],
    documents: [
      "Иск о лишении родительских прав",
      "Свидетельство о рождении ребёнка",
      "Акты и протоколы полиции, скорой помощи, органов опеки",
      "Медицинские документы при травмах или заболеваниях ребёнка",
      "Справка о задолженности по алиментам (при уклонении от содержания)",
      "Приговор суда (если есть уголовное дело)",
      "Показания свидетелей, характеристики из школы, поликлиники"
    ],
    mistakes: [
      "Рассчитывать на лишение прав только из-за неуплаты алиментов — это основание, но само по себе недостаточное без систематического уклонения.",
      "Не фиксировать нарушения письменно — без доказательств иск будет слабым.",
      "Не привлекать органы опеки до подачи иска.",
      "Путать лишение и ограничение родительских прав — это разные меры с разными последствиями.",
      "Считать, что после лишения прав алименты платить не нужно — это не так."
    ],
    faq: [
      {
        question: "Можно ли лишить родительских прав за неуплату алиментов?",
        answer: "Злостное уклонение от уплаты алиментов — одно из оснований. Но суд оценивает совокупность обстоятельств: причины неуплаты, поведение родителя, интересы ребёнка."
      },
      {
        question: "Что происходит с ребёнком после лишения?",
        answer: "Ребёнок остаётся с другим родителем или передаётся под опеку. Лишённый родитель теряет все права, но ребёнок сохраняет право на его наследство."
      },
      {
        question: "Можно ли восстановить родительские права?",
        answer: "Да, если родитель изменил поведение, образ жизни и устранил причины лишения. Решение принимает суд с участием органов опеки и прокурора."
      },
      {
        question: "Чем ограничение прав отличается от лишения?",
        answer: "Ограничение — временная мера, при которой родитель теряет часть прав, но сохраняет обязанности. Суд применяет её, когда оснований для лишения недостаточно или ситуация может измениться."
      }
    ],
    selfHelpConditions: [
      "есть очевидные и задокументированные основания из закона;",
      "органы опеки уже зафиксировали нарушения и готовы поддержать иск;",
      "нет сложных процессуальных обстоятельств."
    ],
    lawyerConditions: [
      "ответчик оспаривает основания и действует через юриста;",
      "доказательства спорные или неоднозначные;",
      "нужно одновременно решить вопросы опеки, алиментов и места жительства;",
      "предстоит обжалование решения."
    ]
  },
  "semya-i-deti/osporit-otcovstvo": {
    title: "Оспаривание отцовства",
    h1: "Оспаривание отцовства",
    shortTitle: "Оспорить отцовство",
    shortAnswer: "Оспорить запись об отцовстве можно только через суд. Для этого нужно доказать, что лицо, записанное отцом, биологическим отцом ребёнка не является — как правило, через ДНК-экспертизу.",
    description: "Иск об оспаривании отцовства вправе подать мужчина, записанный отцом, биологический отец ребёнка, мать, а также сам ребёнок по достижении совершеннолетия. Суд назначает молекулярно-генетическую экспертизу. Если записанный отец знал в момент записи, что не является биологическим, оспорить отцовство он не может. Последствия: изменение свидетельства о рождении, прекращение алиментной обязанности (с даты решения), изменение фамилии ребёнка — по отдельному заявлению.",
    seoTitle: "Оспаривание отцовства через суд — ДНК-экспертиза, документы и последствия",
    seoDescription: "Как оспорить отцовство в суде: кто вправе подать иск, нужна ли ДНК-экспертиза, каковы последствия для алиментов и свидетельства о рождении.",
    relatedDocumentSlugs: ["iskovoe-zayavlenie", "zayavlenie-ob-opredelenii-mesta-zhitelstva-rebenka"],
    relatedQuestionTopics: ["оспорить отцовство", "ДНК-экспертиза", "запись об отце", "отказ от отцовства", "биологический отец"],
    relatedLawyerSpecializations: ["семейное право", "споры об отцовстве"],
    heroNote: {
      title: "Важно знать",
      text: "Нельзя оспорить отцовство, если в момент записи в книге записей актов мужчина знал, что не является биологическим отцом. Суд будет исходить из интересов ребёнка."
    },
    whatToKnow: [
      "Оспорить отцовство можно только через суд — органы ЗАГС самостоятельно не изменяют запись.",
      "Право на иск имеют: мужчина, записанный отцом; биологический отец ребёнка; мать ребёнка; сам ребёнок после 18 лет; опекун ребёнка или недееспособного родителя.",
      "Мужчина, который знал в момент записи, что не является биологическим отцом, не вправе оспорить отцовство — закон его не защищает.",
      "Основное доказательство — молекулярно-генетическая экспертиза (ДНК-тест). Суд назначает её по ходатайству, если стороны не провели добровольно.",
      "После оспаривания отцовства запись в свидетельстве о рождении меняется, алиментная обязанность прекращается с даты вступления решения в силу (долги, возникшие до решения, могут остаться).",
      "Суд учитывает интересы ребёнка: если ребёнок давно считает этого человека отцом, суд может принять это во внимание."
    ],
    deadlines: [
      "Срок давности для иска об оспаривании отцовства специально не установлен — иск можно подать в любое время.",
      "Алиментная обязанность прекращается с даты вступления решения суда в силу, а не с момента подачи иска.",
      "При уклонении от ДНК-экспертизы суд вправе признать факт, который экспертиза должна была подтвердить, установленным."
    ],
    risks: [
      "Если мужчина знал об отсутствии биологического родства, суд откажет в иске.",
      "Алиментный долг, накопленный до решения суда, не аннулируется автоматически.",
      "Если ребёнок воспринимает записанного отца как своего и это соответствует его интересам, суд может принять это во внимание при вынесении решения."
    ],
    steps: [
      "Убедитесь, что у вас есть право на подачу иска (вы записаны отцом или являетесь биологическим отцом).",
      "При возможности проведите добровольную ДНК-экспертизу — это ускорит рассмотрение дела.",
      "Подготовьте исковое заявление в районный суд по месту жительства ответчика.",
      "В иске заявите ходатайство о назначении молекулярно-генетической экспертизы, если ДНК-тест не проводился.",
      "Подготовьте доказательства, подтверждающие, что вы не являетесь или являетесь биологическим отцом.",
      "После вступления решения в силу обратитесь в ЗАГС для внесения изменений в запись о рождении."
    ],
    documents: [
      "Исковое заявление об оспаривании отцовства",
      "Свидетельство о рождении ребёнка",
      "Свидетельство о браке или о его расторжении",
      "Результаты ДНК-экспертизы (если проводилась добровольно)",
      "Иные доказательства: переписка, документы, показания свидетелей"
    ],
    mistakes: [
      "Подавать иск, не убедившись в наличии права на оспаривание.",
      "Пытаться изменить запись через ЗАГС без решения суда.",
      "Рассчитывать, что алиментный долг за прошлые периоды будет автоматически списан.",
      "Уклоняться от ДНК-экспертизы — суд расценит это против уклоняющейся стороны.",
      "Не учитывать интересы ребёнка при подготовке иска."
    ],
    faq: [
      {
        question: "Нужна ли ДНК-экспертиза для оспаривания отцовства?",
        answer: "Как правило, да. Суд назначает её по ходатайству. Если одна из сторон уклоняется, суд вправе признать факт установленным без экспертизы."
      },
      {
        question: "Прекращается ли обязанность платить алименты после оспаривания?",
        answer: "Да, с даты вступления решения суда в законную силу. Долг, накопленный до решения, не аннулируется автоматически и может стать предметом отдельного спора."
      },
      {
        question: "Можно ли оспорить отцовство, если мужчина сам согласился на запись?",
        answer: "Если мужчина знал, что не является биологическим отцом, и всё равно согласился на запись, он не вправе её оспорить. Это правило защищает интересы ребёнка."
      },
      {
        question: "Как изменяется свидетельство о рождении после решения суда?",
        answer: "На основании вступившего в силу решения суда нужно обратиться в ЗАГС для внесения изменений в актовую запись и получения нового свидетельства о рождении."
      }
    ],
    legalReferenceKeys: ["sk_47", "sk_48", "sk_51", "sk_52", "sk_49", "gpk_28", "gpk_131", "gpk_132", "nk_333_19"],
    selfHelpConditions: [
      "есть согласие всех сторон и результаты ДНК-экспертизы;",
      "правовая позиция очевидна и не требует сложной доказательной базы."
    ],
    lawyerConditions: [
      "другая сторона оспаривает иск или уклоняется от экспертизы;",
      "нужно урегулировать вопрос алиментного долга;",
      "одновременно решается вопрос о праве на наследство или имуществе;",
      "дело касается ребёнка, чьи интересы могут быть затронуты."
    ]
  },
  "semya-i-deti/ustanovit-otcovstvo": {
    title: "Установление отцовства",
    h1: "Установление отцовства",
    shortTitle: "Установить отцовство",
    shortAnswer: "Если родители не состоят в браке, отцовство устанавливается добровольно через ЗАГС или через суд. Установление отцовства даёт право на алименты и наследство.",
    description: "Добровольное установление отцовства: оба родителя подают совместное заявление в ЗАГС. Если отец отказывается — иск в суд. Суд назначает ДНК-экспертизу, оценивает доказательства совместного проживания, переписку, фото, показания свидетелей. После установления отцовства ребёнок приобретает право на алименты, наследство и другие права в отношении отца.",
    seoTitle: "Установление отцовства через суд и ЗАГС — ДНК-тест, алименты и документы",
    seoDescription: "Как установить отцовство: добровольно через ЗАГС или через суд с ДНК-экспертизой. Какие документы нужны, как взыскать алименты и что даёт установление отцовства.",
    relatedDocumentSlugs: ["iskovoe-zayavlenie", "zayavlenie-o-vzyskanii-alimentov"],
    relatedQuestionTopics: ["установить отцовство", "ДНК-экспертиза", "алименты без брака", "отцовство вне брака", "биологический отец не признает ребенка"],
    relatedLawyerSpecializations: ["семейное право", "алименты", "споры об отцовстве"],
    heroNote: {
      title: "Что важно понять сразу",
      text: "Установить отцовство и взыскать алименты можно даже если родители никогда не состояли в браке. Алименты взыскиваются с даты подачи иска, а не с даты рождения ребёнка."
    },
    whatToKnow: [
      "Если родители не в браке, отцовство нужно устанавливать отдельно — в свидетельстве о рождении автоматически отец не указывается (или указывается со слов матери).",
      "Добровольно: оба родителя подают совместное заявление в ЗАГС. Можно подать до рождения ребёнка.",
      "Через суд: если отец отказывается. Суд назначает ДНК-экспертизу и оценивает совокупность доказательств.",
      "Алименты взыскиваются с даты подачи иска об установлении отцовства — за прошлые периоды до иска взыскать нельзя (в отличие от обычных алиментов).",
      "После установления отцовства ребёнок получает все права: наследство, пенсию по потере кормильца, алименты.",
      "Посмертное установление отцовства возможно в порядке особого производства — когда предполагаемый отец умер."
    ],
    deadlines: [
      "Иск об установлении отцовства можно подать в любое время до совершеннолетия ребёнка (после 18 лет — только с согласия ребёнка или по его иску).",
      "Алименты взыскиваются с даты подачи иска — не ждите, если отец уклоняется.",
      "Если биологический отец умер, посмертное установление отцовства нужно оформлять через особое судебное производство."
    ],
    risks: [
      "Без установления отцовства ребёнок не имеет права на алименты, наследство и другие права в отношении биологического отца.",
      "Если отец уклоняется от ДНК-экспертизы, суд вправе признать отцовство установленным без экспертизы.",
      "Затягивание с иском откладывает дату начала взыскания алиментов."
    ],
    steps: [
      "Сначала попробуйте добровольный путь: предложите отцу подать совместное заявление в ЗАГС.",
      "Если отец отказывается, подайте иск об установлении отцовства в районный суд одновременно с требованием о взыскании алиментов.",
      "Соберите доказательства: переписку с отцом, фото, показания свидетелей, документы о совместном проживании.",
      "В иске заявите ходатайство о назначении молекулярно-генетической экспертизы.",
      "При уклонении ответчика от экспертизы суд вправе признать факт отцовства установленным.",
      "После вступления решения в силу внесите изменения в свидетельство о рождении через ЗАГС."
    ],
    documents: [
      "Исковое заявление об установлении отцовства",
      "Свидетельство о рождении ребёнка",
      "Доказательства отношений с ответчиком: переписка, фото, показания свидетелей",
      "Результаты ДНК-экспертизы (если проводилась добровольно)",
      "Заявление о взыскании алиментов (можно объединить с иском)"
    ],
    mistakes: [
      "Откладывать иск — алименты взыскиваются только с даты подачи иска.",
      "Не подавать алиментное требование вместе с иском об отцовстве.",
      "Не собирать доказательства отношений с отцом до суда.",
      "Рассчитывать, что ДНК-экспертиза назначается автоматически — нужно заявить ходатайство.",
      "Не учитывать, что после установления отцовства меняется свидетельство о рождении и фамилия ребёнка (при желании)."
    ],
    faq: [
      {
        question: "Можно ли взыскать алименты за прошлые годы при установлении отцовства?",
        answer: "Нет. При установлении отцовства через суд алименты взыскиваются только с даты подачи иска. За прошлые периоды взыскать их нельзя."
      },
      {
        question: "Что делать, если отец уклоняется от ДНК-теста?",
        answer: "Суд расценивает уклонение как подтверждение позиции истца и вправе признать отцовство установленным без экспертизы."
      },
      {
        question: "Можно ли установить отцовство после смерти отца?",
        answer: "Да, в порядке особого производства. Это важно для получения наследства и пенсии по потере кормильца."
      },
      {
        question: "Нужно ли согласие ребёнка для установления отцовства?",
        answer: "Если ребёнку уже исполнилось 18 лет, его согласие обязательно. До совершеннолетия иск подаёт мать или опекун."
      }
    ],
    legalReferenceKeys: ["sk_47", "sk_48", "sk_49", "sk_50", "sk_51", "sk_53", "sk_80", "gpk_28", "gpk_131", "gpk_132", "nk_333_19"],
    selfHelpConditions: [
      "отец согласен признать ребёнка и готов подать совместное заявление в ЗАГС;",
      "есть результаты ДНК-экспертизы и ответчик не оспаривает иск."
    ],
    lawyerConditions: [
      "отец уклоняется от участия в деле или экспертизы;",
      "нужно одновременно решить вопросы наследства или имущества;",
      "дело о посмертном установлении отцовства;",
      "ответчик действует через представителя."
    ]
  },
  "semya-i-deti/ustanovlenie-ili-osparivanie-otcovstva": {
    title: "Установление или оспаривание отцовства",
    h1: "Установление или оспаривание отцовства",
    shortTitle: "Отцовство: установить или оспорить",
    shortAnswer: "На этой странице два разных юридических сценария: установление отцовства (когда отец не записан или не признаёт ребёнка) и оспаривание отцовства (когда запись уже есть, но биологическое родство отсутствует). Оба вопроса решаются через суд — добровольный путь работает только при установлении, если отец готов признать ребёнка.",
    description: "УСТАНОВЛЕНИЕ ОТЦОВСТВА: если родители не состоят в браке, отца нужно вписать в свидетельство о рождении отдельно — через совместное заявление в ЗАГС или через суд. Судебное установление запускается, когда отец отказывается подавать заявление: суд оценивает ДНК-экспертизу и любые доказательства происхождения ребёнка. После установления ребёнок получает право на алименты, наследство и пенсию по потере кормильца. ОСПАРИВАНИЕ ОТЦОВСТВА: изменить запись об отце можно только через суд. Право на иск имеет мужчина, записанный отцом, биологический отец, мать или сам ребёнок после 18 лет. Исключение: если мужчина в момент добровольной записи знал, что не является биологическим отцом, — оспорить он не может. ПОСМЕРТНОЕ УСТАНОВЛЕНИЕ: если предполагаемый отец умер, суд устанавливает факт признания отцовства в порядке особого производства.",
    seoTitle: "Установление или оспаривание отцовства — суд, ДНК-экспертиза, алименты и документы",
    seoDescription: "Как установить отцовство через ЗАГС или суд, как оспорить запись об отце, нужна ли ДНК-экспертиза, что будет с алиментами и свидетельством о рождении — порядок действий и документы.",
    riskLevel: "high",
    urgency: "standard",
    urgencyNote: "Если нужны алименты — подавайте иск как можно раньше: алименты при установлении отцовства взыскиваются только с даты подачи иска, за прошлые годы взыскать нельзя.",
    heroNote: {
      title: "Какая страница вам нужна",
      text: "Эта страница — про юридическое подтверждение или исключение отцовства. Если отцовство уже установлено и нужны алименты — перейдите в «Алименты». Если отцовство установлено и нужно определить, с кем живёт ребёнок — в «Определение места жительства ребёнка». Если нужно лишить родителя прав — в «Лишение и ограничение родительских прав»."
    },
    whatToKnow: [
      "УСТАНОВЛЕНИЕ ОТЦОВСТВА. Если родители в браке — отец записывается автоматически при регистрации рождения. Если не в браке — нужно либо совместное заявление в ЗАГС, либо суд.",
      "ДОБРОВОЛЬНЫЙ ПУТЬ. Оба родителя подают совместное заявление в ЗАГС — до рождения ребёнка или после. После записи ребёнок получает все права как при рождении в браке.",
      "СУДЕБНОЕ УСТАНОВЛЕНИЕ. Если отец отказывается признавать ребёнка, мать (или сам ребёнок после 18 лет) подаёт иск в районный суд. Суд назначает молекулярно-генетическую экспертизу и оценивает все доказательства: переписку, совместные фото, показания свидетелей.",
      "АЛИМЕНТЫ ПРИ УСТАНОВЛЕНИИ. Взыскиваются только с даты подачи иска. За прошлые годы до обращения в суд алименты не начисляются — в отличие от случаев, когда отцовство уже было установлено ранее.",
      "ПОСМЕРТНОЕ УСТАНОВЛЕНИЕ. Если предполагаемый отец умер, суд в особом производстве устанавливает факт признания отцовства по имеющимся доказательствам. Это нужно для наследства, пенсии по потере кормильца.",
      "ОСПАРИВАНИЕ ОТЦОВСТВА. Запись об отце меняется только по решению суда. Кто вправе подать иск: мужчина, записанный отцом; биологический отец; мать; ребёнок после 18 лет; опекун ребёнка или недееспособного родителя.",
      "ИСКЛЮЧЕНИЕ ПРИ ОСПАРИВАНИИ. Если мужчина при добровольной записи знал, что не является биологическим отцом, — оспорить запись он не может. Закон защищает интересы ребёнка.",
      "УКЛОНЕНИЕ ОТ ЭКСПЕРТИЗЫ. Если одна из сторон уклоняется от ДНК-теста, суд вправе признать факт, который экспертиза должна была подтвердить, установленным — против уклоняющейся стороны.",
      "ПОСЛЕДСТВИЯ ОСПАРИВАНИЯ. Алиментная обязанность прекращается с даты вступления решения в силу. Долг, накопленный до решения, не аннулируется. Нужно отдельно обратиться в ЗАГС для внесения изменений в свидетельство о рождении.",
      "ПРАВА РЕБЁНКА ПОСЛЕ УСТАНОВЛЕНИЯ. Дети, рождённые вне брака, после установления отцовства имеют те же права, что и рождённые в браке: алименты, наследство, пенсию по потере кормильца."
    ],
    deadlines: [
      "Иск об установлении отцовства — в любое время до совершеннолетия ребёнка. После 18 лет — только с согласия ребёнка или по его собственному иску.",
      "Алименты при судебном установлении отцовства взыскиваются с даты подачи иска. Не затягивайте.",
      "Иск об оспаривании отцовства — специального срока давности нет, можно подать в любое время.",
      "После вступления решения суда в силу нужно отдельно обратиться в ЗАГС для изменения записи в свидетельстве о рождении — в разумный срок."
    ],
    risks: [
      "Алименты при установлении отцовства нельзя взыскать за прошлые годы до обращения в суд.",
      "При оспаривании: если мужчина знал об отсутствии родства при добровольной записи, суд откажет в иске.",
      "Алиментный долг, накопленный до решения об оспаривании, не аннулируется автоматически.",
      "Уклонение от ДНК-экспертизы суд расценивает против уклоняющейся стороны.",
      "Без установления отцовства ребёнок не имеет права на алименты, наследство и другие права в отношении биологического отца."
    ],
    steps: [
      "Определите свой сценарий: установление отцовства (отец не записан или не признаёт) или оспаривание (запись есть, но биологического родства нет).",
      "При установлении — сначала предложите добровольный путь: оба родителя подают заявление в ЗАГС.",
      "Если добровольный путь невозможен — подайте иск об установлении отцовства в районный суд одновременно с требованием о взыскании алиментов.",
      "Соберите доказательства: переписку, фото, документы о совместном проживании, показания свидетелей, при наличии — результаты добровольного ДНК-теста.",
      "Заявите ходатайство о назначении молекулярно-генетической экспертизы в рамках судебного процесса.",
      "При оспаривании — подайте иск в районный суд, заявите ходатайство об экспертизе.",
      "После вступления решения в силу обратитесь в ЗАГС для изменения записи в свидетельстве о рождении.",
      "При посмертном установлении отцовства — обратитесь в суд с заявлением об установлении юридического факта в порядке особого производства."
    ],
    documents: [
      "Исковое заявление об установлении (или оспаривании) отцовства",
      "Свидетельство о рождении ребёнка",
      "Паспорт истца",
      "Доказательства отношений: переписка, фото, документы о совместном проживании, показания свидетелей",
      "Результаты ДНК-экспертизы (если проводилась добровольно)",
      "Заявление о взыскании алиментов (при установлении — можно объединить с иском)",
      "Свидетельство о смерти (при посмертном установлении)"
    ],
    mistakes: [
      "Откладывать подачу иска при установлении отцовства — алименты взыскиваются только с даты иска.",
      "Не заявлять требование об алиментах одновременно с иском об установлении отцовства.",
      "Рассчитывать, что ДНК-экспертиза назначается автоматически — нужно заявить ходатайство.",
      "При оспаривании — не учитывать, что знание о биологическом неродстве в момент добровольной записи лишает права на иск.",
      "Рассчитывать, что алиментный долг за прошлые периоды аннулируется после оспаривания — нет, он остаётся.",
      "Уклоняться от ДНК-экспертизы — суд расценит это против уклоняющейся стороны.",
      "Не обращаться в ЗАГС после решения суда — без этого шага запись в свидетельстве не изменится.",
      "Путать установление отцовства (ребёнок без отца в документах) и оспаривание (отец записан, но не биологический)."
    ],
    faq: [
      {
        question: "Как установить отцовство, если отец не признаёт ребёнка?",
        answer: "Через суд. Подайте иск об установлении отцовства в районный суд. Суд назначит ДНК-экспертизу и оценит другие доказательства. Одновременно можно заявить требование об алиментах."
      },
      {
        question: "Можно ли взыскать алименты за прошлые годы при установлении отцовства?",
        answer: "Нет. При установлении отцовства через суд алименты взыскиваются только с даты подачи иска. За прошлые периоды до обращения в суд взыскать их нельзя — это принципиальное отличие от случаев, когда отцовство уже установлено."
      },
      {
        question: "Нужна ли ДНК-экспертиза для установления или оспаривания отцовства?",
        answer: "Как правило, да — это главное доказательство. Суд назначает экспертизу по ходатайству. Если сторона уклоняется от теста, суд вправе признать спорный факт установленным против неё."
      },
      {
        question: "Можно ли оспорить отцовство, если мужчина сам согласился на запись?",
        answer: "Если мужчина в момент добровольной записи знал, что не является биологическим отцом, и всё равно согласился — оспорить отцовство он не может. Закон не даёт ему такого права."
      },
      {
        question: "Прекращаются ли алименты после оспаривания отцовства?",
        answer: "Алиментная обязанность прекращается с даты вступления решения суда в силу. Долг, который накопился до решения, не аннулируется — он может стать предметом отдельного спора."
      },
      {
        question: "Как установить отцовство после смерти предполагаемого отца?",
        answer: "Через особое судебное производство — суд устанавливает факт признания отцовства по имеющимся доказательствам. Это нужно для наследства и пенсии по потере кормильца."
      },
      {
        question: "Кто вправе подать иск об оспаривании отцовства?",
        answer: "Мужчина, записанный отцом; биологический отец ребёнка; мать; сам ребёнок после 18 лет; опекун ребёнка или недееспособного родителя."
      },
      {
        question: "Что происходит со свидетельством о рождении после решения суда?",
        answer: "После вступления решения в силу нужно обратиться в ЗАГС для изменения актовой записи и получения нового свидетельства о рождении. Суд сам запись не меняет."
      },
      {
        question: "Нужно ли согласие ребёнка на установление отцовства?",
        answer: "Если ребёнку уже 18 лет — его согласие обязательно. До совершеннолетия иск подаёт мать, отец или опекун без согласия ребёнка, но суд учитывает мнение ребёнка старше 10 лет."
      },
      {
        question: "Может ли ребёнок, рождённый вне брака, претендовать на наследство отца?",
        answer: "Да, но только после установления отцовства. После этого он имеет те же права, что и ребёнок, рождённый в браке: на наследство, алименты, пенсию по потере кормильца."
      }
    ],
    relatedDocumentSlugs: [
      "iskovoe-zayavlenie",
      "zayavlenie-o-vzyskanii-alimentov"
    ],
    relatedQuestionTopics: [
      "установить отцовство",
      "оспорить отцовство",
      "ДНК-экспертиза отцовство",
      "отец не признаёт ребёнка",
      "алименты без брака",
      "биологический отец не вписан",
      "посмертное установление отцовства",
      "запись об отце свидетельство о рождении",
      "отцовство вне брака"
    ],
    relatedLawyerSpecializations: ["семейное право", "споры об отцовстве", "алименты"],
    legalReferenceKeys: [
      "sk_47", "sk_48", "sk_49", "sk_50", "sk_51", "sk_52", "sk_53",
      "sk_57", "sk_61",
      "gpk_24", "gpk_28", "gpk_131", "gpk_132",
      "nk_333_19"
    ],
    selfHelpConditions: [
      "отец согласен признать ребёнка и готов подать совместное заявление в ЗАГС;",
      "при оспаривании: есть результаты ДНК-экспертизы и другая сторона не оспаривает иск."
    ],
    lawyerConditions: [
      "отец отказывается от ДНК-экспертизы или уклоняется от участия в деле;",
      "нужно одновременно решить вопросы наследства или имущества;",
      "посмертное установление отцовства;",
      "другая сторона действует через представителя;",
      "нужно урегулировать алиментный долг после оспаривания отцовства."
    ]
  },
  "semya-i-deti/brachnyy-dogovor": {
    title: "Брачный договор",
    h1: "Брачный договор",
    shortTitle: "Брачный договор",
    shortAnswer: "Брачный договор позволяет изменить законный режим совместной собственности: определить, какое имущество кому принадлежит, в том числе на будущее. Он обязательно удостоверяется нотариусом.",
    description: "Брачный договор можно заключить до свадьбы или в любой момент в браке. Он регулирует только имущественные отношения — права и обязанности по воспитанию детей, алиментам и личным вопросам в нём установить нельзя. Договор, ставящий одного из супругов в крайне невыгодное положение, суд может признать недействительным. Особенно актуален при покупке недвижимости в ипотеку, открытии бизнеса или вступлении в брак при наличии долгов.",
    seoTitle: "Брачный договор — зачем нужен, что включить и как оформить у нотариуса",
    seoDescription: "Что такое брачный договор, когда его заключать, что в нём можно и нельзя прописать, сколько стоит оформление у нотариуса и когда суд признаёт его недействительным.",
    relatedDocumentSlugs: ["isk-o-razdele-imuschestva", "iskovoe-zayavlenie"],
    relatedQuestionTopics: ["брачный договор", "раздел имущества по договору", "брачный контракт", "ипотека и брачный договор", "имущество до брака"],
    relatedLawyerSpecializations: ["семейное право", "брачный договор", "раздел имущества"],
    heroNote: {
      title: "Ключевое",
      text: "Брачный договор без нотариального удостоверения недействителен. Он регулирует только имущество — детей, алименты и личные отношения в него включать нельзя."
    },
    whatToKnow: [
      "Брачный договор заключается в письменной форме и обязательно удостоверяется нотариусом — без этого он недействителен.",
      "Можно заключить до регистрации брака (вступит в силу с момента регистрации) или в любое время в браке.",
      "Регулирует только имущественные отношения: определяет режим собственности, права на доходы, расходы и долги.",
      "Нельзя включать условия об ограничении правоспособности, о детях, о неимущественных обязательствах.",
      "Суд признаёт договор недействительным, если он ставит одного из супругов в крайне невыгодное положение.",
      "Особенно актуален: при ипотеке (банки часто сами требуют), при открытии бизнеса, при разных уровнях дохода супругов, при наличии долгов у одного из них."
    ],
    deadlines: [
      "Заключить договор можно в любое время — до брака или в браке.",
      "Договор, заключённый до регистрации брака, вступает в силу с момента официальной регистрации.",
      "Изменить или расторгнуть договор можно по соглашению сторон у нотариуса или через суд."
    ],
    risks: [
      "Договор без нотариального удостоверения не имеет юридической силы.",
      "Условия, ставящие одного из супругов в крайне невыгодное положение, могут быть оспорены в суде.",
      "Договор не защищает от требований кредиторов, которые не были уведомлены о его заключении."
    ],
    steps: [
      "Определите, какие вопросы нужно урегулировать: режим собственности, ипотека, доходы, долги.",
      "Подготовьте проект договора самостоятельно или с помощью юриста.",
      "Обратитесь к нотариусу: он проверит законность условий и удостоверит договор.",
      "Если договор заключается в связи с ипотекой, согласуйте его условия с банком заранее.",
      "При наличии долгов уведомьте кредиторов о заключении договора — это предусмотрено законом.",
      "Храните договор у каждого из супругов и при необходимости обновляйте при существенных изменениях."
    ],
    documents: [
      "Паспорта обоих супругов",
      "Свидетельство о браке (если брак уже зарегистрирован)",
      "Документы на имущество, которое включается в договор",
      "Проект брачного договора (нотариус поможет его составить или проверить)"
    ],
    mistakes: [
      "Заключать договор устно или без нотариуса — такой договор недействителен.",
      "Включать условия о детях, алиментах или личных обязательствах — суд признает их ничтожными.",
      "Не уведомлять кредиторов о заключении договора при наличии долгов.",
      "Составлять договор так, что один из супругов оказывается ни с чем — суд может его оспорить.",
      "Считать, что брачный договор защищает от всех претензий кредиторов."
    ],
    faq: [
      {
        question: "Можно ли заключить брачный договор после свадьбы?",
        answer: "Да, в любое время в браке. Договор вступает в силу с момента нотариального удостоверения."
      },
      {
        question: "Что будет с ипотекой, если заключить брачный договор?",
        answer: "Договор может изменить режим квартиры: определить, кому она достанется при разводе, кто несёт расходы по кредиту. Важно заранее согласовать условия с банком."
      },
      {
        question: "Может ли суд признать брачный договор недействительным?",
        answer: "Да, если договор нарушает закон или ставит одного из супругов в крайне невыгодное положение. Также можно оспорить конкретные условия."
      },
      {
        question: "Нужно ли согласие банка на брачный договор при ипотеке?",
        answer: "Банк не даёт согласие на договор, но его нужно уведомить. На практике многие банки сами требуют договор при ипотеке для одного из супругов."
      },
      {
        question: "Что нельзя включить в брачный договор?",
        answer: "Нельзя ограничивать правоспособность и дееспособность супруга, регулировать личные отношения, устанавливать права и обязанности в отношении детей, включать условия о порядке общения или воспитании."
      }
    ],
    legalReferenceKeys: ["sk_40", "sk_41", "sk_42", "sk_43", "sk_44", "sk_46", "sk_33", "sk_34"],
    selfHelpConditions: [
      "оба супруга согласны с условиями и готовы обратиться к нотариусу;",
      "состав имущества и пожелания сторон понятны;",
      "нет сложных обязательств перед третьими лицами (кредиторов, соучредителей)."
    ],
    lawyerConditions: [
      "есть ипотека, бизнес, доли в компаниях или крупные долги;",
      "нужно заранее проверить законность и устойчивость условий к оспариванию;",
      "один из супругов не уверен в последствиях конкретного условия;",
      "нужно изменить или расторгнуть уже заключённый договор."
    ]
  },
  "semya-i-deti/opeka-i-popechitelstvo": {
    title: "Опека и попечительство",
    h1: "Опека и попечительство",
    shortTitle: "Опека и попечительство",
    shortAnswer: "Опека устанавливается над детьми до 14 лет и недееспособными гражданами, попечительство — над детьми 14–18 лет и ограниченно дееспособными. Решение принимает орган опеки и попечительства, для признания гражданина недееспособным нужен суд.",
    description: "ОПЕКА НАД РЕБЁНКОМ: если родители умерли, лишены прав, признаны недееспособными или не могут заботиться о ребёнке, орган опеки назначает опекуна или попечителя из числа родственников или других лиц. Предварительная опека оформляется быстро — в течение 3 дней при острой необходимости. Постоянная опека — через полный пакет документов. ОПЕКА НАД ВЗРОСЛЫМ: гражданин признаётся недееспособным только через суд, после чего орган опеки назначает опекуна. Ограниченно дееспособным (при злоупотреблении алкоголем, наркотиками) — также через суд, назначается попечитель. ВОЗМЕЗДНАЯ ОПЕКА (приёмная семья): опекун заключает договор с органом опеки и получает вознаграждение плюс выплаты на содержание ребёнка.",
    seoTitle: "Опека и попечительство — как оформить, документы, требования и выплаты",
    seoDescription: "Как оформить опеку над ребёнком или недееспособным взрослым: куда обращаться, какие документы нужны, требования к опекуну, сроки оформления и выплаты опекунам.",
    riskLevel: "high",
    urgency: "standard",
    heroNote: {
      title: "Какая страница вам нужна",
      text: "Эта страница — про опеку и попечительство как форму защиты тех, кто не может сам себя защитить. Если вы хотите стать полноправным родителем ребёнка — это усыновление, перейдите в [«Усыновление»](/problems/semya-i-deti/usynovlenie). Если речь о лишении родителя прав — перейдите в [«Лишение и ограничение родительских прав»](/problems/semya-i-deti/lishenie-i-ogranichenie-roditelskih-prav)."
    },
    whatToKnow: [
      "Опека устанавливается над детьми до 14 лет (и над недееспособными взрослыми), попечительство — над детьми 14–18 лет (и над ограниченно дееспособными взрослыми).",
      "Опекуном может стать только совершеннолетний дееспособный гражданин. Орган опеки проверяет состояние здоровья, судимость, жилищные условия, отношения с ребёнком и желание самого ребёнка старше 10 лет.",
      "Предварительная опека оформляется за 3 дня при срочной необходимости — без полного пакета документов, но временно (до 6 месяцев). После этого нужно оформить постоянную.",
      "Признание взрослого гражданина недееспособным — только через суд. После решения суда орган опеки назначает опекуна. Без судебного решения установить опеку над дееспособным взрослым нельзя.",
      "Возмездная опека (приёмная семья) — опекун заключает договор с органом опеки и получает ежемесячное вознаграждение, а также выплаты на содержание ребёнка. Размеры устанавливает регион.",
      "Опека не прекращает родительские права — если родители живы и не лишены прав, ребёнок вправе общаться с ними, если это не противоречит его интересам.",
      "Опекун управляет имуществом подопечного и несёт за него ответственность. Сделки с недвижимостью подопечного требуют разрешения органа опеки.",
      "Орган опеки ведёт надзор: проводит плановые и внеплановые проверки условий жизни подопечного, опекун обязан ежегодно отчитываться об управлении имуществом."
    ],
    deadlines: [
      "Предварительная опека — решение принимается в течение 3 рабочих дней при острой необходимости.",
      "Постоянная опека — орган опеки принимает решение в течение 1 месяца с момента подачи полного пакета документов.",
      "Медицинское освидетельствование кандидата в опекуны — действительно 6 месяцев.",
      "Обжалование отказа в установлении опеки — в суде в течение общего срока исковой давности (3 года)."
    ],
    risks: [
      "Отказ в установлении опеки при наличии судимости за тяжкие преступления, лишении родительских прав или неудовлетворительных условиях жизни.",
      "Отстранение опекуна при нарушении обязанностей или злоупотреблении правами подопечного.",
      "Сделки с имуществом подопечного без разрешения органа опеки могут быть признаны недействительными.",
      "Если взрослый подопечный признан ограниченно дееспособным — важно правильно определить объём ограничений в решении суда."
    ],
    steps: [
      "Обратитесь в орган опеки и попечительства по месту жительства ребёнка или подопечного — за консультацией и списком документов.",
      "Пройдите медицинское освидетельствование и подготовьте документы: паспорт, справку об отсутствии судимости, документы на жильё, характеристику с места работы, справку о доходах.",
      "При необходимости пройдите обучение в школе приёмных родителей (обязательно для всех опекунов, кроме близких родственников).",
      "Подайте заявление в орган опеки с полным пакетом документов.",
      "Дождитесь обследования жилищных условий специалистом органа опеки.",
      "Получите акт о назначении опекуном и удостоверение опекуна.",
      "При оформлении возмездной опеки — заключите договор с органом опеки об осуществлении опеки за вознаграждение."
    ],
    documents: [
      "Заявление об установлении опеки (попечительства)",
      "Паспорт кандидата в опекуны",
      "Справка об отсутствии судимости",
      "Медицинское заключение о состоянии здоровья кандидата",
      "Справка о доходах или копия налоговой декларации",
      "Документы на жильё (свидетельство о праве собственности или договор найма)",
      "Автобиография",
      "Свидетельство о рождении ребёнка",
      "Документы, подтверждающие отсутствие родительского попечения (свидетельство о смерти, решение суда о лишении прав и т. п.)",
      "Согласие всех совершеннолетних членов семьи, проживающих совместно"
    ],
    mistakes: [
      "Не уточнить в органе опеки актуальный перечень документов — требования в регионах различаются.",
      "Пропустить обучение в школе приёмных родителей — без него близкие родственники могут обойтись, но остальным оно обязательно.",
      "Совершать сделки с имуществом подопечного без предварительного разрешения органа опеки.",
      "Не отчитываться ежегодно об управлении имуществом подопечного — это основание для отстранения.",
      "Путать опеку и усыновление: опека не прекращает правовую связь с биологическими родителями."
    ],
    faq: [
      {
        question: "Кто может стать опекуном?",
        answer: "Совершеннолетний дееспособный гражданин без судимости за тяжкие преступления, без лишения родительских прав и с удовлетворительными жилищными условиями. Орган опеки оценивает каждого кандидата индивидуально."
      },
      {
        question: "Можно ли стать опекуном без родства с ребёнком?",
        answer: "Да. Орган опеки отдаёт предпочтение родственникам, но при их отсутствии или нежелании — назначают других лиц, прошедших подготовку."
      },
      {
        question: "Какие выплаты получает опекун?",
        answer: "Безвозмездные опекуны получают только пособие на содержание ребёнка. Возмездные (приёмные родители) — дополнительно ежемесячное вознаграждение. Размеры устанавливает регион."
      },
      {
        question: "Чем опека отличается от усыновления?",
        answer: "Усыновление полностью приравнивает ребёнка к кровному — родительские права биологических родителей прекращаются. При опеке правовая связь с биологическими родителями сохраняется, ребёнок остаётся сиротой юридически."
      },
      {
        question: "Как оформить опеку над недееспособным взрослым?",
        answer: "Сначала суд признаёт гражданина недееспособным. Затем орган опеки назначает опекуна. Без решения суда установить опеку над дееспособным взрослым нельзя."
      },
      {
        question: "Может ли орган опеки отказать в назначении опекуном?",
        answer: "Да. Отказ возможен при наличии судимости за ряд преступлений, ненадлежащих жилищных условиях, состоянии здоровья, препятствующем воспитанию, или лишении родительских прав в прошлом. Отказ можно обжаловать в суде."
      }
    ],
    relatedDocumentSlugs: ["iskovoe-zayavlenie"],
    relatedQuestionTopics: ["опека над ребёнком", "попечительство", "стать опекуном", "приёмная семья", "выплаты опекунам", "недееспособный родственник"],
    relatedLawyerSpecializations: ["семейное право", "опека и попечительство", "защита прав детей"],
    legalReferenceKeys: [
      "gk_31", "gk_32", "gk_33", "sk_145", "sk_146", "sk_57", "sk_63",
      "fz48_11", "gpk_24", "gpk_131", "gpk_132"
    ],
    selfHelpConditions: [
      "вы близкий родственник ребёнка и орган опеки уже известен вам;",
      "документы подготовлены, жилищные условия удовлетворительны, нет спорных обстоятельств."
    ],
    lawyerConditions: [
      "орган опеки отказал и вы намерены оспорить отказ в суде;",
      "нужно признать взрослого родственника недееспособным через суд;",
      "возник конфликт с биологическими родителями ребёнка по поводу общения;",
      "нужно получить разрешение органа опеки на сделку с имуществом подопечного."
    ]
  },
  "semya-i-deti/usynovlenie": {
    title: "Усыновление",
    h1: "Усыновление",
    shortTitle: "Усыновление",
    shortAnswer: "Усыновление — это установление юридически полноценной родительско-детской связи. После усыновления ребёнок приравнивается к кровному и все права биологических родителей прекращаются. Оформляется только через суд.",
    description: "КОГО МОЖНО УСЫНОВИТЬ: только детей, оставшихся без попечения родителей — сирот, детей лишённых прав родителей или давших письменное согласие, детей, от которых родители отказались. ПОРЯДОК: заявление подаётся в районный суд по месту жительства (нахождения) ребёнка. Орган опеки даёт обязательное заключение. Прокурор участвует в деле. УСЫНОВЛЕНИЕ РЕБЁНКА СУПРУГА: отчим или мачеха может усыновить ребёнка супруга без согласия второго биологического родителя только в случаях, предусмотренных законом (лишение прав, признание безвестно отсутствующим, более 6 месяцев без уважительных причин не участвует в воспитании). ТАЙНА УСЫНОВЛЕНИЯ охраняется законом: должностные лица и иные лица, разгласившие тайну, несут уголовную ответственность.",
    seoTitle: "Усыновление ребёнка — порядок, документы, суд и требования к усыновителям",
    seoDescription: "Как усыновить ребёнка из детского дома или ребёнка супруга: порядок, требования к усыновителям, документы в суд, роль органа опеки и тайна усыновления.",
    riskLevel: "high",
    urgency: "standard",
    heroNote: {
      title: "Какая страница вам нужна",
      text: "Усыновление — это полное правовое замещение родителей. Если вы хотите стать законным представителем ребёнка без прекращения связи с биологическими родителями — это опека, перейдите в [«Опека и попечительство»](/problems/semya-i-deti/opeka-i-popechitelstvo)."
    },
    whatToKnow: [
      "Усыновление оформляется только через суд — никакой другой орган не вправе его установить. Орган опеки участвует в деле и даёт заключение, прокурор — обязательный участник.",
      "После вступления решения в силу усыновлённый ребёнок приравнивается к кровному: наследство, алименты, фамилия, отчество. Права и обязанности по отношению к биологическим родителям прекращаются.",
      "Усыновителю должно быть не менее 18 лет. Разница в возрасте с ребёнком — как правило, не менее 16 лет (суд вправе отступить). Одинокий усыновитель — допускается.",
      "Для усыновления ребёнка старше 10 лет необходимо его письменное согласие. Исключение — если ребёнок давно проживает с усыновителем и считает его родителем.",
      "Нельзя усыновить: лица, лишённые родительских прав; имеющие судимость за тяжкие преступления против личности; страдающие рядом заболеваний; не прошедшие подготовку в школе приёмных родителей (кроме близких родственников и отчима/мачехи).",
      "Тайна усыновления охраняется законом. По просьбе усыновителей суд вправе изменить имя, дату и место рождения ребёнка, а также записать усыновителей как родителей в свидетельство о рождении.",
      "Усыновление ребёнка супруга (отчим/мачеха): требуется согласие биологического родителя, кроме случаев — он лишён прав, признан безвестно отсутствующим, более 6 месяцев без уважительных причин не участвует в воспитании и содержании.",
      "Отмена усыновления возможна в судебном порядке — по заявлению усыновителей, прокурора, органа опеки или самого ребёнка (с 14 лет)."
    ],
    deadlines: [
      "Суд рассматривает дело об усыновлении в течение 2 месяцев.",
      "Медицинское заключение кандидата в усыновители действительно 6 месяцев.",
      "После вступления решения суда в силу нужно в течение 1 месяца обратиться в ЗАГС для регистрации усыновления и получения нового свидетельства о рождении.",
      "Подготовка в школе приёмных родителей — как правило, 1–3 месяца."
    ],
    risks: [
      "Суд откажет в усыновлении при несоответствии требованиям к усыновителям или если посчитает, что усыновление не отвечает интересам ребёнка.",
      "Тайна усыновления может быть раскрыта при смене документов или судебных разбирательствах — заранее продумайте стратегию.",
      "При отмене усыновления ребёнок возвращается в систему опеки, что тяжело психологически и юридически."
    ],
    steps: [
      "Встаньте на учёт в органе опеки по месту жительства как кандидат в усыновители — получите список документов.",
      "Пройдите подготовку в школе приёмных родителей (обязательно, кроме близких родственников и отчима/мачехи усыновляемого ребёнка).",
      "Пройдите медицинское освидетельствование по установленному перечню заболеваний.",
      "Получите заключение органа опеки о возможности быть усыновителем.",
      "Подберите ребёнка через базу данных детей-сирот (при усыновлении из детского учреждения) или договоритесь с органом опеки при усыновлении ребёнка супруга.",
      "Подайте заявление об усыновлении в районный суд по месту жительства (нахождения) ребёнка с полным пакетом документов.",
      "Примите участие в судебном заседании — вместе с представителем органа опеки и прокурором.",
      "После вступления решения в силу обратитесь в ЗАГС для получения нового свидетельства о рождении."
    ],
    documents: [
      "Заявление об усыновлении в районный суд",
      "Паспорт усыновителя",
      "Медицинское заключение об отсутствии заболеваний из перечня",
      "Справка об отсутствии судимости",
      "Документы о доходах или справка с места работы",
      "Документы на жильё",
      "Заключение органа опеки о возможности быть усыновителем",
      "Свидетельство о браке (если усыновляют оба супруга или один при наличии брака)",
      "Согласие супруга, если усыновляет один из супругов",
      "Согласие биологического родителя (при усыновлении ребёнка супруга, если родитель жив и не лишён прав)",
      "Согласие ребёнка старше 10 лет"
    ],
    mistakes: [
      "Начинать подбор ребёнка до получения заключения органа опеки о возможности быть усыновителем.",
      "Пропустить подготовку в школе приёмных родителей — без неё суд откажет (кроме случаев-исключений).",
      "Не согласовать с биологическим родителем ребёнка супруга и не выяснить заранее, есть ли у него права.",
      "Не учесть, что тайна усыновления не абсолютна — ребёнок вправе узнать о своём происхождении.",
      "Забыть обратиться в ЗАГС после решения суда — без этого новые документы ребёнок не получит."
    ],
    faq: [
      {
        question: "Можно ли усыновить чужого ребёнка, если его родители живы?",
        answer: "Да, но только при наличии их письменного согласия или в случаях, когда согласие не требуется: родители лишены прав, признаны безвестно отсутствующими, недееспособными, или более 6 месяцев не участвуют в жизни ребёнка без уважительных причин."
      },
      {
        question: "Может ли одинокий человек усыновить ребёнка?",
        answer: "Да. Одинокие усыновители допускаются. Но два лица, не состоящие в браке между собой, не могут усыновить одного и того же ребёнка."
      },
      {
        question: "Нужна ли школа приёмных родителей для усыновления ребёнка супруга?",
        answer: "Нет. Отчим или мачеха, усыновляющие ребёнка супруга, а также близкие родственники освобождены от этого требования."
      },
      {
        question: "Что происходит с алиментами после усыновления?",
        answer: "Обязанность биологических родителей платить алименты прекращается. Усыновитель несёт все обязанности родителя, включая содержание."
      },
      {
        question: "Можно ли отменить усыновление?",
        answer: "Да, только через суд — по заявлению усыновителей, прокурора, органа опеки или ребёнка после 14 лет. После отмены ребёнок, как правило, передаётся под опеку."
      }
    ],
    relatedDocumentSlugs: ["iskovoe-zayavlenie"],
    relatedQuestionTopics: ["усыновление ребёнка", "усыновить ребёнка из детского дома", "усыновление ребёнка супруга", "отчим хочет усыновить ребёнка", "тайна усыновления", "школа приёмных родителей"],
    relatedLawyerSpecializations: ["семейное право", "усыновление", "защита прав детей"],
    legalReferenceKeys: [
      "sk_124", "sk_125", "sk_127", "sk_132", "sk_137", "sk_57",
      "gpk_24", "gpk_131", "gpk_132"
    ],
    selfHelpConditions: [
      "усыновляете ребёнка супруга при наличии согласия биологического родителя и нет спорных обстоятельств;",
      "все документы готовы и орган опеки выдал положительное заключение."
    ],
    lawyerConditions: [
      "биологический родитель не даёт согласия и нужно доказать основания для усыновления без него;",
      "суд истребует дополнительные доказательства;",
      "нужно оспорить или отменить ранее состоявшееся усыновление;",
      "усыновление сопровождается изменением даты рождения или других данных ребёнка."
    ]
  },
  "semya-i-deti/materinskiy-kapital": {
    title: "Материнский капитал",
    h1: "Материнский капитал",
    shortTitle: "Материнский капитал",
    shortAnswer: "Материнский капитал — государственная выплата при рождении или усыновлении первого и последующих детей. Сертификат выдаёт Социальный фонд России (СФР), использовать средства можно строго по целевым направлениям.",
    description: "С 2020 года материнский капитал выдаётся уже при рождении первого ребёнка. Сертификат оформляется автоматически через Госуслуги после регистрации рождения или выдаётся по заявлению в СФР. НАПРАВЛЕНИЯ ИСПОЛЬЗОВАНИЯ: улучшение жилищных условий (покупка, строительство, реконструкция, ипотека), образование детей (любых, не только родившегося), пенсионные накопления матери, товары и услуги для ребёнка-инвалида, ежемесячная выплата семьям с низким доходом (до исполнения ребёнку 3 лет). ОГРАНИЧЕНИЯ: на жильё без ипотеки — только после достижения ребёнком 3 лет; на погашение ипотеки — в любое время. При покупке жилья с использованием маткапитала обязательно нужно выделить доли всем детям (и супругу). Нецелевое использование — уголовная ответственность.",
    seoTitle: "Материнский капитал — как получить, на что потратить и выделить доли детям",
    seoDescription: "Как получить сертификат на материнский капитал, на что его можно потратить: ипотека, жильё, образование, ежемесячная выплата. Когда нужно выделять доли детям и что будет за нецелевое использование.",
    riskLevel: "medium",
    urgency: "standard",
    heroNote: {
      title: "Главное про маткапитал",
      text: "Сертификат сейчас оформляется автоматически — проверьте его наличие в личном кабинете на Госуслугах. Если использовали маткапитал на ипотеку, не забудьте выделить доли детям после погашения — это обязательство перед нотариусом."
    },
    whatToKnow: [
      "С 2020 года маткапитал выдаётся с первого ребёнка. При рождении второго и последующих — дополнительная сумма (если первый ребёнок родился до 2020 года — капитал назначается со второго). Размер индексируется ежегодно.",
      "Сертификат оформляется автоматически после регистрации рождения ребёнка через ЗАГС. Уведомление приходит в личный кабинет на Госуслугах. При отсутствии — подайте заявление в СФР.",
      "Использовать маткапитал можно на: покупку или строительство жилья, погашение ипотеки (в любое время, без ограничения по возрасту ребёнка), образование любого ребёнка в семье, пенсию матери, товары для ребёнка-инвалида, ежемесячную выплату (при доходе ниже 2 прожиточных минимумов на человека, до 3 лет ребёнку).",
      "На жильё без ипотеки (прямая покупка, строительство) — только после того, как ребёнку исполнится 3 года. На погашение уже имеющейся ипотеки — в любое время.",
      "При использовании маткапитала на жильё: обязательно нужно выделить доли всем членам семьи (супруг + все дети). Срок — 6 месяцев после снятия обременения или завершения строительства. Обязательство фиксируется у нотариуса.",
      "Нецелевое использование маткапитала (обналичивание, покупка авто, алкоголь) — уголовная ответственность. СФР проверяет целевое использование.",
      "Право на маткапитал имеет мать. Отец — только в случаях смерти матери, лишения её прав, совершения преступления против ребёнка. Усыновители также имеют право при усыновлении двух и более детей."
    ],
    deadlines: [
      "Сертификат оформляется автоматически в течение 5 рабочих дней после регистрации рождения. При заявлении — СФР рассматривает в течение 5 рабочих дней.",
      "Направить средства на погашение ипотеки можно в любое время после рождения ребёнка.",
      "Для других направлений (кроме ипотеки) — как правило, после достижения ребёнком 3 лет.",
      "Обязательство по выделению долей детям — в течение 6 месяцев после погашения ипотеки или снятия обременения с жилья."
    ],
    risks: [
      "Не выполнить обязательство по выделению долей — прокуратура может потребовать аннулирования сделки.",
      "Схемы обналичивания маткапитала квалифицируются как мошенничество и влекут уголовную ответственность.",
      "При разводе маткапитал не делится между супругами — он предназначен для детей.",
      "Если жильё куплено с маткапиталом, при продаже нужно соблюдать права детей-собственников (согласие органа опеки)."
    ],
    steps: [
      "Проверьте наличие сертификата в личном кабинете на Госуслугах или в приложении СФР.",
      "Определите направление использования: ипотека, покупка жилья, образование, ежемесячная выплата.",
      "При погашении ипотеки: подайте заявление в СФР через Госуслуги или МФЦ, приложив кредитный договор и реквизиты банка.",
      "При покупке жилья: согласуйте с продавцом оплату частично маткапиталом (СФР перечислит средства в течение 10 рабочих дней после одобрения).",
      "После использования маткапитала на жильё: обратитесь к нотариусу для составления и удостоверения обязательства по выделению долей.",
      "В течение 6 месяцев после погашения ипотеки/снятия обременения — выделите доли всем детям и супругу через Росреестр."
    ],
    documents: [
      "Сертификат на материнский капитал",
      "Паспорт владельца сертификата",
      "Свидетельства о рождении всех детей",
      "Кредитный договор и реквизиты банка (при погашении ипотеки)",
      "Договор купли-продажи или долевого участия (при покупке жилья)",
      "Нотариальное обязательство по выделению долей",
      "Заявление о распоряжении средствами маткапитала (подаётся в СФР)"
    ],
    mistakes: [
      "Не выделить доли детям после погашения ипотеки — это нарушение обязательства перед СФР и влечёт правовые последствия.",
      "Пытаться обналичить маткапитал через сомнительные схемы — уголовная ответственность.",
      "Не проверить сертификат на Госуслугах и думать, что нужно специально подавать заявление — сейчас он оформляется автоматически.",
      "Использовать маткапитал на жильё до исполнения ребёнку 3 лет без ипотеки — СФР откажет.",
      "Продавать жильё, купленное с маткапиталом, без выделения долей детям — сделку могут оспорить."
    ],
    faq: [
      {
        question: "С какого ребёнка выдаётся материнский капитал?",
        answer: "С 2020 года — с первого ребёнка. При рождении второго и последующих выплачивается дополнительная сумма. Если первый родился до 2020 года, капитал назначается со второго."
      },
      {
        question: "Можно ли потратить маткапитал на ремонт квартиры?",
        answer: "Нет. Ремонт не входит в перечень допустимых направлений. Можно использовать на строительство или реконструкцию дома, но не на текущий ремонт квартиры."
      },
      {
        question: "Можно ли использовать маткапитал на ипотеку сразу после рождения?",
        answer: "Да. Погашение ипотеки — единственное жилищное направление, доступное сразу, без ожидания 3 лет."
      },
      {
        question: "Нужно ли выделять долю мужу при использовании маткапитала?",
        answer: "Да. Обязательство предполагает выделение долей всем членам семьи: матери, отцу и всем детям."
      },
      {
        question: "Что будет, если не выделить доли детям?",
        answer: "Прокуратура или СФР вправе обратиться в суд с требованием исполнить обязательство или признать сделку недействительной. Доли нужно выделить в течение 6 месяцев после снятия обременения."
      },
      {
        question: "Делится ли маткапитал при разводе?",
        answer: "Нет. Маткапитал — целевая государственная выплата для детей, не является совместно нажитым имуществом супругов и разделу не подлежит."
      }
    ],
    relatedDocumentSlugs: ["iskovoe-zayavlenie"],
    relatedQuestionTopics: ["материнский капитал", "маткапитал на ипотеку", "выделить доли детям маткапитал", "сертификат материнский капитал", "ежемесячная выплата маткапитал", "маткапитал на жильё"],
    relatedLawyerSpecializations: ["семейное право", "материнский капитал", "жилищное право"],
    legalReferenceKeys: ["fz256_7", "fz256_10", "uk_159_2", "sk_60", "sk_61", "gpk_131", "gpk_132"],
    selfHelpConditions: [
      "направляете маткапитал на погашение ипотеки через банк и СФР — это стандартная процедура;",
      "оформляете ежемесячную выплату через Госуслуги или МФЦ."
    ],
    lawyerConditions: [
      "СФР отказал в распоряжении средствами и вы планируете обжалование;",
      "продаёте жильё, купленное с маткапиталом, и нужно согласие органа опеки на сделку;",
      "при разводе возник спор о жилье, купленном с использованием маткапитала;",
      "нотариус отказывает в удостоверении обязательства по выделению долей."
    ]
  },
  "semya-i-deti/brak-zags-i-smena-familii": {
    title: "Брак и ЗАГС",
    h1: "Брак и ЗАГС",
    shortTitle: "Брак и ЗАГС",
    shortAnswer: "Выберите цель: заключить брак, сменить фамилию или имя, получить повторный документ либо исправить запись ЗАГС. После выбора покажем только подходящие шаги и документы.",
    description: "Маршрут помогает выбрать правильную процедуру в ЗАГС: совместное заявление о браке, заявление о перемене имени, повторное свидетельство или справку, либо исправление актовой записи. Общий иск и универсальный бланк для всех случаев не подходят.",
    seoTitle: "Брак и ЗАГС: регистрация, фамилия и документы",
    seoDescription: "Как зарегистрировать брак, сменить фамилию или имя, получить повторный документ и исправить запись ЗАГС: формы, сроки, госпошлины и порядок подачи.",
    riskLevel: "low",
    urgency: "standard",
    heroNote: {
      title: "Сначала выберите цель",
      text: "Если речь о разводе, алиментах, детях или разделе имущества, это другие семейные маршруты. Здесь только регистрация брака, перемена имени, повторные документы и исправление записей ЗАГС."
    },
    whatToKnow: [
      "Брак регистрируется в личном присутствии будущих супругов: по истечении месяца и не позднее 12 месяцев со дня подачи заявления.",
      "При уважительных причинах ЗАГС может назначить регистрацию до истечения месяца; при особых обстоятельствах, например беременности, рождении ребёнка или угрозе жизни, — в день подачи заявления.",
      "При заключении брака можно выбрать общую фамилию, фамилию одного из супругов или сохранить добрачные фамилии. Отдельная перемена имени оформляется по другой процедуре.",
      "После изменения фамилии, имени или отчества паспорт остаётся действительным 90 дней. СНИЛС и ИНН заново не присваиваются: в СФР обновляют персональные данные, ИНН остаётся прежним.",
      "Разведённому лицу не выдаётся повторное свидетельство о заключении брака; по просьбе выдаётся справка или иной документ, подтверждающий факт регистрации."
    ],
    deadlines: [
      "Регистрация брака — по истечении месяца и не позднее 12 месяцев со дня подачи заявления; при уважительных причинах срок может быть сокращён.",
      "При особых обстоятельствах брак может быть зарегистрирован в день подачи заявления.",
      "Паспорт после смены фамилии, имени или отчества становится недействительным по истечении 90 дней.",
      "Заявление о перемене имени рассматривается в месячный срок; при уважительных причинах срок может быть увеличен не более чем на два месяца.",
      "Заявление об исправлении или изменении записи ЗАГС рассматривается в месячный срок; срок может быть увеличен не более чем на два месяца.",
      "Повторное свидетельство или справка при личном обращении выдаётся в день обращения, если запись есть в ЕГР ЗАГС."
    ],
    risks: [
      "ЗАГС откажет в регистрации брака, если есть препятствия: другой зарегистрированный брак, близкое родство, отношения усыновителя и усыновлённого, недееспособность одного из лиц.",
      "Если после смены ФИО не обновить паспорт и связанные данные, могут возникнуть проблемы с удостоверением личности, банками, работодателем и госуслугами.",
      "Если между заинтересованными лицами есть спор об исправлении записи, ЗАГС не решает его сам: может потребоваться судебное решение.",
      "При отказе ЗАГС сначала нужно получить письменные причины отказа, а уже потом выбирать способ обжалования."
    ],
    steps: [
      "Выберите цель обращения: брак, перемена имени, повторный документ или исправление записи.",
      "Проверьте, какая официальная форма заявления нужна именно для этой цели.",
      "Соберите документы, подтверждающие право на регистрацию, выдачу документа или исправление записи.",
      "Подайте заявление в ЗАГС, через МФЦ или официальный электронный сервис, если он доступен для выбранной услуги.",
      "При отказе потребуйте письменные причины отказа и только после этого выбирайте способ обжалования."
    ],
    documents: [
      "Паспорт заявителя или паспорта обоих будущих супругов.",
      "Документ о прекращении предыдущего брака, если он был.",
      "Разрешение на вступление в брак до брачного возраста, если заявитель несовершеннолетний.",
      "Свидетельства и документы-основания для перемены имени или исправления записи.",
      "Документ об оплате госпошлины, если сведения об оплате не поступили автоматически."
    ],
    mistakes: [
      "Использовать один свободный текст заявления вместо установленной формы ЗАГС.",
      "Смешивать выбор фамилии при браке и отдельную перемену имени: это разные процедуры.",
      "Просить повторное свидетельство о заключении брака после развода, хотя в этом случае выдаётся справка или иной подтверждающий документ.",
      "Писать, что СНИЛС или ИНН меняются как номер. Номера сохраняются, обновляются только персональные данные.",
      "Оспаривать устный отказ без письменных причин отказа."
    ],
    faq: [
      {
        question: "Можно ли зарегистрировать брак быстрее чем через месяц?",
        answer: "Да, если ЗАГС признает причины уважительными. При особых обстоятельствах, например беременности, рождении ребёнка или угрозе жизни, брак может быть зарегистрирован в день подачи заявления."
      },
      {
        question: "Чем выбор фамилии при браке отличается от перемены имени?",
        answer: "Фамилию при браке выбирают в заявлении о заключении брака. Перемена имени, фамилии или отчества по желанию оформляется отдельным заявлением в ЗАГС."
      },
      {
        question: "Выдают ли повторное свидетельство о браке после развода?",
        answer: "Нет. Лицам, расторгнувшим брак, повторное свидетельство о заключении брака не выдаётся. По просьбе выдаётся справка или иной документ о факте регистрации."
      },
      {
        question: "Что делать, если ЗАГС отказал?",
        answer: "Попросите письменные причины отказа. После этого можно проверить основание отказа и выбрать путь: исправить документы, обратиться в вышестоящий орган или в суд."
      }
    ],
    relatedDocumentSlugs: ["zayavlenie-v-zags"],
    relatedQuestionTopics: ["хочу зарегистрировать брак", "как подать заявление в загс", "как зарегистрировать брак быстрее", "сменить фамилию после свадьбы", "сменить имя", "потерял свидетельство о браке", "получить справку о браке после развода", "исправить ошибку в свидетельстве", "загс отказал"],
    relatedLawyerSpecializations: ["семейное право", "гражданское право"],
    legalReferenceKeys: ["sk_10", "sk_11", "sk_12", "sk_13", "sk_14", "sk_32", "fz143_9", "fz143_11", "fz143_26", "fz143_27", "fz143_28", "fz143_58", "fz143_59", "fz143_60", "fz143_69", "fz143_71", "fz143_72", "nk_333_26", "minjust_201_forms", "passport_2267_8", "sfr_snils_update", "fns_inn_same"],
    lastReviewedAt: "2026-07-21",
    selfHelpConditions: [
      "стандартная регистрация брака без осложнений;",
      "смена фамилии через ЗАГС — перечень документов стандартный."
    ],
    lawyerConditions: [
      "ЗАГС отказал в регистрации и вы планируете оспорить отказ;",
      "брак оспаривается или признаётся недействительным;",
      "нужно восстановить утраченную актовую запись через суд."
    ]
  },
  "semya-i-deti/nasilie-v-seme": {
    title: "Насилие в семье",
    h1: "Насилие в семье",
    shortTitle: "Насилие в семье",
    shortAnswer: "Если есть угроза жизни или здоровью — немедленно звоните 112. Семейное насилие преследуется по уголовному и административному закону: побои, угроза убийством, причинение вреда здоровью — это конкретные составы преступлений, а не просто конфликт.",
    description: "ФИЗИЧЕСКОЕ НАСИЛИЕ: побои в отношении членов семьи — уголовное дело по ст. 116 УК РФ. Тяжкий или средний вред здоровью — ст. 111, 112 УК РФ. Угроза убийством — ст. 119 УК РФ. Обращаться в полицию; уголовное дело возбуждается независимо от желания потерпевшего при тяжком вреде. ЗАЩИТА ДЕТЕЙ: если насилие направлено против ребёнка — одновременно обратитесь в орган опеки. При непосредственной угрозе орган опеки вправе немедленно забрать ребёнка. ПСИХОЛОГИЧЕСКОЕ И ЭКОНОМИЧЕСКОЕ НАСИЛИЕ: формально в отдельные статьи не выделены, но могут квалифицироваться как угрозы, принуждение, истязание (ст. 117 УК РФ — систематическое причинение физических или психических страданий). ЗАЩИТНЫЙ МЕХАНИЗМ: уголовное дело, гражданский иск о возмещении вреда здоровью, выселение обидчика через суд (если жильё ваше), лишение или ограничение родительских прав при угрозе детям.",
    seoTitle: "Насилие в семье — что делать, куда обращаться, как защитить себя и детей",
    seoDescription: "Что делать при домашнем насилии: куда звонить, как зафиксировать побои, подать заявление в полицию, защитить детей через орган опеки и добиться привлечения обидчика к ответственности.",
    riskLevel: "high",
    urgency: "today",
    urgencyNote: "Если прямо сейчас есть угроза вашей жизни или здоровью — звоните 112 немедленно. Не ждите следующего случая.",
    heroNote: {
      title: "Если угроза прямо сейчас",
      text: "Позвоните 112. Уйдите в безопасное место — к соседям, знакомым, в кризисный центр. Зафиксируйте травмы в травмпункте сразу — медицинские документы станут доказательством. Заявление в полицию можно подать позже, доказательства нужны сразу."
    },
    whatToKnow: [
      "Побои в отношении члена семьи — уголовное дело по ст. 116 УК РФ (наказание до 2 лет лишения свободы). При повторных побоях или при причинении лёгкого вреда здоровью — ст. 115 УК РФ. Это не административное нарушение — это уголовное преступление.",
      "Угроза убийством или тяжким вредом здоровью — ст. 119 УК РФ. Не нужно ждать, пока угрозу исполнят. Достаточно, что у вас были основания её бояться.",
      "Тяжкий вред здоровью (ст. 111 УК РФ) и средний вред (ст. 112) — дела публичного обвинения: уголовное дело возбуждается независимо от заявления потерпевшего.",
      "Для доказательства побоев: сразу обратитесь в травмпункт или скорую помощь. Медицинские документы — главное доказательство. Сфотографируйте травмы. Сохраните переписку с угрозами.",
      "Если насилие направлено против ребёнка: одновременно с полицией обратитесь в орган опеки. При непосредственной угрозе орган опеки вправе немедленно забрать ребёнка у родителя без решения суда (ст. 77 СК РФ).",
      "Систематическое причинение физических или психических страданий — истязание (ст. 117 УК РФ). Один раз может квалифицироваться по другим статьям, систематически — по этой.",
      "Кризисные центры помощи жертвам насилия: предоставляют временное жильё, психологическую и юридическую помощь. Обратитесь в центр вашего региона.",
      "Выселение обидчика возможно через суд: если жильё принадлежит вам, можно требовать выселения. Если жильё совместное — сложнее, но через суд при доказанном насилии возможно."
    ],
    deadlines: [
      "Медицинскую фиксацию травм проводите сразу — чем раньше, тем лучше. Документы из травмпункта — основное доказательство.",
      "Заявление в полицию — сразу после инцидента или как только окажетесь в безопасности. Полиция обязана принять заявление.",
      "Срок давности по побоям (ст. 116 УК) — 2 года. По тяжкому вреду здоровью — 10 лет. Не затягивайте.",
      "Иск о возмещении вреда здоровью — в течение 3 лет с момента, когда узнали о причинённом вреде."
    ],
    risks: [
      "Без медицинской фиксации травм доказать побои крайне сложно — фиксируйте сразу.",
      "Примирение с обидчиком не прекращает уголовное дело по ст. 111, 112 УК (тяжкий и средний вред) — эти дела публичного обвинения.",
      "Если насилию подвергаются дети, а вы не обращаетесь за защитой — орган опеки вправе поставить под сомнение вашу способность защитить ребёнка.",
      "Обидчик может подать встречное заявление. Сохраняйте все доказательства своей позиции."
    ],
    steps: [
      "Если есть угроза прямо сейчас — позвоните 112, уйдите в безопасное место.",
      "Сразу обратитесь в травмпункт или скорую помощь для фиксации травм — возьмите справку.",
      "Сфотографируйте травмы, сохраните переписку с угрозами, запишите имена свидетелей.",
      "Подайте заявление в полицию — в дежурную часть по месту происшествия или по месту жительства. Потребуйте талон-уведомление о принятии заявления.",
      "Если под угрозой дети — одновременно обратитесь в орган опеки и попечительства.",
      "При необходимости временного жилья — обратитесь в кризисный центр помощи жертвам насилия вашего региона.",
      "При систематическом насилии — проконсультируйтесь с юристом о гражданском иске о возмещении вреда здоровью и о лишении или ограничении родительских прав обидчика."
    ],
    documents: [
      "Справка из травмпункта или скорой помощи с описанием травм",
      "Фотографии травм (с датой и временем съёмки)",
      "Заявление в полицию (вам обязаны выдать талон-уведомление)",
      "Скриншоты угрожающей переписки, аудио- и видеозаписи при наличии",
      "Показания свидетелей (оформляются в полиции)",
      "Заявление в орган опеки (при угрозе детям)",
      "Медицинские документы о ранее причинённых травмах (при систематическом насилии)"
    ],
    mistakes: [
      "Не фиксировать травмы медицински — без справки из травмпункта доказать побои крайне сложно.",
      "Ждать 'последнего случая' и затягивать с заявлением — каждый задокументированный эпизод имеет значение.",
      "Думать, что примирение прекратит уголовное дело — по ряду статей это не так.",
      "Не брать талон-уведомление в полиции — без него сложно контролировать движение заявления.",
      "Удалять угрожающую переписку — сохраняйте все доказательства.",
      "При угрозе детям не обращаться в орган опеки — это ваша обязанность как родителя."
    ],
    faq: [
      {
        question: "Что будет, если я заберу заявление из полиции?",
        answer: "По лёгким побоям (частно-публичное обвинение) примирение возможно. Но по тяжкому и среднему вреду здоровью (ст. 111, 112 УК) дело прекратить нельзя — оно публичного обвинения."
      },
      {
        question: "Нужны ли свидетели для возбуждения дела?",
        answer: "Нет. Дело может быть возбуждено на основании медицинской документации и вашего заявления. Свидетели усиливают позицию, но их отсутствие не блокирует уголовный процесс."
      },
      {
        question: "Можно ли выселить обидчика из квартиры?",
        answer: "Если жильё ваше — через суд можно требовать выселения. Если совместное — сложнее, но при доказанной угрозе и судебном решении возможно. Обратитесь к юристу за оценкой конкретной ситуации."
      },
      {
        question: "Что делать, если полиция отказывается принять заявление?",
        answer: "Потребуйте объяснения в письменной форме. Подайте жалобу прокурору или обжалуйте отказ в суде. Также можно подать заявление через Госуслуги или напрямую в прокуратуру."
      },
      {
        question: "Как защитить ребёнка от насилия со стороны второго родителя?",
        answer: "Обратитесь в орган опеки. При непосредственной угрозе орган опеки вправе немедленно забрать ребёнка. Одновременно можно подать иск об ограничении или лишении родительских прав."
      },
      {
        question: "Есть ли в России защитный ордер, как за рубежом?",
        answer: "В России нет отдельного института защитных ордеров. Схожие меры — через суд: запрет приближаться, временное ограничение в правах, ограничение родительских прав. Прорабатывается законодательно, но пока не принято."
      }
    ],
    relatedDocumentSlugs: ["iskovoe-zayavlenie"],
    relatedQuestionTopics: ["домашнее насилие", "насилие в семье куда обращаться", "муж бьёт что делать", "побои заявление в полицию", "защита от насилия в семье", "кризисный центр для женщин"],
    relatedLawyerSpecializations: ["семейное право", "уголовное право", "защита прав детей"],
    legalReferenceKeys: [
      "uk_116", "uk_119", "uk_111",
      "sk_56", "sk_69", "sk_73", "sk_77", "sk_78",
      "gpk_131", "gpk_132"
    ],
    selfHelpConditions: [
      "фиксируете травмы в травмпункте самостоятельно;",
      "подаёте заявление в полицию при однократном инциденте с явными доказательствами."
    ],
    lawyerConditions: [
      "полиция отказывается возбуждать дело — нужна жалоба прокурору или в суд;",
      "систематическое насилие и нужен иск о возмещении вреда здоровью;",
      "нужно выселить обидчика или оспорить его права на жильё;",
      "насилие направлено против детей и нужно лишение или ограничение родительских прав;",
      "обидчик подал встречное заявление."
    ]
  },
  "semya-i-deti/suprug-skryvaet-imuschestvo": {
    title: "Супруг скрывает имущество при разводе",
    h1: "Супруг скрывает имущество при разводе",
    shortTitle: "Супруг скрывает имущество",
    shortAnswer: "Если супруг скрывает или переводит имущество перед разводом, нужно действовать быстро: собирать сведения об активах, заявлять обеспечительные меры и оспаривать сомнительные сделки.",
    description: "Скрытое имущество можно выявить через запросы в Росреестр, ГИБДД, налоговую, банки, реестры юридических лиц. Сделки по продаже или дарению общего имущества, совершённые без согласия супруга, можно оспорить в течение года с момента, когда супруг узнал об этой сделке. В суде можно заявить ходатайство об аресте имущества и об истребовании доказательств.",
    seoTitle: "Супруг скрывает имущество при разводе — как найти и разделить",
    seoDescription: "Что делать, если муж или жена скрывают имущество при разводе: как выявить активы, оспорить сделки, заявить обеспечительные меры и добиться справедливого раздела.",
    relatedDocumentSlugs: ["isk-o-razdele-imuschestva", "iskovoe-zayavlenie"],
    relatedQuestionTopics: ["скрытое имущество при разводе", "муж скрывает имущество", "переоформил имущество перед разводом", "оспорить сделку при разводе", "арест имущества при разводе"],
    relatedLawyerSpecializations: ["семейное право", "раздел имущества", "оспаривание сделок"],
    legalReferenceKeys: ["sk_33", "sk_34", "sk_35", "sk_38", "sk_39", "gpk_139", "gpk_140", "gpk_131", "gpk_132", "nk_333_19"],
    heroNote: {
      title: "Действуйте быстро",
      text: "Переоформление имущества на родственников или продажа до раздела — частая схема. Чем раньше подан иск с ходатайством об аресте, тем меньше шансов, что имущество исчезнет."
    },
    whatToKnow: [
      "Сделки по продаже или дарению общего имущества без согласия другого супруга можно оспорить — срок давности один год с момента, когда супруг узнал о сделке.",
      "Суд по ходатайству может наложить арест на имущество ещё до вынесения решения — это ключевой инструмент защиты.",
      "Сведения об имуществе можно получить через запросы: Росреестр, ГИБДД, налоговая, ПФР, реестры юрлиц, банки (через суд).",
      "Если имущество было реализовано по заниженной цене или переведено на родственников, такую сделку можно признать мнимой или оспорить.",
      "Если доказать размер скрытого имущества сложно, суд вправе при разделе присудить компенсацию, исходя из стоимости установленных активов.",
      "Доходы, скрытые от семьи и потраченные в ущерб ей, также могут учитываться при разделе."
    ],
    deadlines: [
      "Ходатайство об аресте имущества можно заявить одновременно с подачей иска о разделе или сразу после.",
      "Срок давности для оспаривания сделок — один год с момента, когда узнали о сделке.",
      "Срок давности для иска о разделе имущества — три года с момента, когда узнали о нарушении права."
    ],
    risks: [
      "Чем дольше ждать с подачей иска, тем больше активов может быть переоформлено или продано.",
      "Без обеспечительных мер ответчик может продолжить выводить активы в процессе суда.",
      "Оспаривание сделок требует доказательств: одного подозрения суду недостаточно."
    ],
    steps: [
      "Немедленно запросите информацию об имуществе супруга: выписки ЕГРН, данные ГИБДД, сведения из налоговой о доходах и счетах.",
      "Проверьте сделки за последние 1–3 года: договоры дарения, купли-продажи, переводы на родственников.",
      "Подайте иск о разделе имущества и одновременно — ходатайство о наложении обеспечительных мер (арест).",
      "В иске заявите ходатайство об истребовании доказательств: суд вправе запросить банковские выписки, сведения из реестров.",
      "При наличии оснований подайте отдельный иск об оспаривании конкретной сделки.",
      "Зафиксируйте доказательства скрытого имущества: переписку, фото, свидетелей, документы о расходах семьи."
    ],
    documents: [
      "Иск о разделе имущества с ходатайством об обеспечительных мерах",
      "Иск об оспаривании сделки (при необходимости)",
      "Выписки из ЕГРН по имуществу обоих супругов",
      "Данные о транспортных средствах из ГИБДД",
      "Переписка, квитанции, фото, свидетельские показания о наличии имущества",
      "Сведения о счетах и вкладах (запрашиваются через суд)"
    ],
    mistakes: [
      "Ждать и надеяться, что супруг сам всё расскажет — действовать нужно до завершения раздела.",
      "Не подавать ходатайство об аресте имущества сразу при подаче иска.",
      "Полагаться только на устные заверения о составе имущества.",
      "Не фиксировать сведения об активах, которые становятся известны до суда.",
      "Пропустить срок давности для оспаривания конкретной сделки.",
      "Не запрашивать документы о доходах и расходах семьи — они могут подтвердить наличие скрытых активов."
    ],
    faq: [
      {
        question: "Как доказать, что супруг продал общее имущество?",
        answer: "Через запросы в Росреестр, ГИБДД, налоговую. В рамках судебного дела суд вправе истребовать банковские выписки, договоры и иные документы."
      },
      {
        question: "Можно ли оспорить договор дарения на родственника?",
        answer: "Да, если имущество являлось общим и было отчуждено без согласия супруга. Срок давности — один год с момента, когда супруг узнал о сделке."
      },
      {
        question: "Как наложить арест на имущество супруга?",
        answer: "Подайте ходатайство об обеспечении иска одновременно с иском о разделе. Суд рассматривает его оперативно и вправе наложить арест до вынесения решения по существу."
      },
      {
        question: "Что делать, если супруг занижает стоимость имущества?",
        answer: "Заявите ходатайство о назначении независимой оценочной экспертизы. Суд определит рыночную стоимость имущества на основании заключения оценщика."
      },
      {
        question: "Засчитывается ли имущество, переоформленное на детей?",
        answer: "Имущество, оформленное на несовершеннолетних детей, при разделе не учитывается. Однако если переоформление было мнимым, суд может признать сделку недействительной."
      }
    ],
    selfHelpConditions: [
      "состав имущества известен и задокументирован;",
      "нет скрытых сделок и выводимых активов;",
      "оба готовы к добровольному разделу через нотариуса."
    ],
    lawyerConditions: [
      "есть признаки вывода активов или сомнительных сделок;",
      "нужно оспорить конкретную сделку;",
      "требуется ходатайство об аресте или истребовании доказательств;",
      "состав или стоимость имущества оспариваются;",
      "другая сторона действует через представителя."
    ]
  },
  "semya/razvod-s-detmi": {
    title: "Развод с детьми",
    h1: "Развод с детьми",
    shortTitle: "Развод с детьми",
    shortAnswer: "Развод при наличии несовершеннолетних детей — только через суд, даже если оба согласны. В иске или отдельных заявлениях нужно решить: с кем живёт ребёнок, порядок общения со вторым родителем и алименты.",
    description: "ТОЛЬКО СУД: если есть несовершеннолетние дети, ЗАГС расторгнуть брак не вправе — нужно подавать иск в суд. Исключение: второй супруг признан безвестно отсутствующим, недееспособным или осуждён на срок более 3 лет. ЧТО РЕШАЕТСЯ В ОДНОМ ДЕЛЕ: суд вправе одновременно рассмотреть требования об алиментах, месте жительства ребёнка и порядке общения — если соответствующие требования заявлены. МИРОВОЕ СОГЛАШЕНИЕ: стороны могут заключить соглашение о детях прямо в ходе суда, суд его утверждает. Нотариально удостоверенное соглашение об алиментах — исполнительный документ без суда. СРОК ПРИМИРЕНИЯ: суд вправе дать срок для примирения — до 3 месяцев. Истец может ходатайствовать о сокращении или об отказе от примирения.",
    seoTitle: "Развод с детьми — как оформить через суд, алименты и место жительства ребёнка",
    seoDescription: "Как развестись при наличии несовершеннолетних детей: куда подавать иск, как решить вопрос с алиментами и местом жительства ребёнка, что делать, если второй родитель против.",
    riskLevel: "high",
    urgency: "standard",
    heroNote: {
      title: "Что важно проверить сразу",
      text: "Есть ли несовершеннолетние дети — от этого зависит, нужен суд или ЗАГС. Согласен ли второй супруг и известен ли его адрес. Есть ли споры о детях, имуществе или ипотеке — это влияет на подсудность и список документов. Если нужен просто развод без имущественных споров — это страница [«Развод»](/problems/semya-i-deti/razvod)."
    },
    whatToKnow: [
      "Если есть несовершеннолетние дети — только суд, даже при согласии обоих супругов. Исключение: второй супруг признан безвестно отсутствующим, недееспособным или осуждён на срок более 3 лет — тогда ЗАГС.",
      "Иск подаётся по месту жительства ответчика. Если с истцом проживает несовершеннолетний ребёнок или состояние здоровья не позволяет выехать — иск можно подать по своему месту жительства.",
      "При цене иска до 50 000 руб. (алименты или имущество) дело рассматривает мировой судья. При более крупных имущественных спорах или спорах о детях — районный суд.",
      "Суд вправе дать срок для примирения — до 3 месяцев. Если примиряться не хотите, подайте ходатайство об исключении этого срока.",
      "В одном деле можно заявить требования об алиментах, месте жительства ребёнка и порядке общения. Если этих требований нет — суд расторгнет брак, а вопросы о детях решите потом отдельно.",
      "Нотариальное соглашение об алиментах равносильно исполнительному листу — приставы принудительно исполнят без суда. Если договорились — оформите соглашение до или в ходе суда.",
      "После решения суда нужно обратиться в ЗАГС за свидетельством о расторжении брака (госпошлина — 650 руб. с каждого). Сам развод считается совершённым с даты вступления решения в силу.",
      "Если второй супруг не является в суд, суд вправе рассмотреть дело в его отсутствие, после двукратного извещения."
    ],
    deadlines: [
      "Суд первой инстанции рассматривает дело о разводе: мировой — в течение 1 месяца, районный — в течение 2 месяцев.",
      "Срок примирения — до 3 месяцев (суд назначает по своему усмотрению; можно ходатайствовать об отказе).",
      "Решение вступает в силу через 1 месяц после принятия, если не обжаловано.",
      "После вступления решения в силу — обратитесь в ЗАГС в любое время для получения свидетельства."
    ],
    risks: [
      "Устные договорённости о детях перестают работать при конфликте — нужен судебный акт или нотариальное соглашение.",
      "Если не заявить требование об алиментах в иске о разводе — придётся подавать отдельный иск.",
      "Если супруг неизвестен по месту жительства — нужно уточнить адрес через адресное бюро, иначе иск вернут.",
      "Споры о месте жительства ребёнка могут затянуть дело на многие месяцы — орган опеки будет проверять условия обоих родителей.",
      "При наличии общей ипотеки развод не делит долг автоматически — нужен отдельный иск или соглашение с банком."
    ],
    steps: [
      "Определите, куда подавать иск: мировому судье (если нет спора о детях и имущество менее 50 000 руб.) или в районный суд (спор о детях или крупное имущество).",
      "Подготовьте исковое заявление о расторжении брака с указанием требований об алиментах и/или месте жительства ребёнка, если они есть.",
      "Соберите документы и уплатите госпошлину.",
      "Подайте иск в суд лично, по почте или через ГАС «Правосудие».",
      "Примите участие в заседании. Если хотите исключить срок на примирение — подайте ходатайство.",
      "После вынесения решения — дождитесь вступления в силу (1 месяц) или вступления в силу апелляционного определения.",
      "Обратитесь в ЗАГС за свидетельством о расторжении брака."
    ],
    documents: [
      "Исковое заявление о расторжении брака (с дополнительными требованиями при необходимости)",
      "Свидетельство о заключении брака",
      "Свидетельства о рождении детей",
      "Паспорт истца",
      "Документы, подтверждающие доходы ответчика (при требовании алиментов)",
      "Справка о составе семьи или домовая книга",
      "Квитанция об уплате госпошлины (600 руб. за расторжение брака)"
    ],
    mistakes: [
      "Подавать иск в ЗАГС при наличии несовершеннолетних детей — ЗАГС откажет.",
      "Не заявлять требования об алиментах и месте жительства ребёнка в иске о разводе, если они нужны — придётся подавать отдельно.",
      "Соглашаться на устные договорённости о детях — юридической силы они не имеют.",
      "Не учитывать срок примирения и не подавать ходатайство о его исключении — затягивает дело.",
      "Забывать получить свидетельство о расторжении в ЗАГС — без него не заключить новый брак и ряд документов не переоформить."
    ],
    faq: [
      {
        question: "Можно ли развестись в ЗАГС, если есть дети?",
        answer: "Нет, только через суд. Исключение — если второй супруг признан безвестно отсутствующим, недееспособным или осуждён на срок более 3 лет."
      },
      {
        question: "Нужно ли решать вопрос об алиментах при разводе?",
        answer: "Нет, не обязательно в момент развода. Можно подать отдельный иск об алиментах в любое время — в том числе до или после развода. Но удобнее объединить в одном деле."
      },
      {
        question: "Что делать, если второй супруг не приходит на суд?",
        answer: "Суд дважды извещает ответчика. Если он не является без уважительных причин — суд вправе рассмотреть дело в его отсутствие."
      },
      {
        question: "Можно ли ускорить развод при наличии детей?",
        answer: "Да. Подайте ходатайство об исключении срока примирения. Если оба родителя согласны на развод и нет споров о детях, суд часто идёт навстречу."
      },
      {
        question: "Когда развод считается официальным?",
        answer: "С даты вступления решения суда в законную силу (через месяц после принятия, если не обжаловано). Свидетельство из ЗАГС — не момент развода, а подтверждающий документ."
      }
    ],
    relatedDocumentSlugs: ["isk-o-rastorzhenii-braka", "zayavlenie-ob-opredelenii-mesta-zhitelstva-rebenka", "zayavlenie-o-vzyskanii-alimentov"],
    relatedQuestionTopics: ["развод с детьми", "развод при несовершеннолетних детях", "иск о разводе", "куда подать на развод", "развод и алименты", "место жительства ребёнка при разводе"],
    relatedLawyerSpecializations: ["семейное право", "развод", "алименты", "споры о детях"],
    legalReferenceKeys: ["sk_17", "sk_21", "sk_22", "sk_23", "sk_24", "sk_80", "sk_81", "gpk_23", "gpk_28", "gpk_29", "gpk_131", "gpk_132", "nk_333_19"],
    selfHelpConditions: [
      "оба супруга согласны на развод, нет споров о детях и имуществе — иск стандартный;",
      "ответчик известен по месту жительства и не уклоняется от получения документов."
    ],
    lawyerConditions: [
      "есть спор о месте жительства ребёнка или порядке общения;",
      "второй супруг скрывается, не получает корреспонденцию или препятствует разводу;",
      "есть спор о разделе имущества, ипотеки или бизнеса;",
      "один из супругов настаивает на сроке примирения, который вы хотите исключить."
    ]
  },
  "zhkh/zatopili-sosedi": {
    description: "Сразу зафиксируйте залив актом, фото и видео, затем определите виновника: сосед, управляющая компания или подрядчик. До оценки ущерба не спешите с ремонтом.",
    whatToKnow: [
      "Акт о заливе нужно составить как можно быстрее с участием УК или аварийной службы.",
      "Причина залива влияет на ответчика: собственник квартиры, УК или другое лицо.",
      "Оценка ущерба и доказательства ремонта нужны для претензии и суда."
    ],
    deadlines: [
      "Акт и фото лучше оформить в день залива или сразу после обнаружения.",
      "До ремонта сохраните доказательства повреждений и пригласите виновную сторону на осмотр, если планируете оценку.",
      "Претензию можно направить после фиксации причины и размера ущерба."
    ],
    risks: [
      "Без акта и фото виновник может спорить с причиной и размером ущерба.",
      "Если сделать ремонт до оценки, доказать реальный ущерб будет сложнее.",
      "Неверно выбранный ответчик может затянуть взыскание."
    ],
    steps: [
      "Вызовите аварийную службу или УК и зафиксируйте обращение.",
      "Сделайте фото и видео повреждений, источника протечки и последствий.",
      "Получите акт о заливе и проверьте, указана ли предполагаемая причина.",
      "Проведите оценку ущерба и направьте претензию виновному лицу.",
      "Если добровольно не платят, готовьте иск о возмещении ущерба."
    ]
  },
  "zhkh/uk-ne-delaet-remont": {
    description: "Сначала переведите проблему в письменную плоскость: заявка, фото, акт осмотра, требование к УК. Если реакции нет, подключайте жилищную инспекцию или суд.",
    whatToKnow: [
      "УК отвечает за содержание общего имущества, но нужно показать дефект и дату обращения.",
      "Заявки лучше подавать письменно или через систему, где остается номер обращения.",
      "Если дефект угрожает безопасности, фиксируйте срочность и повторные обращения."
    ],
    deadlines: [
      "Чем дольше нет письменной фиксации, тем сложнее доказать бездействие УК.",
      "Срок ответа зависит от характера обращения, но аварийные ситуации требуют быстрой реакции.",
      "При отказе или молчании готовьте жалобу с копиями заявок и фотографиями."
    ],
    risks: [
      "Устные заявки диспетчеру без номера обращения сложно подтвердить.",
      "Если ремонт связан с общим имуществом, важно правильно описать дефект и место.",
      "Без акта осмотра УК может спорить с объемом работ."
    ]
  },
  "pokupki-uslugi/vernut-dengi-za-tovar": {
    description: "Начните с письменной претензии продавцу: что купили, какой недостаток обнаружили, что требуете и в какой срок. Чек полезен, но не всегда является единственным доказательством покупки.",
    relatedDocumentSlugs: ["pretenziya-prodavcu-o-vozvrate-deneg", "zayavlenie-o-vozvrate-tovara", "isk-o-zaschite-prav-potrebitelya"],
    whatToKnow: [
      "Требование зависит от ситуации: недостаток товара, непоставка, дистанционная покупка или отказ продавца.",
      "Нужно сохранить товар, фото недостатка, переписку, чек, выписку банка или другой след покупки.",
      "Если продавец назначает экспертизу, важно фиксировать дату передачи товара и документы."
    ],
    deadlines: [
      "Денежные требования потребителя обычно рассматриваются в установленный законом срок, который зависит от вида требования.",
      "Сроки могут отличаться для возврата товара, ремонта, экспертизы и дистанционной покупки.",
      "Если продавец молчит, сохраняйте претензию и подтверждение вручения для дальнейшей жалобы или иска."
    ],
    risks: [
      "Устное обращение в магазин не доказывает дату требования.",
      "Если передать товар без акта или квитанции, сложнее доказать его состояние и дату передачи.",
      "Неправильно сформулированное требование может дать продавцу повод затянуть ответ."
    ]
  },
  "pokupki-uslugi/tovar-slomalsya-na-garantii": {
    description: "Проверьте гарантийный срок и передавайте товар только с документом о приеме. В претензии сразу укажите требование: ремонт, замена, уменьшение цены или возврат денег.",
    whatToKnow: [
      "Гарантия не отменяет права потребителя при недостатках товара.",
      "Продавец или сервис должен выдать документ о приеме товара и сроках проверки.",
      "Если спорят о причине поломки, может понадобиться экспертиза."
    ],
    deadlines: [
      "Сроки зависят от выбранного требования: ремонт, замена или возврат денег.",
      "Фиксируйте дату передачи товара продавцу или в сервис.",
      "Если срок ремонта или проверки нарушен, можно менять требование и готовить претензию."
    ],
    risks: [
      "Передача товара без квитанции осложнит доказательство сроков.",
      "Самостоятельный ремонт до обращения может создать спор о причине поломки.",
      "Если требование сформулировано расплывчато, продавец может затянуть решение."
    ]
  },
  "pokupki-uslugi/nekachestvennaya-usluga": {
    description: "Зафиксируйте, что именно сделано некачественно, и направьте исполнителю письменную претензию. Требование может быть об устранении недостатков, снижении цены, возврате денег или возмещении расходов.",
    whatToKnow: [
      "Нужно показать договоренность об услуге, оплату и конкретные недостатки результата.",
      "Фото, переписка, акт, заключение специалиста или смета помогают подтвердить проблему.",
      "Требование выбирают по ситуации: исправить, вернуть деньги, уменьшить цену или компенсировать расходы."
    ],
    deadlines: [
      "Претензию лучше направить сразу после обнаружения недостатков.",
      "Срок ответа зависит от требования и характера услуги.",
      "Если исполнитель исправлял недостатки, фиксируйте новые сроки и результат."
    ],
    risks: [
      "Без описания недостатков исполнитель может заявить, что услуга принята без замечаний.",
      "Устные договоренности об исправлении сложно доказать.",
      "Если привлечь другого исполнителя без фиксации дефектов, размер убытков будет сложнее подтвердить."
    ]
  },
  "nasledstvo/vstuplenie-v-nasledstvo": {
    description: "Проверьте дату смерти наследодателя, место открытия наследства и обратитесь к нотариусу в шестимесячный срок. Если имущество уже фактически принято, это тоже нужно подтвердить документами.",
    whatToKnow: [
      "Наследство принимают через нотариуса или фактическими действиями, но документы все равно нужно оформить.",
      "Срок обычно считается с даты смерти наследодателя.",
      "Состав наследства, завещание, очередность и долги лучше проверить до окончательного оформления."
    ],
    deadlines: [
      "Общий срок принятия наследства — 6 месяцев, но в отдельных ситуациях начало срока может зависеть от дополнительных обстоятельств.",
      "Если срок близко заканчивается, подайте заявление нотариусу и сохраните подтверждение.",
      "Если срок пропущен, оцените фактическое принятие, согласие наследников или обращение в суд."
    ],
    risks: [
      "Пропуск срока может потребовать суда или согласия других наследников.",
      "Наследство может включать долги, поэтому состав имущества и обязательств нужно проверять.",
      "Устные договоренности между наследниками не заменяют нотариальное оформление."
    ]
  },
  "nasledstvo/propuschen-srok-nasledstva": {
    description: "Сначала выясните, можно ли подтвердить фактическое принятие наследства. Если нет, понадобится согласие наследников или обращение в суд с доказательствами уважительной причины пропуска.",
    whatToKnow: [
      "Пропуск срока не всегда означает потерю наследства, но нужен законный способ восстановления.",
      "Фактическое принятие подтверждают платежи, владение имуществом, ремонт, охрана, содержание.",
      "Суд оценивает причины пропуска и действия наследника после того, как он узнал о наследстве."
    ],
    deadlines: [
      "После того как узнали о пропуске, не откладывайте сбор доказательств и обращение.",
      "Если есть согласие всех наследников, вопрос иногда можно решить без суда через нотариуса.",
      "Если согласия нет, готовьте заявление и доказательства уважительных причин."
    ],
    risks: [
      "Без доказательств уважительной причины суд может отказать в восстановлении срока.",
      "Если наследственное имущество уже оформлено на других лиц, спор может стать сложнее.",
      "Затягивание после обнаружения пропуска ухудшает позицию наследника."
    ]
  },
  "dolgi/bank-podal-v-sud-po-kreditu": {
    description: "Получите иск и приложения, проверьте расчет долга, срок давности, проценты, комиссии и платежи. Возражения лучше готовить до первого заседания, а не после решения суда.",
    whatToKnow: [
      "Банк должен доказать договор, сумму долга, расчет процентов и соблюдение порядка взыскания.",
      "Ответчику важно проверить срок давности, платежи, штрафы, комиссии и ошибки в расчете.",
      "Если нет возможности платить сразу, можно отдельно оценить рассрочку исполнения решения."
    ],
    deadlines: [
      "Проверьте дату заседания и срок для подачи возражений или документов в суд.",
      "Если получили решение заочно или поздно, отдельно проверьте срок отмены или обжалования.",
      "Не ждите исполнительного производства: возражения по сумме лучше заявлять в суде."
    ],
    risks: [
      "Если не участвовать в деле, суд может рассмотреть спор по документам банка.",
      "Ошибки в расчете долга могут остаться без оценки, если их не заявить письменно.",
      "После решения спор перейдет к приставам и списаниям со счетов."
    ],
    steps: [
      "Получите иск, расчет задолженности и приложения банка.",
      "Сверьте платежи по выпискам и проверьте период начисления процентов.",
      "Оцените срок давности и спорные комиссии или штрафы.",
      "Подготовьте письменные возражения и доказательства платежей.",
      "Если сумма значительная, покажите документы юристу до заседания."
    ]
  },
  "dolgi/kollektory-ugrozhayut": {
    description: "Фиксируйте звонки, сообщения, номера, даты и содержание угроз. Если есть давление, угрозы или звонки третьим лицам, подавайте жалобу и не передавайте деньги без проверки долга.",
    whatToKnow: [
      "Коллектор обязан действовать в рамках ограничений по времени, частоте и способам общения.",
      "Угрозы, давление, введение в заблуждение и раскрытие долга третьим лицам нужно фиксировать.",
      "До оплаты проверьте, кто является кредитором и на каком основании требуют долг."
    ],
    deadlines: [
      "Фиксируйте каждый контакт сразу: дата, время, номер, содержание разговора или сообщения.",
      "Жалобу можно готовить после первых нарушений, не дожидаясь усиления давления.",
      "Если параллельно пришел судебный приказ или иск, отдельно проверьте процессуальные сроки."
    ],
    risks: [
      "Оплата неизвестному лицу без проверки полномочий может не закрыть долг.",
      "Без доказательств угроз жалобу сложнее подтвердить.",
      "Если игнорировать судебные документы, коллекторский спор может перейти к приставам."
    ]
  },
  "ugolovnye-riski/vyzvali-na-dopros": {
    description: "До допроса выясните, в каком статусе вас вызывают и по какому делу. Не подписывайте документы, которые не понимаете, и заранее проконсультируйтесь с адвокатом, если есть риск для вас или близких.",
    whatToKnow: [
      "Статус важен: свидетель, подозреваемый и обвиняемый имеют разные права и риски.",
      "Перед подписью протокола нужно внимательно прочитать текст и внести замечания, если запись неточная.",
      "Можно пользоваться правом не свидетельствовать против себя и близких, если вопросы создают такой риск."
    ],
    deadlines: [
      "До явки уточните дату, время, орган, должностное лицо и основание вызова.",
      "Если вызов срочный или статус неясен, свяжитесь с адвокатом до дачи объяснений.",
      "После допроса сохраните копии документов и запишите, какие вопросы задавали."
    ],
    risks: [
      "Необдуманные объяснения могут повлиять на дальнейший статус по делу.",
      "Подписание протокола без чтения усложнит исправление неточностей.",
      "Игнорирование официального вызова может создать отдельные процессуальные проблемы."
    ],
    steps: [
      "Уточните статус, основание вызова и данные должностного лица.",
      "Подготовьте документы и краткую хронологию событий, но не передавайте лишнее без понимания последствий.",
      "Перед допросом обсудите ситуацию с адвокатом, если есть риск обвинения или самооговора.",
      "На допросе внимательно читайте протокол и просите внести исправления.",
      "Не подписывайте документы, смысл которых вам не понятен."
    ],
    mistakes: [
      "Идти на допрос без понимания своего статуса.",
      "Подписывать протокол, не прочитав его полностью.",
      "Давать предположения вместо фактов или отвечать на вопросы, которые могут навредить вам или близким."
    ]
  }
};

const debtQuestionTopics = [
  "Взыскание задолженности",
  "Банковское право",
  "Банкротство физических лиц",
  "Исполнительное производство",
  "Гражданские дела",
  "Арбитраж",
  "Составление документов"
];

const debtLawyerSpecializations = [
  "Кредиты и долги",
  "Банковское право",
  "Банкротство физических лиц",
  "Исполнительное производство",
  "Взыскание задолженности",
  "Гражданские дела",
  "Арбитражные споры"
];

const debtProblemOverrides: Record<string, LegalProblemOverride> = {
  "dolgi/sudebnyy-prikaz": {
    description: "Что произошло: кредитор получил судебный приказ без обычного судебного заседания. Сначала проверьте дату получения приказа, суд и номер дела.",
    relatedDocumentSlugs: ["vozrazhenie-na-sudebnyy-prikaz", "zayavlenie-o-vosstanovlenii-sroka-na-otmenu-sudebnogo-prikaza", "zhaloba-na-sudebnogo-pristava"],
    relatedQuestionTopics: debtQuestionTopics,
    relatedLawyerSpecializations: debtLawyerSpecializations,
    whatToKnow: [
      "Что произошло: судебный приказ выносится без вызова сторон, поэтому отменяется через письменные возражения.",
      "Что сделать первым: определить дату фактического получения копии приказа и сохранить подтверждение.",
      "Если приказ уже передали приставам или в банк, после отмены нужно отдельно передать определение об отмене."
    ],
    deadlines: [
      "Какие сроки важны: обычно возражения подают в течение 10 дней с даты получения копии приказа.",
      "Если срок пропущен, вместе с возражением готовят заявление о восстановлении срока.",
      "Сохраните конверт, уведомление, скриншот Госуслуг или иной документ с датой получения."
    ],
    risks: [
      "Если не подать возражения, приказ может уйти приставам, а деньги начнут списывать со счетов.",
      "Без подтверждения даты получения сложнее восстановить срок.",
      "После отмены приказа кредитор может обратиться с иском, поэтому платежи и договор лучше сохранить."
    ],
    steps: [
      "Получите копию судебного приказа и проверьте дату получения.",
      "Сверьте суд, номер дела, взыскателя, сумму и основание долга.",
      "Подготовьте возражение на судебный приказ.",
      "Если срок пропущен, добавьте заявление о восстановлении срока.",
      "После отмены передайте определение приставу или банку, если уже начались списания."
    ],
    documents: [
      "Возражение на судебный приказ",
      "Заявление о восстановлении срока на отмену судебного приказа",
      "Жалоба на судебного пристава, если уже началось исполнение",
      "Копия судебного приказа и подтверждение даты получения"
    ],
    mistakes: [
      "Ждать звонка из суда вместо подачи письменных возражений.",
      "Не сохранять доказательства даты получения приказа.",
      "Считать, что отмена приказа сама автоматически прекратит уже начатые списания."
    ]
  },
  "dolgi/bank-podal-v-sud-po-kreditu": {
    description: "Что произошло: банк или другой кредитор подал иск. Сначала получите иск, приложения и расчёт долга, затем проверьте срок давности, платежи и штрафы.",
    relatedDocumentSlugs: ["vozrazhenie-na-isk", "hodataystvo-o-primenenii-sroka-iskovoy-davnosti", "hodataystvo-ob-umenshenii-neustoyki-po-st-333-gk-rf", "zayavlenie-o-rassrochke-ispolneniya-resheniya"],
    relatedQuestionTopics: debtQuestionTopics,
    relatedLawyerSpecializations: debtLawyerSpecializations,
    whatToKnow: [
      "Что произошло: спор уже перешёл в исковое производство, поэтому позицию нужно заявлять письменно.",
      "Что сделать первым: получить иск, приложения, расчёт долга и дату заседания.",
      "Банк должен подтвердить договор, сумму, проценты и соблюдение порядка взыскания."
    ],
    deadlines: [
      "Какие сроки важны: проверьте дату заседания и срок подачи возражений или документов.",
      "Срок давности суд применяет только по заявлению стороны.",
      "Вопрос о снижении неустойки лучше заявлять до принятия решения."
    ],
    risks: [
      "Если не участвовать в деле, суд может оценить спор только по документам банка.",
      "Ошибки в расчёте долга останутся без проверки, если их не указать письменно.",
      "После решения спор перейдёт к приставам и списаниям."
    ],
    steps: [
      "Получите иск, расчёт задолженности и приложения кредитора.",
      "Сверьте платежи по выпискам и проверьте период начисления процентов.",
      "Оцените срок давности, комиссии, штрафы и пени.",
      "Подготовьте возражения, ходатайство о сроке давности или снижении неустойки.",
      "Если решение уже принято, оцените рассрочку или отсрочку исполнения."
    ],
    documents: [
      "Возражение на исковое заявление о взыскании задолженности",
      "Ходатайство о применении срока исковой давности",
      "Ходатайство об уменьшении неустойки по ст. 333 ГК РФ",
      "Заявление об отсрочке или рассрочке исполнения решения суда"
    ]
  },
  "dolgi/kollektory-ugrozhayut": {
    description: "Что произошло: взыскатель или коллектор давит звонками, сообщениями или угрозами. Сначала фиксируйте контакты и проверьте, кто требует долг.",
    relatedDocumentSlugs: ["zhaloba-na-kollektorov-v-fssp", "zhaloba-v-bank-rossii"],
    relatedQuestionTopics: debtQuestionTopics,
    relatedLawyerSpecializations: debtLawyerSpecializations,
    whatToKnow: [
      "Что произошло: коллекторы вправе общаться с должником, но должны соблюдать ограничения по времени, частоте и способам контакта.",
      "Что сделать первым: фиксировать каждый звонок, сообщение, номер и содержание угроз.",
      "До оплаты проверьте полномочия взыскателя и основание перехода долга."
    ],
    deadlines: [
      "Какие сроки важны: жалобу можно готовить после первых нарушений, не ожидая усиления давления.",
      "Если параллельно пришёл приказ или иск, отдельно проверьте процессуальные сроки.",
      "Доказательства лучше сохранять сразу: детализация звонков и скриншоты быстро теряются."
    ],
    risks: [
      "Оплата неизвестному лицу без проверки полномочий может не закрыть долг.",
      "Без доказательств угроз жалобу сложнее подтвердить.",
      "Игнорирование судебных документов может привести к приказу, иску и приставам."
    ],
    steps: [
      "Сохраните сообщения, записи звонков, номера и даты контактов.",
      "Запросите документы, подтверждающие право требовать долг.",
      "Не передавайте деньги без проверки реквизитов и основания требования.",
      "Подготовьте жалобу в ФССП при угрозах, давлении или нарушении порядка общения.",
      "Если требование связано с банком или МФО, оцените жалобу в Банк России."
    ],
    documents: ["Жалоба на коллекторов в ФССП", "Жалоба в Банк России", "Детализация звонков, сообщения и переписка"]
  },
  "dolgi/mfo-trebuet-vernut-dolg": {
    description: "Что произошло: МФО требует оплатить займ, проценты, штрафы или пени. Сначала проверьте договор, платежи, расчёт и ограничения по начислениям.",
    relatedDocumentSlugs: ["vozrazhenie-na-isk", "hodataystvo-ob-umenshenii-neustoyki-po-st-333-gk-rf", "zhaloba-v-bank-rossii", "zayavlenie-o-rassrochke-ispolneniya-resheniya"],
    relatedQuestionTopics: debtQuestionTopics,
    relatedLawyerSpecializations: debtLawyerSpecializations,
    whatToKnow: [
      "Что произошло: спор с МФО часто строится вокруг расчёта процентов, штрафов и периода просрочки.",
      "Что сделать первым: получить договор, историю платежей и полный расчёт задолженности.",
      "Если МФО подала в суд, все возражения по сумме нужно заявлять письменно."
    ],
    deadlines: [
      "Какие сроки важны: при иске проверьте дату заседания и срок представления возражений.",
      "Если долг старый, отдельно проверьте срок исковой давности.",
      "Если требуют завышенную неустойку, ходатайство о снижении лучше подать до решения."
    ],
    risks: [
      "Без проверки расчёта можно согласиться с суммой, где есть спорные начисления.",
      "Подписание нового графика платежей может повлиять на спор о сроке давности.",
      "Игнорирование приказа или иска приведёт к исполнительному производству."
    ],
    steps: [
      "Запросите договор займа, график платежей и расчёт долга.",
      "Сверьте фактические платежи с расчётом МФО.",
      "Проверьте проценты, штрафы, срок давности и наличие судебных документов.",
      "При иске подготовьте возражение и ходатайство о снижении неустойки.",
      "При нарушениях МФО оцените жалобу в Банк России."
    ],
    documents: [
      "Возражение на иск",
      "Ходатайство об уменьшении неустойки по ст. 333 ГК РФ",
      "Жалоба в Банк России",
      "Заявление об отсрочке или рассрочке исполнения решения суда"
    ]
  },
  "dolgi/ne-mozhete-platit-kredit": {
    description: "Что произошло: платить по графику стало невозможно. Сначала оцените просрочку, доходы, страховку, риск судебного приказа, иска и банкротства.",
    relatedDocumentSlugs: ["zayavlenie-o-rassrochke-ispolneniya-resheniya", "pretenziya-kontragentu-po-dogovoru"],
    relatedQuestionTopics: debtQuestionTopics,
    relatedLawyerSpecializations: debtLawyerSpecializations,
    whatToKnow: [
      "Что произошло: просрочка может привести к требованию досрочного возврата, приказу, иску или коллекторам.",
      "Что сделать первым: зафиксировать доходы, расходы, причину просрочки и запросить варианты изменения графика.",
      "Если уже есть судебный документ, приоритетом становятся процессуальные сроки."
    ],
    deadlines: [
      "Какие сроки важны: после получения приказа, иска или постановления приставов сроки считаются отдельно.",
      "Если банк предлагает соглашение, перед подписанием проверьте новую сумму и последствия.",
      "При невозможности платить длительно стоит заранее оценить банкротство или рассрочку исполнения."
    ],
    risks: [
      "Устные договорённости с банком не защищают от начислений и суда.",
      "Новый график может увеличить общую сумму долга.",
      "Игнорирование писем от суда и приставов приводит к списаниям."
    ],
    steps: [
      "Соберите документы о доходах, платежах, просрочке и причине ухудшения положения.",
      "Письменно запросите у кредитора условия реструктуризации или отсрочки.",
      "Проверьте страховку, судебные документы и возможные ограничения.",
      "Если есть решение суда, оцените заявление о рассрочке исполнения.",
      "При крупной сумме покажите документы юристу до подписания нового соглашения."
    ],
    documents: ["Заявление об отсрочке или рассрочке исполнения решения суда", "Письменное обращение к кредитору", "Документы о доходах и платежах"]
  },
  "dolgi/ogromnye-procenty-po-dolgu": {
    description: "Что произошло: кредитор требует проценты, штрафы или пени, которые кажутся завышенными. Сначала проверьте договор, расчёт и период начислений.",
    relatedDocumentSlugs: ["hodataystvo-ob-umenshenii-neustoyki-po-st-333-gk-rf", "vozrazhenie-na-isk"],
    relatedQuestionTopics: debtQuestionTopics,
    relatedLawyerSpecializations: debtLawyerSpecializations,
    whatToKnow: [
      "Что произошло: сумма долга может вырасти из-за процентов, штрафов, пеней и комиссий.",
      "Что сделать первым: запросить подробный расчёт и сверить его с договором и платежами.",
      "Если спор уже в суде, просить снизить неустойку нужно письменно."
    ],
    deadlines: [
      "Какие сроки важны: ходатайство о снижении неустойки лучше подать до вынесения решения.",
      "Если долг старый, проверьте срок исковой давности по каждому периоду.",
      "Не подписывайте признание новой суммы без проверки расчёта."
    ],
    risks: [
      "Суд не проверит все спорные начисления сам, если ответчик не заявит возражения.",
      "Признание долга может осложнить спор о сроке давности.",
      "После решения спорная сумма может перейти к приставам."
    ],
    steps: [
      "Получите договор и расчёт задолженности.",
      "Сверьте платежи, период просрочки, проценты, штрафы и пени.",
      "Выделите спорные начисления и подготовьте письменные возражения.",
      "При иске добавьте ходатайство об уменьшении неустойки.",
      "Сохраните выписки, квитанции и переписку с кредитором."
    ],
    documents: ["Ходатайство об уменьшении неустойки по ст. 333 ГК РФ", "Возражение на иск", "Расчёт долга и банковские выписки"]
  },
  "dolgi/srok-davnosti-po-dolgu": {
    description: "Что произошло: кредитор требует старый долг. Сначала проверьте даты последнего платежа, требования, суда и возможного признания долга.",
    relatedDocumentSlugs: ["hodataystvo-o-primenenii-sroka-iskovoy-davnosti", "vozrazhenie-na-isk"],
    relatedQuestionTopics: debtQuestionTopics,
    relatedLawyerSpecializations: debtLawyerSpecializations,
    whatToKnow: [
      "Что произошло: старый долг не исчезает автоматически, но в суде можно заявить о пропуске срока давности.",
      "Что сделать первым: определить последний платёж, дату просрочки и дату обращения кредитора в суд.",
      "Суд применяет исковую давность только по заявлению стороны."
    ],
    deadlines: [
      "Какие сроки важны: общий срок исковой давности обычно составляет 3 года, но начало срока зависит от конкретного обязательства.",
      "Заявление о сроке давности нужно сделать до вынесения решения.",
      "Новые платежи, признание долга или соглашение могут повлиять на позицию."
    ],
    risks: [
      "Если не заявить о сроке давности, суд может взыскать долг по существу.",
      "Неверная дата последнего платежа может разрушить довод о давности.",
      "Подписание нового соглашения без проверки может ухудшить защиту."
    ],
    steps: [
      "Соберите договор, выписки и историю платежей.",
      "Определите дату просрочки и последнего признания долга.",
      "Проверьте, когда кредитор обратился в суд.",
      "Подготовьте ходатайство о применении срока исковой давности.",
      "Если есть иск, включите довод о давности в возражения."
    ],
    documents: ["Ходатайство о применении срока исковой давности", "Возражение на иск", "Выписки и документы по платежам"]
  },
  "dolgi/bank-spisal-dengi-bez-soglasiya": {
    description: "Что произошло: деньги списаны со счёта без вашего согласия или без понятного основания. Сначала выясните, это списание банка или исполнение документа приставом.",
    relatedDocumentSlugs: ["pretenziya-v-bank-o-vozvrate-spisannyh-deneg", "zhaloba-v-bank-rossii", "zhaloba-na-sudebnogo-pristava", "zayavlenie-o-vozvrate-izlishne-uderzhannyh-deneg"],
    relatedQuestionTopics: debtQuestionTopics,
    relatedLawyerSpecializations: debtLawyerSpecializations,
    whatToKnow: [
      "Что произошло: списание может быть по договору с банком, судебному приказу, исполнительному листу или постановлению пристава.",
      "Что сделать первым: запросить основание списания и банковскую выписку.",
      "Если списание связано с приставами, нужны номер производства и копия постановления."
    ],
    deadlines: [
      "Какие сроки важны: жалобы на действия пристава и банка лучше подавать сразу после обнаружения списания.",
      "Если основание — судебный приказ, отдельно проверьте срок его отмены.",
      "При ошибочном удержании просите возврат письменно и сохраняйте подтверждение подачи."
    ],
    risks: [
      "Повторные списания могут продолжиться, пока основание не отменено или не ограничено.",
      "Без выписки и постановления сложно доказать ошибку.",
      "Если пропустить срок отмены приказа или жалобы, восстановление потребует дополнительных доводов."
    ],
    steps: [
      "Получите банковскую выписку с назначением списания.",
      "Запросите у банка основание: договор, исполнительный документ или постановление пристава.",
      "Если есть пристав, получите номер производства и копии документов.",
      "Подготовьте претензию в банк, жалобу в Банк России или жалобу приставу по ситуации.",
      "При излишнем удержании подайте заявление о возврате денег."
    ],
    documents: [
      "Претензия в банк о возврате списанных денег",
      "Жалоба в Банк России",
      "Жалоба на судебного пристава",
      "Заявление о возврате излишне удержанных денег"
    ]
  },
  "dolgi/prodali-dolg-kollektoram": {
    description: "Что произошло: банк, МФО или другой кредитор сообщил о передаче долга коллекторам. Сначала проверьте уведомление, договор уступки и полномочия нового кредитора.",
    relatedDocumentSlugs: ["zhaloba-na-kollektorov-v-fssp", "vozrazhenie-na-isk", "zhaloba-v-bank-rossii"],
    relatedQuestionTopics: debtQuestionTopics,
    relatedLawyerSpecializations: debtLawyerSpecializations,
    whatToKnow: [
      "Что произошло: долг может быть уступлен новому кредитору, но требования должны подтверждаться документами.",
      "Что сделать первым: запросить доказательства перехода права требования и расчёт долга.",
      "Коллекторы обязаны соблюдать правила взаимодействия с должником."
    ],
    deadlines: [
      "Какие сроки важны: если пришёл приказ или иск от нового кредитора, проверьте процессуальные сроки отдельно.",
      "Жалобу на нарушения общения можно готовить после фиксации первых нарушений.",
      "Перед оплатой проверьте реквизиты и полномочия взыскателя."
    ],
    risks: [
      "Оплата без проверки прав нового кредитора может не закрыть долг.",
      "Подписание соглашения может повлиять на спор о сроке давности.",
      "Угрозы и давление без фиксации сложнее обжаловать."
    ],
    steps: [
      "Запросите уведомление о переуступке и документы нового кредитора.",
      "Проверьте сумму, период долга, платежи и срок давности.",
      "Сохраняйте все звонки, сообщения и письма коллекторов.",
      "При нарушениях подготовьте жалобу в ФССП.",
      "Если новый кредитор подал иск, подготовьте возражения."
    ],
    documents: ["Жалоба на коллекторов в ФССП", "Возражение на иск", "Жалоба в Банк России"]
  },
  "dolgi/restrukturizaciya-dolga": {
    description: "Что произошло: нужно изменить график выплат, чтобы не уйти в просрочку или снизить её последствия. Сначала подготовьте подтверждение доходов и причины просрочки.",
    relatedDocumentSlugs: ["zayavlenie-o-rassrochke-ispolneniya-resheniya", "pretenziya-kontragentu-po-dogovoru"],
    relatedQuestionTopics: debtQuestionTopics,
    relatedLawyerSpecializations: debtLawyerSpecializations,
    whatToKnow: [
      "Что произошло: реструктуризация меняет порядок платежей, но может увеличить общую сумму долга.",
      "Что сделать первым: оценить реальный платёж, который вы сможете соблюдать.",
      "Если уже есть решение суда, речь может идти не о реструктуризации, а о рассрочке исполнения."
    ],
    deadlines: [
      "Какие сроки важны: обращаться к кредитору лучше до передачи долга в суд или коллекторам.",
      "Если дело уже в суде, контролируйте дату заседания и сроки подачи документов.",
      "Если решение принято, заявление о рассрочке подают в суд с подтверждением доходов и расходов."
    ],
    risks: [
      "Новый график без проверки может ухудшить общую долговую нагрузку.",
      "Устные обещания кредитора не заменяют письменного соглашения.",
      "Нереалистичный график быстро приведёт к новой просрочке."
    ],
    steps: [
      "Соберите документы о доходах, расходах, семье и причине просрочки.",
      "Посчитайте сумму, которую реально платить каждый месяц.",
      "Направьте кредитору письменное обращение с предложением графика.",
      "Проверьте условия нового соглашения до подписания.",
      "Если долг уже взыскан судом, оцените заявление о рассрочке исполнения."
    ],
    documents: ["Заявление об отсрочке или рассрочке исполнения решения суда", "Письменное обращение к кредитору", "Документы о доходах и расходах"]
  }
};

function applyTopProblemOverride(problem: GeneratedLegalProblem): GeneratedLegalProblem {
  const override = getProblemOverride(problem);
  if (!override) return problem;

  const updated = { ...problem, ...override };
  return {
    ...updated,
    seoTitle: override.seoTitle ?? `${updated.title} — сроки, риски и документы`,
    seoDescription: override.seoDescription ?? `${updated.shortAnswer} Что проверить, какие документы подготовить и когда подключить юриста.`
  };
}

function getProblemOverride(problem: GeneratedLegalProblem): LegalProblemOverride | null {
  const categorySlugs = [problem.categorySlug, ...(overrideCategoryAliases[problem.categorySlug] ?? [])];
  let override: LegalProblemOverride | null = null;

  for (const categorySlug of categorySlugs) {
    const key = `${categorySlug}/${problem.slug}`;
    const topOverride = topProblemOverrides[key];
    const debtOverride = debtProblemOverrides[key];
    const matchingOverride: LegalProblemOverride | null =
      topOverride && debtOverride
        ? { ...topOverride, ...debtOverride }
        : topOverride ?? debtOverride ?? null;

    if (matchingOverride) {
      override = Object.assign({}, override ?? {}, matchingOverride) as LegalProblemOverride;
    }
  }

  return override;
}

const generatedProblems = allProblemSpecs.map((spec) => applyTopProblemOverride(makeProblem(spec)));

export const legalProblems: LegalProblem[] = generatedProblems.map((problem) => ({
  ...problem,
  relatedProblemSlugs: generatedProblems
    .filter((item) => item.categorySlug === problem.categorySlug && item.slug !== problem.slug)
    .slice(0, 4)
    .map((item) => item.slug)
}));

export const popularProblems = [
  "sudebnyy-prikaz",
  "spisali-dengi-pristavy",
  "ne-vyplatili-zarplatu",
  "alimenty",
  "zatopili-sosedi",
  "vstuplenie-v-nasledstvo",
  "vernut-dengi-za-tovar",
  "povestka-v-sud",
  "prishla-povestka",
  "vyzvali-na-dopros",
  "pokupka-kvartiry-s-riskami",
  "nalogovaya-zablokirovala-schet"
]
  .map((slug) => legalProblems.find((problem) => problem.slug === slug))
  .filter((problem): problem is LegalProblem => Boolean(problem));

export function getLegalProblem(categorySlug: string, slug: string) {
  const normalizedCategorySlug = normalizeLegalCategorySlug(categorySlug);
  return legalProblems.find((problem) => problem.categorySlug === normalizedCategorySlug && problem.slug === slug) ?? null;
}

export function getProblemsByCategory(categorySlug: string) {
  const normalizedCategorySlug = normalizeLegalCategorySlug(categorySlug);
  return legalProblems
    .filter((problem) => problem.categorySlug === normalizedCategorySlug)
    .sort((a, b) => getProblemPriority(a) - getProblemPriority(b) || a.title.localeCompare(b.title, "ru"));
}

export function getCategoryForProblem(problem: LegalProblem) {
  return legalCategories.find((category) => category.slug === problem.categorySlug) ?? null;
}

function getProblemPriority(problem: Pick<LegalProblem, "categorySlug" | "slug">) {
  return targetProblemPriority.get(`${problem.categorySlug}/${problem.slug}`) ?? 1000;
}
