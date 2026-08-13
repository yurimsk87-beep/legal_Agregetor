export type SearchableSelectOption = {
  id: string;
  label: string;
  description?: string;
  keywords?: string[];
};

export function normalizeSearchableSelectValue(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/[«»"']/g, "")
    .replace(/\s+/g, " ");
}

export function filterSearchableSelectOptions(options: SearchableSelectOption[], query: string) {
  const normalizedQuery = normalizeSearchableSelectValue(query);
  if (!normalizedQuery) return options;

  return options.filter((option) => normalizeSearchableSelectValue([
    option.label,
    option.description,
    ...(option.keywords ?? [])
  ].filter(Boolean).join(" ")).includes(normalizedQuery));
}
