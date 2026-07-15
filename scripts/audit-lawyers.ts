// Audit lawyer profiles for indexability and quality. Lists fake/dev profiles and
// thin real profiles that should be noindex.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEV_SAMPLE_PREFIXES = ["demo-lawyer", "sample-lawyer", "dev-city-lawyer"];
const isDevSample = (slug: string) => DEV_SAMPLE_PREFIXES.some((p) => slug.startsWith(p));

(async () => {
  const lawyers = await prisma.lawyer.findMany({
    include: { cities: true, services: true, _count: { select: { answers: true, reviews: true } } }
  });

  const rows = lawyers.map((l) => {
    const descLen = (l.description ?? "").trim().length;
    const canIndexByQuality = Boolean(
      l.active && !l.blocked && l.profileStatus === "APPROVED" && l.isVerified && l.cities.length > 0 && l.services.length > 0 && descLen >= 120
    );
    return {
      slug: l.slug,
      devSample: isDevSample(l.slug),
      active: l.active,
      verified: l.isVerified,
      profileStatus: l.profileStatus,
      cities: l.cities.length,
      services: l.services.length,
      descLen,
      answers: l._count.answers,
      reviews: l._count.reviews,
      canIndexByQuality
    };
  });

  const fake = rows.filter((r) => r.devSample);
  const realThin = rows.filter((r) => !r.devSample && !r.canIndexByQuality);
  const realOk = rows.filter((r) => !r.devSample && r.canIndexByQuality);
  // Currently indexed but should not be: passes quality gate but is dev/sample.
  const fakeButIndexable = fake.filter((r) => r.canIndexByQuality);

  console.log(`=== LAWYER AUDIT (${rows.length} profiles) ===`);
  console.log(`Real & indexable (good): ${realOk.length}`);
  console.log(`Real but thin/not-indexable: ${realThin.length}`);
  console.log(`Dev/sample (fake): ${fake.length}  — of which currently pass quality gate (would be indexed): ${fakeButIndexable.length}`);

  console.log(`\n--- Dev/sample profiles to NOINDEX (${fake.length}) ---`);
  fake.slice(0, 12).forEach((r) => console.log(`  ${r.slug} | desc:${r.descLen} answers:${r.answers} indexableByQuality:${r.canIndexByQuality}`));
  if (fake.length > 12) console.log(`  ... +${fake.length - 12} more`);

  console.log(`\n--- Real thin profiles (review) (${realThin.length}) ---`);
  realThin.forEach((r) => console.log(`  ${r.slug} | desc:${r.descLen} verified:${r.verified} cities:${r.cities} services:${r.services} status:${r.profileStatus}`));

  const fs = await import("node:fs");
  fs.mkdirSync("reports", { recursive: true });
  fs.writeFileSync("reports/lawyer-audit.json", JSON.stringify({ generatedAt: new Date().toISOString(), totals: { total: rows.length, realOk: realOk.length, realThin: realThin.length, fake: fake.length, fakeButIndexable: fakeButIndexable.length }, fake, realThin, realOk }, null, 2));
  console.log("\nFull report: reports/lawyer-audit.json");
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
