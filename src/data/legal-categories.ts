import targetProblemStructure from "../../docs/analytics/problems_target_structure.json";

export type LegalCategory = {
  slug: string;
  title: string;
  description: string;
  userProblem: string;
  questionTopics: string[];
  lawyerSpecializations: string[];
  legacySlugs?: string[];
};

type TargetCategory = {
  priority: number;
  title: string;
  slug: string;
  description: string;
  situations: Array<{ title: string }>;
};

type CategoryRelations = {
  legacySlugs?: string[];
  questionTopics: string[];
  lawyerSpecializations: string[];
};

const hiddenCategoryTitles = new Set(targetProblemStructure.doNotExposeCategories);

const categoryRelations: Record<string, CategoryRelations> = {
  "semya-i-deti": {
    legacySlugs: ["semya"],
    questionTopics: ["Алименты", "Заключение и расторжение брака", "Раздел имущества", "Семейное право"],
    lawyerSpecializations: ["Алименты", "Семейные споры", "Развод", "Раздел имущества"]
  },
  "zhile-nedvizhimost-i-zemlya": {
    legacySlugs: ["nedvizhimost"],
    questionTopics: ["Недвижимость", "Ипотека", "Жилищные вопросы", "Земельные вопросы", "ЖКХ"],
    lawyerSpecializations: ["Недвижимость", "Ипотека", "Жилищные споры", "Земельные споры", "ЖКХ"]
  },
  "voennaya-sluzhba-mobilizaciya-i-svo": {
    legacySlugs: ["voinskiy-uchet"],
    questionTopics: ["Военное право", "Защита прав призывников", "Социальные выплаты"],
    lawyerSpecializations: ["Военное право", "Защита прав призывников", "Социальные выплаты"]
  },
  "rabota-zarplata-i-trudovye-prava": {
    legacySlugs: ["rabota"],
    questionTopics: ["Трудовое право", "Составление документов"],
    lawyerSpecializations: ["Трудовые споры", "Составление документов"]
  },
  "dolgi-kredity-i-pristavy": {
    legacySlugs: ["dolgi", "pristavy"],
    questionTopics: [
      "Взыскание задолженности",
      "Банковское право",
      "Банкротство физических лиц",
      "Исполнительное производство",
      "Гражданские дела",
      "Арбитраж",
      "Составление документов"
    ],
    lawyerSpecializations: [
      "Кредиты и долги",
      "Банкротство физических лиц",
      "Исполнительное производство",
      "Банковское право",
      "Взыскание задолженности",
      "Гражданские дела",
      "Арбитражные споры"
    ]
  },
  "migraciya-grazhdanstvo-i-vezd-v-rf": {
    legacySlugs: ["migraciya"],
    questionTopics: ["Миграционное право"],
    lawyerSpecializations: ["Миграционное право"]
  },
  "pokupki-uslugi-i-zashchita-potrebiteley": {
    legacySlugs: ["pokupki-uslugi"],
    questionTopics: ["Защита прав потребителя", "Интернет-право", "Договорное право"],
    lawyerSpecializations: ["Защита прав потребителей", "Интернет-право", "Бизнес и договоры"]
  },
  "avto-dtp-shtrafy-i-transport": {
    legacySlugs: ["avto-shtrafy"],
    questionTopics: ["Автоюристы", "Административное право", "ДТП"],
    lawyerSpecializations: ["Автоюрист", "Административные дела", "ДТП"]
  },
  nasledstvo: {
    questionTopics: ["Наследство", "Доверенности нотариуса"],
    lawyerSpecializations: ["Наследственное право", "Нотариальные вопросы"]
  },
  "sud-zhaloby-i-zashchita-prav": {
    legacySlugs: ["sudy"],
    questionTopics: ["Гражданские дела", "Арбитраж", "Составление документов", "Административное право"],
    lawyerSpecializations: ["Гражданские дела", "Арбитражные споры", "Составление документов", "Административные дела"]
  },
  "pensii-posobiya-i-socialnye-vyplaty": {
    legacySlugs: ["socialnye-vyplaty"],
    questionTopics: ["Социальные выплаты", "Пенсионные споры", "Военное право"],
    lawyerSpecializations: ["Социальные выплаты", "Пенсионные споры", "Военное право"]
  },
  "zhkh-i-kommunalnye-uslugi": {
    legacySlugs: ["zhkh"],
    questionTopics: ["Жилищные вопросы", "ЖКХ", "Возмещение ущерба"],
    lawyerSpecializations: ["Жилищные споры", "ЖКХ", "Возмещение ущерба"]
  },
  "medicina-i-zdorove": {
    legacySlugs: ["medicina"],
    questionTopics: ["Медицинское право", "Возмещение ущерба"],
    lawyerSpecializations: ["Медицинское право", "Возмещение ущерба"]
  },
  obrazovanie: {
    questionTopics: ["Образование", "Составление документов"],
    lawyerSpecializations: ["Образование", "Составление документов"]
  },
  "biznes-ip-i-samozanyatye": {
    legacySlugs: ["biznes"],
    questionTopics: ["Бизнес и договоры", "Арбитраж", "Налоговое право", "Тендеры, контрактная система в сфере закупок"],
    lawyerSpecializations: ["Бизнес и договоры", "Арбитражные споры", "Налоговые споры", "Тендеры и закупки"]
  },
  "ugolovnye-i-administrativnye-riski": {
    legacySlugs: ["ugolovnye-riski"],
    questionTopics: ["Уголовное право", "Дела по наркотикам", "Административное право", "Возмещение ущерба"],
    lawyerSpecializations: ["Уголовные дела", "Дела по наркотикам", "Адвокат по уголовным делам", "Административные дела"]
  },
  "dokumenty-personalnye-dannye-i-gosuslugi": {
    questionTopics: ["Составление документов", "Интернет-право", "Доверенности нотариуса"],
    lawyerSpecializations: ["Составление документов", "Интернет-право", "Нотариальные вопросы"]
  }
};

export const legalCategories: LegalCategory[] = (targetProblemStructure.categories as TargetCategory[])
  .filter((category) => !hiddenCategoryTitles.has(category.title))
  .sort((a, b) => a.priority - b.priority)
  .map((category) => {
    const relations = categoryRelations[category.slug] ?? { questionTopics: [], lawyerSpecializations: [] };
    const examples = category.situations.slice(0, 5).map((situation) => situation.title.toLowerCase());

    return {
      slug: category.slug,
      title: category.title,
      description: category.description,
      userProblem: examples.length
        ? `Выберите похожую ситуацию: ${examples.join(", ")}.`
        : "Выберите похожую жизненную ситуацию и проверьте сроки, риски и документы.",
      questionTopics: relations.questionTopics,
      lawyerSpecializations: relations.lawyerSpecializations,
      legacySlugs: relations.legacySlugs
    };
  });

const categoryAliases = new Map<string, string>();

for (const category of legalCategories) {
  categoryAliases.set(category.slug, category.slug);
  for (const legacySlug of category.legacySlugs ?? []) {
    categoryAliases.set(legacySlug, category.slug);
  }
}

export function normalizeLegalCategorySlug(slug: string) {
  return categoryAliases.get(slug) ?? slug;
}

export function getLegalCategory(slug: string) {
  const normalizedSlug = normalizeLegalCategorySlug(slug);
  return legalCategories.find((category) => category.slug === normalizedSlug) ?? null;
}
