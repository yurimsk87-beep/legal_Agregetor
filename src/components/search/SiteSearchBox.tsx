import { Search } from "lucide-react";
import { SiteSearchInput } from "@/components/search/SiteSearchInput";
import type { AiNavigatorDropdownPage } from "@/components/ai/AiNavigatorDropdownPanel";
import { getPopularSearchHints } from "@/lib/site-search";

type SiteSearchBoxProps = {
  defaultValue?: string;
  title?: string;
  description?: string;
  compact?: boolean;
  headingLevel?: "h1" | "h2";
  aiNavigatorPage?: AiNavigatorDropdownPage;
};

const defaultTitle = "Опишите юридическую проблему — мы покажем, что делать дальше";
const defaultDescription = "Разберём ситуацию, покажем сроки и риски, подготовим документы и подскажем, когда стоит подключить юриста.";
const searchPlaceholder = "Например: пришёл судебный приказ, списали деньги с карты, не выплатили зарплату";

export function SiteSearchBox({ defaultValue = "", title = defaultTitle, description = defaultDescription, compact = false, headingLevel = "h2", aiNavigatorPage }: SiteSearchBoxProps) {
  const hints = getPopularSearchHints();
  const Heading = headingLevel;

  return (
    <section className={compact ? "min-w-0" : "min-w-0 rounded-lg border border-line bg-white p-4 shadow-sm sm:p-5"}>
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-md border border-line bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
          <Search className="h-4 w-4 text-trust" aria-hidden="true" />
          Юридическая помощь онлайн
        </div>
        <Heading className={headingLevel === "h1" ? "mt-4 text-3xl font-semibold text-ink sm:text-4xl lg:text-5xl" : "mt-4 text-2xl font-semibold text-ink sm:text-3xl"}>
          {title}
        </Heading>
        <p className="mt-3 text-base leading-7 text-zinc-600">{description}</p>
      </div>

      <SiteSearchInput defaultValue={defaultValue} hints={hints} placeholder={searchPlaceholder} aiNavigatorPage={aiNavigatorPage} />
    </section>
  );
}
