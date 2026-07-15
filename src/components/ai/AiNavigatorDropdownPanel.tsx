"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Send, Sparkles, UserRound } from "lucide-react";
import type { ClarificationAnswer, NavigatorResponse, NavigatorResult } from "@/lib/ai/navigator-llm";
import { sendAiNavigatorEvent } from "@/lib/ai/navigator-events";

export type AiNavigatorDropdownPage = "home" | "search";

type Props = { query: string; page: AiNavigatorDropdownPage };

type FetchBody = {
  query: string;
  page: string;
  clarificationAnswers?: ClarificationAnswer[];
  clarificationStep?: number;
  dialogCompleted?: boolean;
};

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 200;
const REQUIRED_ANSWERS = 3;
const MAX_STEPS = 5;
const MAX_LINKS = 4;

// Кэш содержит только первый вопрос, уже сформированный LLM для данного запроса.
const responseCache = new Map<string, NavigatorResponse>();

async function fetchConsultant(body: FetchBody, signal: AbortSignal): Promise<NavigatorResponse> {
  const response = await fetch("/api/ai-navigator/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal
  });
  if (!response.ok) throw new Error(`ai-consultant ${response.status}`);
  const json = (await response.json()) as NavigatorResponse;
  if (!json || typeof json !== "object" || json.mode !== "navigator") throw new Error("invalid response");
  return json;
}

function routeDomain(href?: string | null): string | null {
  if (!href) return null;
  return href.match(/^\/problems\/([^/]+)/)?.[1] ?? null;
}

function confidenceScore(confidence: NavigatorResponse["confidence"]): number {
  return confidence === "high" ? 0.9 : confidence === "medium" ? 0.65 : 0.3;
}

function sectionLinks(data: NavigatorResponse): NavigatorResult[] {
  const ordered = [
    ...data.sections.situations,
    ...data.sections.documents,
    ...data.sections.questions,
    ...data.sections.lawyers,
    ...data.sections.instructions
  ];
  const seen = new Set<string>();
  const links: NavigatorResult[] = [];
  for (const item of ordered) {
    if (seen.has(item.href)) continue;
    seen.add(item.href);
    links.push(item);
    if (links.length >= MAX_LINKS) break;
  }
  return links;
}

function isValidQuestionResponse(response: NavigatorResponse) {
  return (response.llmStatus === "success" || response.fallbackUsed) && response.dialogStatus === "active" && response.clarifyingQuestions.length === 1;
}

function isValidFinalResponse(response: NavigatorResponse) {
  return (
    (response.llmStatus === "success" || response.fallbackUsed) &&
    response.dialogStatus === "completed" &&
    response.clarifyingQuestions.length === 0 &&
    response.summary.trim().length > 0 &&
    response.steps.length >= 3
  );
}

function hasSiteMaterials(response: NavigatorResponse) {
  return Boolean(
    response.sections.situations.length ||
      response.sections.instructions.length ||
      response.sections.documents.length
  );
}

function needsLawyerEscalation(response: NavigatorResponse) {
  return response.siteAnswerFound === false || !hasSiteMaterials(response);
}

function toLawyerEscalationResponse(response: NavigatorResponse): NavigatorResponse {
  return {
    ...response,
    summary: "На сайте пока нет готового материала, который надёжно отвечает на вашу ситуацию.",
    steps: [],
    siteAnswerFound: false,
    clarifyingQuestions: [],
    dialogStatus: "completed",
    canContinue: false
  };
}

