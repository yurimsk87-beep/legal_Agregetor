export function ensureParentalRightsRestrictionDraftMarker(text: string) {
  const clean = text.trimStart();
  return clean.startsWith("ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ") ? clean : `ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ\nТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА\n\n${clean}`;
}

export async function createParentalRightsRestrictionDocxBlob(text: string) {
  const { Document, Packer, Paragraph } = await import("docx");
  const document = new Document({ sections: [{ properties: {}, children: ensureParentalRightsRestrictionDraftMarker(text).split("\n").map((line) => new Paragraph({ text: line })) }] });
  return Packer.toBlob(document);
}

export function getParentalRightsRestrictionDocxFilename(slug: string) {
  return `CHERNOVIK-${slug}.docx`;
}

