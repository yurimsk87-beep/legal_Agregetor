import type {
  Article,
  Calculator,
  CaseItem,
  City,
  DocumentTemplate,
  FaqEntityType,
  FaqItem,
  LegalChecklist,
  LegalScenario,
  Lawyer,
  LawyerStatus,
  NextBestAction,
  Question,
  SeoPage,
  Service,
  StaticPage,
  VideoPage
} from "./types";
import { prodSampleQuestions } from "./sample-questions-prod";

export const siteName = "ПравоПоиск";

export const cities: City[] = [
  {
    id: "city-moskva",
    name: "Москва",
    namePrepositional: "Москве",
    slug: "moskva",
    region: "Москва",
    federalDistrict: "Центральный федеральный округ",
    isActive: true,
    seoText:
      "В Москве юридическая помощь часто нужна быстро: по семейным, наследственным, трудовым, жилищным и судебным вопросам. Мы показываем не только список специалистов, но и признаки выбора: опыт по теме, стоимость первой консультации, формат работы и подтвержденные данные профиля."
  },
  {
    id: "city-sankt-peterburg",
    name: "Санкт-Петербург",
    namePrepositional: "Санкт-Петербурге",
    slug: "sankt-peterburg",
    region: "Ленинградская область",
    federalDistrict: "Северо-Западный федеральный округ",
    isActive: true,
    seoText:
      "Юристы Санкт-Петербурга помогают с консультациями онлайн, подготовкой документов и представительством в судах города. Страница собрана как локальный лендинг: услуги, ориентиры стоимости, FAQ и понятный переход к вопросам."
  },
  {
    id: "city-krasnodar",
    name: "Краснодар",
    namePrepositional: "Краснодаре",
    slug: "krasnodar",
    region: "Краснодарский край",
    federalDistrict: "Южный федеральный округ",
    isActive: true,
    seoText:
      "В Краснодаре востребованы юристы по недвижимости, ДТП, семейным спорам и защите бизнеса. Подбор учитывает релевантность практики, проверенные сведения профиля и удобный формат консультации."
  },
  {
    id: "city-novosibirsk",
    name: "Новосибирск",
    namePrepositional: "Новосибирске",
    slug: "novosibirsk",
    region: "Новосибирская область",
    federalDistrict: "Сибирский федеральный округ",
    isActive: true,
    seoText:
      "Юридические услуги в Новосибирске удобно сравнивать по стажу, специализации и ориентиру стоимости. Пользователь может выбрать тему, формат консультации и оставить вопрос через платформу."
  },
  {
    id: "city-ekaterinburg",
    name: "Екатеринбург",
    namePrepositional: "Екатеринбурге",
    slug: "ekaterinburg",
    region: "Свердловская область",
    federalDistrict: "Уральский федеральный округ",
    isActive: true,
    seoText:
      "В Екатеринбурге можно найти юриста для консультации, подготовки документов или ведения дела в суде. На странице есть локальные услуги, ориентиры по цене и вопросы, которые чаще всего задают жители города."
  },
  {
    id: "city-kazan",
    name: "Казань",
    namePrepositional: "Казани",
    slug: "kazan",
    region: "Республика Татарстан",
    federalDistrict: "Приволжский федеральный округ",
    isActive: true,
    seoText:
      "Каталог юристов Казани помогает найти специалиста под конкретную ситуацию: семейный спор, наследство, ДТП, трудовой конфликт, банкротство или бизнес-задачу."
  },
  {
    id: "city-nizhnij-novgorod",
    name: "Нижний Новгород",
    namePrepositional: "Нижнем Новгороде",
    slug: "nizhniy-novgorod",
    region: "Нижегородская область",
    federalDistrict: "Приволжский федеральный округ",
    isActive: true,
    seoText:
      "Юристы Нижнего Новгорода представлены с понятными карточками: специализация, опыт, ориентир стоимости и подтвержденные сведения профиля без перегруженного листинга."
  },
  {
    id: "city-rostov-na-donu",
    name: "Ростов-на-Дону",
    namePrepositional: "Ростове-на-Дону",
    slug: "rostov-na-donu",
    region: "Ростовская область",
    federalDistrict: "Южный федеральный округ",
    isActive: true,
    seoText:
      "В Ростове-на-Дону востребованы консультации по суду, недвижимости, трудовым спорам, ДТП и семейному праву. Мы показываем релевантных специалистов и объясняем, как выбрать подходящего."
  },
  {
    id: "city-samara",
    name: "Самара",
    namePrepositional: "Самаре",
    slug: "samara",
    region: "Самарская область",
    federalDistrict: "Приволжский федеральный округ",
    isActive: true,
    seoText:
      "Страница юристов Самары объединяет локальный спрос, подбор по услуге и доверительные блоки: как проверяются специалисты и какие сведения профиля подтверждены платформой."
  },
  {
    id: "city-voronezh",
    name: "Воронеж",
    namePrepositional: "Воронеже",
    slug: "voronezh",
    region: "Воронежская область",
    federalDistrict: "Центральный федеральный округ",
    isActive: true,
    seoText:
      "В Воронеже можно найти юриста для онлайн-консультации, подготовки претензии, сопровождения сделки или представительства в суде. Перед обращением удобно сравнить опыт, специализацию, ориентир стоимости и формат работы специалиста."
  },
  {
    id: "city-krasnoyarsk",
    name: "Красноярск",
    namePrepositional: "Красноярске",
    slug: "krasnoyarsk",
    region: "Красноярский край",
    federalDistrict: "Сибирский федеральный округ",
    isActive: true,
    seoText:
      "В Красноярске юридическая помощь востребована по семейным, жилищным, наследственным, трудовым и судебным вопросам. Платформа помогает выбрать специалиста по теме, опыту, формату консультации и проверенным сведениям профиля."
  },
  {
    id: "city-chelyabinsk",
    name: "Челябинск",
    namePrepositional: "Челябинске",
    slug: "chelyabinsk",
    region: "Челябинская область",
    federalDistrict: "Уральский федеральный округ",
    isActive: true,
    seoText:
      "Юристы Челябинска помогают с консультациями, претензиями, документами и представительством в суде. Перед обращением можно выбрать специализацию и задать вопрос через модерируемый Q&A-путь."
  },
  {
    id: "city-ufa",
    name: "Уфа",
    namePrepositional: "Уфе",
    slug: "ufa",
    region: "Республика Башкортостан",
    federalDistrict: "Приволжский федеральный округ",
    isActive: true,
    seoText:
      "В Уфе можно подобрать юриста по конкретной правовой ситуации: семейный спор, наследство, ДТП, недвижимость, работа или бизнес-задача. Профили показывают специализации, опыт и проверенные данные без публичных контактов."
  },
  {
    id: "city-omsk",
    name: "Омск",
    namePrepositional: "Омске",
    slug: "omsk",
    region: "Омская область",
    federalDistrict: "Сибирский федеральный округ",
    isActive: true,
    seoText:
      "Страница Омска помогает найти юриста по теме обращения и сначала задать вопрос на платформе. Такой путь сохраняет модерацию, контроль контактов и возможность сравнить специалистов по содержанию ответа."
  },
  {
    id: "city-perm",
    name: "Пермь",
    namePrepositional: "Перми",
    slug: "perm",
    region: "Пермский край",
    federalDistrict: "Приволжский федеральный округ",
    isActive: true,
    seoText:
      "Юридические услуги в Перми удобно сравнивать по специализации, опыту и стоимости первичной консультации. Платформа ведет пользователя через вопрос, ответ юриста и осознанный выбор профиля."
  },
  {
    id: "city-volgograd",
    name: "Волгоград",
    namePrepositional: "Волгограде",
    slug: "volgograd",
    region: "Волгоградская область",
    federalDistrict: "Южный федеральный округ",
    isActive: true,
    seoText:
      "В Волгограде востребованы консультации по суду, недвижимости, долгам, трудовым и семейным спорам. Профиль юриста показывает проверенные сведения и направление практики без телефонного lead-first сценария."
  },
  {
    id: "city-saratov",
    name: "Саратов",
    namePrepositional: "Саратове",
    slug: "saratov",
    region: "Саратовская область",
    federalDistrict: "Приволжский федеральный округ",
    isActive: true,
    seoText:
      "Каталог юристов Саратова помогает начать с описания задачи, а не с передачи контактов. Пользователь может выбрать услугу, город и получить ответ после модерации."
  },
  {
    id: "city-tyumen",
    name: "Тюмень",
    namePrepositional: "Тюмени",
    slug: "tyumen",
    region: "Тюменская область",
    federalDistrict: "Уральский федеральный округ",
    isActive: true,
    seoText:
      "Юристы Тюмени представлены по ключевым направлениям практики: семья, наследство, недвижимость, долги, бизнес и суд. Платформа сохраняет Q&A-first маршрут и приватную модерацию обращений."
  },
  {
    id: "city-tolyatti",
    name: "Тольятти",
    namePrepositional: "Тольятти",
    slug: "tolyatti",
    region: "Самарская область",
    federalDistrict: "Приволжский федеральный округ",
    isActive: true,
    seoText:
      "В Тольятти юридическая помощь часто нужна по ДТП, трудовым вопросам, долгам, недвижимости и семейным спорам. Профили помогают сравнить специалистов по теме и опыту."
  },
  {
    id: "city-mahachkala",
    name: "Махачкала",
    namePrepositional: "Махачкале",
    slug: "mahachkala",
    region: "Республика Дагестан",
    federalDistrict: "Северо-Кавказский федеральный округ",
    isActive: true,
    seoText:
      "Юристы Махачкалы помогают с консультациями, судебными документами и представительством по гражданским, семейным, жилищным и наследственным вопросам. Первый шаг на платформе остается публичным вопросом с модерацией."
  },
  {
    id: "city-barnaul",
    name: "Барнаул",
    namePrepositional: "Барнауле",
    slug: "barnaul",
    region: "Алтайский край",
    federalDistrict: "Сибирский федеральный округ",
    isActive: true,
    seoText:
      "В Барнауле можно подобрать юриста по конкретной услуге и задать вопрос до приватного обращения. Это помогает оценить подход специалиста без раскрытия контактов на первом шаге."
  },
  {
    id: "city-izhevsk",
    name: "Ижевск",
    namePrepositional: "Ижевске",
    slug: "izhevsk",
    region: "Удмуртская Республика",
    federalDistrict: "Приволжский федеральный округ",
    isActive: true,
    seoText:
      "Страница Ижевска объединяет локальный выбор юристов, услуги и Q&A-маршрут. Профили показывают подтвержденные данные, опыт и специализацию без fake-rating сигналов."
  },
  {
    id: "city-khabarovsk",
    name: "Хабаровск",
    namePrepositional: "Хабаровске",
    slug: "khabarovsk",
    region: "Хабаровский край",
    federalDistrict: "Дальневосточный федеральный округ",
    isActive: true,
    seoText:
      "Юристы Хабаровска помогают с локальными и онлайн-консультациями, подготовкой документов и судебными спорами. Платформа сохраняет модерируемый путь от вопроса к профилю юриста."
  },
  {
    id: "city-ulyanovsk",
    name: "Ульяновск",
    namePrepositional: "Ульяновске",
    slug: "ulyanovsk",
    region: "Ульяновская область",
    federalDistrict: "Приволжский федеральный округ",
    isActive: true,
    seoText:
      "В Ульяновске можно найти юриста по семейным, наследственным, трудовым, жилищным и долговым вопросам. Пользователь сначала описывает задачу, затем сравнивает ответы и профили."
  },
  {
    id: "city-irkutsk",
    name: "Иркутск",
    namePrepositional: "Иркутске",
    slug: "irkutsk",
    region: "Иркутская область",
    federalDistrict: "Сибирский федеральный округ",
    isActive: true,
    seoText:
      "Юридическая помощь в Иркутске включает консультации, подготовку претензий, исков и сопровождение споров. Профили юристов показывают специализацию, опыт и проверенные сведения."
  },
  {
    id: "city-vladivostok",
    name: "Владивосток",
    namePrepositional: "Владивостоке",
    slug: "vladivostok",
    region: "Приморский край",
    federalDistrict: "Дальневосточный федеральный округ",
    isActive: true,
    seoText:
      "Во Владивостоке востребованы юристы по недвижимости, бизнесу, семейным, наследственным и судебным вопросам. Платформа помогает начать с вопроса и выбрать специалиста осознанно."
  },
  {
    id: "city-yaroslavl",
    name: "Ярославль",
    namePrepositional: "Ярославле",
    slug: "yaroslavl",
    region: "Ярославская область",
    federalDistrict: "Центральный федеральный округ",
    isActive: true,
    seoText:
      "Юристы Ярославля помогают оценить перспективы дела, подготовить документы и выбрать следующий процессуальный шаг. Карточки показывают один город обслуживания и профильную специализацию."
  },
  {
    id: "city-stavropol",
    name: "Ставрополь",
    namePrepositional: "Ставрополе",
    slug: "stavropol",
    region: "Ставропольский край",
    federalDistrict: "Северо-Кавказский федеральный округ",
    isActive: true,
    seoText:
      "В Ставрополе можно найти юриста для консультации, подготовки документов и сопровождения спора. Платформа не раскрывает публичные контакты юриста и сохраняет контролируемую заявку."
  },
  {
    id: "city-sevastopol",
    name: "Севастополь",
    namePrepositional: "Севастополе",
    slug: "sevastopol",
    region: "Севастополь",
    federalDistrict: "Южный федеральный округ",
    isActive: true,
    seoText:
      "Юристы Севастополя представлены по основным направлениям частной и судебной практики. Пользователь может задать вопрос, получить модерируемый ответ и перейти к профилю специалиста."
  },
  {
    id: "city-naberezhnye-chelny",
    name: "Набережные Челны",
    namePrepositional: "Набережных Челнах",
    slug: "naberezhnye-chelny",
    region: "Республика Татарстан",
    federalDistrict: "Приволжский федеральный округ",
    isActive: true,
    seoText:
      "В Набережных Челнах юридическая помощь нужна по семейным, трудовым, долговым, авто- и жилищным вопросам. Профиль юриста показывает специализацию и один город обслуживания."
  },
  {
    id: "city-tomsk",
    name: "Томск",
    namePrepositional: "Томске",
    slug: "tomsk",
    region: "Томская область",
    federalDistrict: "Сибирский федеральный округ",
    isActive: true,
    seoText:
      "Юристы Томска помогают с консультациями, правовой экспертизой документов, претензиями и судами. Платформа ведет пользователя через модерируемый вопрос и выбор профиля."
  },
  {
    id: "city-balashikha",
    name: "Балашиха",
    namePrepositional: "Балашихе",
    slug: "balashikha",
    region: "Московская область",
    federalDistrict: "Центральный федеральный округ",
    isActive: true,
    seoText:
      "В Балашихе можно подобрать юриста по локальной ситуации и специализации. Q&A-first сценарий помогает получить первичную оценку без телефонного сбора контактов на первом шаге."
  },
  {
    id: "city-kemerovo",
    name: "Кемерово",
    namePrepositional: "Кемерове",
    slug: "kemerovo",
    region: "Кемеровская область",
    federalDistrict: "Сибирский федеральный округ",
    isActive: true,
    seoText:
      "Юристы Кемерова представлены по ключевым направлениям: семья, наследство, труд, долги, недвижимость и суд. Профили сохраняют проверяемые данные и не используют fake-review сигналы."
  },
  {
    id: "city-orenburg",
    name: "Оренбург",
    namePrepositional: "Оренбурге",
    slug: "orenburg",
    region: "Оренбургская область",
    federalDistrict: "Приволжский федеральный округ",
    isActive: true,
    seoText:
      "В Оренбурге юридическая помощь начинается с понятного описания задачи и выбора специализации. Платформа помогает сравнить профиль юриста и обратиться через приватную модерируемую заявку."
  },
  {
    id: "city-novokuznetsk",
    name: "Новокузнецк",
    namePrepositional: "Новокузнецке",
    slug: "novokuznetsk",
    region: "Кемеровская область",
    federalDistrict: "Сибирский федеральный округ",
    isActive: true,
    seoText:
      "Юристы Новокузнецка помогают с документами, консультациями и судебными спорами по гражданским, трудовым, семейным и долговым вопросам. Каждый профиль привязан к одному городу обслуживания."
  },
  {
    id: "city-ryazan",
    name: "Рязань",
    namePrepositional: "Рязани",
    slug: "ryazan",
    region: "Рязанская область",
    federalDistrict: "Центральный федеральный округ",
    isActive: true,
    seoText:
      "В Рязани можно выбрать юриста по специализации, опыту и формату обращения. Пользовательский маршрут сохраняет вопрос, модерацию ответа, профиль юриста и приватное обращение через платформу."
  }
];

