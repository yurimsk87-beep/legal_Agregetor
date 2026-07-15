export type LawyerProfileDraft = {
  fullName: string;
  slug: string;
  photoUrl?: string;
  coverUrl?: string;
  city: string;
  region: string;
  legalStatus: string;
  experienceYears: number;
  headline: string;
  cardDescription: string;
  primarySpecializations: string[];
  additionalSpecializations: string[];
  workFormats: string[];
  about: string;
  helpWith: string;
  caseTypes: string;
  consultationProcess: string;
  advantages: string;
  clientPreparation: string;
  experience: WorkExperienceItem[];
  education: EducationItem[];
  services: ProfileServiceItem[];
  courtCases: CourtCaseItem[];
  visibility: Record<string, boolean>;
};

export type WorkExperienceItem = {
  id: string;
  startDate: string;
  endDate: string;
  current: boolean;
  position: string;
  organization: string;
  city: string;
  description: string;
};

export type EducationItem = {
  id: string;
  institution: string;
  faculty: string;
  specialty: string;
  qualification: string;
  graduationYear: string;
  description: string;
};

export type ProfileServiceItem = {
  id: string;
  title: string;
  description: string;
  priceType: string;
  priceFrom: string;
  priceTo: string;
  fixedPrice: string;
};

export type CourtCaseItem = {
  id: string;
  title: string;
  caseNumber: string;
  court: string;
  category: string;
  year: string;
  result: string;
  description: string;
  sourceUrl: string;
};

export const specializationOptions = [
  "Семейное право",
  "Жилищное право",
  "Трудовое право",
  "Наследственное право",
  "Защита прав потребителей",
  "Банкротство физических лиц",
  "Военное право",
  "Медицинское право",
  "Земельные споры",
  "Взыскание задолженности",
  "Гражданские дела",
  "Уголовные дела",
  "Административное право",
  "Арбитраж",
  "Автоюрист",
  "Миграционное право",
  "Налоговое право",
  "Интеллектуальная собственность"
];

export const workFormatOptions = [
  "Бесплатная первичная консультация",
  "Онлайн-консультация",
  "Очная встреча",
  "Прием по записи",
  "Срочная помощь",
  "Представительство в суде",
  "Работа по договору",
  "Работа по доверенности",
  "Участие в переговорах",
  "Конфиденциальность",
  "Оплата наличными",
  "Оплата картой",
  "Оплата по счету",
  "Рассрочка"
];

export const emptyLawyerProfile: LawyerProfileDraft = {
  fullName: "",
  slug: "",
  photoUrl: "",
  coverUrl: "",
  city: "",
  region: "",
  legalStatus: "Юрист",
  experienceYears: 0,
  headline: "",
  cardDescription: "",
  primarySpecializations: [],
  additionalSpecializations: [],
  workFormats: [],
  about: "",
  helpWith: "",
  caseTypes: "",
  consultationProcess: "",
  advantages: "",
  clientPreparation: "",
  experience: [
    {
      id: "exp-1",
      startDate: "",
      endDate: "",
      current: false,
      position: "",
      organization: "",
      city: "",
      description: ""
    }
  ],
  education: [
    {
      id: "edu-1",
      institution: "",
      faculty: "",
      specialty: "",
      qualification: "",
      graduationYear: "",
      description: ""
    }
  ],
  services: [
    {
      id: "service-1",
      title: "",
      description: "",
      priceType: "По договоренности",
      priceFrom: "",
      priceTo: "",
      fixedPrice: ""
    }
  ],
  courtCases: [
    {
      id: "case-1",
      title: "",
      caseNumber: "",
      court: "",
      category: "",
      year: "",
      result: "",
      description: "",
      sourceUrl: ""
    }
  ],
  visibility: {
    experience: true,
    education: true,
    services: true,
    courtCases: true,
    publications: true,
    reviews: true,
    consultations: true
  }
};

