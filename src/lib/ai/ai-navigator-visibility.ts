import { getCurrentUser } from "@/lib/server-auth";
import { isNavigatorLlmEnabled } from "@/lib/ai/navigator-llm";

// Feature-flag видимости ИИ-навигатора. Решение принимается на сервере; клиентский
// компонент карточки получает уже готовый булев результат через prop.
//
// AI_NAVIGATOR_ENABLED   = "true" | (любое другое) — глобальный выключатель карточки.
// AI_NAVIGATOR_VISIBLE_TO = "admin" | "all"        — кому показывать, если включено.

export type AiNavigatorVisibleTo = "admin" | "all";
export type AiNavigatorViewer = { role?: string | null } | null | undefined;

export type AiNavigatorRuntimeConfig = {
  enabled: boolean;
  visibleTo: AiNavigatorVisibleTo;
};

export function getAiNavigatorRuntimeConfig(): AiNavigatorRuntimeConfig {
  const enabled = process.env.AI_NAVIGATOR_ENABLED === "true";
  const visibleTo: AiNavigatorVisibleTo = (process.env.AI_NAVIGATOR_VISIBLE_TO ?? "admin") === "all" ? "all" : "admin";
  return { enabled, visibleTo };
}

// Чистая проверка по известному зрителю (без чтения куки/БД).
// Неизвестный/неавторизованный зритель: visibleTo=admin → false, visibleTo=all → true.
export function isAiNavigatorEnabledForViewer(viewer: AiNavigatorViewer): boolean {
  const { enabled, visibleTo } = getAiNavigatorRuntimeConfig();
  if (!enabled) return false;
  if (visibleTo === "all") return true;
  return viewer?.role === "ADMIN";
}

// Серверное решение видимости для текущего запроса. Куки/БД читаются ТОЛЬКО в режиме
// admin-only — поэтому в режимах disabled и all статическая генерация страниц
// (например, главной с revalidate) не ломается.
export async function isAiNavigatorVisible(): Promise<boolean> {
  const config = getAiNavigatorRuntimeConfig();
  if (!config.enabled) return false;
  if (config.visibleTo === "all") return true;
  const viewer = await getCurrentUser();
  return isAiNavigatorEnabledForViewer(viewer);
}

// Статус для admin-аналитики. AI_API_KEY НЕ возвращается — только факт его наличия.
export function getAiNavigatorStatus() {
  const config = getAiNavigatorRuntimeConfig();
  return {
    enabled: config.enabled,
    visibleTo: config.visibleTo,
    llmFlag: process.env.AI_NAVIGATOR_LLM_ENABLED === "true",
    llmEffective: isNavigatorLlmEnabled(),
    provider: process.env.AI_PROVIDER?.trim() || null,
    model: process.env.AI_MODEL?.trim() || null,
    baseUrl: process.env.AI_BASE_URL?.trim() || null,
    apiKeyConfigured: Boolean(process.env.AI_API_KEY)
  };
}
