import Link from "next/link";
import { Calculator, FileQuestion, FileText, Info, Route } from "lucide-react";
import { getCities } from "@/lib/repositories";
import { CitySelector } from "@/components/CitySelector";
import { HeaderCabinetButton } from "@/components/HeaderCabinetButton";

const nav = [
  { href: "/problems/", label: "Ситуации", icon: Route },
  { href: "/documents/", label: "Документы", icon: FileText },
  { href: "/tools/", label: "Инструменты", icon: Calculator },
  { href: "/about/", label: "О проекте", icon: Info }
];

export async function Header() {
  const cities = await getCities();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
          <Link href="/" aria-label="ПравоПоиск" className="flex shrink-0 items-center gap-2 font-semibold text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-trust text-sm font-bold text-white">ПП</span>
            <span className="hidden sm:inline">ПравоПоиск</span>
          </Link>
          <CitySelector cities={cities} />
        </div>
        <nav className="hidden min-w-0 items-center gap-1 lg:flex">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-ink"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <HeaderCabinetButton />
          <Link
            href="/questions/#question"
            className="inline-flex min-h-11 max-w-full min-w-0 shrink-0 items-center justify-center gap-1 rounded-md bg-trust px-2.5 py-3 text-xs font-semibold text-white transition hover:bg-ink sm:gap-2 sm:px-5 sm:text-sm"
          >
            <FileQuestion className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Задать вопрос</span>
            <span className="sm:hidden">Вопрос</span>
          </Link>
        </div>
      </div>
      <nav className="border-t border-line px-3 py-2 sm:px-6 lg:hidden" aria-label="Основная навигация">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-trust hover:text-trust"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
