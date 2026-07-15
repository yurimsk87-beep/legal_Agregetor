import { prisma } from "../src/lib/prisma";
import { cleanPublicCopy, cleanPublicFaq } from "../src/lib/public-copy";

const technicalMarkers = [
  "quality gate",
  "canonical",
  "noindex",
  "sitemap",
  "isindexable",
  "seopage",
  "primarykeyword",
  "ready_for_index",
  "seo-",
  "seo ",
  "индексац",
  "индексируем",
  "техническ",
  "фильтр",
  "дубли",
  "дубл",
  "пагинац",
  "краул",
  "mvp",
  "api"
];

async function main() {
  let updated = 0;

  for (const page of await prisma.seoPage.findMany({ select: { id: true, h1: true, seoText: true } })) {
    if (!hasTechnicalMarker(page.seoText)) continue;
    await prisma.seoPage.update({
      where: { id: page.id },
      data: { seoText: cleanPublicCopy(page.seoText, page.h1) }
    });
    updated += 1;
  }

  for (const city of await prisma.city.findMany({ select: { id: true, name: true, seoText: true } })) {
    if (!hasTechnicalMarker(city.seoText)) continue;
    await prisma.city.update({
      where: { id: city.id },
      data: { seoText: cleanPublicCopy(city.seoText, `Юристы в городе ${city.name}`) }
    });
    updated += 1;
  }

  for (const service of await prisma.service.findMany({ select: { id: true, name: true, fullDescription: true } })) {
    if (!hasTechnicalMarker(service.fullDescription)) continue;
    await prisma.service.update({
      where: { id: service.id },
      data: { fullDescription: cleanPublicCopy(service.fullDescription, service.name) }
    });
    updated += 1;
  }

  for (const faq of await prisma.faqItem.findMany({ select: { id: true, question: true, answer: true } })) {
    if (!hasTechnicalMarker(`${faq.question} ${faq.answer}`)) continue;
    const cleanFaq = cleanPublicFaq(faq.question, faq.answer);
    await prisma.faqItem.update({
      where: { id: faq.id },
      data: cleanFaq
    });
    updated += 1;
  }

  console.log(`Public copy cleanup complete. Updated rows: ${updated}`);
}

function hasTechnicalMarker(value: string) {
  const lower = value.toLowerCase();
  return technicalMarkers.some((marker) => lower.includes(marker));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
