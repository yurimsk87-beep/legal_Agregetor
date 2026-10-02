import type { RelatedQuestionsContext } from "@/lib/related-questions";

const ZAGS_PRIMARY_TAGS = [
  "хочу зарегистрировать брак",
  "как подать заявление в загс",
  "как зарегистрировать брак быстрее",
  "сменить фамилию после свадьбы",
  "сменить имя",
  "потерял свидетельство о браке",
  "получить справку о браке после развода",
  "исправить ошибку в свидетельстве",
  "загс отказал"
];

const ZAGS_EXCLUDED_TOPICS = [
  "алименты",
  "раздел имущества",
  "порядок общения с ребенком",
  "место жительства ребенка",
  "лишение родительских прав",
  "расторжение брака",
  "развод через суд",
  "ребен"
];

export type ProblemQnaContext = {
  aliases: string[];
  excludedTopics: string[];
  candidatePhrases?: string[];
  requiredTopicGroups?: string[][];
};

export const PROBLEM_QNA_CONTEXTS: Record<string, ProblemQnaContext> = {
  "brak-zags-i-smena-familii": {
    aliases: ZAGS_PRIMARY_TAGS,
    excludedTopics: ZAGS_EXCLUDED_TOPICS
  },
  "razvod-i-razdel-imushchestva": {
    aliases: ["хочу развестись", "как подать на развод", "поделить имущество после развода", "разделить ипотеку при разводе"],
    excludedTopics: ["алименты на ребёнка", "лишение родительских прав", "установление отцовства", "опека над ребёнком"]
  },
  "opeka-i-popechitelstvo-nad-rebenkom": {
    aliases: ["оформить опеку над ребёнком", "временная опека у родственника", "разрешение опеки на сделку", "жалоба на орган опеки"],
    excludedTopics: ["опека над совершеннолетним", "недееспособность взрослого", "усыновление ребёнка"]
  },
  "roditeli-i-rebenok-posle-razvoda": {
    aliases: ["с кем останется ребёнок", "отец не даёт видеть ребёнка", "мать не даёт общаться с ребёнком", "изменить порядок общения"],
    excludedTopics: ["общение бабушки с внуком", "лишение родительских прав", "алименты на ребёнка"]
  },
  "alimenty-na-rebenka": {
    aliases: ["подать на алименты", "бывший муж не платит алименты", "увеличить алименты", "уменьшить алименты", "взыскать долг по алиментам"],
    excludedTopics: ["алименты супругу", "содержание родителей", "алименты после 18 лет"]
  },
  "lishenie-roditelskih-prav": {
    aliases: ["лишить отца родительских прав", "лишить мать родительских прав", "родитель не участвует в жизни ребёнка"],
    excludedTopics: ["ограничение родительских прав", "восстановление родительских прав", "оспорить отцовство"]
  },
  "ogranichenie-roditelskih-prav": {
    aliases: ["ограничить отца в родительских правах", "ограничить мать в родительских правах", "опасно оставлять ребёнка с родителем"],
    excludedTopics: ["лишение родительских прав", "отменить ограничение родительских прав"]
  },
  "ustanovlenie-otcovstva": {
    aliases: ["признать отцовство", "установить отцовство через суд", "отец ребёнка умер"],
    excludedTopics: ["оспорить отцовство", "исключить запись об отце"]
  },
  "osparivanie-otcovstva": {
    aliases: ["оспорить запись об отце", "я не отец ребёнка", "исключить отца из свидетельства"],
    excludedTopics: ["установить отцовство", "признать отцовство"]
  },
  "usynovlenie-rebenka": {
    aliases: ["усыновить ребёнка жены", "усыновить ребёнка мужа", "какие документы нужны для усыновления"],
    excludedTopics: ["оформить опеку", "приёмная семья", "эмансипация"]
  },
  "vyezd-rebenka-za-granitsu": {
    aliases: ["вывезти ребёнка за границу", "нужно ли согласие второго родителя", "запрет на выезд ребёнка"],
    excludedTopics: ["определить место жительства ребёнка", "переезд ребёнка к другому родителю"]
  },
  "imya-familiya-otchestvo-rebenka": {
    aliases: ["поменять фамилию ребёнку без согласия отца", "изменить имя ребёнка", "сменить отчество ребёнку"],
    excludedTopics: ["сменить фамилию после свадьбы", "перемена имени взрослого"]
  },
  "vosstanovlenie-v-roditelskih-pravah": {
    aliases: ["вернуть родительские права", "восстановиться в родительских правах", "вернуть ребёнка после лишения прав"],
    excludedTopics: ["лишение родительских прав", "отмена ограничения родительских прав"]
  },
  "otmena-ogranicheniya-roditelskih-prav": {
    aliases: [
      "снять ограничение родительских прав",
      "отменить ограничение прав",
      "отмене ограничения в родительских правах",
      "вернуть ребёнка после ограничения"
    ],
    excludedTopics: ["восстановление родительских прав", "лишение родительских прав"]
  },
  "raznoglasiya-roditeley-po-vospitaniyu-i-obrazovaniyu": {
    aliases: [
      "родители спорят о школе",
      "разногласия родителей по лечению",
      "спор родителей о воспитании",
      "менять школу без согласия отца",
      "выбрать школу без согласия",
      "сменить школу без согласия родителей"
    ],
    excludedTopics: ["порядок общения с ребёнком", "место жительства ребёнка"],
    candidatePhrases: ["менять школу", "сменить школу", "выбрать школу"],
    requiredTopicGroups: [
      ["школ", "образован", "лечен", "воспитан"],
      ["без согласия отца", "без согласия матери", "несогласие родителей", "разногласия родителей", "родители спорят"]
    ]
  },
  "dopolnitelnye-rashody-na-rebenka": {
    aliases: [
      "взыскать расходы на лечение ребёнка",
      "дополнительные расходы сверх алиментов",
      "дополнительные расходы на ребёнка",
      "оплатить реабилитацию ребёнка"
    ],
    excludedTopics: ["обычные алименты", "задолженность по алиментам"],
    candidatePhrases: ["расходы на лечение", "расходы на ребёнка", "дополнительные расходы", "расходы на обучение"],
    requiredTopicGroups: [
      ["ребен"],
      ["отец", "мать", "родител", "алимент"],
      ["расход"],
      ["взыск", "дополнительн"]
    ]
  },
  "soderzhanie-supruga-i-byvshego-supruga": {
    aliases: ["алименты на жену", "алименты на бывшую жену", "содержание нетрудоспособного супруга"],
    excludedTopics: ["алименты на ребёнка", "содержание родителей"]
  },
  "brachnyy-dogovor": {
    aliases: ["составить брачный договор", "изменить брачный договор", "расторгнуть брачный договор", "признать брачный договор недействительным"],
    excludedTopics: ["соглашение о разделе имущества", "раздел имущества без брачного договора"]
  },
  "priznanie-braka-nedeystvitelnym": {
    aliases: ["аннулировать брак", "фиктивный брак", "брак без добровольного согласия"],
    excludedTopics: ["расторгнуть брак", "развод через суд", "развод через загс"]
  },
  "slozhnye-imushchestvennye-spory-suprugov": {
    aliases: ["разделить общие долги супругов", "разделить ипотеку", "разделить бизнес супругов", "имущество супругов при банкротстве"],
    excludedTopics: ["обычный развод", "алименты", "брачный договор"]
  },
  "surrogatnoe-materinstvo-i-proiskhozhdenie-rebenka": {
    aliases: [
      "оформить ребёнка после суррогатного материнства",
      "суррогатного материнства",
      "суррогатной матерью",
      "согласие суррогатной матери",
      "запись родителей ребёнка"
    ],
    excludedTopics: ["усыновление ребёнка", "оспаривание отцовства"]
  },
  "mezhdunarodnye-semeynye-spory": {
    aliases: [
      "ребёнок находится за границей",
      "отец ребёнка живёт за границей",
      "ребёнок родился в другой стране",
      "иностранный гражданин в свидетельстве о рождении ребёнка",
      "признать иностранное решение по семейному делу",
      "взыскать алименты за границей"
    ],
    excludedTopics: ["обычный выезд ребёнка в отпуск", "туристическая поездка ребёнка"]
  },
  "obshchenie-rodstvennikov-s-rebenkom": {
    aliases: [
      "бабушке не дают видеть внука",
      "дедушке не дают общаться с ребёнком",
      "порядок общения внука с бабушкой",
      "общение ребёнка с бабушкой",
      "общение с внуком",
      "общение родственников с ребёнком"
    ],
    excludedTopics: ["общение отца с ребёнком", "общение матери с ребёнком"]
  },
  "emansipatsiya-nesovershennoletnego": {
    aliases: ["эмансипация", "получить полную дееспособность в 16 лет", "эмансипация через опеку", "эмансипация через суд"],
    excludedTopics: ["вступление в брак до 18 лет", "опека над ребёнком"]
  }
};

