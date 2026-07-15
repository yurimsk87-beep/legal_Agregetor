"use client";

import { useMemo, useState } from "react";

export type SearchClarificationQuestion = {
  question: string;
  options: string[];
};

type SearchClarificationPanelProps = {
  questions: SearchClarificationQuestion[];
  defaultNote: string;
  carefulNote: string;
  standardNote: string;
};

const carefulMarkers = ["давно", "не уверен", "спис", "суд", "пристав", "арест", "пропуст", "завтра", "срочно", "госуслуг"];

export function SearchClarificationPanel({ questions, defaultNote, carefulNote, standardNote }: SearchClarificationPanelProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const selectedAnswers = Object.values(answers).filter(Boolean);
  const routeNote = useMemo(() => {
    if (!selectedAnswers.length) return defaultNote;

    const answerText = selectedAnswers.join(" ").toLowerCase();
    const needsCarefulRoute = carefulMarkers.some((marker) => answerText.includes(marker));

    return needsCarefulRoute ? carefulNote : standardNote;
  }, [carefulNote, defaultNote, selectedAnswers, standardNote]);

  if (!questions.length) return null;

  return (
    <div className="grid gap-5">
      <div className="grid gap-4">
        {questions.slice(0, 3).map((item, questionIndex) => (
          <fieldset key={item.question} className="rounded-lg border border-line bg-white p-4">
            <legend className="text-base font-semibold text-ink">{item.question}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.options.slice(0, 5).map((option) => {
                const selected = answers[questionIndex] === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAnswers((current) => ({ ...current, [questionIndex]: option }))}
                    className={
                      selected
                        ? "rounded-md bg-trust px-3 py-2 text-sm font-semibold text-white"
                        : "rounded-md border border-line bg-zinc-50 px-3 py-2 text-sm font-semibold text-ink hover:border-trust hover:text-trust"
                    }
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <p className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">{routeNote}</p>
    </div>
  );
}
