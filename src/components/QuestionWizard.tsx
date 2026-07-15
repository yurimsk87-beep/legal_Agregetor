"use client";

import { type ChangeEvent, type FormEvent, type ReactNode, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import { sendAnalyticsEvent } from "@/lib/analytics-client";
import type { City, Service } from "@/lib/types";

type QuestionWizardProps = {
  cities: City[];
  services: Service[];
  sourcePage: string;
  defaultCityId?: string;
  defaultServiceId?: string;
  compact?: boolean;
  lawyerId?: string;
  onSuccess?: () => void;
};

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export function QuestionWizard({
  cities,
  services,
  sourcePage,
  defaultCityId,
  defaultServiceId,
  compact = false,
  onSuccess
}: QuestionWizardProps) {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [cityId, setCityId] = useState(defaultCityId ?? "");
  const [serviceId, setServiceId] = useState(defaultServiceId ?? "");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [personalDataConsent, setPersonalDataConsent] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const openedTracked = useRef(false);

  const selectedCity = useMemo(() => cities.find((city) => city.id === cityId) ?? null, [cities, cityId]);
  const selectedService = useMemo(() => services.find((service) => service.id === serviceId) ?? null, [services, serviceId]);

  function trackStarted() {
    if (openedTracked.current) return;
    openedTracked.current = true;
    sendAnalyticsEvent({
      type: "QUESTION_WIZARD_STARTED",
      sourcePage,
      targetType: "QUESTION",
      payload: { mode: "simple", defaultCityId, defaultServiceId }
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFileError("");
    const file = event.target.files?.[0];
    if (!file) return;

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      setFileError("Файл больше 10 МБ.");
      event.target.value = "";
      return;
    }
    if (!/\.(pdf|jpe?g|png|docx?)$/i.test(file.name)) {
      setFileError("Разрешены pdf, jpg, png, doc, docx.");
      event.target.value = "";
    }
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    trackStarted();
    setStatus("submitting");
    setMessage("");

    if (!selectedCity || !selectedService) {
      setStatus("error");
      setMessage("Выберите город и категорию права.");
      return;
    }

    const attachment = fileRef.current?.files?.[0] ?? null;
    const hasAttachment = Boolean(attachment && attachment.size > 0);

    let response: Response;
    if (hasAttachment && attachment) {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("text", text);
      formData.set("userName", userName);
      formData.set("userEmail", userEmail);
      formData.set("cityId", selectedCity.id);
      formData.set("serviceId", selectedService.id);
      formData.set("sourcePage", sourcePage);
      formData.set("personalDataConsent", personalDataConsent ? "on" : "off");
      formData.set("attachment", attachment);
      response = await fetch("/api/questions/", { method: "POST", body: formData });
    } else {
      response = await fetch("/api/questions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          text,
          rawText: text,
          userName,
          userEmail,
          cityId: selectedCity.id,
          serviceId: selectedService.id,
          sourcePage,
          personalDataConsent
        })
      });
    }
    const result = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;

    if (!response.ok) {
      setStatus("error");
      setMessage(result?.message || "Не удалось отправить вопрос.");
      return;
    }

    setStatus("success");
    setMessage(result?.message || "Вопрос отправлен на модерацию.");
    setTitle("");
    setText("");
    setUserName("");
    setUserEmail("");
    setPersonalDataConsent(false);
    setFileError("");
    if (fileRef.current) fileRef.current.value = "";
    sendAnalyticsEvent({
      type: "QUESTION_SUBMITTED",
      sourcePage,
      targetType: "QUESTION",
      targetId: result?.id,
      payload: { mode: "simple", cityId, serviceId }
    });
    onSuccess?.();
  }

  return (
    <form
      onSubmit={submitQuestion}
      onFocus={trackStarted}
      className={compact ? "grid w-full min-w-0 gap-4" : "grid w-full min-w-0 gap-4 rounded-lg border border-line bg-white p-5 shadow-soft"}
    >
      <div className={compact ? "grid min-w-0 gap-4" : "grid min-w-0 gap-4 sm:grid-cols-2"}>
        <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-700">
          Имя
          <input value={userName} onChange={(event) => setUserName(event.target.value)} required className="w-full min-w-0 rounded-md border border-line px-3 py-2 outline-none focus:border-trust" />
        </label>
        <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-700">
          Почта для уведомления
          <input value={userEmail} onChange={(event) => setUserEmail(event.target.value)} type="email" required className="w-full min-w-0 rounded-md border border-line px-3 py-2 outline-none focus:border-trust" />
        </label>
      </div>
      <div className={compact ? "grid min-w-0 gap-4" : "grid min-w-0 gap-4 sm:grid-cols-2"}>
        <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-700">
          Город
          <select value={cityId} onChange={(event) => setCityId(event.target.value)} required className="w-full min-w-0 rounded-md border border-line px-3 py-2 outline-none focus:border-trust">
            <option value="">Выберите город</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-700">
          Категория права
          <select value={serviceId} onChange={(event) => setServiceId(event.target.value)} required className="w-full min-w-0 rounded-md border border-line px-3 py-2 outline-none focus:border-trust">
            <option value="">Выберите категорию</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-700">
        Заголовок вопроса
        <input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={5} maxLength={120} className="w-full min-w-0 rounded-md border border-line px-3 py-2 outline-none focus:border-trust" />
      </label>
      <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-700">
        Вопрос
        <textarea value={text} onChange={(event) => setText(event.target.value)} required minLength={40} rows={compact ? 5 : 7} className="w-full min-w-0 rounded-md border border-line px-3 py-2 outline-none focus:border-trust" />
      </label>
      <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-700">
        Документ по ситуации (необязательно)
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileChange}
          className="w-full min-w-0 cursor-pointer rounded-md border border-line px-3 py-2 text-sm outline-none file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-trust/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-trust focus:border-trust"
        />
        <span className="text-xs font-normal leading-5 text-zinc-500">
          PDF, JPG, PNG, DOC, DOCX до 10 МБ. Не прикладывайте паспорт и другие чувствительные данные.
        </span>
        {fileError ? <span className="text-xs font-medium text-red-600">{fileError}</span> : null}
      </label>
      <Checkbox checked={personalDataConsent} onChange={setPersonalDataConsent} required label="Согласен на обработку персональных данных." />
      <QuestionButton disabled={status === "submitting" || !personalDataConsent}>
        {status === "submitting" ? "Отправляем вопрос" : "Отправить вопрос"}
      </QuestionButton>
      {message ? <p className={status === "success" ? "break-words text-sm font-medium text-leaf" : "break-words text-sm font-medium text-red-700"}>{message}</p> : null}
    </form>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
  required
}: {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  required?: boolean;
}) {
  return (
    <label className="flex min-w-0 items-start gap-2 text-sm text-zinc-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange ? (event) => onChange(event.target.checked) : undefined}
        required={required}
        className="mt-1 h-4 w-4 shrink-0 rounded border-line text-trust"
      />
      <span className="min-w-0 break-words">{label}</span>
    </label>
  );
}

function QuestionButton({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex min-h-11 max-w-full min-w-0 items-center justify-center gap-2 rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-70"
    >
      <Send className="h-4 w-4" aria-hidden="true" />
      {children}
    </button>
  );
}
