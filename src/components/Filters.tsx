import { SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import type { City, Service } from "@/lib/types";

export function Filters({ cities, services, basePath }: { cities: City[]; services: Service[]; basePath: string }) {
  return (
    <section className="w-full min-w-0 rounded-lg border border-line bg-white p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Фильтры
      </div>
      <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select className="w-full min-w-0 rounded-md border border-line px-3 py-2 text-sm">
          <option>Город</option>
          {cities.map((city) => (
            <option key={city.id}>{city.name}</option>
          ))}
        </select>
        <select className="w-full min-w-0 rounded-md border border-line px-3 py-2 text-sm">
          <option>Услуга</option>
          {services.map((service) => (
            <option key={service.id}>{service.name}</option>
          ))}
        </select>
        <select className="w-full min-w-0 rounded-md border border-line px-3 py-2 text-sm">
          <option>Статус</option>
          <option>Юрист</option>
          <option>Адвокат</option>
        </select>
        <select className="w-full min-w-0 rounded-md border border-line px-3 py-2 text-sm">
          <option>Сортировка</option>
          <option>Цена ниже</option>
        </select>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <FilterSubmit basePath={basePath} name="online" value="true">
          Онлайн
        </FilterSubmit>
        <FilterSubmit basePath={basePath} name="price" value="low">
          Цена ниже
        </FilterSubmit>
      </div>
    </section>
  );
}

function FilterSubmit({
  basePath,
  name,
  value,
  children
}: {
  basePath: string;
  name: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <form action={basePath} method="get">
      <input type="hidden" name={name} value={value} />
      <button type="submit" className="rounded-md border border-line px-3 py-2 text-sm hover:border-trust">
        {children}
      </button>
    </form>
  );
}
