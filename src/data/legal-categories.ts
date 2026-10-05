export type LegalCategory = {
  slug: string;
  title: string;
  description: string;
  userProblem: string;
  questionTopics: string[];
  lawyerSpecializations: string[];
};

export const legalCategories: LegalCategory[] = [
  {
    slug: "semya-i-deti",
    title: "Семейные споры",
    description: "Брак и ЗАГС, развод, дети, алименты, опека, родительские права и имущественные споры супругов.",
    userProblem: "Выберите семейную ситуацию, чтобы получить применимый порядок действий и документы.",
    questionTopics: ["Семейное право", "Дети", "Алименты", "Развод", "Опека", "ЗАГС"],
    lawyerSpecializations: ["Семейные споры", "Гражданское право"]
  },
  {
    slug: "trudovoe-pravo",
    title: "Трудовое право",
    description: "Увольнение, зарплата, трудовой договор, отпуск, больничный, рабочее время и споры с работодателем.",
    userProblem: "Выберите трудовую ситуацию, чтобы узнать свои права, порядок действий и необходимые документы.",
    questionTopics: ["Трудовое право", "Увольнение", "Заработная плата", "Трудовой договор", "Отпуск", "Рабочее время"],
    lawyerSpecializations: ["Трудовое право"]
  }
];

export function normalizeLegalCategorySlug(slug: string) {
  return slug;
}

export function getLegalCategory(slug: string) {
  const normalizedSlug = normalizeLegalCategorySlug(slug);
  return legalCategories.find((category) => category.slug === normalizedSlug) ?? null;
}