export const services: Service[] = [
  service("service-semejnoe-pravo", "Семейные споры", "semeynye-spory", "Развод, дети, алименты, имущество супругов."),
  service("service-alimenty", "Алименты", "alimenty", "Взыскание, изменение размера и задолженность по алиментам.", "service-semejnoe-pravo"),
  service("service-razvod", "Развод", "razvod", "Расторжение брака через ЗАГС или суд.", "service-semejnoe-pravo"),
  service("service-razdel-imushchestva", "Раздел имущества", "razdel-imushchestva", "Раздел недвижимости, вкладов, бизнеса и долгов супругов.", "service-semejnoe-pravo"),
  service("service-nasledstvo", "Наследство", "nasledstvo", "Вступление в наследство, споры с наследниками, сроки и документы."),
  service("service-vstuplenie-v-nasledstvo", "Вступление в наследство", "vstuplenie-v-nasledstvo", "Сроки принятия наследства, документы, нотариус и подтверждение прав наследника.", "service-nasledstvo"),
  service("service-oformlenie-nasledstva", "Оформление наследства", "oformlenie-nasledstva", "Оформление наследственных прав, свидетельства, долей и регистрации имущества.", "service-nasledstvo"),
  service("service-nasledstvennye-spory", "Наследственные споры", "nasledstvennye-spory", "Споры между наследниками, обязательная доля, недостойные наследники и раздел имущества.", "service-nasledstvo"),
  service("service-osparivanie-zaveshchaniya", "Оспаривание завещания", "osparivanie-zaveshchaniya", "Проверка оснований для оспаривания завещания, доказательства и судебная стратегия.", "service-nasledstvo"),
  service("service-razdel-nasledstva", "Раздел наследства", "razdel-nasledstva", "Соглашение или судебный раздел наследственного имущества между наследниками.", "service-nasledstvo"),
  service("service-vosstanovlenie-sroka-nasledstva", "Восстановление срока наследства", "vosstanovlenie-sroka-nasledstva", "Восстановление пропущенного срока принятия наследства через суд или согласие наследников.", "service-nasledstvo"),
  service("service-trudovoe-pravo", "Трудовые споры", "trudovye-spory", "Увольнение, выплаты, дисциплинарные взыскания и споры с работодателем."),
  service("service-uvolnenie", "Увольнение", "uvolnenie", "Оспаривание увольнения, компенсации и восстановление на работе.", "service-trudovoe-pravo"),
  service("service-nezakonnoe-uvolnenie", "Незаконное увольнение", "nezakonnoe-uvolnenie", "Оспаривание увольнения, проверка приказов, сроков и оснований расторжения договора.", "service-trudovoe-pravo"),
  service("service-vosstanovlenie-na-rabote", "Восстановление на работе", "vosstanovlenie-na-rabote", "Восстановление после незаконного увольнения, взыскание выплат и компенсаций.", "service-trudovoe-pravo"),
  service("service-vzyskanie-zarplaty", "Взыскание зарплаты", "vzyskanie-zarplaty", "Взыскание начисленной зарплаты, премий, компенсаций и процентов за задержку.", "service-trudovoe-pravo"),
  service("service-nevyplata-zarplaty", "Невыплата зарплаты", "nevyplata-zarplaty", "Помощь при задержке или полной невыплате зарплаты, жалобы и судебное взыскание.", "service-trudovoe-pravo"),
  service("service-spory-s-rabotodatelem", "Споры с работодателем", "spory-s-rabotodatelem", "Конфликты с работодателем по выплатам, дисциплине, условиям труда и увольнению.", "service-trudovoe-pravo"),
  service("service-trudovoy-dogovor", "Трудовой договор", "trudovoy-dogovor", "Проверка, изменение и оспаривание условий трудового договора и дополнительных соглашений.", "service-trudovoe-pravo"),
  service("service-dolgi", "Кредиты и долги", "kredity-dolgi", "Кредитные споры, взыскание долгов, защита должника, переговоры и суд."),
  service("service-bankrotstvo", "Банкротство", "bankrotstvo", "Банкротство граждан и бизнеса, списание долгов, реструктуризация и защита имущества."),
  service("service-bankrotstvo-fizicheskih-lic", "Банкротство физических лиц", "bankrotstvo-fizicheskih-lits", "Подготовка к банкротству, реструктуризация и списание долгов."),
  service("service-spisanie-dolgov", "Списание долгов", "spisanie-dolgov", "Оценка возможности списания долгов через банкротство, подготовка документов и рисков.", "service-bankrotstvo"),
  service("service-bankrotstvo-cherez-mfc", "Банкротство через МФЦ", "bankrotstvo-cherez-mfc", "Внесудебное банкротство через МФЦ, проверка условий и подготовка заявления.", "service-bankrotstvo"),
  service("service-restrukturizaciya-dolga", "Реструктуризация долга", "restrukturizaciya-dolga", "Переговоры с кредиторами, план реструктуризации и защита от взыскания.", "service-bankrotstvo"),
  service("service-realizaciya-imushchestva", "Реализация имущества", "realizaciya-imushchestva", "Правила реализации имущества в банкротстве, исключения и порядок торгов.", "service-bankrotstvo"),
  service("service-zashchita-imushchestva-pri-bankrotstve", "Защита имущества при банкротстве", "zashchita-imushchestva-pri-bankrotstve", "Анализ рисков для жилья, автомобиля, доходов и другого имущества должника.", "service-bankrotstvo"),
  service("service-dtp", "ДТП", "dtp", "Споры со страховой, виновником ДТП и оценкой ущерба.", "service-avtoyurist"),
  service("service-avtoyurist", "Автоюрист", "avtoyurist", "Лишение прав, штрафы, страховые выплаты и аварии."),
  service("service-nedvizhimost", "Недвижимость", "nedvizhimost", "Сделки, споры с застройщиком, доли, аренда и регистрация прав."),
  service("service-zhkh", "Жилищные споры", "zhilishchnye-spory", "Споры с УК, начисления, заливы, качество услуг, право проживания и пользования жильем."),
  service("service-zashchita-prav-potrebitelej", "Защита прав потребителей", "zashchita-prav-potrebiteley", "Возврат денег, претензии, некачественные товары и услуги."),
  service("service-ugolovnoe-pravo", "Уголовные дела", "ugolovnye-dela", "Защита по уголовным делам, сопровождение следствия, суда и отдельных составов УК РФ."),
  service("service-ugolovnyj-advokat", "Уголовный адвокат", "ugolovnyj-advokat", "Защита подозреваемых, обвиняемых и потерпевших.", "service-ugolovnoe-pravo"),
  service("service-moshennichestvo-159-uk-rf", "Мошенничество, статья 159 УК РФ", "moshennichestvo-159-uk-rf", "Защита по делам о мошенничестве, проверка доказательств, ущерба и квалификации.", "service-ugolovnoe-pravo"),
  service("service-narkotiki-228-uk-rf", "Наркотики, статья 228 УК РФ", "narkotiki-228-uk-rf", "Защита по делам о хранении и обороте наркотиков, обжалование действий следствия.", "service-ugolovnoe-pravo"),
  service("service-krazha-158-uk-rf", "Кража, статья 158 УК РФ", "krazha-158-uk-rf", "Защита по делам о краже, оценка доказательств, ущерба и примирения сторон.", "service-ugolovnoe-pravo"),
  service("service-zashchita-podozrevaemogo", "Защита подозреваемого", "zashchita-podozrevaemogo", "Помощь подозреваемому с момента задержания, допроса или первых следственных действий.", "service-ugolovnoe-pravo"),
  service("service-zashchita-obvinyaemogo", "Защита обвиняемого", "zashchita-obvinyaemogo", "Выработка линии защиты обвиняемого, ходатайства, жалобы и подготовка к суду.", "service-ugolovnoe-pravo"),
  service("service-advokat-na-dopros", "Адвокат на допрос", "advokat-na-dopros", "Сопровождение на допросе, защита от давления и контроль процессуальных нарушений.", "service-ugolovnoe-pravo"),
  service("service-predstavitelstvo-v-ugolovnom-sude", "Представительство в уголовном суде", "predstavitelstvo-v-ugolovnom-sude", "Защита и представительство в уголовном суде, подготовка позиции и процессуальных документов.", "service-ugolovnoe-pravo"),
  service("service-voennyj-yurist", "Военное право", "voennoe-pravo", "Мобилизация, выплаты, ВВК, контракты и увольнение со службы."),
  service("service-nalogovyj-yurist", "Налоговый юрист", "nalogovyj-yurist", "Проверки, доначисления, споры с ФНС и налоговое планирование.", "service-biznes-i-arbitrazh"),
  service("service-yurist-dlya-biznesa", "Юрист для бизнеса", "yurist-dlya-biznesa", "Договоры, корпоративные споры, претензии и сопровождение сделок.", "service-biznes-i-arbitrazh"),
  service("service-sostavlenie-dokumentov", "Составление документов", "sostavlenie-dokumentov", "Иски, претензии, договоры, жалобы и правовые заключения.", "service-yuridicheskie-dokumenty"),
  service("service-predstavitelstvo-v-sude", "Представительство в суде", "predstavitelstvo-v-sude", "Подготовка позиции, документы, участие в заседаниях и исполнение решения."),
  service("service-lishenie-voditelskih-prav", "Лишение водительских прав", "lishenie-voditelskih-prav", "Защита при угрозе лишения прав, подготовка позиции и обжалование постановлений.", "service-avtoyurist"),
  service("service-vozvrat-voditelskih-prav", "Возврат водительских прав", "vozvrat-voditelskih-prav", "Помощь с возвратом водительского удостоверения после лишения или спора.", "service-avtoyurist"),
  service("service-spor-so-strahovoy", "Спор со страховой", "spor-so-strahovoy", "Споры со страховой компанией по выплатам, отказам и заниженной оценке ущерба.", "service-avtoyurist"),
  service("service-osago", "ОСАГО", "osago", "Споры по ОСАГО, взыскание выплат, неустойки и компенсаций со страховой.", "service-avtoyurist"),
  service("service-kasko", "КАСКО", "kasko", "Споры по КАСКО, отказ в выплате, ремонт, тотальная гибель и оценка ущерба.", "service-avtoyurist"),
  service("service-vozmeshchenie-ushcherba-posle-dtp", "Возмещение ущерба после ДТП", "vozmeshchenie-ushcherba-posle-dtp", "Взыскание ущерба после ДТП со страховой, виновника или владельца автомобиля.", "service-avtoyurist"),
  service("service-osparivanie-shtrafov", "Оспаривание штрафов", "osparivanie-shtrafov", "Обжалование штрафов ГИБДД, камер фиксации и административных постановлений.", "service-avtoyurist"),
  service("service-sdelki-s-nedvizhimostyu", "Сделки с недвижимостью", "sdelki-s-nedvizhimostyu", "Юридическое сопровождение сделок с квартирами, домами, землей и долями.", "service-nedvizhimost"),
  service("service-kuplya-prodazha-nedvizhimosti", "Купля-продажа недвижимости", "kuplya-prodazha-nedvizhimosti", "Проверка и сопровождение договора купли-продажи недвижимости, расчетов и регистрации.", "service-nedvizhimost"),
  service("service-proverka-kvartiry", "Проверка квартиры", "proverka-kvartiry", "Проверка квартиры перед покупкой: собственники, обременения, риски и документы.", "service-nedvizhimost"),
  service("service-soprovozhdenie-sdelki", "Сопровождение сделки", "soprovozhdenie-sdelki", "Сопровождение сделки с недвижимостью от проверки документов до регистрации права.", "service-nedvizhimost"),
  service("service-ddu", "ДДУ", "ddu", "Споры и сопровождение договоров долевого участия, сроки передачи и взыскание неустойки.", "service-nedvizhimost"),
  service("service-spory-s-zastroyshchikom", "Споры с застройщиком", "spory-s-zastroyshchikom", "Взыскание неустойки, устранение недостатков и защита прав дольщика.", "service-nedvizhimost"),
  service("service-zemelnye-spory", "Земельные споры", "zemelnye-spory", "Споры о границах, пользовании, собственности и правах на земельные участки."),
  service("service-priznanie-prava-sobstvennosti", "Признание права собственности", "priznanie-prava-sobstvennosti", "Признание права собственности на недвижимость через суд и подготовка доказательств.", "service-nedvizhimost"),
  service("service-osparivanie-sdelki-s-nedvizhimostyu", "Оспаривание сделки с недвижимостью", "osparivanie-sdelki-s-nedvizhimostyu", "Оспаривание сделок с недвижимостью, недействительность договора и последствия.", "service-nedvizhimost"),
  service("service-zhilishchnye-spory", "Споры по ЖКХ", "spory-po-zhkh", "Споры о коммунальных платежах, качестве услуг, ремонте и действиях управляющей компании.", "service-zhkh"),
  service("service-vyselenie", "Выселение", "vyselenie", "Судебное выселение, защита от выселения и споры о праве пользования жильем.", "service-zhkh"),
  service("service-vselenie", "Вселение", "vselenie", "Вселение в жилое помещение, устранение препятствий и защита права проживания.", "service-zhkh"),
  service("service-privatizaciya", "Приватизация", "privatizaciya", "Приватизация жилья, отказ в приватизации, документы и судебные споры.", "service-zhkh"),
  service("service-spory-s-upravlyayushchey-kompaniey", "Споры с управляющей компанией", "spory-s-upravlyayushchey-kompaniey", "Претензии и суды с управляющей компанией по услугам, начислениям и содержанию дома.", "service-zhkh"),
  service("service-zaliv-kvartiry", "Залив квартиры", "zaliv-kvartiry", "Взыскание ущерба после залива квартиры, экспертиза и споры с виновником или УК.", "service-zhkh"),
  service("service-pereplanirovka", "Перепланировка", "pereplanirovka", "Согласование перепланировки, узаконивание изменений и споры с органами.", "service-zhkh"),
  service("service-razdel-licevogo-scheta", "Раздел лицевого счета", "razdel-licevogo-scheta", "Раздел лицевого счета и порядка оплаты коммунальных услуг между жильцами.", "service-zhkh"),
  service("service-snyatie-s-registracionnogo-ucheta", "Снятие с регистрационного учета", "snyatie-s-registracionnogo-ucheta", "Снятие с регистрационного учета через суд и споры о праве проживания.", "service-zhkh"),
  service("service-kommunalnye-platezhi", "Споры по коммунальным платежам", "kommunalnye-platezhi", "Оспаривание начислений, долгов и перерасчетов по коммунальным платежам.", "service-zhkh"),
  service("service-vozvrat-tovara", "Возврат товара", "vozvrat-tovara", "Возврат качественного или некачественного товара, сроки, претензии и доказательства.", "service-zashchita-prav-potrebitelej"),
  service("service-vozvrat-deneg", "Возврат денег", "vozvrat-deneg", "Возврат денег за товар или услугу, взыскание неустойки, штрафа и компенсации.", "service-zashchita-prav-potrebitelej"),
  service("service-spory-s-prodavcom", "Споры с продавцом", "spory-s-prodavcom", "Споры с продавцом по качеству товара, срокам, гарантии и возврату денег.", "service-zashchita-prav-potrebitelej"),
  service("service-spory-s-internet-magazinom", "Споры с интернет-магазином", "spory-s-internet-magazinom", "Защита прав покупателя при онлайн-заказах, доставке, возврате и отказах продавца.", "service-zashchita-prav-potrebitelej"),
  service("service-nekachestvennaya-usluga", "Некачественная услуга", "nekachestvennaya-usluga", "Претензии и иски по некачественным услугам, возврат оплаты и компенсации.", "service-zashchita-prav-potrebitelej"),
  service("service-pretenziya-prodavcu", "Претензия продавцу", "pretenziya-prodavcu", "Подготовка претензии продавцу, расчет требований и фиксация сроков ответа.", "service-zashchita-prav-potrebitelej"),
  service("service-isk-po-zashchite-prav-potrebitelej", "Иск по защите прав потребителей", "isk-po-zashchite-prav-potrebitelej", "Подготовка иска о защите прав потребителей, взыскание штрафа и морального вреда.", "service-zashchita-prav-potrebitelej"),
  service("service-kompensaciya-moralnogo-vreda", "Компенсация морального вреда", "kompensaciya-moralnogo-vreda", "Взыскание компенсации морального вреда по потребительским и иным спорам.", "service-zashchita-prav-potrebitelej"),
  service("service-kreditnye-spory", "Кредитные споры", "kreditnye-spory", "Споры с банками и МФО по кредитам, процентам, штрафам и взысканию долга.", "service-dolgi"),
  service("service-vzyskanie-dolgov", "Взыскание долгов", "vzyskanie-dolgov", "Взыскание долгов по распискам, договорам, займам и судебным решениям.", "service-dolgi"),
  service("service-dolg-po-raspiske", "Долг по расписке", "dolg-po-raspiske", "Взыскание долга по расписке, подготовка претензии, иска и доказательств передачи денег.", "service-dolgi"),
  service("service-dolg-po-dogovoru-zayma", "Долг по договору займа", "dolg-po-dogovoru-zayma", "Взыскание долга по договору займа, процентов, неустойки и судебных расходов.", "service-dolgi"),
  service("service-ispolnitelnoe-proizvodstvo", "Исполнительное производство", "ispolnitelnoe-proizvodstvo", "Сопровождение исполнительного производства, заявления приставам и обжалование действий."),
  service("service-pristavy", "Приставы", "pristavy", "Споры с судебными приставами, бездействие, аресты, ограничения и взыскания.", "service-dolgi"),
  service("service-snyatie-aresta", "Снятие ареста", "snyatie-aresta", "Снятие ареста со счетов, имущества, автомобиля или недвижимости.", "service-dolgi"),
  service("service-otmena-sudebnogo-prikaza", "Отмена судебного приказа", "otmena-sudebnogo-prikaza", "Отмена судебного приказа по кредитам, займам, коммунальным платежам и долгам.", "service-dolgi"),
  service("service-zashchita-dolzhnika", "Защита должника", "zashchita-dolzhnika", "Защита должника от взыскания, переговоры с кредиторами и оспаривание требований.", "service-dolgi"),
  service("service-biznes-i-arbitrazh", "Бизнес и договоры", "biznes-dogovory", "Юридическая помощь бизнесу, договоры, претензии, налоги и взыскание задолженности."),
  service("service-arbitrazhnye-spory", "Арбитражные споры", "arbitrazhnye-spory", "Ведение арбитражных споров между компаниями и предпринимателями."),
  service("service-korporativnye-spory", "Корпоративные споры", "korporativnye-spory", "Споры участников бизнеса, директоров и компаний по управлению, долям и сделкам."),
  service("service-dogovornye-spory", "Договорные споры", "dogovornye-spory", "Споры по договорам поставки, подряда, услуг, аренды и другим обязательствам.", "service-biznes-i-arbitrazh"),
  service("service-sostavlenie-dogovorov", "Составление договоров", "sostavlenie-dogovorov", "Подготовка договоров для бизнеса, проверка условий, рисков и ответственности.", "service-biznes-i-arbitrazh"),
  service("service-proverka-dogovora", "Проверка договора", "proverka-dogovora", "Правовая проверка договора перед подписанием, анализ рисков и спорных условий.", "service-biznes-i-arbitrazh"),
  service("service-nalogovye-spory", "Налоговые споры", "nalogovye-spory", "Споры с налоговой, доначисления, проверки, жалобы и судебная защита."),
  service("service-predstavitelstvo-v-arbitrazhnom-sude", "Представительство в арбитражном суде", "predstavitelstvo-v-arbitrazhnom-sude", "Представительство в арбитражном суде, подготовка позиции, исков и отзывов.", "service-biznes-i-arbitrazh"),
  service("service-vzyskanie-zadolzhennosti-s-kompanii", "Взыскание задолженности с компании", "vzyskanie-zadolzhennosti-s-kompanii", "Взыскание задолженности с юридических лиц и предпринимателей в претензионном и судебном порядке.", "service-biznes-i-arbitrazh"),
  service("service-mobilizaciya", "Мобилизация", "mobilizaciya", "Юридическая помощь по мобилизации, отсрочкам, повесткам и обжалованию решений.", "service-voennyj-yurist"),
  service("service-voennaya-sluzhba", "Военная служба", "voennaya-sluzhba", "Вопросы прохождения военной службы, выплат, увольнения и дисциплинарных споров.", "service-voennyj-yurist"),
  service("service-otsrochka-ot-armii", "Отсрочка от армии", "otsrochka-ot-armii", "Получение и защита отсрочки от армии по учебе, здоровью, семье или работе.", "service-voennyj-yurist"),
  service("service-spory-s-voenkomatom", "Споры с военкоматом", "spory-s-voenkomatom", "Обжалование решений военкомата, повесток, категорий годности и призывных мероприятий.", "service-voennyj-yurist"),
  service("service-obzhalovanie-prizyva", "Обжалование призыва", "obzhalovanie-prizyva", "Обжалование решения призывной комиссии и защита прав призывника.", "service-voennyj-yurist"),
  service("service-kontraktnaya-sluzhba", "Контрактная служба", "kontraktnaya-sluzhba", "Вопросы заключения, исполнения и расторжения контракта о военной службе.", "service-voennyj-yurist"),
  service("service-voennaya-ipoteka", "Военная ипотека", "voennaya-ipoteka", "Споры по военной ипотеке, выплатам, увольнению и правам участника НИС.", "service-voennyj-yurist"),
  service("service-migracionnoe-pravo", "Миграционное право", "migratsionnoe-pravo", "Вопросы гражданства, ВНЖ, РВП, миграционного учета, работы и въезда в РФ."),
  service("service-grazhdanstvo", "Гражданство", "grazhdanstvo", "Получение гражданства, подтверждение оснований, документы и обжалование отказа.", "service-migracionnoe-pravo"),
  service("service-vid-na-zhitelstvo", "Вид на жительство", "vid-na-zhitelstvo", "Оформление вида на жительство, продление, документы и отказ в выдаче.", "service-migracionnoe-pravo"),
  service("service-rvp", "РВП", "rvp", "Разрешение на временное проживание, квоты, документы и обжалование отказа.", "service-migracionnoe-pravo"),
  service("service-migracionnyy-uchet", "Миграционный учет", "migracionnyy-uchet", "Постановка на миграционный учет, продление пребывания и исправление нарушений.", "service-migracionnoe-pravo"),
  service("service-razreshenie-na-rabotu", "Разрешение на работу", "razreshenie-na-rabotu", "Разрешение на работу и патент, оформление документов и споры с органами.", "service-migracionnoe-pravo"),
  service("service-deportaciya", "Депортация", "deportaciya", "Защита от депортации, обжалование решений и восстановление права пребывания.", "service-migracionnoe-pravo"),
  service("service-zapret-na-vezd", "Запрет на въезд", "zapret-na-vezd", "Снятие или обжалование запрета на въезд в РФ, проверка оснований и документов.", "service-migracionnoe-pravo"),
  service("service-strahovoe-pravo", "Страховые споры", "strahovye-spory", "Споры по страховым выплатам, отказам, договорам страхования жизни и имущества."),
  service("service-otkaz-v-strahovoy-vyplate", "Отказ в страховой выплате", "otkaz-v-strahovoy-vyplate", "Обжалование отказа страховой компании и подготовка требований о выплате.", "service-strahovoe-pravo"),
  service("service-vzyskanie-strahovoy-vyplaty", "Взыскание страховой выплаты", "vzyskanie-strahovoy-vyplaty", "Взыскание страховой выплаты, неустойки, штрафа и компенсации через претензию или суд.", "service-strahovoe-pravo"),
  service("service-strahovanie-zhizni", "Страхование жизни", "strahovanie-zhizni", "Споры по договорам страхования жизни, отказам в выплате и условиям договора.", "service-strahovoe-pravo"),
  service("service-strahovanie-imushchestva", "Страхование имущества", "strahovanie-imushchestva", "Споры по страхованию имущества, оценке ущерба, отказам и размеру выплаты.", "service-strahovoe-pravo"),
  service("service-medicinskoe-pravo", "Медицинское право", "meditsinskoe-pravo", "Споры с клиниками, врачебные ошибки, вред здоровью и платные медицинские услуги."),
  service("service-vrachebnaya-oshibka", "Врачебная ошибка", "vrachebnaya-oshibka", "Оценка врачебной ошибки, сбор доказательств и взыскание вреда здоровью.", "service-medicinskoe-pravo"),
  service("service-nekachestvennye-medicinskie-uslugi", "Некачественные медицинские услуги", "nekachestvennye-medicinskie-uslugi", "Претензии и иски по некачественным медицинским услугам и лечению.", "service-medicinskoe-pravo"),
  service("service-vozmeshchenie-vreda-zdorovyu", "Возмещение вреда здоровью", "vozmeshchenie-vreda-zdorovyu", "Взыскание расходов на лечение, утраченного дохода и компенсации вреда здоровью.", "service-medicinskoe-pravo"),
  service("service-spory-s-klinikoy", "Споры с клиникой", "spory-s-klinikoy", "Споры с частными и государственными клиниками по качеству и оплате лечения.", "service-medicinskoe-pravo"),
  service("service-platnye-medicinskie-uslugi", "Платные медицинские услуги", "platnye-medicinskie-uslugi", "Проверка договора платных медицинских услуг, возврат денег и компенсации.", "service-medicinskoe-pravo"),
  service("service-kompensaciya-za-lechenie", "Компенсация за лечение", "kompensaciya-za-lechenie", "Взыскание компенсации расходов на лечение, реабилитацию и лекарства.", "service-medicinskoe-pravo"),
  service("service-administrativnoe-pravo", "Административные дела", "administrativnye-dela", "Административные дела, штрафы, постановления и споры с государственными органами."),
  service("service-administrativnye-dela", "Административные штрафы", "administrativnye-shtrafy", "Обжалование административных штрафов, подготовка жалоб и представительство.", "service-administrativnoe-pravo"),
  service("service-obzhalovanie-shtrafa", "Обжалование штрафа", "obzhalovanie-shtrafa", "Обжалование административных штрафов, постановлений и протоколов.", "service-administrativnoe-pravo"),
  service("service-administrativnaya-otvetstvennost", "Административная ответственность", "administrativnaya-otvetstvennost", "Помощь при привлечении к административной ответственности и снижении санкций.", "service-administrativnoe-pravo"),
  service("service-spory-s-gosorganami", "Споры с госорганами", "spory-s-gosorganami", "Обжалование решений, действий и бездействия государственных органов.", "service-administrativnoe-pravo"),
  service("service-zhaloba-na-postanovlenie", "Жалоба на постановление", "zhaloba-na-postanovlenie", "Подготовка жалобы на постановление по административному делу.", "service-administrativnoe-pravo"),
  service("service-obzhalovanie-deystviy-dolzhnostnyh-lic", "Обжалование действий должностных лиц", "obzhalovanie-deystviy-dolzhnostnyh-lic", "Обжалование действий и бездействия должностных лиц в административном порядке и суде.", "service-administrativnoe-pravo"),
  service("service-socialnoe-pravo", "Социальное право", "socialnoe-pravo", "Пенсии, пособия, выплаты, инвалидность, материнский капитал и споры с Социальным фондом."),
  service("service-sotsialnye-vyplaty", "Социальные выплаты", "sotsialnye-vyplaty", "Назначение социальных выплат, пособий, льгот и обжалование отказов."),
  service("service-pensionnye-spory", "Пенсионные споры", "pensionnye-spory", "Споры о назначении, перерасчете и выплате пенсии."),
  service("service-oformlenie-pensii", "Оформление пенсии", "oformlenie-pensii", "Помощь с оформлением пенсии, подтверждением стажа и подачей документов.", "service-socialnoe-pravo"),
  service("service-pereraschet-pensii", "Перерасчет пенсии", "pereraschet-pensii", "Перерасчет пенсии, учет стажа, льгот и оспаривание отказа.", "service-socialnoe-pravo"),
  service("service-invalidnost", "Инвалидность", "invalidnost", "Оформление инвалидности, обжалование отказа МСЭ и защита социальных прав.", "service-socialnoe-pravo"),
  service("service-posobiya-i-vyplaty", "Пособия и выплаты", "posobiya-i-vyplaty", "Назначение пособий, социальных выплат и обжалование отказов.", "service-socialnoe-pravo"),
  service("service-matkapital", "Материнский капитал", "matkapital", "Вопросы получения и использования материнского капитала, споры и отказы.", "service-socialnoe-pravo"),
  service("service-spory-s-sfr", "Споры с Социальным фондом", "spory-s-sfr", "Споры с Социальным фондом по пенсиям, выплатам, стажу и льготам.", "service-socialnoe-pravo"),
  service("service-grazhdanskie-spory", "Гражданские споры", "grazhdanskie-spory", "Договорные, имущественные и личные неимущественные споры между гражданами и организациями."),
  service("service-vozmeshchenie-ushcherba", "Возмещение ущерба", "vozmeshchenie-ushcherba", "Взыскание имущественного ущерба, расходов, убытков и компенсаций.", "service-grazhdanskie-spory"),
  service("service-zashchita-chesti-i-dostoinstva", "Защита чести и достоинства", "zashchita-chesti-dostoinstva", "Защита чести, достоинства и доброго имени, опровержение недостоверных сведений."),
  service("service-spory-po-dogovoru", "Споры по договору", "spory-po-dogovoru", "Споры по договорам между гражданами и организациями, исполнение и ответственность.", "service-grazhdanskie-spory"),
  service("service-rastorzhenie-dogovora", "Расторжение договора", "rastorzhenie-dogovora", "Расторжение договора, возврат денег, убытки и последствия прекращения обязательств.", "service-grazhdanskie-spory"),
  service("service-priznanie-sdelki-nedeystvitelnoy", "Признание сделки недействительной", "priznanie-sdelki-nedeystvitelnoy", "Оспаривание сделок, недействительность договора и применение последствий.", "service-grazhdanskie-spory"),
  service("service-iskovaya-davnost", "Исковая давность", "iskovaya-davnost", "Проверка сроков исковой давности, восстановление сроков и возражения в суде.", "service-grazhdanskie-spory"),
  service("service-intellektualnaya-sobstvennost", "Интеллектуальная собственность", "intellektualnaya-sobstvennost", "Товарные знаки, авторские права, лицензии, бренды и защита результатов творчества."),
  service("service-tovarnye-znaki", "Товарные знаки", "tovarnye-znaki", "Регистрация, защита и споры по товарным знакам и обозначениям.", "service-intellektualnaya-sobstvennost"),
  service("service-avtorskoe-pravo", "Авторское право", "avtorskoe-pravo", "Защита авторских прав, договоры, нарушения и взыскание компенсации.", "service-intellektualnaya-sobstvennost"),
  service("service-zashchita-brenda", "Защита бренда", "zashchita-brenda", "Юридическая защита бренда, обозначений, репутации и исключительных прав.", "service-intellektualnaya-sobstvennost"),
  service("service-registraciya-tovarnogo-znaka", "Регистрация товарного знака", "registraciya-tovarnogo-znaka", "Регистрация товарного знака, проверка обозначения и ответы на запросы Роспатента.", "service-intellektualnaya-sobstvennost"),
  service("service-narushenie-avtorskih-prav", "Нарушение авторских прав", "narushenie-avtorskih-prav", "Пресечение нарушения авторских прав, претензии, иски и компенсация.", "service-intellektualnaya-sobstvennost"),
  service("service-licenzionnyy-dogovor", "Лицензионный договор", "licenzionnyy-dogovor", "Подготовка и проверка лицензионных договоров и условий использования прав.", "service-intellektualnaya-sobstvennost"),
  service("service-it-pravo", "IT-право", "it-pravo", "Правовое сопровождение IT-бизнеса, сайтов, персональных данных, маркетплейсов и разработки ПО."),
  service("service-personalnye-dannye", "Персональные данные", "personalnye-dannye", "152-ФЗ, политика обработки персональных данных, согласия, проверки и риски."),
  service("service-dogovor-razrabotki-po", "Договор разработки ПО", "dogovor-razrabotki-po", "Договор разработки программного обеспечения, права на код, сроки и приемка работ.", "service-it-pravo"),
  service("service-oferta-dlya-sayta", "Оферта для сайта", "oferta-dlya-sayta", "Подготовка оферты для сайта, онлайн-сервиса, магазина или подписки.", "service-it-pravo"),
  service("service-politika-konfidencialnosti", "Политика конфиденциальности", "politika-konfidencialnosti", "Политика конфиденциальности, обработка данных пользователей и документы для сайта.", "service-it-pravo"),
  service("service-spory-s-marketpleysami", "Споры с маркетплейсами", "spory-s-marketpleysami", "Споры продавцов и покупателей с маркетплейсами по блокировкам, выплатам и штрафам.", "service-it-pravo"),
  service("service-blokirovka-akkaunta", "Блокировка аккаунта", "blokirovka-akkaunta", "Обжалование блокировки аккаунта, кабинета продавца, сервиса или рекламного профиля.", "service-it-pravo"),
  service("service-pravovoe-soprovozhdenie-it-biznesa", "Правовое сопровождение IT-бизнеса", "pravovoe-soprovozhdenie-it-biznesa", "Договоры, персональные данные, права на ПО и правовые процессы IT-компании.", "service-it-pravo"),
  service("service-reputacionnye-spory", "Репутационные споры", "reputacionnye-spory", "Клевета, отзывы, недостоверные сведения и защита деловой репутации."),
  service("service-kleveta", "Клевета", "kleveta", "Защита от клеветы, сбор доказательств, опровержение и взыскание компенсации.", "service-reputacionnye-spory"),
  service("service-oskorblenie", "Оскорбление", "oskorblenie", "Защита при оскорблении, фиксация доказательств и требования о компенсации.", "service-reputacionnye-spory"),
  service("service-udalenie-otzyva", "Удаление отзыва", "udalenie-otzyva", "Удаление недостоверного или нарушающего права отзыва, претензии площадке и автору.", "service-reputacionnye-spory"),
  service("service-zashchita-delovoy-reputacii", "Защита деловой репутации", "zashchita-delovoy-reputacii", "Защита деловой репутации компании или предпринимателя, опровержение сведений.", "service-reputacionnye-spory"),
  service("service-kompensaciya-za-klevetu", "Компенсация за клевету", "kompensaciya-za-klevetu", "Взыскание компенсации за клевету и распространение недостоверных сведений.", "service-reputacionnye-spory"),
  service("service-rasprostranenie-nedostovernyh-svedeniy", "Распространение недостоверных сведений", "rasprostranenie-nedostovernyh-svedeniy", "Пресечение распространения недостоверных сведений и защита репутации.", "service-reputacionnye-spory"),
  service("service-opredelenie-mesta-zhitelstva-rebenka", "Определение места жительства ребенка", "opredelenie-mesta-zhitelstva-rebenka", "Споры о месте жительства ребенка после развода или раздельного проживания родителей.", "service-semejnoe-pravo"),
  service("service-poryadok-obshcheniya-s-rebenkom", "Порядок общения с ребенком", "poryadok-obshcheniya-s-rebenkom", "Определение порядка общения с ребенком, график встреч и исполнение решения.", "service-semejnoe-pravo"),
  service("service-lishenie-roditelskih-prav", "Лишение родительских прав", "lishenie-roditelskih-prav", "Лишение или ограничение родительских прав, доказательства и судебная процедура.", "service-semejnoe-pravo"),
  service("service-braknyy-dogovor", "Брачный договор", "braknyy-dogovor", "Подготовка, изменение, оспаривание брачного договора и раздел имущества.", "service-semejnoe-pravo"),
  service("service-razdel-kvartiry-pri-razvode", "Раздел квартиры при разводе", "razdel-kvartiry-pri-razvode", "Раздел квартиры, ипотеки, долей и совместного имущества при разводе.", "service-semejnoe-pravo"),
  service("service-ustanovlenie-otcovstva", "Установление отцовства", "ustanovlenie-otcovstva", "Установление отцовства через ЗАГС или суд, экспертиза и правовые последствия.", "service-semejnoe-pravo"),
  service("service-osparivanie-otcovstva", "Оспаривание отцовства", "osparivanie-otcovstva", "Оспаривание записи об отцовстве, экспертиза и судебная защита.", "service-semejnoe-pravo"),
  service("service-obyazatelnaya-dolya-v-nasledstve", "Обязательная доля в наследстве", "obyazatelnaya-dolya-v-nasledstve", "Права на обязательную долю в наследстве, расчет доли и судебные споры.", "service-nasledstvo"),
  service("service-nasledstvo-bez-zaveshchaniya", "Наследство без завещания", "nasledstvo-bez-zaveshchaniya", "Наследование по закону, очереди наследников, документы и оформление прав.", "service-nasledstvo"),
  service("service-nasledstvo-cherez-sud", "Наследство через суд", "nasledstvo-cherez-sud", "Оформление наследства через суд, признание прав и восстановление сроков.", "service-nasledstvo"),
  service("service-nedostoynyy-naslednik", "Недостойный наследник", "nedostoynyy-naslednik", "Признание наследника недостойным, доказательства и последствия для наследства.", "service-nasledstvo"),
  service("service-spory-mezhdu-naslednikami", "Споры между наследниками", "spory-mezhdu-naslednikami", "Споры между наследниками о долях, имуществе, завещании и порядке оформления.", "service-nasledstvo"),
  service("service-prinyatie-nasledstva", "Принятие наследства", "prinyatie-nasledstva", "Принятие наследства у нотариуса или фактически, сроки и подтверждение действий.", "service-nasledstvo"),
  service("service-likvidaciya-ooo", "Ликвидация ООО", "likvidaciya-ooo", "Добровольная и принудительная ликвидация ООО, документы, проверки и риски.", "service-biznes-i-arbitrazh"),
  service("service-registraciya-ooo", "Регистрация ООО", "registraciya-ooo", "Регистрация ООО, подготовка документов, выбор ОКВЭД и сопровождение подачи.", "service-biznes-i-arbitrazh"),
  service("service-bankrotstvo-yuridicheskih-lic", "Банкротство бизнеса", "bankrotstvo-biznesa", "Банкротство компании, защита директора, кредиторов и сопровождение процедуры."),
  service("service-proverka-kontragenta", "Проверка контрагента", "proverka-kontragenta", "Проверка контрагента перед сделкой, анализ рисков, долгов и судебной истории.", "service-biznes-i-arbitrazh"),
  service("service-yuridicheskoe-soprovozhdenie-biznesa", "Юридическое сопровождение бизнеса", "yuridicheskoe-soprovozhdenie-biznesa", "Постоянное юридическое сопровождение бизнеса, договоры, претензии и консультации.", "service-biznes-i-arbitrazh"),
  service("service-abonentskoe-obsluzhivanie", "Абонентское юридическое обслуживание", "abonentskoe-obsluzhivanie", "Абонентское юридическое обслуживание компании, договоры, претензии и текущие вопросы.", "service-biznes-i-arbitrazh"),
  service("service-spory-s-postavshchikom", "Споры с поставщиком", "spory-s-postavshchikom", "Споры с поставщиком по качеству, срокам, оплате, неустойке и убыткам.", "service-biznes-i-arbitrazh"),
  service("service-spory-s-pokupatelem", "Споры с покупателем", "spory-s-pokupatelem", "Споры с покупателем по оплате, приемке, возвратам, претензиям и договорам.", "service-biznes-i-arbitrazh"),
  service("service-obrazovatelnoe-pravo", "Образовательное право", "obrazovatelnoe-pravo", "Споры с образовательными организациями, зачисление, отчисление, договоры и платное обучение."),
  service("service-ekologicheskoe-pravo", "Экологическое право", "ekologicheskoe-pravo", "Экологические споры, вред окружающей среде, разрешения, проверки и ответственность."),
  service("service-tamozhennoe-pravo", "Таможенное право", "tamozhennoe-pravo", "Таможенные платежи, проверки, споры с таможней, импорт, экспорт и обжалование решений."),
  service("service-mezhdunarodnoe-pravo", "Международное право", "mezhdunarodnoe-pravo", "Международные договоры, трансграничные споры, документы и правовые риски."),
  service("service-yuridicheskie-dokumenty", "Юридические документы", "yuridicheskie-dokumenty", "Подготовка, проверка и экспертиза юридических документов, исков, претензий и жалоб."),
  service("service-sostavlenie-iska", "Составление иска", "sostavlenie-iska", "Подготовка искового заявления, расчет требований, доказательства и приложения.", "service-yuridicheskie-dokumenty"),
  service("service-sostavlenie-pretenzii", "Составление претензии", "sostavlenie-pretenzii", "Подготовка претензии, правовое обоснование требований и контроль сроков ответа.", "service-yuridicheskie-dokumenty"),
  service("service-sostavlenie-zhaloby", "Составление жалобы", "sostavlenie-zhaloby", "Подготовка жалобы в суд, госорган, прокуратуру или другую инстанцию.", "service-yuridicheskie-dokumenty"),
  service("service-pravovaya-ekspertiza-dokumentov", "Правовая экспертиза документов", "pravovaya-ekspertiza-dokumentov", "Правовая экспертиза документов, выявление рисков и рекомендации по правкам.", "service-yuridicheskie-dokumenty")
];

