const DRAFT_MARKER = "ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ";

export function ensureParentsChildDraftMarker(text: string) {
  const clean = text.trimStart();
  return clean.startsWith(DRAFT_MARKER) || clean.startsWith("ПРОЕКТ СОГЛАШЕНИЯ")
    ? clean
    : `${DRAFT_MARKER}\nТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА\n\n${clean}`;
}

export async function createParentsChildDocxBlob(text: string) {
  const { Document, Packer, Paragraph } = await import("docx");
  const document = new Document({
    sections: [{ properties: {}, children: ensureParentsChildDraftMarker(text).split("\n").map((line) => new Paragraph({ text: line })) }]
  });
  return Packer.toBlob(document);
}

export function getParentsChildDocxFilename(slug: string) {
  return `CHERNOVIK-${slug}.docx`;
}
