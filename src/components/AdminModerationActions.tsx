"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = "idle" | "loading" | "done" | "error";

export function AdminQuestionActions({ questionId }: { questionId: string }) {
  return <ModerationButtons endpoint={`/api/admin/questions/${questionId}/`} actions={["publish", "reject", "spam", "duplicate", "noindex"]} />;
}

export function AdminAnswerActions({ answerId }: { answerId: string }) {
  return <ModerationButtons endpoint={`/api/admin/answers/${answerId}/`} actions={["publish", "reject", "moderation"]} />;
}

function ModerationButtons({ endpoint, actions }: { endpoint: string; actions: string[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function run(action: string) {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const result = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setStatus("error");
        setMessage(result?.message ?? `Ошибка модерации: HTTP ${response.status}`);
        return;
      }

      setStatus("done");
      setMessage("Сохранено");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Не удалось отправить действие модерации.");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action}
          type="button"
          onClick={() => run(action)}
          disabled={status === "loading"}
          className="rounded-md border border-line px-3 py-2 text-xs font-semibold text-ink hover:border-trust disabled:opacity-60"
        >
          {label(action)}
        </button>
      ))}
      {message ? <span className={status === "error" ? "text-xs font-medium text-red-700" : "text-xs font-medium text-leaf"}>{message}</span> : null}
    </div>
  );
}

function label(action: string) {
  const labels: Record<string, string> = {
    publish: "Опубликовать",
    reject: "Отклонить",
    spam: "Спам",
    duplicate: "Дубль",
    noindex: "Noindex",
    moderation: "На модерацию"
  };
  return labels[action] ?? action;
}
