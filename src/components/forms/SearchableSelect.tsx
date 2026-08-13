"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  filterSearchableSelectOptions,
  type SearchableSelectOption
} from "@/lib/searchable-select";

type SearchableSelectProps = {
  id: string;
  label: string;
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  required?: boolean;
};

export function SearchableSelect({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = "Выберите значение",
  searchPlaceholder = "Начните вводить название",
  emptyText = "Ничего не найдено",
  disabled = false,
  required = false
}: SearchableSelectProps) {
  const generatedId = useId().replace(/:/g, "");
  const listboxId = `${id}-${generatedId}-listbox`;
  const [opened, setOpened] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const selected = options.find((option) => option.id === value);
  const filtered = useMemo(() => filterSearchableSelectOptions(options, query), [options, query]);

  useEffect(() => {
    if (!opened) return;
    setQuery("");
    setActiveIndex(0);
    window.requestAnimationFrame(() => searchRef.current?.focus());

    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpened(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [opened]);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(filtered.length - 1, 0)));
  }, [filtered.length]);

  function choose(option: SearchableSelectOption) {
    onChange(option.id);
    setOpened(false);
    setQuery("");
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && filtered[activeIndex]) {
      event.preventDefault();
      choose(filtered[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpened(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        role="combobox"
        aria-label={label}
        aria-controls={listboxId}
        aria-expanded={opened}
        aria-haspopup="listbox"
        aria-required={required}
        disabled={disabled}
        onClick={() => setOpened((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !opened) {
            event.preventDefault();
            setOpened(true);
          }
          if (event.key === "Escape") setOpened(false);
        }}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-line bg-white px-3 py-2 text-left text-base font-normal text-ink outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
      >
        <span className={selected ? "" : "text-zinc-500"}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${opened ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {opened ? (
        <div className="absolute z-40 mt-2 w-full min-w-0 overflow-hidden rounded-md border border-line bg-white shadow-xl">
          <div className="border-b border-line p-2">
            <label className="flex min-h-11 items-center gap-2 rounded-md border border-line px-3 focus-within:border-trust focus-within:ring-2 focus-within:ring-trust/20">
              <Search className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
              <span className="sr-only">Поиск: {label}</span>
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={searchPlaceholder}
                aria-controls={listboxId}
                aria-activedescendant={filtered[activeIndex] ? `${listboxId}-${filtered[activeIndex].id}` : undefined}
                className="min-w-0 flex-1 bg-transparent py-2 text-base font-normal text-ink outline-none"
              />
            </label>
          </div>
          <div id={listboxId} role="listbox" aria-label={label} className="max-h-64 overflow-y-auto overscroll-contain p-1">
            {filtered.length ? filtered.map((option, index) => (
              <button
                id={`${listboxId}-${option.id}`}
                key={option.id}
                type="button"
                role="option"
                aria-selected={option.id === value}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option)}
                className={`flex min-h-11 w-full items-start justify-between gap-3 rounded px-3 py-2 text-left text-sm outline-none focus:ring-2 focus:ring-trust/30 ${index === activeIndex ? "bg-zinc-100" : "hover:bg-zinc-50"}`}
              >
                <span className="min-w-0">
                  <span className="block font-medium text-ink">{option.label}</span>
                  {option.description ? <span className="mt-0.5 block text-xs leading-5 text-zinc-600">{option.description}</span> : null}
                </span>
                {option.id === value ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-trust" aria-hidden="true" /> : null}
              </button>
            )) : <p className="px-3 py-4 text-sm text-zinc-600">{emptyText}</p>}
          </div>
        </div>
      ) : null}
    </div>
  );
}