export const PROBLEM_EXCLUDED_TOPICS: Record<string, string[]> = Object.fromEntries(
  Object.entries(PROBLEM_QNA_CONTEXTS).map(([slug, context]) => [slug, context.excludedTopics])
);

export const PROBLEM_PRIMARY_TAGS: Record<string, string[]> = Object.fromEntries(
  Object.entries(PROBLEM_QNA_CONTEXTS).map(([slug, context]) => [slug, context.aliases])
);

export const CATEGORY_QUESTION_PHRASES: Record<string, string[]> = {
  "semeynoe-pravo": [...new Set(Object.values(PROBLEM_QNA_CONTEXTS).flatMap((context) => context.aliases))]
};

export function categoryQuestionPhrases(slug: string, fallback: string[]): string[] {
  return CATEGORY_QUESTION_PHRASES[slug] ?? fallback;
}

export function buildProblemQuestionContext(args: {
  slug: string;
  categoryTitle?: string;
  primaryTags: string[];
}): RelatedQuestionsContext {
  const excludedTopics = PROBLEM_EXCLUDED_TOPICS[args.slug] ?? [];
  const excludedLower = new Set(excludedTopics.map((topic) => topic.toLowerCase()));
  const aliases = PROBLEM_PRIMARY_TAGS[args.slug] ?? [];
  const explicitContext = PROBLEM_QNA_CONTEXTS[args.slug];
  const basePrimary = [...new Set([...args.primaryTags, ...aliases])];
  return {
    contextType: "problem",
    categoryName: args.categoryTitle,
    primaryTags: basePrimary.filter((tag) => !excludedLower.has(tag.toLowerCase())),
    searchPhrases: basePrimary,
    candidatePhrases: explicitContext?.candidatePhrases,
    requiredTopicGroups: explicitContext?.requiredTopicGroups,
    excludedTopics
  };
}

