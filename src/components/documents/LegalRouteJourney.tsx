import Link from "next/link";

type Stage = "situation" | "document";

export function LegalRouteJourney({
  stage, title, problemUrl, scenarioUrl
}: {
  stage: Stage;
  title: string;
  problemUrl?: string;
  scenarioUrl?: string;
}) {
  const active = stage === "situation" ? 0 : 2;
  const steps = [
    { label: "Ситуация", href: problemUrl },
    { label: "Выбор пути", href: scenarioUrl },
    { label: "Анкета", href: undefined },
    { label: "Результат", href: undefined },
    { label: "Проверка", href: undefined }
  ];
  return <nav aria-label="Этапы юридического маршрута" className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 lg:px-8">
    <div className="rounded-xl border border-line bg-white px-3 py-4 shadow-sm sm:px-5">
      <p className="truncate text-xs font-semibold uppercase tracking-wide text-trust" title={title}>Ваш юридический маршрут: {title}</p>
      <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {steps.map((step, index) => {
          const current = index === active;
          const cls = `flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold sm:text-sm ${current ? "border-trust bg-emerald-50 text-ink" : "border-line text-zinc-600"}`;
          const label = <><span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${current ? "bg-trust text-white" : "bg-zinc-100 text-zinc-600"}`}>{index + 1}</span><span>{step.label}</span></>;
          return <li key={step.label}>
            {step.href && !current
              ? <Link href={step.href} className={cls} aria-label={`Вернуться: ${step.label}`}>{label}</Link>
              : <span className={cls} aria-current={current ? "step" : undefined}>{label}</span>}
          </li>;
        })}
      </ol>
      <p className="mt-2 text-xs leading-5 text-zinc-500">
        Правовые условия определяются выбранным сценарием; одинаковые шаги не означают одинаковых правовых оснований.
      </p>
    </div>
  </nav>;
}