const lawyerNames = [
  ["Иван", "Иванов", "Сергеевич"],
  ["Анна", "Петрова", "Алексеевна"],
  ["Дмитрий", "Смирнов", "Олегович"],
  ["Елена", "Кузнецова", "Игоревна"],
  ["Михаил", "Соколов", "Викторович"],
  ["Ольга", "Попова", "Николаевна"],
  ["Алексей", "Морозов", "Павлович"],
  ["Мария", "Волкова", "Денисовна"],
  ["Сергей", "Лебедев", "Андреевич"],
  ["Наталья", "Новикова", "Романовна"],
  ["Павел", "Федоров", "Ильич"],
  ["Юлия", "Михайлова", "Петровна"],
  ["Артем", "Беляев", "Максимович"],
  ["Ксения", "Орлова", "Станиславовна"],
  ["Роман", "Козлов", "Георгиевич"],
  ["Татьяна", "Андреева", "Владимировна"],
  ["Виктор", "Макаров", "Евгеньевич"],
  ["Ирина", "Никитина", "Борисовна"],
  ["Кирилл", "Захаров", "Валерьевич"],
  ["Светлана", "Зайцева", "Аркадьевна"],
  ["Георгий", "Соловьев", "Львович"],
  ["Вероника", "Борисова", "Семеновна"],
  ["Никита", "Яковлев", "Русланович"],
  ["Алина", "Григорьева", "Михайловна"],
  ["Евгений", "Романов", "Тимурович"],
  ["Полина", "Васильева", "Кирилловна"],
  ["Константин", "Семенов", "Юрьевич"],
  ["Дарья", "Павлова", "Олеговна"],
  ["Борис", "Алексеев", "Федорович"],
  ["Лидия", "Степанова", "Валентиновна"],
  ["Андрей", "Ковалев", "Дмитриевич"],
  ["Екатерина", "Фомина", "Ильинична"],
  ["Максим", "Громов", "Сергеевич"],
  ["Валерия", "Синицына", "Павловна"],
  ["Олег", "Тарасов", "Николаевич"],
  ["Нина", "Егорова", "Андреевна"]
];

