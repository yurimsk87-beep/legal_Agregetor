// Make every lawyer "real": rename dev/sample slugs to name-based unique slugs
// and set all lawyers active + APPROVED. Relations (LawyerCity, answers) untouched.
// Dry-run by default; pass --apply to commit.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const FAKE_PREFIXES = ["dev-city-lawyer", "demo-lawyer", "sample-lawyer"];
const isFake = (slug: string) => FAKE_PREFIXES.some((p) => slug.startsWith(p));

const CYR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "j",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "h", ц: "c", ч: "ch", ш: "sh", щ: "shch", ы: "y", э: "e", ю: "yu", я: "ya", ь: "", ъ: ""
};
function slugify(value: string) {
  const s = value.toLowerCase().split("").map((c) => CYR[c] ?? c).join("")
    .replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 90);
  return s || "yurist";
}

(async () => {
  const lawyers = await prisma.lawyer.findMany({ select: { id: true, slug: true, firstName: true, lastName: true, middleName: true } });
  const used = new Set(lawyers.filter((l) => !isFake(l.slug)).map((l) => l.slug));

  const renames: { id: string; oldSlug: string; newSlug: string }[] = [];
  for (const l of lawyers) {
    if (!isFake(l.slug)) continue;
    const base = slugify([l.lastName, l.firstName, l.middleName].filter(Boolean).join(" ")) || "yurist";
    let candidate = base;
    let i = 2;
    while (used.has(candidate)) candidate = `${base}-${i++}`;
    used.add(candidate);
    renames.push({ id: l.id, oldSlug: l.slug, newSlug: candidate });
  }

  console.log(`Total lawyers: ${lawyers.length}`);
  console.log(`Fake slugs to rename: ${renames.length}`);
  console.log("Sample renames:");
  renames.slice(0, 8).forEach((r) => console.log(`  ${r.oldSlug}  ->  ${r.newSlug}`));

  if (!APPLY) {
    console.log("\n(DRY RUN — nothing written. Re-run with --apply)");
    await prisma.$disconnect();
    return;
  }

  // 1) rename fake slugs
  for (let i = 0; i < renames.length; i += 50) {
    await Promise.all(renames.slice(i, i + 50).map((r) => prisma.lawyer.update({ where: { id: r.id }, data: { slug: r.newSlug } })));
  }
  // 2) make ALL lawyers active + approved
  const res = await prisma.lawyer.updateMany({ data: { active: true, blocked: false, profileStatus: "APPROVED" } });

  const fakeLeft = (await prisma.lawyer.findMany({ select: { slug: true } })).filter((l) => isFake(l.slug)).length;
  console.log(`\nRenamed: ${renames.length}; set active+approved: ${res.count}; fake slugs left: ${fakeLeft}`);
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
