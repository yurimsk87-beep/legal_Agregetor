"use client";

import Link from "next/link";
import { Cookie, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ANALYTICS_CONSENT_COOKIE,
  ANALYTICS_CONSENT_EVENT,
  readAnalyticsConsent,
  type AnalyticsConsent as AnalyticsConsentValue
} from "@/lib/analytics-privacy";

export function AnalyticsConsent() {
  const [consent, setConsent] = useState<AnalyticsConsentValue | null | undefined>(undefined);
  const [settingsOpened, setSettingsOpened] = useState(false);

  useEffect(() => {
    setConsent(readAnalyticsConsent(document.cookie));
  }, []);

  function chooseConsent(value: AnalyticsConsentValue) {
    const previous = consent;
    writeConsentCookie(value);
    setConsent(value);
    setSettingsOpened(false);
    window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: value }));

    if (previous === "granted" && value === "denied") {
      clearAnalyticsCookies();
      window.location.reload();
    }
  }

  if (consent === undefined) return null;

  return (
    <>
      {consent === null || settingsOpened ? (
        <section
          aria-label="Настройки аналитики"
          className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-2xl rounded-lg border border-line bg-white p-4 shadow-xl"
          role="dialog"
        >
          <div className="flex min-w-0 items-start gap-3">
            <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-trust" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-semibold text-ink">Аналитика и cookie</p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                С вашего согласия мы включаем веб-аналитику и обезличенные события по шаблонам страниц. Телефоны, email,
                тексты вопросов и обращений в аналитику не передаются.{" "}
                <Link href="/legal/privacy/" className="font-medium text-trust hover:text-ink">
                  Подробнее
                </Link>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => chooseConsent("denied")}
                  className="min-h-10 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-trust"
                >
                  Отклонить
                </button>
                <button
                  type="button"
                  onClick={() => chooseConsent("granted")}
                  className="min-h-10 rounded-md bg-trust px-4 text-sm font-semibold text-white hover:bg-ink"
                >
                  Разрешить аналитику
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setSettingsOpened(true)}
          className="fixed bottom-3 left-3 z-[60] inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-zinc-600 shadow-soft hover:border-trust hover:text-trust"
          title="Настройки аналитики"
          aria-label="Открыть настройки аналитики"
        >
          <Settings2 className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </>
  );
}

function writeConsentCookie(value: AnalyticsConsentValue) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

function clearAnalyticsCookies() {
  const analyticsPrefixes = ["_ga", "_gid", "_gat", "_gcl", "_ym"];
  for (const item of document.cookie.split(";")) {
    const name = item.trim().split("=")[0];
    if (name !== "yabs-sid" && !analyticsPrefixes.some((prefix) => name.startsWith(prefix))) continue;
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}