const slugParts = [
  "ivanov-ivan-sergeevich",
  "petrova-anna-alekseevna",
  "smirnov-dmitrij-olegovich",
  "kuznecova-elena-igorevna",
  "sokolov-mihail-viktorovich",
  "popova-olga-nikolaevna",
  "morozov-aleksej-pavlovich",
  "volkova-mariya-denisovna",
  "lebedev-sergej-andreevich",
  "novikova-natalya-romanovna",
  "fedorov-pavel-ilich",
  "mihajlova-yuliya-petrovna",
  "belyaev-artem-maksimovich",
  "orlova-kseniya-stanislavovna",
  "kozlov-roman-georgievich",
  "andreeva-tatyana-vladimirovna",
  "makarov-viktor-evgenevich",
  "nikitina-irina-borisovna",
  "zaharov-kirill-valerevich",
  "zajceva-svetlana-arkadevna",
  "solovev-georgij-lvovich",
  "borisova-veronika-semenovna",
  "yakovlev-nikita-ruslanovich",
  "grigoreva-alina-mihajlovna",
  "romanov-evgenij-timurovich",
  "vasileva-polina-kirillovna",
  "semenov-konstantin-yurevich",
  "pavlova-darya-olegovna",
  "alekseev-boris-fedorovich",
  "stepanova-lidiya-valentinovna",
  "kovalev-andrej-dmitrievich",
  "fomina-ekaterina-ilinichna",
  "gromov-maksim-sergeevich",
  "sinicyna-valeriya-pavlovna",
  "tarasov-oleg-nikolaevich",
  "egorova-nina-andreevna"
];

