"use client";
import { useState } from "react";
import { addDocumentVersion, type DocumentVersionEntry } from "@/lib/document-version-history";
import { createLegacyFamilyDocumentResult, type LegacyFamilyOutcome } from "@/lib/legacy-family-document-result";
import type { DocumentResultV1 } from "@/lib/document-result-contract";

/** All sensitive versions live only in React memory in the active tab. */
export function useLegacyFamilyDocumentVersions<TDecision extends LegacyFamilyOutcome, TValues extends object>(config: {
  routeSlug: string;
  scenarioKey: string;
  documentSlug: string;
  reviewedAt: string;
}) {
  type Snapshot = { decision: TDecision; draft: string; values: TValues };
  const [versions, setVersions] = useState<DocumentVersionEntry<Snapshot>[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const visibleVersions = versions.filter((entry) => entry.documentResult.scenarioKey === config.scenarioKey && entry.documentResult.routeSlug === config.routeSlug && entry.documentResult.documentSlug === config.documentSlug);
  const currentEntry = visibleVersions.find((entry) => entry.documentResult.versionId === activeVersionId);
  const current = currentEntry?.documentResult ?? null;

  function record(decision: TDecision, draft: string, values: TValues, source: DocumentResultV1["source"] = "DETERMINISTIC") {
    const result = createLegacyFamilyDocumentResult({ ...config, decision, draft, source });
    setActiveVersionId(result?.versionId ?? null);
    setDirty(false);
    if (result) setVersions((old) => addDocumentVersion(old, {
      documentResult: result,
      payload: { decision, draft, values: { ...values } }
    }));
    return result;
  }

  function clear() {
    setActiveVersionId(null);
    setDirty(false);
  }

  function markDirty(nextText: string) {
    setDirty(nextText !== (currentEntry?.payload.draft ?? ""));
  }

  function restore(versionId: string): Snapshot | null {
    const entry = visibleVersions.find((item) => item.documentResult.versionId === versionId);
    if (!entry) return null;
    setActiveVersionId(versionId);
    setDirty(false);
    return { ...entry.payload, values: { ...entry.payload.values } };
  }

  return {
    versions: visibleVersions.map((entry) => entry.documentResult),
    current,
    activeVersionId,
    dirty,
    canDownload: Boolean(current && !dirty),
    record,
    clear,
    markDirty,
    restore
  };
}
