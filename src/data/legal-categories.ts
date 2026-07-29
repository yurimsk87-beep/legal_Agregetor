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
    description: "Регистрация брака, перемена имени, повторные документы и исправление записей ЗАГС.",
    userProblem: "Выберите ситуацию: брак и ЗАГС.",
    questionTopics: ["Заключение брака", "Семейное право", "ЗАГС"],
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
