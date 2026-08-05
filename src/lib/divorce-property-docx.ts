export type EditableSupplementalDraft = { title: string; text: string };

export function composeDivorcePropertyDocumentText(
  mainText: string,
  supplementalDrafts: EditableSupplementalDraft[],
  filingReady = true
) {
  const safeMainText = ensureDivorcePropertyDraftMarker(mainText, filingReady);
  const supplementalText = supplementalDrafts
    .map((draft) => `${draft.title}\n${draft.text}`)
    .join("\n\n");
  return [safeMainText.trim(), supplementalText.trim()].filter(Boolean).join("\n\n");
}

export function ensureDivorcePropertyDraftMarker(text: string, filingReady: boolean) {
  if (filingReady || text.trimStart().startsWith("ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ")) return text;
  return `ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ\nТребуется индивидуальная юридическая проверка.\n\n${text.trimStart()}`;
}

export function getDivorcePropertyDocxFilename(documentSlug: string, filingReady: boolean) {
  return `${filingReady ? "" : "CHERNOVIK-"}${documentSlug}.docx`;
}

export async function createDivorcePropertyDocxBlob(
  mainText: string,
  supplementalDrafts: EditableSupplementalDraft[],
  filingReady = true
) {
  const { Document, Packer, Paragraph } = await import("docx");
  const text = composeDivorcePropertyDocumentText(mainText, supplementalDrafts, filingReady);
  const document = new Document({
    sections: [{
      properties: {},
      children: text.split("\n").map((line) => new Paragraph({ text: line }))
    }]
  });
  return Packer.toBlob(document);
}
