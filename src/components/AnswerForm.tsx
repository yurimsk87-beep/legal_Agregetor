"use client";

import { useState } from "react";
import { Send } from "lucide-react";

type AnswerFormProps = {
  questionId: string;
};

type Status = "idle" | "submitting" | "success" | "error";

export function AnswerForm({ questionId }: AnswerFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setStatus("submitting");
    setMessage("");

    const response = await fetch("/api/answers/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId,
        text: String(formData.get("text") ?? "")
      })
    });
    const result = (await response.json().catch(() => null)) as { message?: string; answerReviewReason?: string } | null;

    if (response.ok) {
      setStatus("success");
      setMessage("Ответ отправлен на модерацию. Он появится после проверки администратором.");
      return;
    }

    setStatus("error");
    setMessage(result?.message || result?.answerReviewReason || "Не удалось отправить ответ. Проверьте текст и авторизацию.");
  }

  return (
    <form action={submit} className="grid gap-3 rounded-lg border border-line bg-white p-5">
      <label className="grid gap-1 text-sm font-medium text-zinc-700">
        Ответ юриста
        <textarea
          name="text"
          required
          minLength={80}
          rows={5}
          className="rounded-md border border-line px-3 py-2 outline-none focus:border-trust"
        />
      </label>
      <p className="text-xs leading-5 text-zinc-500">
        Ответы с телефонами, email, ссылками, мессенджерами или рекламными призывами не публикуются автоматически.
      </p>
      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-trust disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        {status === "submitting" ? "Отправляем" : "Отправить ответ"}
      </button>
      {message ? (
        <p className={status === "success" ? "text-sm font-medium text-leaf" : "text-sm font-medium text-red-700"}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
