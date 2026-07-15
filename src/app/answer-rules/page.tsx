import { redirect } from "next/navigation";

export default function AnswerRulesRedirectPage() {
  // Правила ответов объединены с правилами вопросов в единый раздел.
  redirect("/legal/qna-rules/");
}
