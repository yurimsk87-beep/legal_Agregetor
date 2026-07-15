"use client";

import {
  hasAnalyticsConsent,
  normalizeAnalyticsRoute,
  sanitizeAnalyticsPayload,
  sanitizeAnalyticsToken
} from "@/lib/analytics-privacy";

export type AnalyticsEventType =
  | "LEAD_CREATED"
  | "QUESTION_FORM_OPENED"
  | "QUESTION_FORM_OPENED_PUBLIC"
  | "QUESTION_WIZARD_STARTED"
  | "QUESTION_WIZARD_CLARIFICATIONS_SHOWN"
  | "QUESTION_WIZARD_ENRICHED_CONFIRMED"
  | "QUESTION_WIZARD_ANALYZING_STARTED"
  | "QUESTION_WIZARD_PRELIMINARY_READY"
  | "QUESTION_WIZARD_ANALYZING_TIMEOUT"
  | "QUESTION_WIZARD_TRANSFER_TO_LAWYER_CLICKED"
  | "QUESTION_WIZARD_LEAD_CREATED"
  | "QUESTION_CREATED"
  | "QUESTION_SUBMITTED"
  | "QUESTION_PUBLISHED"
  | "QUESTION_PAGE_VIEW"
  | "ANSWER_READ"
  | "LAWYER_PROFILE_OPENED_FROM_ANSWER"
  | "SIMILAR_QUESTION_CLICKED"
  | "SERVICE_CATEGORY_CLICKED_FROM_QUESTION"
  | "BLOG_ARTICLE_READ"
  | "DOCUMENT_PAGE_VIEW"
  | "CALCULATOR_USED"
  | "CALCULATOR_RESULT_VIEWED"
  | "CITY_SELECTED"
  | "CITY_AUTODETECTED"
  | "LAWYER_PROFILE_VIEW"
  | "LAWYER_PROFILE_FORM_OPENED"
  | "LAWYER_PROFILE_LEAD_CREATED"
  | "CONSULTATION_REQUEST_CREATED"
  | "DOCUMENT_ORDER_CREATED"
  | "CALCULATOR_COMPLETED"
  | "CHECKLIST_DOWNLOADED"
  | "DOCUMENT_REVIEW_REQUEST_CREATED"
  | "CITY_SERVICE_LEAD_CREATED"
  | "ARTICLE_CTA_CLICKED"
  | "STICKY_CTA_CLICKED"
  | "PLATFORM_PHONE_CLICKED"
  | "PLATFORM_EMAIL_CLICKED"
  | "PLATFORM_MESSENGER_CLICKED"
  | "CONTACTS_PAGE_OPENED"
  | "LAWYER_PROFILE_CLICK"
  | "CTA_CLICK";

type AnalyticsPayload = {
  type: AnalyticsEventType;
  url?: string;
  sourcePage?: string;
  targetType?: string;
  targetId?: string;
  payload?: Record<string, unknown>;
};

export function sendAnalyticsEvent(event: AnalyticsPayload) {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent(document.cookie)) return;

  const normalizedEvent: AnalyticsPayload = {
    type: event.type,
    url: normalizeAnalyticsRoute(event.url ?? window.location.pathname) ?? "/",
    sourcePage: normalizeAnalyticsRoute(event.sourcePage),
    targetType: sanitizeAnalyticsToken(event.targetType),
    targetId: sanitizeAnalyticsToken(event.targetId),
    payload: sanitizeAnalyticsPayload(event.payload)
  };
  const body = JSON.stringify(normalizedEvent);

  reachMetrikaGoal(normalizedEvent);

  if ("sendBeacon" in navigator) {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon("/api/events", blob)) return;
  }

  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true
  }).catch(() => undefined);
}

const analyticsEventMap: Record<AnalyticsEventType, string> = {
  LEAD_CREATED: "lead_created",
  QUESTION_FORM_OPENED: "question_form_opened",
  QUESTION_FORM_OPENED_PUBLIC: "question_form_opened",
  QUESTION_WIZARD_STARTED: "question_wizard_started",
  QUESTION_WIZARD_CLARIFICATIONS_SHOWN: "question_wizard_clarifications_shown",
  QUESTION_WIZARD_ENRICHED_CONFIRMED: "question_wizard_enriched_confirmed",
  QUESTION_WIZARD_ANALYZING_STARTED: "question_wizard_analyzing_started",
  QUESTION_WIZARD_PRELIMINARY_READY: "question_wizard_preliminary_ready",
  QUESTION_WIZARD_ANALYZING_TIMEOUT: "question_wizard_analyzing_timeout",
  QUESTION_WIZARD_TRANSFER_TO_LAWYER_CLICKED: "question_wizard_transfer_to_lawyer_clicked",
  QUESTION_WIZARD_LEAD_CREATED: "question_wizard_lead_created",
  QUESTION_CREATED: "question_submitted",
  QUESTION_SUBMITTED: "question_submitted",
  QUESTION_PUBLISHED: "question_published",
  QUESTION_PAGE_VIEW: "question_page_view",
  ANSWER_READ: "answer_read",
  LAWYER_PROFILE_OPENED_FROM_ANSWER: "lawyer_profile_opened_from_answer",
  SIMILAR_QUESTION_CLICKED: "similar_question_clicked",
  SERVICE_CATEGORY_CLICKED_FROM_QUESTION: "service_category_clicked_from_question",
  BLOG_ARTICLE_READ: "blog_article_read",
  DOCUMENT_PAGE_VIEW: "document_page_view",
  CALCULATOR_USED: "calculator_used",
  CALCULATOR_RESULT_VIEWED: "calculator_result_viewed",
  CITY_SELECTED: "city_selected",
  CITY_AUTODETECTED: "city_autodetected",
  LAWYER_PROFILE_VIEW: "lawyer_profile_view",
  LAWYER_PROFILE_FORM_OPENED: "lawyer_profile_form_opened",
  LAWYER_PROFILE_LEAD_CREATED: "lawyer_profile_lead_created",
  CONSULTATION_REQUEST_CREATED: "consultation_request_created",
  DOCUMENT_ORDER_CREATED: "document_order_created",
  CALCULATOR_COMPLETED: "calculator_completed",
  CHECKLIST_DOWNLOADED: "checklist_downloaded",
  DOCUMENT_REVIEW_REQUEST_CREATED: "document_review_request_created",
  CITY_SERVICE_LEAD_CREATED: "city_service_lead_created",
  ARTICLE_CTA_CLICKED: "article_cta_clicked",
  STICKY_CTA_CLICKED: "sticky_cta_clicked",
  PLATFORM_PHONE_CLICKED: "platform_phone_clicked",
  PLATFORM_EMAIL_CLICKED: "platform_email_clicked",
  PLATFORM_MESSENGER_CLICKED: "platform_messenger_clicked",
  CONTACTS_PAGE_OPENED: "contacts_page_opened",
  LAWYER_PROFILE_CLICK: "lawyer_profile_clicked",
  CTA_CLICK: "cta_clicked"
};

const YANDEX_METRIKA_ID = 109850822;

type MetrikaWindow = Window & {
  ym?: (id: number, method: string, goal: string, params?: Record<string, unknown>) => void;
};

function reachMetrikaGoal(event: AnalyticsPayload) {
  if (typeof window === "undefined") return;

  const ym = (window as MetrikaWindow).ym;
  if (!ym) return;
  ym(YANDEX_METRIKA_ID, "reachGoal", analyticsEventMap[event.type], event.payload);
}
