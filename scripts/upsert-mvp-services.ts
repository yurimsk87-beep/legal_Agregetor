import { PrismaClient } from "@prisma/client";
import { services } from "../src/lib/sample-data";

const prisma = new PrismaClient();

const targetServiceSlugs = [
  "semeynye-spory",
  "nasledstvo",
  "zhilishchnye-spory",
  "nedvizhimost",
  "zemelnye-spory",
  "trudovye-spory",
  "zashchita-prav-potrebiteley",
  "avtoyurist",
  "kredity-dolgi",
  "ispolnitelnoe-proizvodstvo",
  "bankrotstvo-fizicheskih-lits",
  "administrativnye-dela",
  "ugolovnye-dela",
  "migratsionnoe-pravo",
  "pensionnye-spory",
  "sotsialnye-vyplaty",
  "meditsinskoe-pravo",
  "nalogovye-spory",
  "biznes-dogovory",
  "arbitrazhnye-spory",
  "korporativnye-spory",
  "bankrotstvo-biznesa",
  "intellektualnaya-sobstvennost",
  "it-pravo",
  "personalnye-dannye",
  "voennoe-pravo",
  "obrazovatelnoe-pravo",
  "strahovye-spory",
  "zashchita-chesti-dostoinstva",
  "ekologicheskoe-pravo",
  "tamozhennoe-pravo",
  "mezhdunarodnoe-pravo"
];

const legacyAliases: Record<string, string> = {
  "administrativnoe-pravo": "administrativnye-dela",
  arbitrazh: "arbitrazhnye-spory",
  "bankrotstvo-fizicheskih-lic": "bankrotstvo-fizicheskih-lits",
  "biznes-i-arbitrazh": "biznes-dogovory",
  dolgi: "kredity-dolgi",
  "medicinskoe-pravo": "meditsinskoe-pravo",
  "migracionnoe-pravo": "migratsionnoe-pravo",
  "nalogovyj-yurist": "nalogovye-spory",
  "pensii-i-posobiya": "sotsialnye-vyplaty",
  "semejnoe-pravo": "semeynye-spory",
  "strahovoe-pravo": "strahovye-spory",
  "trudovoe-pravo": "trudovye-spory",
  "ugolovnoe-pravo": "ugolovnye-dela",
  "ugolovnyj-advokat": "ugolovnye-dela",
  "voennyj-yurist": "voennoe-pravo",
  "yurist-dlya-biznesa": "biznes-dogovory",
  "zashchita-chesti-i-dostoinstva": "zashchita-chesti-dostoinstva",
  "zashchita-prav-potrebitelej": "zashchita-prav-potrebiteley",
  "zemelnoe-pravo": "zemelnye-spory",
  "zhilishchnye-voprosy": "zhilishchnye-spory",
  zhkh: "zhilishchnye-spory"
};

async function main() {
  assertUnique(
    services.map((service) => service.slug),
    "sample service slugs"
  );
  assertUnique(targetServiceSlugs, "target service slugs");

  const sampleBySlug = new Map(services.map((service) => [service.slug, service]));
  const missingInSample = targetServiceSlugs.filter((slug) => !sampleBySlug.has(slug));
  if (missingInSample.length > 0) throw new Error(`Missing target services in sample-data: ${missingInSample.join(", ")}`);

  let migratedLegacy = 0;
  let deactivatedLegacy = 0;
  let created = 0;
  let updated = 0;

  for (const [legacySlug, canonicalSlug] of Object.entries(legacyAliases)) {
    const canonicalSeed = sampleBySlug.get(canonicalSlug);
    if (!canonicalSeed) continue;

    const [legacy, canonical] = await Promise.all([
      prisma.service.findUnique({ where: { slug: legacySlug } }),
      prisma.service.findUnique({ where: { slug: canonicalSlug } })
    ]);

    if (legacy && !canonical) {
      await prisma.service.update({
        where: { slug: legacySlug },
        data: toServiceUpdate(canonicalSeed)
      });
      migratedLegacy++;
    } else if (legacy && canonical) {
      await prisma.service.update({
        where: { slug: legacySlug },
        data: { isActive: false }
      });
      deactivatedLegacy++;
    }
  }

  for (const slug of targetServiceSlugs) {
    const seed = sampleBySlug.get(slug);
    if (!seed) throw new Error(`Missing target service in sample-data: ${slug}`);

    const existing = await prisma.service.findUnique({ where: { slug } });
    if (existing) {
      await prisma.service.update({
        where: { slug },
        data: toServiceUpdate(seed)
      });
      updated++;
    } else {
      await prisma.service.create({
        data: {
          id: seed.id,
          ...toServiceUpdate(seed)
        }
      });
      created++;
    }
  }

  const activeTargets = await prisma.service.findMany({
    where: { slug: { in: targetServiceSlugs }, isActive: true },
    select: { slug: true, parentId: true },
    orderBy: { slug: "asc" }
  });
  const activeTargetSlugs = new Set(activeTargets.map((service) => service.slug));
  const missingActiveTargets = targetServiceSlugs.filter((slug) => !activeTargetSlugs.has(slug));
  const targetWithParent = activeTargets.filter((service) => service.parentId);
  const activeLegacy = await prisma.service.findMany({
    where: { slug: { in: Object.keys(legacyAliases) }, isActive: true },
    select: { slug: true },
    orderBy: { slug: "asc" }
  });

  console.log(
    JSON.stringify(
      {
        targetCount: targetServiceSlugs.length,
        activeTargetCount: activeTargets.length,
        missingActiveTargets,
        targetWithParent,
        activeLegacySlugs: activeLegacy.map((service) => service.slug),
        migratedLegacy,
        deactivatedLegacy,
        created,
        updated
      },
      null,
      2
    )
  );
}

function toServiceUpdate(seed: (typeof services)[number]) {
  return {
    name: seed.name,
    slug: seed.slug,
    shortDescription: seed.shortDescription,
    fullDescription: seed.fullDescription,
    isActive: true,
    parentId: seed.parentId
  };
}

function assertUnique(values: string[], label: string) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length > 0) throw new Error(`Duplicate ${label}: ${Array.from(new Set(duplicates)).join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
