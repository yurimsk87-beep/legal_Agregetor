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
    slug: "semeynoe-pravo",
    title: "Семейное право",
    description: "Развод, алименты, имущество супругов, вопросы о детях, отцовство, родительские права, усыновление и опека.",
    userProblem: "Выберите семейную ситуацию, чтобы узнать порядок действий, документы и адресата обращения.",
    questionTopics: ["Семейное право", "Брак", "Развод", "Алименты", "Раздел имущества", "Дети", "Отцовство", "Родительские права", "Усыновление", "Опека", "ЗАГС"],
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
