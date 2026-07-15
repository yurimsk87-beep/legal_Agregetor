// Spread answers across all PUBLIC lawyers (active/approved, excluding only the
// hidden demo/sample profiles) matched by the question's category, so no single
// lawyer is overloaded and dev-city lawyers also carry answers. Dry-run by
// default; pass --apply to write.

import { PrismaClient } from "@prisma/client";
import { getHarantSpecializationAliases, normalizeHarantCategoryName } from "../src/lib/harant-question-categories";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
// Mirror repositories.ts sampleLawyerSlugPrefixes (hidden from public surfaces).
const HIDDEN_PREFIXES = ["demo-lawyer", "sample-lawyer"];
const isHidden = (slug: string) => HIDDEN_PREFIXES.some((p) => slug.startsWith(p));

function hashString(v: string) {
  let h = 2166136261;
  for (const c of v) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return Math.abs(h >>> 0);
}
function dshuffle<T extends { id: string }>(items: T[], seed: string) {
  return [...items].sort((a, b) => hashString(`${seed}:${a.id}`) - hashString(`${seed}:${b.id}`));
}

type Svc = { id: string; name: string; parentId: string | null };

async function main() {
  const services = await prisma.service.findMany({ select: { id: true, name: true, parentId: true } });
  const svcById = new Map(services.map((s) => [s.id, s]));

  const all = await prisma.lawyer.findMany({
    where: { active: true, blocked: false, profileStatus: "APPROVED" },
    include: { services: { include: { service: true } } }
  });
  const pool = dshuffle(all.filter((l) => !isHidden(l.slug)), "pravoved-lawyers");
  console.log("public lawyers in pool:", pool.length);
  if (!pool.length) throw new Error("No public lawyers found.");

  function pick(service: Svc, idx: number) {
    const names = new Set([service.name, ...getHarantSpecializationAliases(service.name)].map(normalizeHarantCategoryName));
    const cands = pool.filter((l) =>
      l.services.some(({ service: ls }) =>
        ls.id === service.id || (service.parentId ? ls.id === service.parentId : false) || names.has(normalizeHarantCategoryName(ls.name))
      )
    );
    const m = cands.length ? cands : pool;
    return m[idx % m.length];
  }

  const answers = await prisma.answer.findMany({ select: { id: true, lawyerId: true, question: { select: { serviceId: true } } } });
  console.log("answers:", answers.length);

  const counter = new Map<string, number>();
  const updates: { id: string; lawyerId: string }[] = [];
  let noService = 0;
  for (const a of answers) {
    const svc = a.question?.serviceId ? svcById.get(a.question.serviceId) : undefined;
    if (!svc) { noService++; continue; }
    const idx = counter.get(svc.id) ?? 0;
    counter.set(svc.id, idx + 1);
    const lw = pick(svc, idx);
    if (lw && lw.id !== a.lawyerId) updates.push({ id: a.id, lawyerId: lw.id });
  }
  console.log(`to reassign: ${updates.length}, skipped(no service): ${noService}`);

  if (!APPLY) { console.log("(DRY-RUN — pass --apply to write)"); await prisma.$disconnect(); return; }

  let done = 0;
  const CH = 200;
  for (let i = 0; i < updates.length; i += CH) {
    await Promise.all(updates.slice(i, i + CH).map((u) => prisma.answer.update({ where: { id: u.id }, data: { lawyerId: u.lawyerId } })));
    done += Math.min(CH, updates.length - i);
    if (done % 5000 < CH) console.log(`applied ${done}/${updates.length}`);
  }
  console.log(`DONE: reassigned ${updates.length} answers across ${pool.length} lawyers`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