const DOCUMENT_INTENT_PHRASES = [
  "куда подавать",
  "какие документы приложить",
  "госпошлина",
  "срок подачи",
  "как заполнить",
  "официальный бланк",
  "что делать после подачи"
];

export const DOCUMENT_CONTEXT_OVERRIDES: Record<string, { primaryTags?: string[]; excludedTopics?: string[] }> = {
  "zayavlenie-v-zags": {
    primaryTags: [
      "заявление в загс",
      "заявление о заключении брака",
      "форма 7 загс",
      "форма 8 загс",
      "форма 20 перемена имени",
      "форма 23 исправить запись загс",
      "форма 26 повторное свидетельство",
      "справка о браке после развода"
    ],
    excludedTopics: ZAGS_EXCLUDED_TOPICS
  }
};

export function buildDocumentQuestionContext(args: {
  documentSlug: string;
  relatedPrimaryTags: string[];
  relatedExcludedTopics: string[];
}): RelatedQuestionsContext {
  const override = DOCUMENT_CONTEXT_OVERRIDES[args.documentSlug];
  return {
    contextType: "document",
    primaryTags: [...new Set([...(override?.primaryTags ?? args.relatedPrimaryTags), ...DOCUMENT_INTENT_PHRASES])],
    excludedTopics: [...new Set([...(override?.excludedTopics ?? args.relatedExcludedTopics)])]
  };
}
