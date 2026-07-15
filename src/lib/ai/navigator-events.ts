// Fire-and-forget отправка событий ИИ-навигатора. Не блокирует UI, не бросает
// ошибок наружу — аналитика не должна влиять на поиск.

export type AiNavigatorEventName =
  | "ai_navigator_shown"
  | "ai_navigator_clicked"
  | "ai_search_performed"
  | "ai_clarification_question_shown"
  | "ai_clarification_answer_submitted"
  | "ai_dialog_started"
  | "ai_dialog_completed"
  | "ai_dialog_low_confidence"
  | "ai_dialog_max_steps_reached"
  | "ai_repeated_question_filtered"
  | "ai_fallback_used"
  | "ai_llm_error"
  | "ai_route_selected"
  | "ai_navigator_view"
  | "ai_navigator_error"
  | "ai_navigator_low_confidence"
  | "ai_navigator_primary_click"
  | "ai_navigator_result_click"
  | "ai_navigator_question_view"
  | "ai_navigator_clarification_submit"
  | "ai_navigator_clarification_success"
  | "ai_navigator_clarification_error"
  | "ai_navigator_dropdown_view"
  | "ai_navigator_dropdown_primary_click"
  | "ai_navigator_dropdown_result_click";

export type AiNavigatorEventPayload = {
  event: AiNavigatorEventName;
  query?: string;
  page?: string;
  confidence?: string | null;
  riskLevel?: string | null;
  urgency?: string | null;
  targetType?: string | null;
  targetHref?: string | null;
  targetTitle?: string | null;
  domain?: string | null;
  routeId?: string | null;
  confidenceScore?: number | null;
  clarificationStep?: number;
  hasQuestions?: boolean;
  questionCount?: number;
  userAction?: string | null;
  timestamp?: string;
  meta?: Record<string, unknown>;
};

export function sendAiNavigatorEvent(payload: AiNavigatorEventPayload): void {
  try {
    void fetch("/api/ai-navigator/events/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      keepalive: true
    }).catch(() => {
      // молча игнорируем
    });
  } catch {
    // молча игнорируем
  }
}