export const mockLawyerProfile: LawyerProfileDraft = {
  fullName: "Елена Кравцова",
  slug: "elena-kravtsova",
  photoUrl: "",
  coverUrl: "",
  city: "Москва",
  region: "Москва",
  legalStatus: "Юрист",
  experienceYears: 12,
  headline: "Юрист по семейным, жилищным и наследственным делам",
  cardDescription:
    "Помогаю разобраться в сложных правовых ситуациях, подготовить документы и выбрать понятный порядок действий.",
  primarySpecializations: ["Семейное право", "Жилищное право", "Наследственное право", "Защита прав потребителей", "Трудовое право"],
  additionalSpecializations: [],
  workFormats: ["Онлайн-консультация", "Очная встреча", "Представительство в суде", "Работа по договору", "Оплата картой"],
  about:
    "Юрист с практическим опытом сопровождения семейных, жилищных и наследственных споров. Помогаю клиентам понять правовую ситуацию, оценить риски и подготовить необходимые документы.",
  helpWith:
    "Консультирую по вопросам развода, раздела имущества, наследства, споров с управляющими компаниями, трудовых конфликтов и защиты прав потребителей.",
  caseTypes: "Семейные, жилищные, наследственные, трудовые и потребительские споры.",
  consultationProcess:
    "Сначала разбираем ситуацию и документы, затем определяем возможные варианты действий и выбираем наиболее реалистичный путь.",
  advantages: "Объясняю риски простым языком, заранее обозначаю возможные шаги и не обещаю гарантированный результат.",
  clientPreparation: "Подготовьте документы, переписку, даты ключевых событий и краткое описание цели обращения.",
  experience: [
    {
      id: "exp-1",
      startDate: "2018",
      endDate: "",
      current: true,
      position: "Юрист",
      organization: "Частная юридическая практика",
      city: "Москва",
      description: "Консультации, подготовка документов, сопровождение досудебных и судебных споров."
    },
    {
      id: "exp-2",
      startDate: "2013",
      endDate: "2018",
      current: false,
      position: "Ведущий юрист",
      organization: "Юридическая компания «Правовой центр»",
      city: "Москва",
      description: "Работа с гражданскими, семейными и жилищными делами."
    }
  ],
  education: [
    {
      id: "edu-1",
      institution: "Московский государственный юридический университет",
      faculty: "Юридический факультет",
      specialty: "Юриспруденция",
      qualification: "Специалист",
      graduationYear: "2012",
      description: ""
    }
  ],
  services: [
    {
      id: "service-1",
      title: "Устная консультация",
      description: "Разбор ситуации, оценка рисков и рекомендации по дальнейшим действиям.",
      priceType: "От",
      priceFrom: "3000",
      priceTo: "",
      fixedPrice: ""
    },
    {
      id: "service-2",
      title: "Подготовка искового заявления",
      description: "Подготовка иска с учетом обстоятельств дела и имеющихся документов.",
      priceType: "От",
      priceFrom: "8000",
      priceTo: "",
      fixedPrice: ""
    },
    {
      id: "service-3",
      title: "Анализ документов",
      description: "Проверка договора, претензии, судебных документов или переписки.",
      priceType: "Фиксированная",
      priceFrom: "",
      priceTo: "",
      fixedPrice: "5000"
    }
  ],
  courtCases: [
    {
      id: "case-1",
      title: "Спор о порядке общения с ребенком",
      caseNumber: "",
      court: "районный суд г. Москвы",
      category: "Семейное право",
      year: "2023",
      result: "требования удовлетворены частично",
      description: "Стороны согласовали порядок общения с ребенком с учетом интересов несовершеннолетнего.",
      sourceUrl: ""
    },
    {
      id: "case-2",
      title: "Взыскание ущерба после протечки квартиры",
      caseNumber: "",
      court: "районный суд г. Москвы",
      category: "Жилищное право",
      year: "2022",
      result: "иск удовлетворен",
      description: "С управляющей организации взыскан ущерб, расходы на оценку и судебные расходы.",
      sourceUrl: ""
    }
  ],
  visibility: {
    experience: true,
    education: true,
    services: true,
    courtCases: true,
    publications: true,
    reviews: true,
    consultations: true
  }
};

export const lawyerDashboardStats = [
  ["Статус профиля", "Черновик"],
  ["Заполненность профиля", "45%"],
  ["Вопросы для ответа", "12"],
  ["Мои ответы", "4"],
  ["Отзывы", "0"],
  ["Просмотры профиля", "128"],
  ["Публикации", "0"],
  ["Судебные дела", "0"]
];

export const mockLawyerQuestions = [
  {
    category: "Семейное право",
    city: "Москва",
    title: "Как определить порядок общения с ребенком?",
    text: "После развода нет понятного графика встреч, из-за этого постоянно возникают конфликты.",
    answersCount: 2,
    date: "Сегодня"
  },
  {
    category: "Жилищное право",
    city: "Москва",
    title: "УК не составляет акт после протечки",
    text: "Заявку приняли, но акт осмотра не оформляют и сроки ремонта не называют.",
    answersCount: 1,
    date: "Вчера"
  },
  {
    category: "Наследственное право",
    city: "Краснодар",
    title: "Можно ли восстановить срок наследства?",
    text: "Нотариус сказал, что шесть месяцев прошли. Нужно понять, есть ли варианты.",
    answersCount: 0,
    date: "22 мая"
  }
];