const lawyerCitySlugs = [
  "moskva",
  "sankt-peterburg",
  "novosibirsk",
  "ekaterinburg",
  "kazan",
  "krasnoyarsk",
  "nizhniy-novgorod",
  "chelyabinsk",
  "ufa",
  "krasnodar",
  "samara",
  "rostov-na-donu",
  "omsk",
  "voronezh",
  "perm",
  "volgograd",
  "saratov",
  "tyumen",
  "tolyatti",
  "mahachkala",
  "barnaul",
  "izhevsk",
  "khabarovsk",
  "ulyanovsk",
  "irkutsk",
  "vladivostok",
  "yaroslavl",
  "stavropol",
  "sevastopol",
  "naberezhnye-chelny",
  "tomsk",
  "balashikha",
  "kemerovo",
  "orenburg",
  "novokuznetsk",
  "ryazan"
];

function findCityBySlug(slug: string) {
  const city = cities.find((item) => item.slug === slug);
  if (!city) throw new Error(`Missing city slug in sample data: ${slug}`);
  return city;
}

function generatedLawyerPhotoUrl(slug: string) {
  return `/generated-lawyer-photos/${slug}.png?v=realistic-headshots-20260609`;
}

export const lawyers: Lawyer[] = lawyerNames.map(([firstName, lastName, middleName], index) => {
  const primaryCity = findCityBySlug(lawyerCitySlugs[index] ?? "moskva");
  const primaryService = index < 12 ? services[4] : services[index % services.length];
  const secondaryService = services[(index + 5) % services.length];
  const thirdService = services[(index + 11) % services.length];
  const status: LawyerStatus = index % 5 === 0 || index % 7 === 0 ? "ADVOCATE" : "LAWYER";
  const id = `lawyer-${index + 1}`;

  return {
    id,
    userId: `user-lawyer-${index + 1}`,
    firstName,
    lastName,
    middleName,
    slug: slugParts[index],
    photoUrl: generatedLawyerPhotoUrl(slugParts[index]),
    status,
    experienceYears: 5 + (index % 16),
    description:
      `${lastName} ${firstName} ведет дела по направлению «${primaryService.name}», помогает оценить перспективы и подготовить документы до обращения в суд. В профиле указаны проверенные сведения, опыт и стоимость консультации.`,
    education:
      "Высшее юридическое образование, регулярное повышение квалификации по процессуальному праву и профильной практике.",
    licenseNumber: status === "ADVOCATE" ? `77/${4200 + index}` : null,
    isVerified: true,
    rating: 0,
    reviewCount: 0,
    consultationPrice: 1500 + (index % 6) * 700,
    primaryServiceId: primaryService.id,
    phone: null,
    whatsapp: null,
    telegram: null,
    email: null,
    citySlugs: [primaryCity.slug],
    serviceSlugs: Array.from(new Set([primaryService.slug, secondaryService.slug, thirdService.slug])),
    cities: [primaryCity],
    services: Array.from(new Map([primaryService, secondaryService, thirdService].map((item) => [item.slug, item])).values()),
    reviews: [],
    profile: {
      about:
        "Специалист начинает с короткого разбора ситуации, выделяет риски и предлагает практичный план: переговоры, претензия, документы, суд или онлайн-консультация. Данные профиля проходят модерацию сервиса.",
      courtExperience:
        "Регулярно представляет интересы клиентов в судах первой и апелляционной инстанции.",
      officeAddress: `${primaryCity.name}, деловой центр, кабинет ${20 + index}`,
      casesCount: 45 + index * 4,
      responseTimeMinutes: 25 + (index % 5) * 10
    },
    priceItems: [
      {
        id: `price-${id}-1`,
        lawyerId: id,
        serviceId: primaryService.id,
        title: `Консультация по теме «${primaryService.name}»`,
        priceFrom: 1500 + (index % 6) * 700,
        priceTo: 3500 + (index % 5) * 900
      },
      {
        id: `price-${id}-2`,
        lawyerId: id,
        serviceId: secondaryService.id,
        title: "Подготовка документа",
        priceFrom: 3000 + (index % 4) * 1000,
        priceTo: 9000 + (index % 6) * 1200
      }
    ],
    verifications: [
      {
        id: `verification-${id}-contacts`,
        lawyerId: id,
        type: "CONTACTS",
        status: "APPROVED",
        comment: "Контакты подтверждены сервисом."
      },
      {
        id: `verification-${id}-education`,
        lawyerId: id,
        type: status === "ADVOCATE" ? "ADVOCATE_STATUS" : "DIPLOMA",
        status: "APPROVED",
        comment: status === "ADVOCATE" ? "Статус адвоката проверен по открытым данным." : "Сведения об образовании прошли модерацию."
      }
    ]
  };
});

export const articles: Article[] = [
  makeArticle("article-1", "Как вступить в наследство без споров", "kak-vstupit-v-nasledstvo", services[4], lawyers[0]),
  makeArticle("article-2", "Как подать на алименты и подтвердить расходы", "kak-podat-na-alimenty", services[1], lawyers[1]),
  makeArticle("article-3", "Развод через суд: документы, сроки и риски", "razvod-cherez-sud", services[2], lawyers[2]),
  makeArticle("article-4", "Что делать после ДТП: юридический порядок действий", "chto-delat-posle-dtp", services[9], lawyers[3]),
  makeArticle("article-5", "Банкротство физического лица: когда оно действительно помогает", "bankrotstvo-fizlica-kogda-pomogaet", services[8], lawyers[4]),
  makeArticle("article-6", "Как подготовить претензию потребителя", "kak-podgotovit-pretenziyu-potrebitelya", services[13], lawyers[5])
];

