"use client";

import { type FormEvent, useState } from "react";
import { Send } from "lucide-react";
import type { City, Service } from "@/lib/types";
import { sendAnalyticsEvent } from "@/lib/analytics-client";

type LeadFormProps = {
  cities: City[];
  services: Service[];
  sourcePage: string;
  defaultCityId?: string;
  defaultServiceId?: string;
  compact?: boolean;
  sourceType?: string;
  lawyerId: string;
  showPlatformNotice?: boolean;
};

type SubmitStatus = "idle" | "submitting" | "success" | "error";

const successText = "Ваше обращение отправлено через платформу. Администратор сервиса обработает заявку и свяжется с вами.";

export function LeadForm({
  cities,
  services,
  sourcePage,
  defaultCityId,
  defaultServiceId,
  compact = false,
  sourceType = "LAWYER_PROFILE",
  lawyerId,
  showPlatformNotice = false
}: LeadFormProps) {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setStatus("submitting");
    setMessage("");

    const payload = {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      cityId: String(formData.get("cityId") ?? ""),
      serviceId: String(formData.get("serviceId") ?? ""),
      message: String(formData.get("message") ?? ""),
      format: String(formData.get("format") ?? "online"),
      sourcePage,
      sourceType,
      lawyerId,
      consent: formData.get("consent") === "on"
    };

    const response = await fetch("/api/leads/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = (await response.json().catch(() => null)) as { id?: string } | null;
      sendAnalyticsEvent({
        type: "LAWYER_PROFILE_LEAD_CREATED",
        sourcePage,
        targetType: "LAWYER",
        targetId: lawyerId,
        payload: {
          leadId: result?.id,
          sourceType,
          lawyerId,
          cityId: payload.cityId || undefined,
          serviceId: payload.serviceId || undefined
        }
      });
      setStatus("success");
      setMessage(successText);
      return;
    }

    const result = (await response.json().catch(() => null)) as { message?: string } | null;
    setStatus("error");
    setMessage(result?.message || "Не удалось отправить обращение. Проверьте поля формы и попробуйте еще раз.");
  }

  return (
    <form
      onSubmit={submit}
      data-seo-block="cta"
      className={compact ? "grid w-full min-w-0 gap-3" : "grid w-full min-w-0 gap-4 rounded-lg border border-line bg-white p-5 shadow-soft"}
    >
      {showPlatformNotice ? (
        <div className="min-w-0 break-words rounded-md bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
          Обращение будет создано через платформу. Контакты юриста не раскрываются публично, заявку увидит только администратор сервиса.
        </div>
      ) : null}
      <div className={compact ? "grid min-w-0 gap-3" : "grid min-w-0 gap-4 sm:grid-cols-2"}>
        <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-700">
          Имя
          <input name="name" required className="w-full min-w-0 rounded-md border border-line px-3 py-2 outline-none focus:border-trust" />
        </label>
        <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-700">
          Телефон
          <input name="phone" required className="w-full min-w-0 rounded-md border border-line px-3 py-2 outline-none focus:border-trust" />
        </label>
      </div>
      <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-700">
        Email
        <input name="email" type="email" className="w-full min-w-0 rounded-md border border-line px-3 py-2 outline-none focus:border-trust" />
      </label>
      <div className={compact ? "grid min-w-0 gap-3" : "grid min-w-0 gap-4 sm:grid-cols-2"}>
        <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-700">
          Город
          <select name="cityId" defaultValue={defaultCityId ?? ""} className="w-full min-w-0 rounded-md border border-line px-3 py-2 outline-none focus:border-trust">
            <option value="">Выберите город</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-700">
          Тема
          <select name="serviceId" defaultValue={defaultServiceId ?? ""} className="w-full min-w-0 rounded-md border border-line px-3 py-2 outline-none focus:border-trust">
            <option value="">Выберите тему</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-700">
        Формат консультации
        <select name="format" defaultValue="online" className="w-full min-w-0 rounded-md border border-line px-3 py-2 outline-none focus:border-trust">
          <option value="online">Онлайн</option>
          <option value="phone">Телефон</option>
          <option value="office">Офис по записи через платформу</option>
          <option value="court">Суд</option>
        </select>
      </label>
      <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-700">
        Сообщение
        <textarea
          name="message"
          required
          minLength={10}
          rows={compact ? 4 : 5}
          placeholder="Коротко опишите ситуацию. Администратор сервиса обработает обращение и свяжется с вами."
          className="w-full min-w-0 rounded-md border border-line px-3 py-2 outline-none focus:border-trust"
        />
      </label>
      <label className="flex min-w-0 items-start gap-2 text-sm text-zinc-600">
        <input name="consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 rounded border-line text-trust" />
        <span className="min-w-0 break-words">Согласен на обработку персональных данных и обращение через платформу.</span>
      </label>
      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex min-h-11 max-w-full min-w-0 items-center justify-center gap-2 rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        {status === "submitting" ? "Отправляем" : "Передать обращение через платформу"}
      </button>
      {message ? <p className={status === "success" ? "break-words text-sm font-medium text-leaf" : "break-words text-sm font-medium text-red-700"}>{message}</p> : null}
    </form>
  );
}
