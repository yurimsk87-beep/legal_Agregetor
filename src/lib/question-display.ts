import type { Question } from "./types";

export function getQuestionCategory(question: Question) {
  return question.category ?? (question.service?.slug === "zhilishchnye-spory" ? "Жилищное право" : question.service?.name) ?? "Юридический вопрос";
}

export function formatQuestionNumber(publicNumber?: string | null) {
  const rawValue = publicNumber?.trim();
  if (!rawValue) return "Вопрос № 00000000";

  const digits = rawValue.match(/\d+/g)?.join("") ?? "";
  if (!digits) return `Вопрос № ${rawValue}`;

  return `Вопрос № ${digits.slice(-8).padStart(8, "0")}`;
}

export function formatQuestionAuthorName(userName?: string | null) {
  const cleanName = userName?.trim().replace(/\s+/g, " ");
  if (!cleanName || /^гость$/i.test(cleanName)) return "Гость";

  const parts = cleanName.split(" ").filter(Boolean);
  return parts.slice(0, 2).join(" ");
}

export function formatQuestionDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(value));
}
