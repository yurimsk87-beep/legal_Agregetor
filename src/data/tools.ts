export type NavigatorTool = {
  slug: string;
  title: string;
  description: string;
  status: "available" | "planned";
  relatedProblemSlugs: string[];
};

export const navigatorTools: NavigatorTool[] = [
  {
    slug: "sudebnyy-prikaz-deadline",
    title: "Калькулятор срока отмены судебного приказа",
    description: "Ориентировочно считает 10 дней со дня получения приказа, переносит выходной на понедельник и подсказывает следующий шаг.",
    status: "available",
    relatedProblemSlugs: []
  },
  {
    slug: "gosposhlina",
    title: "Калькулятор госпошлины",
    description: "Подскажет ориентир госпошлины для имущественных требований и судебных обращений.",
    status: "planned",
    relatedProblemSlugs: []
  },
  {
    slug: "kompensaciya-zaderzhki-zarplaty",
    title: "Калькулятор компенсации за задержку зарплаты",
    description: "Соберет даты и сумму долга, чтобы оценить компенсацию за задержку выплат.",
    status: "planned",
    relatedProblemSlugs: []
  },
  {
    slug: "generator-pretenzii",
    title: "Генератор претензии",
    description: "Соберет факты, требование, сроки и список приложений для претензии.",
    status: "planned",
    relatedProblemSlugs: []
  },
  {
    slug: "generator-zhaloby",
    title: "Генератор жалобы",
    description: "Поможет подготовить обращение в орган или организацию без лишних эмоций и контактов.",
    status: "planned",
    relatedProblemSlugs: []
  },
  {
    slug: "proverka-sudebnogo-prikaza",
    title: "Проверка судебного приказа",
    description: "Пошагово проверит суд, взыскателя, сумму, дату получения и возможные действия.",
    status: "planned",
    relatedProblemSlugs: []
  },
  {
    slug: "proverka-dokumenta",
    title: "Проверка документа",
    description: "Список вопросов, по которым юрист оценивает договор, претензию, иск или жалобу.",
    status: "planned",
    relatedProblemSlugs: []
  },
  {
    slug: "nuzhen-li-yurist",
    title: "Тест «нужен ли юрист»",
    description: "Поможет отличить ситуацию, где можно начать с документа, от дела с высоким риском.",
    status: "planned",
    relatedProblemSlugs: []
  }
];
