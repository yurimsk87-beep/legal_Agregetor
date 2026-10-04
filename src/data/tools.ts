export type NavigatorTool = {
  slug: string;
  title: string;
  description: string;
  status: "available" | "planned";
  relatedProblemSlugs: string[];
};

export const navigatorTools: NavigatorTool[] = [
  { slug: "family-state-duty", title: "Госпошлина по семейному спору", description: "Предварительный расчёт федеральной госпошлины.", status: "available", relatedProblemSlugs: ["razvod-i-razdel-imushchestva"] },
  { slug: "claim-price", title: "Цена иска", description: "Предварительная сумма оцениваемых требований.", status: "available", relatedProblemSlugs: ["razvod-i-razdel-imushchestva"] },
  { slug: "alimony-shares", title: "Доли алиментов", description: "Ориентир долевого взыскания на детей.", status: "available", relatedProblemSlugs: ["alimenty-na-detey"] },
  { slug: "alimony-debt-estimate", title: "Задолженность по алиментам", description: "Предварительная арифметика начислений и выплат.", status: "available", relatedProblemSlugs: ["dolg-po-alimentam"] },
  { slug: "notary-costs", title: "Расходы у нотариуса", description: "Официальная проверка федерального и регионального тарифа.", status: "available", relatedProblemSlugs: ["brachnyy-dogovor"] },
  { slug: "court-finder", title: "Найти суд", description: "Официальный поиск территориальной подсудности.", status: "available", relatedProblemSlugs: [] },
  { slug: "order-or-claim", title: "Судебный приказ или иск", description: "Проверка процессуального пути по алиментам.", status: "available", relatedProblemSlugs: ["alimenty-na-detey"] },
  { slug: "family-document-check", title: "Проверка комплекта документов", description: "Общий чек-лист перед подачей.", status: "available", relatedProblemSlugs: [] },
  { slug: "where-to-file", title: "Куда обращаться", description: "ЗАГС, нотариус или суд без угадывания органа.", status: "available", relatedProblemSlugs: [] },
  {
    slug: "sudebnyy-prikaz-deadline",
    title: "Калькулятор срока отмены судебного приказа",
    description: "Ориентировочно считает 10 дней со дня получения приказа, переносит выходной на понедельник и подсказывает следующий шаг.",
    status: "available",
    relatedProblemSlugs: ["sudebnyy-prikaz"]
  },
  {
    slug: "gosposhlina",
    title: "Калькулятор госпошлины",
    description: "Подскажет ориентир госпошлины для имущественных требований и судебных обращений.",
    status: "planned",
    relatedProblemSlugs: ["dolg-po-dogovoru", "podat-vozrazheniya-v-sud"]
  },
  {
    slug: "kompensaciya-zaderzhki-zarplaty",
    title: "Калькулятор компенсации за задержку зарплаты",
    description: "Соберет даты и сумму долга, чтобы оценить компенсацию за задержку выплат.",
    status: "planned",
    relatedProblemSlugs: ["ne-vyplatili-zarplatu"]
  },
  {
    slug: "generator-pretenzii",
    title: "Генератор претензии",
    description: "Соберет факты, требование, сроки и список приложений для претензии.",
    status: "planned",
    relatedProblemSlugs: ["vernut-dengi-za-tovar", "dolg-po-dogovoru", "zatopili-sosedi"]
  },
  {
    slug: "generator-zhaloby",
    title: "Генератор жалобы",
    description: "Поможет подготовить обращение в орган или организацию без лишних эмоций и контактов.",
    status: "planned",
    relatedProblemSlugs: ["otkaz-v-posobii", "spisali-dengi-pristavy", "reshenie-vvk"]
  },
  {
    slug: "proverka-sudebnogo-prikaza",
    title: "Проверка судебного приказа",
    description: "Пошагово проверит суд, взыскателя, сумму, дату получения и возможные действия.",
    status: "planned",
    relatedProblemSlugs: ["sudebnyy-prikaz"]
  },
  {
    slug: "proverka-dokumenta",
    title: "Проверка документа",
    description: "Список вопросов, по которым юрист оценивает договор, претензию, иск или жалобу.",
    status: "planned",
    relatedProblemSlugs: ["pokupka-kvartiry-s-matkapitalom", "dolg-po-dogovoru"]
  },
  {
    slug: "nuzhen-li-yurist",
    title: "Тест «нужен ли юрист»",
    description: "Поможет отличить ситуацию, где можно начать с документа, от дела с высоким риском.",
    status: "planned",
    relatedProblemSlugs: ["reshenie-vvk", "nekachestvennoe-lechenie", "podat-vozrazheniya-v-sud"]
  }
];
