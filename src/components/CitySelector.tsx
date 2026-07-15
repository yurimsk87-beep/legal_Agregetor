"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, MapPin, Search, X } from "lucide-react";
import type { City } from "@/lib/types";
import { sendAnalyticsEvent } from "@/lib/analytics-client";
import { cityChangedEventName, cityStorageKey, type StoredCitySelection } from "@/lib/city-selection";

const popularCityNames = [
  "Москва",
  "Санкт-Петербург",
  "Новосибирск",
  "Екатеринбург",
  "Казань",
  "Краснодар",
  "Ростов-на-Дону",
  "Самара",
  "Нижний Новгород",
  "Воронеж",
  "Уфа",
  "Пермь",
  "Челябинск",
  "Волгоград",
  "Тюмень"
];

export function CitySelector({ cities }: { cities: City[] }) {
  const [opened, setOpened] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StoredCitySelection>({ id: "", name: "Россия", slug: "" });
  const panelRef = useRef<HTMLDivElement | null>(null);

  const popularCities = useMemo(
    () => popularCityNames.map((name) => cities.find((city) => city.name === name)).filter(Boolean) as City[],
    [cities]
  );
  const filteredCities = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return cities;
    return cities.filter((city) => normalize(`${city.name} ${city.region}`).includes(normalizedQuery));
  }, [cities, query]);

  useEffect(() => {
    const stored = readStoredCity(cities);
    if (stored) {
      persistCity(stored);
      setSelected(stored);
      return;
    }

    const detected = detectCity(cities);
    if (detected) {
      persistCity(detected);
      setSelected(detected);
      sendAnalyticsEvent({
        type: "CITY_AUTODETECTED",
        targetType: "CITY",
        targetId: detected.id,
        payload: { slug: detected.slug }
      });
    }
  }, [cities]);

  useEffect(() => {
    if (!opened) return;

    function handlePointerDown(event: PointerEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpened(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [opened]);

  function chooseCity(city: StoredCitySelection) {
    persistCity(city);
    setSelected(city);
    setOpened(false);
    sendAnalyticsEvent({
      type: "CITY_SELECTED",
      targetType: city.id ? "CITY" : "COUNTRY",
      targetId: city.id || "russia",
      payload: { slug: city.slug || undefined }
    });
  }

  function autodetect() {
    const detected: StoredCitySelection = detectCity(cities) ?? { id: "", name: "Россия", slug: "", region: "" };
    chooseCity(detected);
    sendAnalyticsEvent({
      type: "CITY_AUTODETECTED",
      targetType: detected.id ? "CITY" : "COUNTRY",
      targetId: detected.id || "russia",
      payload: { slug: detected.slug || undefined }
    });
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpened((value) => !value)}
        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium text-zinc-700 hover:border-trust"
        aria-expanded={opened}
      >
        <MapPin className="h-4 w-4 text-trust" aria-hidden="true" />
        {selected.name}
      </button>
      {opened ? (
        <div className="absolute left-0 top-12 z-50 w-[min(92vw,420px)] rounded-lg border border-line bg-white p-4 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase text-zinc-500">Текущий регион</p>
              <p className="mt-1 font-semibold text-ink">{selected.name}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpened(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-zinc-600 hover:border-trust"
              aria-label="Закрыть выбор города"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <label className="mt-4 flex min-h-10 items-center gap-2 rounded-md border border-line px-3">
            <Search className="h-4 w-4 text-zinc-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск города..."
              className="w-full text-sm outline-none"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={autodetect}
              className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-trust"
            >
              <LocateFixed className="h-4 w-4" aria-hidden="true" />
              Автоопределение
            </button>
            <button
              type="button"
              onClick={() => chooseCity({ id: "", name: "Россия", slug: "" })}
              className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-trust"
            >
              Россия
            </button>
          </div>
          <CityButtonGroup title="Популярные города" cities={popularCities} onChoose={chooseCity} />
          <div className="mt-4">
            <p className="text-xs font-medium uppercase text-zinc-500">Все города</p>
            <div className="mt-2 max-h-56 overflow-auto rounded-md border border-line">
              {filteredCities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => chooseCity(city)}
                  className="flex w-full items-center justify-between gap-3 border-b border-line px-3 py-2 text-left text-sm last:border-b-0 hover:bg-zinc-50"
                >
                  <span className="font-medium text-ink">{city.name}</span>
                  <span className="text-xs text-zinc-500">{city.region}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CityButtonGroup({ title, cities, onChoose }: { title: string; cities: City[]; onChoose: (city: City) => void }) {
  if (cities.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-xs font-medium uppercase text-zinc-500">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {cities.map((city) => (
          <button
            key={city.id}
            type="button"
            onClick={() => onChoose(city)}
            className="rounded-md border border-line px-3 py-2 text-sm text-ink hover:border-trust"
          >
            {city.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function readStoredCity(cities: City[]): StoredCitySelection | null {
  try {
    const value = window.localStorage.getItem(cityStorageKey);
    if (!value) return null;
    const parsed = JSON.parse(value) as StoredCitySelection;
    if (!parsed.id) return { id: "", name: "Россия", slug: "" };
    return cities.find((city) => city.id === parsed.id || city.slug === parsed.slug) ?? null;
  } catch {
    return null;
  }
}

function persistCity(city: StoredCitySelection) {
  window.localStorage.setItem(cityStorageKey, JSON.stringify({ id: city.id, name: city.name, slug: city.slug, region: city.region ?? "" }));
  document.cookie = `${cityStorageKey}=${encodeURIComponent(city.slug || "russia")}; Path=/; Max-Age=31536000; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent(cityChangedEventName, { detail: city }));
}

function detectCity(cities: City[]) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timeZone === "Europe/Moscow") {
    return cities.find((city) => city.slug === "moskva") ?? null;
  }
  if (timeZone === "Asia/Yekaterinburg") {
    return cities.find((city) => city.slug === "ekaterinburg") ?? null;
  }
  return null;
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/ё/g, "е");
}