const baseQuestions: Question[] = [
  makePublishedQuestion({
    id: "question-1",
    publicNumber: "QP-000001",
    slug: "mozhet-li-byvshij-muzh-zabrat-rebenka-posle-razvoda",
    title: "Может ли бывший муж забрать ребенка после развода?",
    category: "Семейное право",
    city: cities[0],
    serviceItem: services[0],
    authorName: "Анна",
    authorType: "USER",
    publishedAt: new Date(Date.UTC(2026, 4, 20, 10, 15)).toISOString(),
    viewsCount: 184,
    questionText:
      "После развода ребенок живет со мной. Бывший муж говорит, что заберет ребенка на выходные и может не вернуть, потому что тоже имеет родительские права. Решения суда о месте жительства ребенка пока нет. Как мне действовать, чтобы не допустить такой ситуации?",
    shortPreview:
      "После развода ребенок живет с матерью, отец угрожает забрать ребенка и не вернуть после выходных.",
    tags: ["дети после развода", "место жительства ребенка", "порядок общения"],
    lawyer: lawyers[0],
    answerPublishedAt: new Date(Date.UTC(2026, 4, 20, 15, 30)).toISOString(),
    answerText:
      "Анна, если место жительства ребенка не определено соглашением родителей или решением суда, лучше не оставлять ситуацию на устных договоренностях. Зафиксируйте угрозы: переписку, сообщения, свидетельские подтверждения. Если есть риск, что отец удержит ребенка после выходных, передавайте ребенка только при понятных условиях и подавайте иск об определении места жительства ребенка и порядка общения. При реальной угрозе удержания обращайтесь в полицию и органы опеки. Суд будет оценивать интересы ребенка, привычный уклад, участие каждого родителя и условия проживания."
  }),
  makePublishedQuestion({
    id: "question-2",
    publicNumber: "QP-000002",
    slug: "upravlyayushchaya-kompaniya-ne-ustranyaet-protechku-kryshi",
    title: "Управляющая компания не устраняет протечку крыши",
    category: "Жилищное право",
    city: cities[1],
    serviceItem: services[12],
    authorName: "Сергей",
    authorType: "USER",
    publishedAt: new Date(Date.UTC(2026, 4, 21, 8, 40)).toISOString(),
    viewsCount: 142,
    questionText:
      "После сильного дождя у нас снова потек потолок в комнате. Управляющая компания заявки принимает, но дальше ничего не происходит. Потолок портится, есть пятна и запах сырости. Что нужно сделать, чтобы УК наконец устранила причину и возместила ущерб?",
    shortPreview:
      "После дождя течет потолок, УК принимает заявки, но ничего не делает.",
    tags: ["протечка крыши", "управляющая компания", "ущерб квартире"],
    lawyer: lawyers[5],
    answerPublishedAt: new Date(Date.UTC(2026, 4, 21, 13, 5)).toISOString(),
    answerText:
      "Сергей, начните с письменной претензии в управляющую компанию: укажите дату протечки, адрес, последствия и требование устранить причину. Ущерб фиксируйте фото и видео, дополнительно добивайтесь составления акта осмотра. Если УК не реагирует, подавайте жалобы в жилищную инспекцию и Роспотребнадзор. При ущербе имуществу можно обращаться в суд с требованиями о возмещении убытков, неустойке, штрафе и компенсации морального вреда."
  }),
  makePublishedQuestion({
    id: "question-3",
    publicNumber: "QP-000003",
    slug: "rabotodatel-ne-vyplatil-zarplatu-pri-uvolnenii",
    title: "Работодатель не выплатил зарплату при увольнении",
    category: "Трудовое право",
    city: cities[4],
    serviceItem: services[5],
    authorName: "Марина",
    authorType: "USER",
    publishedAt: new Date(Date.UTC(2026, 4, 22, 11, 20)).toISOString(),
    viewsCount: 211,
    questionText:
      "Я уволилась две недели назад, но расчет до сих пор не получила. Работодатель обещает перевести деньги позже, компенсацию за отпуск тоже не выплатили. Документы об увольнении на руках. Куда обращаться и что можно взыскать?",
    shortPreview:
      "Уволилась две недели назад, расчет и компенсацию за отпуск не выплатили.",
    tags: ["расчет при увольнении", "задержка зарплаты", "компенсация отпуска"],
    lawyer: lawyers[2],
    answerPublishedAt: new Date(Date.UTC(2026, 4, 22, 16, 10)).toISOString(),
    answerText:
      "Марина, окончательный расчет должны сделать в день увольнения. Если деньги не выплачены, направьте работодателю письменное требование и сохраните подтверждение отправки. Параллельно можно обратиться в трудовую инспекцию и прокуратуру. Через суд взыскивают зарплату, компенсацию за задержку, компенсацию за неиспользованный отпуск и, при наличии оснований, моральный вред. Сроки по трудовым спорам лучше не затягивать."
  }),
  makePublishedQuestion({
    id: "question-4",
    publicNumber: "QP-000004",
    slug: "magazin-otkazyvaetsya-vozvrashchat-dengi-za-neispravnyj-telefon",
    title: "Магазин отказывается возвращать деньги за неисправный телефон",
    category: "Защита прав потребителей",
    city: cities[5],
    serviceItem: services[13],
    authorName: "Игорь",
    authorType: "USER",
    publishedAt: new Date(Date.UTC(2026, 4, 23, 9, 45)).toISOString(),
    viewsCount: 167,
    questionText:
      "Купил телефон, через неделю он начал сам выключаться. Магазин говорит, что деньги не вернет и предлагает только ремонт. Я хочу вернуть деньги, потому что телефон новый и пользоваться им нормально нельзя. Как правильно оформить требование?",
    shortPreview:
      "Телефон сломался через неделю, магазин предлагает только ремонт, деньги возвращать отказывается.",
    tags: ["неисправный телефон", "возврат денег", "претензия магазину"],
    lawyer: lawyers[3],
    answerPublishedAt: new Date(Date.UTC(2026, 4, 23, 14, 25)).toISOString(),
    answerText:
      "Игорь, по технически сложному товару в установленный законом срок можно требовать возврат денег, если обнаружен недостаток. Подайте письменную претензию с требованием вернуть стоимость телефона и передайте товар на проверку качества по акту. Если магазин спорит о причине поломки, проводится экспертиза. При отказе можно идти в суд и дополнительно заявлять неустойку, штраф за неудовлетворение требований потребителя и компенсацию."
  }),
  makePublishedQuestion({
    id: "question-5",
    publicNumber: "QP-000005",
    slug: "propustil-srok-vstupleniya-v-nasledstvo",
    title: "Пропустил срок вступления в наследство",
    category: "Наследственное право",
    city: cities[2],
    serviceItem: services[4],
    authorName: "Гость",
    authorType: "GUEST",
    publishedAt: new Date(Date.UTC(2026, 4, 24, 12, 0)).toISOString(),
    viewsCount: 235,
    questionText:
      "После смерти отца прошло больше шести месяцев. Я думал, что успею обратиться к нотариусу позже, но теперь нотариус говорит, что срок пропущен. Другие наследники есть. Можно ли восстановить срок или есть другой способ оформить наследство?",
    shortPreview:
      "После смерти отца прошло больше 6 месяцев, нотариус говорит, что срок пропущен.",
    tags: ["срок наследства", "восстановление срока", "фактическое принятие"],
    lawyer: lawyers[4],
    answerPublishedAt: new Date(Date.UTC(2026, 4, 24, 17, 40)).toISOString(),
    answerText:
      "Срок можно восстановить через суд, если были уважительные причины пропуска, либо оформить наследство с письменного согласия других наследников. Еще важно проверить фактическое принятие наследства: проживание в жилье, оплата коммунальных услуг, ремонт, содержание или охрана имущества. Если такие действия были, это может стать отдельным основанием для признания права на наследство."
  })
];

// Curated demo questions + a real snapshot from production (sample-questions-prod.ts),
// so the dev DB fallback populates the related-questions blocks like on prod.
export const questions: Question[] = [
  ...baseQuestions,
  ...prodSampleQuestions.map((item, index) =>
    makePublishedQuestion({
      id: `prod-q-${index + 1}`,
      publicNumber: `QP-9${String(index + 1).padStart(5, "0")}`,
      slug: item.slug,
      title: item.title,
      category: item.category,
      city: cities[index % cities.length],
      serviceItem: services[index % services.length],
      authorName: item.authorName,
      authorType: "USER",
      publishedAt: item.publishedAt,
      viewsCount: 50 + (index % 200),
      questionText: item.text,
      shortPreview: item.summary,
      tags: item.tags,
      lawyer: lawyers[index % lawyers.length],
      answerPublishedAt: item.publishedAt,
      answerText: item.answerText
    })
  )
];

export const documentTemplates: DocumentTemplate[] = [makeDocument("document-zags", "Заявление в орган ЗАГС", "zayavlenie-v-zags", services[0])];

export const calculators: Calculator[] = [
  makeCalculator("calculator-1", "Алименты", "alimenty", services[1], "Доход плательщика * доля по количеству детей"),
  makeCalculator("calculator-2", "Госпошлина", "gosposhlina", services[19], "Цена иска * ставка госпошлины"),
  makeCalculator("calculator-3", "Неустойка", "neustoyka", services[7], "Сумма долга * ставка * дни просрочки"),
  makeCalculator("calculator-4", "Проценты по долгу", "procenty-po-dolgu", services[7], "Долг * ключевая ставка * дни / 365"),
  makeCalculator("calculator-5", "Задержка зарплаты", "zaderzhka-zarplaty", services[5], "Невыплаченная сумма * компенсационная ставка * дни"),
  makeCalculator("calculator-6", "Стоимость банкротства", "stoimost-bankrotstva", services[8], "Фиксированные расходы + услуги специалиста"),
  makeCalculator("calculator-7", "Судебные расходы", "sudebnye-rashody", services[19], "Госпошлина + представитель + экспертизы + почтовые расходы")
];

export const cases: CaseItem[] = [
  makeCase("case-1", "Восстановили срок наследства", "vosstanovili-srok-nasledstva", services[4], cities[0], lawyers[0]),
  makeCase("case-2", "Взыскали алименты за прошлый период", "vzyskali-alimenty-za-proshlyj-period", services[1], cities[1], lawyers[1]),
  makeCase("case-3", "Оспорили увольнение и получили компенсацию", "osporili-uvolnenie-i-poluchili-kompensaciyu", services[6], cities[2], lawyers[2])
];

export const checklists: LegalChecklist[] = [
  makeChecklist("checklist-1", "Документы для вступления в наследство", "dokumenty-dlya-nasledstva", services[4], [
    "Паспорт наследника",
    "Свидетельство о смерти",
    "Документы о родстве",
    "Документы на имущество",
    "Сведения о долгах наследодателя",
    "Заявление нотариусу"
  ]),
  makeChecklist("checklist-2", "Что подготовить перед разводом", "pered-razvodom", services[2], [
    "Свидетельство о браке",
    "Свидетельства о рождении детей",
    "Документы на имущество",
    "Справки о доходах",
    "Переписка и доказательства договоренностей",
    "Проект требований к суду"
  ]),
  makeChecklist("checklist-3", "Проверка трудового спора", "trudovoj-spor", services[5], [
    "Трудовой договор",
    "Приказы работодателя",
    "Расчетные листки",
    "Переписка с работодателем",
    "График работы",
    "Сроки обращения в комиссию или суд"
  ])
];

export const videoPages: VideoPage[] = [
  makeVideoPage("video-1", "Как проходит консультация юриста", "kak-prohodit-konsultaciya-yurista", services[0], lawyers[0]),
  makeVideoPage("video-2", "Что делать, если не платят зарплату", "chto-delat-esli-ne-platyat-zarplatu", services[5], lawyers[2]),
  makeVideoPage("video-3", "Как вступить в наследство без ошибок", "kak-vstupit-v-nasledstvo", services[4], lawyers[0])
];

export const legalScenarios: LegalScenario[] = [makeScenario("scenario-zags", "Брак и ЗАГС", "brak-zags-i-smena-familii", services[0])];

export const nextBestActions: NextBestAction[] = [
  makeNextBestAction("nba-1", "SERVICE", services[4], null, "Найти юриста по наследству", "/nasledstvo/"),
  makeNextBestAction("nba-2", "DOCUMENT", services[1], null, "Скачать список документов", "/documents/"),
  makeNextBestAction("nba-3", "CALCULATOR", services[1], null, "Рассчитать ориентировочную сумму", "/calculators/alimenty/"),
  makeNextBestAction("nba-4", "SITUATION", services[5], null, "Задать вопрос по трудовому спору", "/questions/")
];

