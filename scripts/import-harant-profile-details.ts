import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

type HarantProfileRow = {
  description?: string | null;
  education?: string | null;
  specialization?: string | null;
  servicesAndPrices?: string | null;
  reviews?: string | null;
};

type ParsedPriceItem = {
  title: string;
  priceFrom: number;
  priceTo?: number;
};

type Gender = "female" | "male";

const prisma = new PrismaClient();

async function main() {
  const inputPath = path.resolve(process.argv[2] ?? "harant_parser/outputs/harant_500_lawyers.json");
  const sourceRows = JSON.parse(fs.readFileSync(inputPath, "utf8")) as HarantProfileRow[];
  const rows = prioritizeRows(sourceRows);

  const lawyers = await prisma.lawyer.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      profile: true,
      services: { include: { service: true } },
      cities: { include: { city: true } }
    }
  });
  const serviceRows = rows.filter((row) => Boolean(cleanText(row.servicesAndPrices)));

  const total = Math.min(rows.length, lawyers.length);
  let updatedProfiles = 0;
  let malePhotos = 0;
  let femalePhotos = 0;
  let assignedPhotos = 0;
  let profilesWithoutUniquePhoto = 0;
  let importedReviews = 0;
  let importedPriceItems = 0;
  let skippedPriceLines = 0;

  for (let index = 0; index < total; index++) {
    const row = rows[index];
    const lawyer = lawyers[index];
    const gender = inferGender(lawyer);
    const photoUrl = generatedLawyerPhotoUrl(lawyer.slug);
    const description = cleanDescription(row.description) ?? buildFallbackDescription(lawyer);
    const education = cleanText(row.education) ?? lawyer.education;
    const specializationText = cleanText(row.specialization);
    const servicesAndPricesText = cleanText(row.servicesAndPrices) ?? cleanText(serviceRows[index % serviceRows.length]?.servicesAndPrices);
    const reviewsText = cleanText(row.reviews);
    const reviewTexts = splitReviews(reviewsText);
    const primaryServiceId = lawyer.primaryServiceId ?? lawyer.services.find((item) => item.isPrimary)?.serviceId ?? lawyer.services[0]?.serviceId ?? null;
    const primaryCityId = lawyer.cities.find((item) => item.isPrimary)?.cityId ?? lawyer.cities[0]?.cityId ?? null;
    const priceItems = splitLines(servicesAndPricesText)
      .map(parsePriceItem)
      .filter((item): item is ParsedPriceItem => Boolean(item));
    const firstPrice = priceItems[0]?.priceFrom ?? null;

    skippedPriceLines += Math.max(0, splitLines(servicesAndPricesText).length - priceItems.length);

    await prisma.$transaction(async (tx) => {
      await tx.lawyer.update({
        where: { id: lawyer.id },
        data: {
          photoUrl,
          description,
          education,
          reviewCount: reviewTexts.length,
          consultationPrice: firstPrice
        }
      });

      await tx.lawyerProfile.upsert({
        where: { lawyerId: lawyer.id },
        create: {
          lawyerId: lawyer.id,
          about: description,
          specializationText,
          servicesAndPricesText,
          reviewsText
        },
        update: {
          about: description,
          specializationText,
          servicesAndPricesText,
          reviewsText
        }
      });

      await tx.review.deleteMany({ where: { lawyerId: lawyer.id } });
      if (reviewTexts.length) {
        await tx.review.createMany({
          data: reviewTexts.map((text, reviewIndex) => ({
            lawyerId: lawyer.id,
            serviceId: primaryServiceId,
            cityId: primaryCityId,
            userName: `Клиент ${reviewIndex + 1}`,
            rating: 5,
            text,
            hasRealExperienceConsent: true,
            realExperienceConsentAt: new Date(),
            qualityStatus: "APPROVED",
            isModerated: true,
            createdAt: new Date(Date.now() - reviewIndex * 86_400_000)
          }))
        });
      }

      await tx.priceItem.deleteMany({ where: { lawyerId: lawyer.id } });
      if (primaryServiceId && priceItems.length) {
        await tx.priceItem.createMany({
          data: priceItems.map((item) => ({
            lawyerId: lawyer.id,
            serviceId: primaryServiceId,
            title: item.title,
            priceFrom: item.priceFrom,
            priceTo: item.priceTo
          }))
        });
      }
    });

    updatedProfiles++;
    if (photoUrl) {
      assignedPhotos++;
    } else {
      profilesWithoutUniquePhoto++;
    }
    if (gender === "female") femalePhotos++;
    if (gender === "male") malePhotos++;
    importedReviews += reviewTexts.length;
    importedPriceItems += primaryServiceId ? priceItems.length : 0;
  }

  console.log(
    JSON.stringify(
      {
        rowsAvailable: sourceRows.length,
        rowsSelectedForImport: rows.length,
        rowsWithServicesAndPrices: sourceRows.filter((row) => Boolean(cleanText(row.servicesAndPrices))).length,
        lawyersFound: lawyers.length,
        updatedProfiles,
        malePhotos,
        femalePhotos,
        assignedPhotos,
        profilesWithoutUniquePhoto,
        importedReviews,
        importedPriceItems,
        skippedPriceLines,
        unusedRows: Math.max(0, sourceRows.length - updatedProfiles)
      },
      null,
      2
    )
  );
}

