"use client";

import { useEffect, useMemo, useState } from "react";
import { LawyerCard } from "@/components/LawyerCard";
import { cityChangedEventName, cityStorageKey, type StoredCitySelection } from "@/lib/city-selection";
import type { Lawyer } from "@/lib/types";

type ExpandableLawyerGridProps = {
  lawyers: Lawyer[];
  initialCount?: number;
  maxCount?: number;
  filterBySelectedRegion?: boolean;
};

export function ExpandableLawyerGrid({ lawyers, initialCount = 4, maxCount = 10, filterBySelectedRegion = true }: ExpandableLawyerGridProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedCity, setSelectedCity] = useState<StoredCitySelection | null>(null);
  const filteredLawyers = useMemo(() => filterLawyersBySelectedRegion(lawyers, selectedCity, filterBySelectedRegion), [filterBySelectedRegion, lawyers, selectedCity]);
  const visibleLimit = expanded ? maxCount : initialCount;
  const visibleLawyers = filteredLawyers.slice(0, visibleLimit);
  const canShowMore = filteredLawyers.length > initialCount && !expanded;

  useEffect(() => {
    if (!filterBySelectedRegion) return;

    function updateSelectedCity(event?: Event) {
      const customEvent = event instanceof CustomEvent ? event : null;
      setSelectedCity(customEvent?.detail ?? readStoredCitySelection());
    }

    updateSelectedCity();
    window.addEventListener(cityChangedEventName, updateSelectedCity);
    window.addEventListener("storage", updateSelectedCity);

    return () => {
      window.removeEventListener(cityChangedEventName, updateSelectedCity);
      window.removeEventListener("storage", updateSelectedCity);
    };
  }, [filterBySelectedRegion]);

  useEffect(() => {
    setExpanded(false);
  }, [selectedCity?.slug]);

  if (!filteredLawyers.length && selectedCity?.region) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white p-5 text-sm leading-6 text-zinc-600">
        В выбранном регионе пока нет юристов по этой теме. Вы можете изменить регион или задать вопрос через платформу.
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-2">
        {visibleLawyers.map((lawyer) => (
          <LawyerCard key={lawyer.id} lawyer={lawyer} compact />
        ))}
      </div>
      {canShowMore ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-trust hover:text-trust"
        >
          Показать еще
        </button>
      ) : null}
    </div>
  );
}

function filterLawyersBySelectedRegion(lawyers: Lawyer[], selectedCity: StoredCitySelection | null, shouldFilter: boolean) {
  if (!shouldFilter || !selectedCity?.region) return lawyers;

  return lawyers.filter((lawyer) =>
    lawyer.cities.some((city) => city.slug === selectedCity.slug || normalizeRegion(city.region) === normalizeRegion(selectedCity.region ?? ""))
  );
}

function readStoredCitySelection(): StoredCitySelection | null {
  try {
    const value = window.localStorage.getItem(cityStorageKey);
    if (!value) return null;
    const parsed = JSON.parse(value) as StoredCitySelection;
    return parsed.id ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeRegion(value: string) {
  return value.toLowerCase().replace(/ё/g, "е").trim();
}
