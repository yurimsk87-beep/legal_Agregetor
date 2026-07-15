"use client";

import { useState } from "react";
import Link from "next/link";
import { mockLawyerQuestions } from "@/lib/lawyer-cabinet-mock";
import { LawyerEmptyState } from "./LawyerCabinetShell";

export type LawyerQuestionItem = {
  id: string;
  category: string;
  city: string;
  title: string;
  text: string;
  answersCount: number;
  date: string;
};

export type LawyerAnswerItem = {
  id: string;
  questionTitle: string;
  text: string;
  status: string;
  qualityStatus: string;
  containsContactAttempt: boolean;
  date: string;
};

export function LawyerQuestionsMock({ questions }: { questions?: LawyerQuestionItem[] }) {
  const items = questions?.length ? questions : process.env.NODE_ENV === "production" ? [] : mockLawyerQuestions.map((question, index) => ({ id: `mock-${index}`, ...question }));
  return (
    <div className="grid gap-4">
      {items.map((question) => (
        <article key={question.id} className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-2 text-xs font-medium text-zinc-600">
            <span className="rounded-full bg-emerald-50 px-3 py-1">{question.category}</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1">{question.city}</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1">{question.date}</span>
          </div>
          <h2 className="mt-3 text-xl font-semibold text-ink">{question.title}</h2>
          <p className="mt-2 leading-7 text-zinc-700">{question.text}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-zinc-500">Ответов: {question.answersCount}</span>
            <Link href={`/lawyer-cabinet/questions/${question.id}/answer/`} className="rounded-md border border-line px-4 py-2 text-sm font-semibold hover:border-trust">
              Ответить
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

export function LawyerAnswersMock({ answers = [] }: { answers?: LawyerAnswerItem[] }) {
  const tabs = ["Черновики", "На модерации", "Опубликованные", "Отклоненные"];
  const [active, setActive] = useState(tabs[0]);
  const filtered = answers.filter((answer) => {
    if (active === "На модерации") return answer.status === "MODERATION";
    if (active === "Опубликованные") return answer.status === "PUBLISHED";
    if (active === "Отклоненные") return answer.status === "REJECTED";
    return answer.status === "DRAFT";
  });

  return (
    <div className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={active === tab ? "rounded-md bg-trust px-3 py-2 text-sm font-semibold text-white" : "rounded-md border border-line px-3 py-2 text-sm font-semibold text-zinc-700"}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-5">
        {filtered.length ? (
          <div className="grid gap-3">
            {filtered.map((answer) => (
              <article key={answer.id} className="rounded-lg border border-line bg-zinc-50 p-4">
                <div className="flex flex-wrap gap-2 text-xs font-medium text-zinc-600">
                  <span className="rounded-full bg-white px-3 py-1">{answer.date}</span>
                  <span className="rounded-full bg-white px-3 py-1">{answer.qualityStatus}</span>
                  {answer.containsContactAttempt ? <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">Найдены контакты</span> : null}
                </div>
                <h2 className="mt-3 font-semibold text-ink">{answer.questionTitle}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-700">{answer.text}</p>
              </article>
            ))}
          </div>
        ) : (
          <LawyerEmptyState title={`${active}: пока пусто`} description="Ответы появятся здесь после отправки и модерации." />
        )}
      </div>
    </div>
  );
}

export function LawyerReviewsMock() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard label="Средний рейтинг" value="0.0" />
      <StatCard label="Количество отзывов" value="0" />
      <StatCard label="Последние отзывы" value="нет" />
      <div className="md:col-span-3">
        <LawyerEmptyState title="Пока нет отзывов." description="Отзывы будут видны после модерации администратором." />
      </div>
    </div>
  );
}

export function LawyerStatisticsMock() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Просмотры профиля" value="128" />
      <StatCard label="Просмотры ответов" value="64" />
      <StatCard label="Клики по кнопке обращения" value="9" />
      <StatCard label="Публикации" value="0" />
      <StatCard label="Отзывы" value="0" />
    </div>
  );
}

export function LawyerFeedbackForm() {
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setSent(false);
        const formData = new FormData(event.currentTarget);
        const response = await fetch("/api/lawyer-cabinet/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: String(formData.get("topic") ?? ""),
            type: String(formData.get("type") ?? "Идея"),
            message: String(formData.get("message") ?? "")
          })
        }).catch(() => null);

        if (response?.ok) {
          const data = (await response.json()) as { message?: string };
          setMessage(data.message ?? "Спасибо. Обращение сохранено.");
          setSent(true);
          event.currentTarget.reset();
          return;
        }

        setMessage("Не удалось сохранить обращение. Проверьте текст и попробуйте еще раз.");
      }}
      className="grid gap-4 rounded-lg border border-emerald-100 bg-white p-5 shadow-sm"
    >
      <label className="grid gap-1 text-sm font-medium text-zinc-700">
        Тема
        <input name="topic" required className="rounded-md border border-line px-3 py-2 outline-none focus:border-trust" />
      </label>
      <label className="grid gap-1 text-sm font-medium text-zinc-700">
        Тип обращения
        <select name="type" className="rounded-md border border-line px-3 py-2 outline-none focus:border-trust">
          {["Идея", "Ошибка", "Вопрос", "Жалоба"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-zinc-700">
        Сообщение
        <textarea name="message" required rows={5} className="rounded-md border border-line px-3 py-2 outline-none focus:border-trust" />
      </label>
      <button type="submit" className="rounded-md bg-trust px-4 py-3 text-sm font-semibold text-white hover:bg-ink">
        Отправить
      </button>
      {message ? <p className={sent ? "rounded-md bg-emerald-50 p-3 text-sm font-medium text-emerald-900" : "rounded-md bg-red-50 p-3 text-sm font-medium text-red-700"}>{message}</p> : null}
    </form>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
    </article>
  );
}
