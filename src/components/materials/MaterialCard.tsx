import Link from "next/link";
import type { ReactNode } from "react";

export type MaterialCardAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type MaterialCardProps = {
  typeLabel?: string;
  title: string;
  description?: string;
  href: string;
  fitLabel?: string;
  insideLabel?: string;
  deadlineLabel?: string;
  selfHelpLabel?: string;
  lawyerNote?: string;
  trustLabels?: string[];
  disclaimer?: string;
  actions?: MaterialCardAction[];
  children?: ReactNode;
  className?: string;
};

export function MaterialCard({
  typeLabel,
  title,
  description,
  href,
  fitLabel,
  insideLabel,
  deadlineLabel,
  selfHelpLabel,
  lawyerNote,
  trustLabels = [],
  disclaimer,
  actions,
  children,
  className
}: MaterialCardProps) {
  const visibleActions = actions?.length ? actions : [{ href, label: "Открыть материал", variant: "secondary" as const }];
  const visibleTrustLabels = trustLabels.filter(Boolean);

  return (
    <article className={["flex h-full flex-col rounded-lg border border-line bg-white p-5 shadow-sm transition hover:border-trust", className].filter(Boolean).join(" ")}>
      {typeLabel || visibleTrustLabels.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {typeLabel ? <span className="rounded-full bg-trust/10 px-3 py-1 text-xs font-semibold text-trust">{typeLabel}</span> : null}
          {visibleTrustLabels.slice(0, 3).map((label) => (
            <span key={label} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
              {label}
            </span>
          ))}
        </div>
      ) : null}

      <Link href={href} className={typeLabel || visibleTrustLabels.length ? "mt-3 block" : "block"}>
        <h3 className="text-lg font-semibold leading-7 text-ink hover:text-trust">{title}</h3>
        {description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">{description}</p> : null}
      </Link>

      <div className="mt-4 grid gap-3 text-sm leading-6">
        <CardFact label="Подходит, если">{fitLabel}</CardFact>
        <CardFact label="Что внутри">{insideLabel}</CardFact>
        <CardFact label="Сроки" tone={deadlineLabel ? "warning" : "default"}>
          {deadlineLabel}
        </CardFact>
        <CardFact label="Можно самому">{selfHelpLabel}</CardFact>
      </div>

      {lawyerNote ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
          {lawyerNote}
        </p>
      ) : null}

      {children ? <div className="mt-4">{children}</div> : null}

      {disclaimer ? <p className="mt-4 text-xs leading-5 text-zinc-500">{disclaimer}</p> : null}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {visibleActions.map((action) => (
          <Link
            key={`${action.href}-${action.label}`}
            href={action.href}
            className={
              action.variant === "primary"
                ? "inline-flex min-h-10 items-center justify-center rounded-md bg-trust px-4 py-2 text-sm font-semibold text-white hover:bg-ink"
                : "inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust hover:text-trust"
            }
          >
            {action.label}
          </Link>
        ))}
      </div>
    </article>
  );
}

function CardFact({ label, tone = "default", children }: { label: string; tone?: "default" | "warning"; children?: ReactNode }) {
  if (!children) return null;

  return (
    <div className={tone === "warning" ? "rounded-md border border-amber-100 bg-amber-50 px-3 py-2" : "rounded-md bg-zinc-50 px-3 py-2"}>
      <p className={tone === "warning" ? "text-xs font-semibold uppercase tracking-wide text-amber-800" : "text-xs font-semibold uppercase tracking-wide text-zinc-500"}>{label}</p>
      <p className={tone === "warning" ? "mt-1 text-amber-950" : "mt-1 text-zinc-700"}>{children}</p>
    </div>
  );
}