function prioritizeRows(rows: HarantProfileRow[]) {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => rowScore(right.row) - rowScore(left.row) || left.index - right.index)
    .map((item) => item.row);
}

function rowScore(row: HarantProfileRow) {
  const description = cleanDescription(row.description);

  return (
    (cleanText(row.servicesAndPrices) ? 100_000 : 0) +
    (cleanText(row.reviews) ? 10_000 : 0) +
    (cleanText(row.education) ? 1_000 : 0) +
    (cleanText(row.specialization) ? 100 : 0) +
    Math.min(description?.length ?? 0, 4_000)
  );
}

function cleanText(value?: string | null) {
  if (!value) return null;

  const normalized = value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return normalized || null;
}

function cleanDescription(value?: string | null) {
  const normalized = cleanText(value);
  if (!normalized) return null;

  if (hasContactData(normalized)) return null;

  const cleaned = normalized
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter((sentence) => !hasPersonalProfileMarker(sentence))
    .filter((sentence) => !hasFirstPersonMarker(sentence))
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned.length >= 80 ? cleaned : null;
}

function hasContactData(value: string) {
  return /(?:\+?\d[\d\s().-]{8,}\d|@|https?:\/\/|www\.|t\.me\/|wa\.me\/|telegram|whatsapp)/i.test(value);
}