export const faqItems: FaqItem[] = [
  ...cities.flatMap((city) =>
    makeFaqs("CITY", city.id, [
      [`Как выбрать юриста в ${city.namePrepositional}?`, "Сравните опыт по вашей теме, наличие проверенного профиля, ориентир стоимости и готовность работать в нужном формате: онлайн, в офисе или в суде."],
      ["Можно ли получить консультацию онлайн?", "Да. В карточках специалистов можно изучить формат работы, а вопрос позволяет описать задачу заранее."],
      ["Что делать, если в моем городе мало специалистов?", "Оставьте вопрос на платформе: мы проверим доступных юристов в регионе и предложим онлайн-консультацию, если очный прием сейчас недоступен."]
    ])
  ),
  ...services.flatMap((service) =>
    makeFaqs("SERVICE", service.id, [
      [`Когда нужен юрист по теме «${service.name}»?`, "Когда решение влияет на деньги, сроки, документы, суд или переговоры с другой стороной. Ранняя консультация помогает не испортить позицию."],
      ["Сколько стоит консультация?", "Цена зависит от опыта специалиста, региона, срочности и объема документов. В листинге показывается ориентир по первой консультации."],
      ["Как сервис подбирает специалистов?", "Мы учитываем совпадение услуги, города, опыта, подтвержденных сведений профиля и доступного формата консультации."]
    ])
  ),
  ...makeFaqs("CITY_SERVICE", "city-moskva:service-nasledstvo", [
    ["Какие наследственные вопросы чаще решают в Москве?", "Оформление наследства у нотариуса, восстановление срока, споры между наследниками, выдел обязательной доли и оспаривание завещания."],
    ["Можно ли начать с онлайн-консультации?", "Да. Для первичной оценки обычно достаточно описать родство, сроки, имущество и документы, которые уже есть."],
    ["Почему здесь показаны именно эти специалисты?", "Мы учитываем город, услугу, опыт по теме, специализацию и подтвержденные данные профиля."]
  ]),
  ...lawyers.slice(0, 10).flatMap((lawyer) =>
    makeFaqs("LAWYER", lawyer.id, [
      ["Что значит проверенный специалист?", "Сервис проверяет контакты, базовые сведения профиля и, для адвокатов, наличие статуса по открытым данным."],
      ["Что означают сигналы доверия?", "Сигналы доверия описывают проверенность и полноту профиля, опыт и качество публичных ответов. Они не являются рейтингом клиентов."],
      ["Когда появится рейтинг по отзывам?", "ReviewRating появится только после запуска проверки реального опыта обращения и модерации отзывов платформой."]
    ])
  ),
  ...articles.flatMap((article) =>
    makeFaqs("ARTICLE", article.id, [
      ["Нужна ли консультация после прочтения статьи?", "Статья помогает понять общий порядок действий, но для оценки рисков документов лучше показать ситуацию юристу."],
      ["Можно ли использовать материал как инструкцию для суда?", "Материал дает ориентир. Судебные документы должны учитывать факты, доказательства, сроки и местную практику."],
      ["Как связана статья с услугой?", `Материал относится к направлению «${article.service?.name ?? "юридическая помощь"}» и ведет на профильных специалистов.`]
    ])
  ),
  ...documentTemplates.flatMap((document) =>
    makeFaqs("DOCUMENT", document.id, [
      ["Можно ли использовать образец без юриста?", "Образец помогает понять структуру, но факты, доказательства, сроки и адресат должны быть адаптированы под вашу ситуацию."],
      ["Сколько стоит подготовка документа?", `Ориентир по подготовке документа юристом — от ${document.priceFrom.toLocaleString("ru-RU")} ₽.`],
      ["Что проверить перед подачей?", "Проверьте реквизиты сторон, требования, приложения, подпись, подсудность или адрес органа, куда направляется документ."]
    ])
  ),
  ...calculators.flatMap((calculator) =>
    makeFaqs("CALCULATOR", calculator.id, [
      ["Можно ли считать расчет окончательным?", "Калькулятор дает ориентир. Итоговая сумма зависит от документов, периода, ставок, судебной практики и позиции другой стороны."],
      ["Когда нужен юрист после расчета?", "Если расчет будет использоваться в претензии, иске или переговорах, юрист проверит формулу, доказательства и риски возражений."],
      ["Какие данные нужны?", "Обычно нужны сумма, даты, ставка или доход, подтверждающие документы и сведения о второй стороне."]
    ])
  ),
  ...makeFaqs("GENERAL", "home", [
    ["Сервис сам оказывает юридические услуги?", "Нет. Сервис помогает сравнить специалистов и передать вопрос выбранному юристу или адвокату."],
    ["Можно ли выбрать адвоката, а не юриста?", "Да. Если для ситуации важен статус адвоката, укажите это в вопросе: мы подберем специалистов с подходящим статусом и опытом."],
    ["Можно ли сузить подбор юристов под мою задачу?", "Да. Вы можете выбрать город, услугу, формат консультации, стоимость, стаж и статус специалиста. Если критериев много, удобнее описать ситуацию в вопросе."]
  ])
];

export const staticPages: StaticPage[] = [
  {
    slug: "kak-proveryaem-yuristov",
    title: "Как мы проверяем юристов — документы, контакты, статус адвоката",
    description: "Рассказываем, как сервис проверяет профили юристов и адвокатов, какие данные подтверждены и как пользователь может пожаловаться.",
    h1: "Как проверяются юристы",
    body: [
      "Проверка профиля нужна, чтобы пользователь видел не только рекламное описание, но и понятные признаки доверия: подтвержденные контакты, сведения об образовании, статус адвоката и историю активности на сервисе.",
      "Мы разделяем данные, предоставленные специалистом, и данные, которые прошли модерацию. Это помогает честно показывать уровень проверки и не создавать ложное ощущение гарантии результата."
    ],
    bullets: ["Проверяем контакты и доступные каналы связи", "Отдельно отмечаем подтвержденный статус адвоката", "Модерируем жалобы пользователей и спорные данные", "Показываем, какие сведения предоставлены самим специалистом"],
    cta: "Подобрать проверенного юриста",
    isIndexable: true
  },
  {
    slug: "kak-rabotaet-rejting",
    title: "Методология доверия — сигналы проверки профиля",
    description: "Как платформа разделяет проверенность профиля, активность юриста и будущий ReviewRating.",
    h1: "Методология доверия",
    body: [
      "На MVP платформа не публикует рейтинг юристов, топы или сортировку по отзывам.",
      "ReviewRating появится только после реальных отзывов, подтвержденных платформой и прошедших модерацию. Пока пользователю помогают специализация, опыт, проверенность профиля и публичные ответы."
    ],
    bullets: ["Релевантность услуге и городу", "Проверенные данные профиля", "Публичные ответы", "Полнота профиля", "Отсутствие нарушений"],
    cta: "Задать вопрос",
    isIndexable: false
  },
  {
    slug: "pravila-otzyvov",
    title: "Правила отзывов о юристах — модерация и жалобы",
    description: "Какие отзывы публикуются, почему отзыв может быть отклонен и как пользователь или юрист может пожаловаться на материал.",
    h1: "Правила отзывов",
    body: [
      "Отзывы рассматриваются как пользовательские материалы и проходят модерацию. До запуска проверки реального опыта они не формируют публичный рейтинг юристов.",
      "Юрист может оспорить отзыв, если он содержит фактическую ошибку или персональные данные третьих лиц."
    ],
    bullets: ["Не публикуем спам и рекламу", "Скрываем персональные данные третьих лиц", "Даем возможность пожаловаться", "Не удаляем отзыв только из-за негативной оценки"],
    cta: "Задать вопрос",
    isIndexable: true
  },
  {
    slug: "redakcionnaya-politika",
    title: "Редакционная политика юридического сервиса",
    description: "Как мы готовим юридические материалы, обновляем статьи и отделяем справочную информацию от индивидуальной консультации.",
    h1: "Редакционная политика",
    body: [
      "Материалы сервиса помогают разобраться в типовых юридических ситуациях, но не заменяют индивидуальную консультацию. Мы связываем статьи с услугами, обновляем даты и добавляем ссылки на профильных специалистов.",
      "Редакционный подход помогает держать материалы полезными: у публикации должен быть автор, дата обновления, понятная структура, ответы на частые вопросы и связь с юридической услугой."
    ],
    bullets: ["Статьи привязаны к услугам", "Указываем автора и дату обновления", "Добавляем практические блоки и FAQ", "Отделяем общую информацию от консультации"],
    cta: "Читать статьи",
    isIndexable: true
  },
  {
    slug: "garantii",
    title: "Гарантии сервиса — прозрачный подбор юристов",
    description: "Что гарантирует сервис поиска юристов, где границы ответственности и как мы помогаем пользователю выбрать специалиста.",
    h1: "Гарантии сервиса",
    body: [
      "Мы гарантируем прозрачный процесс подбора: вопрос сохраняется, профиль специалиста содержит проверяемые сведения, а пользователь видит специализацию, опыт и ориентир стоимости до обращения.",
      "Сервис не обещает исход дела, потому что юридический результат зависит от фактов, доказательств, сроков и позиции другой стороны."
    ],
    bullets: ["Понятная вопрос и источник обращения", "Прозрачные профили специалистов", "Модерация отзывов и жалоб", "Честное описание границ ответственности"],
    cta: "Начать подбор",
    isIndexable: true
  },
  {
    slug: "kak-pozhalovatsya-na-yurista",
    title: "Как пожаловаться на юриста — порядок обращения и модерация",
    description: "Как пользователь может пожаловаться на юриста, какие данные приложить и как сервис рассматривает спорные профили и отзывы.",
    h1: "Как пожаловаться на юриста",
    body: [
      "Жалоба помогает поддерживать качество сервиса: мы проверяем спорные контакты, неподтвержденные сведения, рекламные ответы без пользы и отзывы, которые нарушают правила.",
      "Для проверки обычно нужны ссылка на профиль, описание ситуации, дата контакта и документы или переписка, если они подтверждают проблему."
    ],
    bullets: ["Фиксируем обращение пользователя", "Проверяем профиль и спорный контент", "Можем скрыть отзыв, ответ или профиль до проверки", "Сохраняем историю модерации"],
    cta: "Сообщить о проблеме",
    isIndexable: true
  },
  {
    slug: "yuristam",
    title: "Юристам — получайте клиентов из поиска и вопросов",
    description: "Создайте профиль юриста, подтвердите опыт и получайте вопросы от пользователей, которые уже описали правовую проблему.",
    h1: "Юристам: получайте клиентов из поиска и вопросов",
    body: [
      "Профиль специалиста работает как посадочная страница: показывает опыт, услуги, города, ориентир стоимости, ответы на вопросы и подтвержденные данные.",
      "Вопросы приходят с контекстом: город, услуга, описание проблемы и желаемый формат консультации. Это экономит время на первичном уточнении."
    ],
    bullets: ["Профиль в тематических разделах", "Вопросы с описанием проблемы", "Блоки доверия и проверок", "Публичные ответы помогают пользователю выбрать специалиста"],
    cta: "Создать профиль",
    isIndexable: true
  }
];

const rawSeoPages: SeoPage[] = [
  {
    id: "seo-home",
    type: "HOME",
    slug: "",
    title: "Поиск юриста под вашу ситуацию — проверенные профили",
    description:
      "Опишите юридическую проблему и сравните профили юристов по опыту, специализации, подтвержденным сведениям и формату консультации.",
    h1: "Подберите проверенного юриста под вашу ситуацию",
    seoText:
      "ПравоПоиск помогает начать не с бесконечного каталога, а с конкретной ситуации. Опишите вопрос, выберите город и тему, а сервис покажет специалистов по опыту, ответам и релевантности задачи.",
    canonical: "/",
    isIndexable: true
  },
  ...cities.map((city) => citySeoPage(city)),
  ...services.map((item) => serviceSeoPage(item)),
  cityServiceSeoPage(cities[0], services[4]),
  ...staticPages.map((page) => ({
    id: `seo-static-${page.slug}`,
    type: "STATIC" as const,
    slug: page.slug,
    title: page.title,
    description: page.description,
    h1: page.h1,
    seoText: page.body.join("\n\n"),
    canonical: `/${page.slug}/`,
    isIndexable: page.isIndexable
  })),
  ...documentTemplates.map((document) => ({
    id: `seo-document-${document.slug}`,
    type: "DOCUMENT" as const,
    slug: `documents/${document.slug}`,
    serviceId: document.serviceId,
    title: `${document.title} — образец, правила составления, помощь юриста`,
    description: `${document.description} Когда используется, структура, частые ошибки, сроки и стоимость подготовки юристом.`,
    h1: document.title,
    seoText: document.content,
    canonical: `/documents/${document.slug}/`,
    isIndexable: document.isIndexable
  })),
  ...calculators.map((calculator) => ({
    id: `seo-calculator-${calculator.slug}`,
    type: "CALCULATOR" as const,
    slug: `calculators/${calculator.slug}`,
    serviceId: calculator.serviceId,
    title: `Калькулятор ${calculator.title} — расчет онлайн и консультация юриста`,
    description: `${calculator.description} Формула, пример расчета, FAQ и помощь юриста для точной проверки.`,
    h1: `Калькулятор ${calculator.title}`,
    seoText: `${calculator.description}\n\nФормула: ${calculator.formula}\n\nПример: ${calculator.example}`,
    canonical: `/calculators/${calculator.slug}/`,
    isIndexable: calculator.isIndexable
  })),
  ...cases.map((caseItem) => ({
    id: `seo-case-${caseItem.slug}`,
    type: "CASE" as const,
    slug: `cases/${caseItem.slug}`,
    cityId: caseItem.cityId,
    serviceId: caseItem.serviceId,
    lawyerId: caseItem.lawyerId,
    title: `${caseItem.title} — кейс юриста`,
    description: `${caseItem.situation} Действия юриста, подготовленные документы, результат и срок решения.`,
    h1: caseItem.title,
    seoText: `${caseItem.problem}\n\n${caseItem.lawyerActions}\n\n${caseItem.result}`,
    canonical: `/cases/${caseItem.slug}/`,
    isIndexable: caseItem.isIndexable
  }))
];

export const seoPages: SeoPage[] = rawSeoPages.map(enrichSeoPage);

export function getFullName(lawyer: Pick<Lawyer, "lastName" | "firstName" | "middleName">) {
  return [lawyer.lastName, lawyer.firstName, lawyer.middleName].filter(Boolean).join(" ");
}

export function getStatusLabel(status: LawyerStatus) {
  return status === "ADVOCATE" ? "адвокат" : "юрист";
}

export function getInitials(lawyer: Pick<Lawyer, "firstName" | "lastName">) {
  return `${lawyer.firstName[0]}${lawyer.lastName[0]}`;
}

function service(id: string, name: string, slug: string, shortDescription: string, parentId: string | null = null): Service {
  return {
    id,
    name,
    slug,
    shortDescription,
    fullDescription:
      `${shortDescription} Юрист помогает оценить перспективы, подготовить документы, выстроить переговоры и при необходимости представить интересы в суде.`,
    isActive: true,
    parentId
  };
}

function enrichSeoPage(page: SeoPage): SeoPage {
  const seoText = ensureSeoTextDepth(page);
  const score =
    (page.title ? 10 : 0) +
    (page.description ? 10 : 0) +
    (page.h1 ? 10 : 0) +
    (seoText.length >= 1500 ? 10 : seoText.length >= 900 ? 8 : seoText.length >= 180 ? 6 : 0) +
    10 +
    10 +
    10 +
    10 +
    10 +
    10;

  return {
    ...page,
    seoText,
    robots: page.isIndexable ? "index, follow" : "noindex, follow",
    seoScore: Math.min(score, 100),
    seoMaturity: page.isIndexable ? "READY_FOR_INDEX" : "COLLECTING_DATA",
    primaryKeyword: page.h1.toLowerCase()
  };
}

