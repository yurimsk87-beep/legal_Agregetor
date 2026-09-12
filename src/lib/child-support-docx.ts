const SAFE_MARKERS = ["ЧЕРНОВИК", "ПРОЕКТ ДЛЯ НОТАРИУСА"];

export function ensureChildSupportDraftMarker(text: string) {
  const clean = text.trimStart();
  return SAFE_MARKERS.some((marker) => clean.startsWith(marker)) ? clean : `ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ\nТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА\n\n${clean}`;
}

export async function createChildSupportDocxBlob(text: string) {
  const { Document, Packer, Paragraph } = await import("docx");
  const document = new Document({ sections: [{ properties: {}, children: ensureChildSupportDraftMarker(text).split("\n").map((line) => new Paragraph({ text: line })) }] });
  return Packer.toBlob(document);
}

export function getChildSupportDocxFilename(slug: string) {
  return `PROEKT-${slug}.docx`;
}
