export type EditableSupplementalDraft = { title: string; text: string };

export function composeDivorcePropertyDocumentText(
  mainText: string,
  supplementalDrafts: EditableSupplementalDraft[]
) {
  const supplementalText = supplementalDrafts
    .map((draft) => `${draft.title}\n${draft.text}`)
    .join("\n\n");
  return [mainText.trim(), supplementalText.trim()].filter(Boolean).join("\n\n");
}

export function getDivorcePropertyDocxFilename(documentSlug: string, filingReady: boolean) {
  return `${filingReady ? "" : "CHERNOVIK-"}${documentSlug}.docx`;
}

export async function createDivorcePropertyDocxBlob(
  mainText: string,
  supplementalDrafts: EditableSupplementalDraft[]
) {
  const { Document, Packer, Paragraph } = await import("docx");
  const text = composeDivorcePropertyDocumentText(mainText, supplementalDrafts);
  const document = new Document({
    sections: [{
      properties: {},
      children: text.split("\n").map((line) => new Paragraph({ text: line }))
    }]
  });
  return Packer.toBlob(document);
}
