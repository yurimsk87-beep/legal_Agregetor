"use client";

import { useState } from "react";

type AdminAssistedAnswerFormProps = {
  questionId: string;
  lawyers: Array<{
    id: string;
    name: string;
    consent: boolean;
  }>;
};

export function AdminAssistedAnswerForm({ questionId, lawyers }: AdminAssistedAnswerFormProps) {
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setMessage("");
    const response = await fetch("/api/answers/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId,
        lawyerId: String(formData.get("lawyerId") ?? ""),
        text: String(formData.get("text") ?? ""),
        adminAssisted: true
      })
    });
    const result = await response.json().catch(() => null);
    setMessage(response.ok ? "Ответ сохранен." : result?.message || "Не удалось сохранить ответ.");
  }

  return (
    <form action={submit} className="mt-4 grid gap-3 rounded-lg border border-line bg-zinc-50 p-4">
      <label className="grid gap-1 text-sm font-medium text-zinc-700">
        Юрист
        <select name="lawyerId" required className="rounded-md border border-line px-3 py-2">
          <option value="">Выберите юриста</option>
          {lawyers.map((lawyer) => (
            <option key={lawyer.id} value={lawyer.id} disabled={!lawyer.consent}>
              {lawyer.name}
              {lawyer.consent ? "" : " — нет согласия на публикацию ответов редакцией от имени юриста"}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-zinc-700">
        Ответ
        <textarea name="text" required minLength={80} rows={5} className="rounded-md border border-line px-3 py-2" />
      </label>
      <button type="submit" className="rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-trust">
        Добавить ответ
      </button>
      {message ? <p className="text-sm text-zinc-700">{message}</p> : null}
    </form>
  );
}