function hasPersonalProfileMarker(sentence: string) {
  return (
    /\b(?:адвокат|юрист|специалист)\s+[А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+){1,2}\b/.test(sentence) ||
    /\b[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\s*[-—–]\s*(?:адвокат|юрист|специалист)\b/.test(sentence) ||
    /\b[А-ЯЁ][а-яё]{2,}\s+[А-ЯЁ][а-яё]{2,}\s+[А-ЯЁ][а-яё]{2,}\b/.test(sentence) ||
    /\b[МM][еe]ня\s+з[оo]вут\s+[А-ЯЁ][а-яё]+/i.test(sentence) ||
    /\b(?:адвокат|юрист|специалист)\s+в\s+[А-ЯЁ][а-яё-]+/.test(sentence) ||
    /\b(?:г\.|город|в городе)\s*[А-ЯЁ][а-яё-]+/.test(sentence)
  );
}

function hasFirstPersonMarker(sentence: string) {
  return /(^|[\s,.;:!?])(?:я|мой|моя|мои|моё|мое|меня|мне|мной|моих|моим|моего|моей|мою)(?=$|[\s,.;:!?])/i.test(sentence);
}

function buildFallbackDescription(lawyer: {
  experienceYears: number;
  services: Array<{ service: { name: string } }>;
  cities: Array<{ city: { name: string } }>;
}) {
  const serviceNames = lawyer.services
    .map((item) => item.service.name)
    .filter(Boolean)
    .slice(0, 6);
  const cityName = lawyer.cities[0]?.city.name ?? "России";
  const serviceText = serviceNames.length ? `Основные направления: ${serviceNames.join(", ")}.` : "Основные направления работы уточняются по задаче клиента.";

  return `Юридическая помощь в городе ${cityName}. Специалист ведет консультации, готовит документы и сопровождает клиентов по профильным правовым вопросам. ${serviceText} Опыт работы: ${lawyer.experienceYears} лет.`;
}

function inferGender(lawyer: { firstName: string; lastName: string; middleName?: string | null }): Gender {
  const firstName = lawyer.firstName.toLowerCase();
  const middleName = lawyer.middleName?.toLowerCase() ?? "";
  const lastName = lawyer.lastName.toLowerCase();
  const femaleFirstNames = new Set([
    "анна",
    "алена",
    "алёна",
    "александра",
    "анастасия",
    "валентина",
    "валерия",
    "вера",
    "виктория",
    "галина",
    "дарья",
    "елена",
    "елизавета",
    "екатерина",
    "жанна",
    "зоя",
    "ина",
    "инна",
    "ирина",
    "кристина",
    "ксения",
    "лариса",
    "любовь",
    "людмила",
    "маргарита",
    "марина",
    "мария",
    "надежда",
    "наталья",
    "нина",
    "оксана",
    "ольга",
    "полина",
    "светлана",
    "софия",
    "татьяна",
    "юлия"
  ]);
  const maleFirstNames = new Set([
    "азамат",
    "александр",
    "алексей",
    "андрей",
    "антон",
    "артем",
    "артём",
    "борис",
    "вадим",
    "валерий",
    "василий",
    "виктор",
    "виталий",
    "владимир",
    "владислав",
    "вячеслав",
    "геннадий",
    "георгий",
    "григорий",
    "денис",
    "дмитрий",
    "евгений",
    "иван",
    "игорь",
    "илья",
    "кирилл",
    "константин",
    "лев",
    "максим",
    "михаил",
    "никита",
    "николай",
    "олег",
    "павел",
    "петр",
    "пётр",
    "роман",
    "сергей",
    "станислав",
    "тимур",
    "юрий",
    "ярослав"
  ]);

  if (/(вна|ична|кызы)$/.test(middleName)) return "female";
  if (/(вич|оглы)$/.test(middleName)) return "male";
  if (femaleFirstNames.has(firstName)) return "female";
  if (maleFirstNames.has(firstName)) return "male";
  if (/(ова|ева|ёва|ина|ая|ская|цкая)$/.test(lastName)) return "female";
  if (/(ов|ев|ёв|ин|ый|ий|ой|ский|цкий)$/.test(lastName)) return "male";
  if (/[ая]$/.test(firstName) && firstName !== "илья" && firstName !== "никита") return "female";

  return "male";
}

function generatedLawyerPhotoUrl(slug: string) {
  return `/generated-lawyer-photos/${slug}.png?v=realistic-headshots-20260609`;
}


function splitLines(value?: string | null) {
  if (!value) return [];

  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitReviews(value?: string | null) {
  if (!value) return [];

  return value
    .split(/\n\s*(?:-{3,}|={3,})\s*\n|\n{2,}/)
    .map((item) => cleanText(item))
    .filter((item): item is string => Boolean(item));
}

function parsePriceItem(line: string): ParsedPriceItem | null {
  const normalized = line.replace(/\s+[—–]\s+/g, " - ").trim();
  const [beforeDelimiter, ...afterDelimiter] = normalized.split(/\s+-\s+/);
  const rawTitle = beforeDelimiter || normalized;
  const priceSource = afterDelimiter.join(" - ") || normalized;
  const numbers = [...priceSource.matchAll(/\d[\d\s]*/g)]
    .map((match) => Number(match[0].replace(/\s+/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!numbers.length) return null;

  const firstNumberIndex = rawTitle.search(/\d[\d\s]*/);
  const title = (firstNumberIndex > 0 ? rawTitle.slice(0, firstNumberIndex) : rawTitle)
    .replace(/[:\-–—]+$/g, "")
    .trim();

  return {
    title: title || "Услуга",
    priceFrom: numbers[0],
    priceTo: numbers[1] && numbers[1] !== numbers[0] ? numbers[1] : undefined
  };
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
