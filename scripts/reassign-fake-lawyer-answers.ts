// Reassign every answer currently attributed to a fake (dev/sample) lawyer to a
// REAL lawyer, matched to the question's category where possible. Lawyer DATA and
// LawyerCity relations are NOT touched — only Answer.lawyerId changes.
//
// Dry-run by default; pass --apply to commit.

import { PrismaClient } from "@prisma/client";
import { getHarantSpecializationAliases, normalizeHarantCategoryName } from "../src/lib/harant-question-categories";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const FAKE_PREFIXES = ["dev-city-lawyer", "demo-lawyer", "sample-lawyer"];
const isFake = (slug: string) => FAKE_PREFIXES.some((p) => slug.startsWith(p));

function hashString(value: string) {
  let h = 2166136261;
  for (const c of value) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return Math.abs(h >>> 0);
}

(async () => {
  const allLawyers = await prisma.lawyer.findMany({
    where: { active: true, blocked: false, profileStatus: "APPROVED" },
    include: { services: { include: { service: true } } }
  });
  const real = allLawyers.filter((l) => !isFake(l.slug)).sort((a, b) => hashString(a.id) - hashString(b.id));
  const fakeIds = new Set((await prisma.lawyer.findMany({ where: {}, select: { id: true, slug: true } })).filter((l) => isFake(l.slug)).map((l) => l.id));
  if (!real.length) throw new Error("No real lawyers to reassign to.");
  console.log(`Real lawyers: ${real.length}, fake lawyers: ${fakeIds.size}`);

  function pickReal(categoryName: string | null, idx: number) {
    if (categoryName) {
      const names = new Set([categoryName, ...getHarantSpecializationAliases(categoryName)].map(normalizeHarantCategoryName));
      const cands = real.filter((l) => l.services.some((s) => names.has(normalizeHarantCategoryName(s.service.name))));
      if (cands.length) return cands[idx % cands.length];
    }
    return real[idx % real.length];
  }

  // Pull answers on fake lawyers with their question category, in batches.
  const BATCH = 2000;
  let processed = 0;
  let reassigned = 0;
  const catCounter = new Map<string, number>();
  for (let skip = 0; ; skip += BATCH) {
    const answers = await prisma.answer.findMany({
      where: { lawyerId: { in: [...fakeIds] } },
      select: { id: true, question: { select: { service: { select: { name: true } } } } },
      orderBy: { id: "asc" },
      take: BATCH,
      skip
    });
    if (!answers.length) break;
    processed += answers.length;

    const updates: { id: string; lawyerId: string }[] = [];
    for (const a of answers) {
      const cat = a.question?.service?.name ?? null;
      const key = cat ?? "_";
      const idx = catCounter.get(key) ?? 0;
      catCounter.set(key, idx + 1);
      updates.push({ id: a.id, lawyerId: pickReal(cat, idx).id });
    }

    if (APPLY) {
      for (let i = 0; i < updates.length; i += 100) {
        await Promise.all(updates.slice(i, i + 100).map((u) => prisma.answer.update({ where: { id: u.id }, data: { lawyerId: u.lawyerId } })));
      }
    }
    reassigned += updates.length;
    if (processed % 10000 < BATCH) console.log(`  processed ${processed}, reassigned ${reassigned}`);
    // NOTE: in --apply the where-set shrinks as we update, so always page from skip=0.
    if (APPLY) skip = -BATCH; // restart paging from 0 next loop since updated rows leave the set
  }

  console.log(`${APPLY ? "REASSIGNED" : "WOULD REASSIGN"}: ${reassigned} answers from fake -> real lawyers`);
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
