"use client";

export type LegalFormOption = { value: string; label: string };

export function LegalFormField({
  id, label, value, onChange, kind = "text", required = false,
  hint, error, options, rows = 4
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  kind?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  options?: readonly LegalFormOption[];
  rows?: number;
}) {
  const inputClass = `min-h-11 w-full rounded-md border bg-white px-3 py-2 text-base font-normal text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/30 ${error ? "border-red-600" : "border-line"}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const props = {
    id, value, required, "aria-invalid": Boolean(error),
    "aria-describedby": describedBy,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
    className: inputClass
  };
  const inputType = ["text", "date", "email", "tel", "number"].includes(kind) ? kind : "text";
  return <div className="grid min-w-0 content-start gap-2 text-sm font-semibold text-ink">
    <label htmlFor={id}>{label}{required ? <span aria-hidden="true" className="text-red-700"> *</span> : null}</label>
    {kind === "select" ? <select {...props}>
      <option value="">Выберите вариант</option>
      {options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select> : kind === "textarea" ? <textarea {...props} rows={rows} className={`${inputClass} min-h-28`} />
      : <input {...props} type={inputType} min={kind === "number" ? 0 : undefined} />}
    {hint ? <p id={hintId} className="text-xs font-normal leading-5 text-zinc-600">{hint}</p> : null}
    {error ? <p id={errorId} className="text-sm font-normal text-red-700" role="alert">{error}</p> : null}
  </div>;
}
