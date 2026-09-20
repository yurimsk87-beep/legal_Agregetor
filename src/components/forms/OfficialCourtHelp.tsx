import { ExternalLink } from "lucide-react";
import { OFFICIAL_COURT_SEARCH_URL } from "@/lib/court-source";

export function OfficialCourtHelp() {
  return (
    <aside className="rounded-md border border-line bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
      <a
        href={OFFICIAL_COURT_SEARCH_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-2 font-semibold text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30"
      >
        Найти суд и проверить территориальную подсудность
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
      <p className="mt-2">
        Найдите суд по адресу ответчика, откройте официальную страницу найденного суда и скопируйте ссылку из адресной строки браузера. Затем вставьте её ниже.
      </p>
      <p className="mt-1 text-xs text-zinc-600">Пример: https://...sudrf.ru/</p>
    </aside>
  );
}
