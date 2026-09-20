import { ExternalLink } from "lucide-react";
import { getOfficialServiceForField, OFFICIAL_SERVICE_LINKS, type OfficialServiceKind } from "@/data/official-service-links";

export function OfficialServiceHelp({ kind }: { kind: OfficialServiceKind }) {
  const helper = OFFICIAL_SERVICE_LINKS[kind];
  return (
    <aside className="rounded-md border border-line bg-zinc-50 p-4 text-sm font-normal leading-6 text-zinc-700">
      {helper.url ? <a href={helper.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">
        {helper.label}<ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a> : <p className="font-semibold text-ink">{helper.label}</p>}
      <p className="mt-2">{helper.description}</p>
      <p className="mt-1 text-xs text-zinc-600">Источник: {helper.source}. Проверено {helper.checkedAt}.</p>
    </aside>
  );
}

export function OfficialFieldHelp({ fieldName }: { fieldName: string }) {
  const kind = getOfficialServiceForField(fieldName);
  return kind ? <OfficialServiceHelp kind={kind} /> : null;
}