function ensureSeoTextDepth(page: SeoPage) {
  if (page.seoText.trim().length >= 900) return page.seoText;

  return `${page.seoText}

${page.h1}: здесь собрана практическая информация для человека, который хочет решить юридическую проблему без лишних шагов. Пользователь должен быстро понять, с какой ситуацией можно обратиться, какие документы подготовить, какие сроки и риски проверить заранее, как сравнить специалистов по опыту, специализации, ориентиру стоимости и формату консультации.

Перед обращением полезно кратко записать суть конфликта, даты ключевых событий, суммы требований, данные второй стороны и список имеющихся документов. Это помогает юристу быстрее оценить перспективы, предупредить о рисках и предложить следующий шаг: консультацию, подготовку претензии, составление иска, проверку договора или представительство в суде.

Страница помогает пройти понятный маршрут: проблема -> объяснение -> сроки -> документы -> риски -> цена -> юрист по теме -> вопрос. Если ситуация срочная, не откладывайте обращение: пропуск срока, неверно составленный документ или необдуманные переговоры могут ухудшить позицию.`;
}

function makeDocument(id: string, title: string, slug: string, serviceItem: Service): DocumentTemplate {
  return {
    id,
    title,
    slug,
    description: `${title}: когда нужен документ, какие данные указать и как избежать ошибок при подаче.`,
    serviceId: serviceItem.id,
    content:
      `${title} нужен, когда требуется зафиксировать позицию, требования и доказательства по направлению «${serviceItem.name}». Документ должен учитывать адресата, сроки, приложения, правовую основу и последствия ошибки.\n\nПеред подготовкой важно собрать факты, переписку, договоры, платежи, уведомления и иные доказательства. Юрист проверит, достаточно ли документов для подачи и какие требования лучше заявлять.`,
    structure: ["Адресат", "Данные сторон", "Факты", "Правовая позиция", "Требования", "Приложения", "Подпись"],
    commonMistakes: ["Неверный адресат", "Нет доказательств", "Не указаны сроки", "Слишком общие требования"],
    priceFrom: 3500,
    isIndexable: true,
    seoScore: 90,
    seoMaturity: "READY_FOR_INDEX"
  };
}

function makeCalculator(id: string, title: string, slug: string, serviceItem: Service, formula: string): Calculator {
  return {
    id,
    title,
    slug,
    description: `Онлайн-расчет по теме «${title}» помогает получить ориентир перед консультацией и подготовкой документов.`,
    formula,
    example: "Если сумма требований 100 000 ₽, а период просрочки 30 дней, итог зависит от применимой ставки и подтверждающих документов.",
    serviceId: serviceItem.id,
    isIndexable: true,
    seoScore: 88,
    seoMaturity: "READY_FOR_INDEX"
  };
}

function makeCase(id: string, title: string, slug: string, serviceItem: Service, city: City, lawyer: Lawyer): CaseItem {
  return {
    id,
    title,
    slug,
    situation: `Клиент из города ${city.name} обратился по направлению «${serviceItem.name}».`,
    problem: "Нужно было быстро оценить сроки, подготовить документы и снизить риск отказа.",
    lawyerActions: "Юрист изучил документы, подготовил правовую позицию, составил заявление и сопроводил переговоры.",
    documentsPrepared: "Заявление, правовая позиция, подборка доказательств и сопроводительные документы.",
    result: "Вопрос решен без раскрытия персональных данных клиента; результат подтверждает релевантный опыт специалиста.",
    duration: "3 недели",
    clientReview: null,
    serviceId: serviceItem.id,
    cityId: city.id,
    lawyerId: lawyer.id,
    isAnonymized: true,
    isIndexable: true,
    seoScore: 86,
    seoMaturity: "READY_FOR_INDEX"
  };
}

function makeChecklist(id: string, title: string, slug: string, serviceItem: Service, items: string[]): LegalChecklist {
  return {
    id,
    title,
    slug,
    items,
    serviceId: serviceItem.id,
    isIndexable: true,
    seoScore: 84,
    seoMaturity: "READY_FOR_INDEX"
  };
}

function makeVideoPage(id: string, title: string, slug: string, serviceItem: Service, lawyer: Lawyer): VideoPage {
  return {
    id,
    title,
    slug,
    description: `${title}: объяснение юриста, порядок действий, документы, сроки, риски и следующий шаг.`,
    transcript:
      `В этом видео юрист объясняет, когда возникает ситуация «${title}», какие документы подготовить, какие сроки нельзя пропустить и когда лучше не действовать самостоятельно.\n\n` +
      `Материал связан с направлением «${serviceItem.name}» и не заменяет индивидуальную консультацию: детали документов, региональная практика и процессуальные сроки могут изменить стратегию.`,
    timestamps: ["00:00 Суть проблемы", "01:20 Документы", "03:10 Сроки", "05:00 Ошибки", "06:30 Когда нужен юрист"],
    relatedServiceId: serviceItem.id,
    relatedLawyerId: lawyer.id,
    isIndexable: true,
    seoScore: 82,
    seoMaturity: "READY_FOR_INDEX"
  };
}

function makeScenario(id: string, title: string, slug: string, serviceItem: Service): LegalScenario {
  return {
    id,
    title,
    slug,
    problem: `Ситуация «${title}» требует быстро оценить сроки, доказательства, риски и возможные последствия.`,
    explanation:
      `Сначала нужно зафиксировать факты, собрать документы и понять, какой способ защиты подходит: переговоры, претензия, жалоба, иск или срочное обращение к юристу. Сценарий связан с направлением «${serviceItem.name}».`,
    deadlines:
      "Срок зависит от категории дела. Для трудовых споров и обжалований он может быть коротким, поэтому дату события лучше зафиксировать сразу.",
    documents: ["Документы, подтверждающие событие", "Переписка", "Платежные документы", "Уведомления", "Черновик требований"],
    risks: ["Пропуск срока", "Недостаток доказательств", "Неверный адресат жалобы", "Подписание невыгодного документа"],
    serviceId: serviceItem.id,
    isIndexable: true,
    seoScore: 86,
    seoMaturity: "READY_FOR_INDEX"
  };
}

function makeNextBestAction(
  id: string,
  pageType: NextBestAction["pageType"],
  serviceItem: Service | null,
  city: City | null,
  title: string,
  url: string
): NextBestAction {
  return {
    id,
    pageType,
    serviceId: serviceItem?.id ?? null,
    cityId: city?.id ?? null,
    actionType: "CTA",
    title,
    url,
    priority: 90
  };
}

function makeArticle(id: string, title: string, slug: string, serviceItem: Service, author: Lawyer): Article {
  return {
    id,
    title,
    slug,
    excerpt:
      `Практический разбор по теме «${serviceItem.name}»: сроки, документы, типичные ошибки и когда стоит обратиться к юристу.`,
    content:
      `Материал помогает понять общий порядок действий по направлению «${serviceItem.name}». Сначала важно собрать документы и зафиксировать сроки. Затем юрист оценивает правовую позицию, риски переговоров и перспективу судебного спора.\n\nДля пользователя полезно заранее подготовить договоры, переписку, платежные документы, уведомления и судебные акты, если они уже есть. Это ускоряет консультацию и позволяет точнее назвать стоимость работы.\n\nЕсли ситуация связана с деньгами, недвижимостью, детьми, уголовным риском или процессуальными сроками, лучше не ограничиваться самостоятельным поиском шаблонов. Ошибка в первом документе часто влияет на дальнейшую позицию.`,
    shortAnswer: `По теме «${serviceItem.name}» сначала фиксируют факты, сроки и документы, затем выбирают стратегию: консультация, претензия, переговоры или суд.`,
    importantPoints: ["Проверьте сроки", "Соберите доказательства", "Не отправляйте спорные документы без проверки"],
    steps: ["Описать ситуацию", "Подготовить документы", "Задать вопрос", "Выбрать способ защиты"],
    documents: ["Договоры", "Переписка", "Платежные документы", "Уведомления"],
    deadlines: ["Срок зависит от категории дела и процессуального статуса"],
    prices: ["Первичная консультация обычно стоит от 1500 ₽"],
    risks: ["Пропуск срока", "Неверное требование", "Недостаток доказательств"],
    mistakes: ["Использование неподходящего шаблона", "Отправка документа не тому адресату"],
    serviceId: serviceItem.id,
    cityId: null,
    authorId: author.id,
    authorName: getFullName(author),
    reviewedByLawyerId: author.id,
    reviewedByLawyerName: getFullName(author),
    status: "APPROVED",
    isIndexable: true,
    contentFreshness: "FRESH",
    publishedAt: new Date(Date.UTC(2026, 3, 15)).toISOString(),
    reviewedAt: new Date(Date.UTC(2026, 4, 12)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, 4, 12)).toISOString(),
    service: serviceItem,
    city: null
  };
}

function makePublishedQuestion(input: {
  id: string;
  publicNumber: string;
  slug: string;
  title: string;
  category: string;
  city: City;
  serviceItem: Service;
  authorName: string;
  authorType: "USER" | "GUEST";
  publishedAt: string;
  viewsCount: number;
  questionText: string;
  shortPreview: string;
  tags: string[];
  lawyer: Lawyer;
  answerPublishedAt: string;
  answerText: string;
}): Question {
  const summary = input.shortPreview;

  return {
    id: input.id,
    publicNumber: input.publicNumber,
    title: input.title,
    slug: input.slug,
    text: input.questionText,
    questionText: input.questionText,
    cityId: input.city.id,
    serviceId: input.serviceItem.id,
    userName: input.authorName,
    authorType: input.authorType,
    summary,
    shortPreview: input.shortPreview,
    category: input.category,
    tags: input.tags,
    status: "PUBLISHED",
    moderationStatus: "APPROVED",
    qualityStatus: "APPROVED",
    isIndexable: true,
    isDuplicate: false,
    trustScore: 90,
    viewsCount: input.viewsCount,
    answersCount: 1,
    publishedAt: input.publishedAt,
    createdAt: input.publishedAt,
    city: input.city,
    service: input.serviceItem,
    answers: [
      {
        id: `answer-${input.id}-1`,
        questionId: input.id,
        lawyerId: input.lawyer.id,
        lawyerName: getFullName(input.lawyer),
        lawyerSlug: input.lawyer.slug,
        lawyerCity: input.lawyer.cities[0]?.name ?? input.city.name,
        lawyerSpecialization: input.serviceItem.name,
        lawyerExperienceYears: input.lawyer.experienceYears,
        lawyerProfileStatus: "VERIFIED",
        text: input.answerText,
        answerText: input.answerText,
        authorType: "LAWYER",
        status: "PUBLISHED",
        answerStatus: "PUBLISHED",
        moderationStatus: "APPROVED",
        qualityStatus: "APPROVED",
        answerQualityScore: 88,
        helpfulCount: 7,
        containsContactAttempt: false,
        publishedByAdmin: true,
        isModerated: true,
        publishedAt: input.answerPublishedAt,
        createdAt: input.answerPublishedAt
      }
    ]
  };
}

function makeFaqs(entityType: FaqEntityType, entityId: string, rows: [string, string][]): FaqItem[] {
  return rows.map(([question, answer], index) => ({
    id: `faq-${entityType.toLowerCase()}-${entityId}-${index}`,
    question,
    answer,
    entityType,
    entityId,
    sortOrder: index
  }));
}

function citySeoPage(city: City): SeoPage {
  return {
    id: `seo-city-${city.slug}`,
    type: "CITY",
    slug: city.slug,
    cityId: city.id,
    title: `Юристы в ${city.namePrepositional} — консультация и подбор`,
    description: `Подберите юриста в ${city.namePrepositional}. Сравните специализацию, опыт, подтвержденные сведения профиля и формат работы.`,
    h1: `Юристы в ${city.namePrepositional}`,
    seoText: city.seoText,
    canonical: `/${city.slug}/`,
    isIndexable: city.isActive
  };
}

function serviceSeoPage(item: Service): SeoPage {
  return {
    id: `seo-service-${item.slug}`,
    type: "SERVICE",
    slug: item.slug,
    serviceId: item.id,
    title: `${item.name} — консультация юриста`,
    description: `Получите помощь по направлению «${item.name}». Сравните специализацию, опыт, подтвержденные сведения профиля и формат работы.`,
    h1: `Юристы по направлению «${item.name}»`,
    seoText: item.fullDescription,
    canonical: `/${item.slug}/`,
    isIndexable: item.isActive
  };
}

function cityServiceSeoPage(city: City, item: Service): SeoPage {
  return {
    id: `seo-city-service-${city.slug}-${item.slug}`,
    type: "CITY_SERVICE",
    slug: `${city.slug}/${item.slug}`,
    cityId: city.id,
    serviceId: item.id,
    title: `${item.name} в ${city.namePrepositional} — юристы и консультация`,
    description: `Подберите юриста по направлению «${item.name}» в ${city.namePrepositional}. Сравните специализацию, опыт, подтвержденные сведения профиля и формат работы.`,
    h1: `Юристы по направлению «${item.name}» в ${city.namePrepositional}`,
    seoText:
      `Страница объединяет город и конкретную юридическую проблему: ${item.name.toLowerCase()} в ${city.namePrepositional}. Мы показываем специалистов, которые работают с этой темой, объясняем типовые вопросы, документы, стоимость консультации и критерии выбора. Пользователь может уточнить формат помощи и оставить вопрос через платформу.`,
    canonical: `/${city.slug}/${item.slug}/`,
    isIndexable: true
  };
}
