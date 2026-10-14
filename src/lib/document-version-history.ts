import type { DocumentResultV1 } from "@/lib/document-result-contract";

export type DocumentVersionEntry<T> = { documentResult: DocumentResultV1; payload: T };
export const MAX_OPEN_TAB_DOCUMENT_VERSIONS = 6;

/**
 * Snapshots contain private facts. They remain in React memory only — never
 * place them in a URL, localStorage, analytics or an unprotected cookie.
 */
export function addDocumentVersion<T>(
  previous: readonly DocumentVersionEntry<T>[],
  next: DocumentVersionEntry<T>
): DocumentVersionEntry<T>[] {
  const rest = previous.filter((entry) => entry.documentResult.versionId !== next.documentResult.versionId);
  return [next, ...rest].slice(0, MAX_OPEN_TAB_DOCUMENT_VERSIONS);
}
