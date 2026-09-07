const DRAFT_MARKER = "ЧЕРНОВИК — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА";

export function ensureGuardianshipDraftMarker(text: string) {
  const clean = text.trimStart();
  if (clean.startsWith(DRAFT_MARKER)) return clean;
  return `${DRAFT_MARKER}\nНе является официальной формой или готовым к подаче судебным документом.\n\n${clean}`;
}

export function getGuardianshipDocxFilename(slug: string) {
  return `CHERNOVIK-${slug}.docx`;
}

export async function createGuardianshipDocxBlob(text: string) {
  const { Document, Packer, Paragraph } = await import("docx");
  const marked = ensureGuardianshipDraftMarker(text);
  const document = new Document({
    sections: [{ properties: {}, children: marked.split("\n").map((line) => new Paragraph({ text: line })) }]
  });
  return Packer.toBlob(document);
}
