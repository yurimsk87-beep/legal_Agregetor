"use client";

import { Check, ChevronDown } from "lucide-react";
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selected = options.find((option) => option.id === value);
  const filtered = useMemo(() => filterSearchableSelectOptions(options, query), [options, query]);

  useEffect(() => {
    if (!opened) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpened(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [opened]);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(filtered.length - 1, 0)));
  }, [filtered.length]);

  useEffect(() => {
    if (opened && filtered[activeIndex]) {
      document.getElementById(`${listboxId}-${filtered[activeIndex].id}`)?.scrollIntoView({ block: "nearest" });
    }
  }, [opened, activeIndex, filtered, listboxId]);

  function openList(last = false) {
    setQuery("");
    setActiveIndex(last ? Math.max(options.length - 1, 0) : 0);
    setOpened(true);
  }

  function choose(option: SearchableSelectOption) {
    onChange(option.id);
    setOpened(false);
    setQuery("");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!opened) {
        openList();
      } else {
        setActiveIndex((current) => Math.min(current + 1, Math.max(filtered.length - 1, 0)));
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!opened) {
        openList(true);
      } else {
        setActiveIndex((current) => Math.max(current - 1, 0));
      }
    } else if (event.key === "Enter" && opened) {
      event.preventDefault();
      if (filtered[activeIndex]) choose(filtered[activeIndex]);
    } else if (event.key === "Escape" && opened) {
      event.preventDefault();
      event.stopPropagation();
      setOpened(false);
      setQuery("");
      window.requestAnimationFrame(() => inputRef.current?.focus());
    } else if (event.key === "Tab") {
      setOpened(false);
      setQuery("");
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div
        className="flex min-h-11 w-full items-center gap-3 rounded-md border border-line bg-white px-3 text-left text-base font-normal text-ink hover:border-trust focus-within:border-trust focus-within:ring-2 focus-within:ring-trust/20"
      >
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-label={label}
          aria-controls={opened ? listboxId : undefined}
          aria-expanded={opened}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-activedescendant={opened && filtered[activeIndex] ? `${listboxId}-${filtered[activeIndex].id}` : undefined}
          aria-required={required}
          disabled={disabled}
          value={opened ? query : selected?.label ?? ""}
          placeholder={opened ? searchPlaceholder : placeholder}
          onClick={() => { if (!opened) openList(); }}
          onBlur={(event) => {
            if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
              setOpened(false);
              setQuery("");
            }
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            if (!opened) setOpened(true);
          }}
          onKeyDown={handleKeyDown}
          className="min-h-11 min-w-0 flex-1 bg-transparent text-base font-normal text-ink outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:text-zinc-500"
        />
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${opened ? "rotate-180" : ""}`} aria-hidden="true" />
      </div>

      {opened ? (
        <div className="absolute z-40 mt-2 w-full min-w-0 overflow-hidden rounded-md border border-line bg-white shadow-xl">
          <div id={listboxId} role="listbox" aria-label={label} className="max-h-64 overflow-y-auto overscroll-contain p-1">
            {filtered.length ? filtered.map((option, index) => (
              <button
                id={`${listboxId}-${option.id}`}
                key={option.id}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={option.id === value}
                onPointerMove={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
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
