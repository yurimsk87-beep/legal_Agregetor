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
  }
];

export function normalizeLegalCategorySlug(slug: string) {
  return slug;
}

export function getLegalCategory(slug: string) {
  const normalizedSlug = normalizeLegalCategorySlug(slug);
  return legalCategories.find((category) => category.slug === normalizedSlug) ?? null;
}