export function AiNavigatorDropdownPanel({ query, page }: Props) {
  const trimmed = query.trim();
  const [data, setData] = useState<NavigatorResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState<ClarificationAnswer[]>([]);
  const [clarState, setClarState] = useState<"idle" | "loading" | "error">("idle");
  const [retryKey, setRetryKey] = useState(0);

  const requestIdRef = useRef(0);
  const viewKeyRef = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const panelRef = useRef<HTMLElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  const currentQuestion = data?.clarifyingQuestions[0] ?? null;
  const needsLawyer = Boolean(data && needsLawyerEscalation(data));
  const completed = Boolean(
    data &&
      history.length === REQUIRED_ANSWERS &&
      (isValidFinalResponse(data) || (needsLawyer && data.dialogStatus === "completed"))
  );
  const lawyerQuestionHref =
    data?.sections.lawyers[0]?.href ?? `/questions/?q=${encodeURIComponent(trimmed)}#question`;
  // Кнопка «Задать вопрос юристу Online» всегда ведёт в Q&A с уже вписанным запросом.
  const askLawyerOnlineHref = `/questions/?q=${encodeURIComponent(trimmed)}#question`;

  useEffect(() => {
    if (!window.matchMedia("(max-width: 639px)").matches) return;
    const timer = window.setTimeout(() => {
      conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [status, clarState, history.length, data?.clarificationStep]);

  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setStatus("idle");
      setData(null);
      setAnswer("");
      setHistory([]);
      setClarState("idle");
      return;
    }

    const requestId = ++requestIdRef.current;
    const key = `${page}|${trimmed}`;
    setAnswer("");
    setHistory([]);
    setClarState("idle");

    const cached = responseCache.get(key);
    if (cached && isValidQuestionResponse(cached)) {
      setData(cached);
      setStatus("ready");
      fireView(cached);
      return;
    }

    setData(null);
    setStatus("loading");
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const json = await fetchConsultant({ query: trimmed, page, clarificationStep: 0 }, controller.signal);
        if (requestIdRef.current !== requestId) return;
        if (!isValidQuestionResponse(json)) throw new Error("LLM question is unavailable");
        responseCache.set(key, json);
        setData(json);
        setStatus("ready");
        fireView(json);
        fireLlmState(json);
      } catch {
        if (controller.signal.aborted || requestIdRef.current !== requestId) return;
        setStatus("error");
        sendAiNavigatorEvent({
          event: "ai_llm_error",
          query: trimmed,
          page,
          userAction: "initial_question",
          timestamp: new Date().toISOString()
        });
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed, page, retryKey]);

  function fireView(json: NavigatorResponse) {
    const key = `${trimmed}|${json.confidence}|${json.primaryAction?.href ?? ""}`;
    if (viewKeyRef.current === key) return;
    viewKeyRef.current = key;
    sendAiNavigatorEvent({
      event: "ai_navigator_shown",
      query: trimmed,
      page,
      confidence: json.confidence,
      confidenceScore: confidenceScore(json.confidence),
      riskLevel: json.riskLevel,
      urgency: json.urgency,
      domain: routeDomain(json.primaryAction?.href),
      routeId: json.primaryAction?.href ?? null,
      clarificationStep: json.clarificationStep ?? 0,
      hasQuestions: true,
      questionCount: 1,
      timestamp: new Date().toISOString()
    });
  }

  function fireLlmState(json: NavigatorResponse) {
    if (json.filteredQuestionCount) {
      sendAiNavigatorEvent({
        event: "ai_repeated_question_filtered",
        query: trimmed,
        page,
        confidence: json.confidence,
        clarificationStep: json.clarificationStep ?? 0,
        meta: { count: json.filteredQuestionCount },
        timestamp: new Date().toISOString()
      });
    }
  }

  async function onAnswerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const preparedAnswer = answer.trim();
    if (!data || !currentQuestion || !preparedAnswer || clarState === "loading" || submittingRef.current) return;

    const previousHistory = history;
    const allAnswers = [...history, { question: currentQuestion, answer: preparedAnswer }];
    const nextStep = allAnswers.length;
    const isFinalStep = nextStep >= REQUIRED_ANSWERS;
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    submittingRef.current = true;
    setHistory(allAnswers);
    setAnswer("");
    setClarState("loading");

    const eventBase = {
      query: trimmed,
      page,
      confidence: data.confidence,
      domain: routeDomain(data.primaryAction?.href),
      routeId: data.primaryAction?.href ?? null,
      clarificationStep: nextStep,
      hasQuestions: true,
      questionCount: 1,
      timestamp: new Date().toISOString()
    };
    if (previousHistory.length === 0) sendAiNavigatorEvent({ event: "ai_dialog_started", ...eventBase });
    sendAiNavigatorEvent({ event: "ai_clarification_answer_submitted", ...eventBase, userAction: "submit_answer" });

    try {
      const json = await fetchConsultant(
        {
          query: trimmed,
          page,
          clarificationAnswers: allAnswers,
          clarificationStep: nextStep,
          dialogCompleted: isFinalStep
        },
        controller.signal
      );
      if (requestIdRef.current !== requestId) return;
      const result = isFinalStep && needsLawyerEscalation(json) ? toLawyerEscalationResponse(json) : json;
      const validResult = isFinalStep
        ? isValidFinalResponse(result) || (needsLawyerEscalation(result) && result.dialogStatus === "completed")
        : isValidQuestionResponse(result);
      if (!validResult) {
        throw new Error("LLM dialog step is unavailable");
      }
      setData(result);
      setClarState("idle");
      fireLlmState(json);
      sendAiNavigatorEvent({
        event: isFinalStep ? "ai_dialog_completed" : "ai_clarification_question_shown",
        ...eventBase,
        questionCount: isFinalStep ? 0 : 1
      });
    } catch {
      if (requestIdRef.current !== requestId) return;
      if (isFinalStep && needsLawyerEscalation(data)) {
        setData(toLawyerEscalationResponse(data));
        setClarState("idle");
        sendAiNavigatorEvent({ event: "ai_fallback_used", ...eventBase, userAction: "ask_specialized_lawyer" });
        return;
      }
      setHistory(previousHistory);
      setAnswer(preparedAnswer);
      setClarState("error");
      sendAiNavigatorEvent({ event: "ai_llm_error", ...eventBase, userAction: isFinalStep ? "final_consultation" : "next_question" });
    } finally {
      submittingRef.current = false;
    }
  }

  function onResultClick(result: NavigatorResult) {
    sendAiNavigatorEvent({
      event: "ai_navigator_clicked",
      query: trimmed,
      page,
      confidence: data?.confidence,
      riskLevel: data?.riskLevel,
      urgency: data?.urgency,
      targetType: result.type,
      targetHref: result.href,
      targetTitle: result.title,
      domain: routeDomain(result.href),
      routeId: result.href,
      userAction: "result",
      timestamp: new Date().toISOString()
    });
  }

  if (trimmed.length < MIN_QUERY_LENGTH) return null;

  return (
    <section ref={panelRef} className="scroll-mt-3 rounded-lg border border-trust/30 bg-trust/5 p-3 sm:p-4" aria-label="ИИ-консультант ПравоПоиска">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-trust">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          ИИ-консультант
        </span>
        {status === "ready" && !completed ? <span className="font-medium text-zinc-500">Шаг {Math.min(history.length + 1, 3)} из 3</span> : null}
      </div>

      <div className="mt-3 max-h-[64vh] space-y-3 overflow-y-auto pr-1" aria-live="polite">
        {status === "loading" ? (
          <AssistantLoading text="Изучаю запрос и формирую вопрос №1…" />
        ) : null}

        {status === "error" ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <p className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Не удалось сформировать вопрос. Попробуйте ещё раз.
            </p>
            <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="mt-3 min-h-9 rounded-md border border-rose-300 bg-white px-3 text-xs font-semibold hover:border-rose-500">
              Повторить
            </button>
          </div>
        ) : null}

        {status === "ready" && data ? (
          <>
            {history.map((item, index) => (
              <div key={`${index}-${item.question}`} className="space-y-2">
                <AssistantMessage label={`Вопрос ${index + 1} из 3`}>{item.question}</AssistantMessage>
                <UserMessage>{item.answer}</UserMessage>
              </div>
            ))}

            {clarState === "loading" ? (
              <AssistantLoading
                text={history.length >= REQUIRED_ANSWERS ? "Анализирую ответы и готовлю мини-консультацию…" : `Формирую вопрос №${history.length + 1}…`}
              />
            ) : null}

            {!completed && clarState !== "loading" && currentQuestion ? (
              <div className="space-y-2">
                <AssistantMessage label={`Вопрос ${history.length + 1} из 3`}>{currentQuestion}</AssistantMessage>
                <form onSubmit={onAnswerSubmit} className="ml-7 flex min-w-0 gap-2">
                  <input
                    type="text"
                    value={answer}
                    onChange={(event) => {
                      setAnswer(event.target.value);
                      if (clarState === "error") setClarState("idle");
                    }}
                    className="min-h-10 min-w-0 flex-1 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none focus:border-trust"
                    placeholder="Напишите ответ"
                    aria-label={`Ответ на вопрос ${history.length + 1}`}
                  />
                  <button
                    type="submit"
                    disabled={!answer.trim()}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-trust text-white hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Отправить ответ"
                    title="Отправить ответ"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                  </button>
                </form>
                {clarState === "error" ? (
                  <p className="ml-7 text-xs leading-5 text-rose-700">Не удалось сформировать следующий этап. Ответ сохранён — отправьте его повторно.</p>
                ) : null}
              </div>
            ) : null}

            {completed && needsLawyer ? (
              <div className="ml-7 rounded-md border border-trust/25 bg-white p-3">
                <p className="text-sm leading-6 text-ink">
                  На сайте пока нет готового материала, который надёжно отвечает на вашу ситуацию. Передайте описание и ответы профильному юристу.
                </p>
                <Link
                  href={lawyerQuestionHref}
                  className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md bg-trust px-4 py-2 text-sm font-semibold text-white hover:bg-ink"
                >
                  Спросить юриста
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ) : null}

            {completed && !needsLawyer ? (
              <div className="space-y-3">
                <div className="ml-7 rounded-md border border-trust/25 bg-white p-3">
                  <p className="flex items-center gap-2 text-xs font-semibold text-trust">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Мини-консультация
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink">{data.summary}</p>
                  <ol className="mt-3 space-y-2">
                    {data.steps.slice(0, MAX_STEPS).map((step, index) => (
                      <li key={`${index}-${step}`} className="flex gap-2 text-xs leading-5 text-zinc-700">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-trust/15 text-[10px] font-bold text-trust">{index + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  {data.legalReferences?.length ? (
                    <div className="mt-3 border-t border-line pt-3">
                      <p className="text-[11px] font-semibold text-zinc-500">Нормы закона по теме</p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {data.legalReferences.map((reference) => (
                          <li key={`${reference.url}-${reference.article}`}>
                            <a
                              href={reference.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={reference.title ?? `${reference.article} ${reference.code}`}
                              className="inline-flex items-center gap-1 rounded-md border border-line bg-zinc-50 px-2 py-1 text-[11px] font-medium text-ink hover:border-trust hover:text-trust"
                            >
                              {reference.article} {reference.code}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                {sectionLinks(data).length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {sectionLinks(data).map((result) => (
                      <Link
                        key={`${result.type}-${result.href}`}
                        href={result.href}
                        onClick={() => onResultClick(result)}
                        className="flex min-w-0 items-start gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs leading-5 text-ink hover:border-trust"
                      >
                        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-trust" aria-hidden="true" />
                        <span className="min-w-0 font-medium">{result.title}</span>
                      </Link>
                    ))}
                  </div>
                ) : null}

                <Link
                  href={askLawyerOnlineHref}
                  onClick={() =>
                    sendAiNavigatorEvent({
                      event: "ai_navigator_clicked",
                      query: trimmed,
                      page,
                      confidence: data.confidence,
                      riskLevel: data.riskLevel,
                      urgency: data.urgency,
                      targetType: "ask_lawyer_online",
                      targetHref: askLawyerOnlineHref,
                      targetTitle: "Задать вопрос юристу Online",
                      domain: routeDomain(data.primaryAction?.href),
                      routeId: data.primaryAction?.href ?? null,
                      userAction: "ask_lawyer_online",
                      timestamp: new Date().toISOString()
                    })
                  }
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-trust px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink sm:w-auto"
                >
                  Задать вопрос юристу Online
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                <p className="text-[11px] leading-5 text-zinc-500">{data.disclaimer}</p>
              </div>
            ) : null}
          </>
        ) : null}
        <div ref={conversationEndRef} />
      </div>
    </section>
  );
}

function AssistantMessage({ label, children }: { label: string; children: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-trust/15 text-trust">
        <Sparkles className="h-3 w-3" aria-hidden="true" />
      </span>
      <div className="min-w-0 rounded-md border border-trust/20 bg-white px-3 py-2">
        <p className="text-[11px] font-semibold text-trust">{label}</p>
        <p className="mt-1 text-sm leading-6 text-ink">{children}</p>
      </div>
    </div>
  );
}

function UserMessage({ children }: { children: string }) {
  return (
    <div className="ml-7 flex items-start justify-end gap-2">
      <div className="min-w-0 max-w-[88%] rounded-md bg-trust px-3 py-2 text-sm leading-6 text-white">{children}</div>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-200 text-zinc-600">
        <UserRound className="h-3 w-3" aria-hidden="true" />
      </span>
    </div>
  );
}

function AssistantLoading({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-trust/20 bg-white px-3 py-2 text-sm text-zinc-600">
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-trust" aria-hidden="true" />
      {text}
    </div>
  );
}
