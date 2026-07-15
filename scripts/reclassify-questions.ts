// One-time re-categorization of imported Q&A by question CONTENT.
//
// The scraped source category reflects the answering lawyer's specialization, not
// the question topic, so many questions are mis-tagged (e.g. credit questions under
// "Военное право"). This reclassifies every question from its text and, on --apply,
// updates Question.serviceId and reassigns each answer's lawyer to a matching one.
//
// Dry-run by default: prints the new distribution, top transitions, and samples.
// Apply with:  ... reclassify-questions.ts --apply

import { PrismaClient } from "@prisma/client";
import { classifyLegalQuestion } from "./lib/classify-legal-question";
import {
  getHarantSpecializationAliases,
  normalizeHarantCategoryName,
  HARANT_QUESTION_CATEGORIES
} from "../src/lib/harant-question-categories";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const sampleArg = process.argv.find((a) => a.startsWith("--samples="));
const SAMPLES = sampleArg ? Number.parseInt(sampleArg.split("=")[1], 10) : 25;

function hashString(value: string) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function deterministicShuffle<T extends { id: string }>(items: T[], seed: string) {
  return [...items].sort((a, b) => hashString(`${seed}:${a.id}`) - hashString(`${seed}:${b.id}`));
}

// Never assign answers to dev/sample lawyers — they are hidden from public
// surfaces, so the answer (and its question) would disappear from the public Q&A.
const SAMPLE_LAWYER_SLUG_PREFIXES = ["demo-lawyer", "sample-lawyer"];
const excludeSampleLawyers = { NOT: SAMPLE_LAWYER_SLUG_PREFIXES.map((prefix) => ({ slug: { startsWith: prefix } })) };

async function getImportLawyers() {
  const approved = await prisma.lawyer.findMany({
    where: { active: true, blocked: false, profileStatus: "APPROVED", ...excludeSampleLawyers },
    include: { services: { include: { service: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
  });
  if (approved.length) return approved;
  return prisma.lawyer.findMany({
    where: { ...excludeSampleLawyers },
    include: { services: { include: { service: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
  });
}

type LawyerOrder = Awaited<ReturnType<typeof getImportLawyers>>;
type ServiceLite = { id: string; name: string; parentId: string | null };

function pickLawyerForService(lawyerOrder: LawyerOrder, service: ServiceLite, questionIndex: number) {
  const specializationNames = new Set(
    [service.name, ...getHarantSpecializationAliases(service.name)].map((name) => normalizeHarantCategoryName(name))
  );
  const candidates = lawyerOrder.filter((lawyer) =>
    lawyer.services.some(({ service: ls }) =>
      ls.id === service.id ||
      (service.parentId ? ls.id === service.parentId : false) ||
      specializationNames.has(normalizeHarantCategoryName(ls.name))
    )
  );
  const matched = candidates.length ? candidates : lawyerOrder;
  return matched.length ? matched[questionIndex % matched.length] : null;
}

async function main() {
  const services = await prisma.service.findMany({ select: { id: true, name: true, parentId: true } });
  const serviceNameById = new Map(services.map((s) => [s.id, s.name]));
  const serviceByCat = new Map<string, ServiceLite>();
  for (const s of services) {
    const key = normalizeHarantCategoryName(s.name);
    if (!serviceByCat.has(key)) serviceByCat.set(key, s);
  }
  const missing = HARANT_QUESTION_CATEGORIES.filter((c) => !serviceByCat.has(normalizeHarantCategoryName(c)));
  if (missing.length) console.log(`WARNING: no Service rows for: ${missing.join(", ")} (questions for these will be left unchanged)`);

  const lawyerOrder = deterministicShuffle(await getImportLawyers(), "pravoved-lawyers");
  console.log(`Lawyers in pool: ${lawyerOrder.length}`);

  const questions = await prisma.question.findMany({
    select: { id: true, title: true, text: true, rawText: true, serviceId: true, answers: { select: { id: true, lawyerId: true } } }
  });
  console.log(`Questions loaded: ${questions.length}`);

  let changed = 0;
  const transitions = new Map<string, number>();
  const newDist = new Map<string, number>();
  const samples: string[] = [];
  const catCounter = new Map<string, number>();
  const updates: { qid: string; serviceId: string; answers: { id: string; oldLawyerId: string; newLawyerId?: string }[] }[] = [];

  const MILITARY = "Военное право";
  for (const q of questions) {
    const { category: best, score: bestScore, scores } = classifyLegalQuestion(q.title, q.rawText || q.text);
    const oldName = q.serviceId ? serviceNameById.get(q.serviceId) ?? "—" : "—";

    // Conservative decision:
    //  - keep the original category unless the content gives a confident (>=4) signal
    //    for a different one — avoids stripping correct specific tags into the generic
    //    "Гражданские дела" bucket when the classifier just lacks recall;
    //  - special case: a "Военное право" tag with no military vocabulary (score <3) is
    //    almost certainly the сво/служб mis-tag, so reclassify it to the best guess.
    let targetCat: string;
    if (oldName === MILITARY && (scores[MILITARY] ?? 0) < 3) {
      targetCat = best;
    } else if (bestScore >= 4 && best !== oldName) {
      targetCat = best;
    } else {
      targetCat = oldName && oldName !== "—" ? oldName : best;
    }

    newDist.set(targetCat, (newDist.get(targetCat) ?? 0) + 1);
    const target = serviceByCat.get(normalizeHarantCategoryName(targetCat));
    if (!target) continue;
    if (target.id === q.serviceId) continue;

    changed += 1;
    const tkey = `${oldName} → ${targetCat}`;
    transitions.set(tkey, (transitions.get(tkey) ?? 0) + 1);
    if (samples.length < SAMPLES) samples.push(`[${oldName} → ${targetCat}] ${(q.title || "").slice(0, 90)}`);

    const answers = q.answers.map((a) => {
      const idx = catCounter.get(targetCat) ?? 0;
      catCounter.set(targetCat, idx + 1);
      const lawyer = pickLawyerForService(lawyerOrder, target, idx);
      return { id: a.id, oldLawyerId: a.lawyerId, newLawyerId: lawyer?.id };
    });
    updates.push({ qid: q.id, serviceId: target.id, answers });
  }

  console.log(`\nWould change category on: ${changed} / ${questions.length} questions`);
  console.log("\n=== New distribution ===");
  [...newDist.entries()].sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`${String(n).padStart(6)}  ${c}`));
  console.log("\n=== Top transitions (old → new) ===");
  [...transitions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 45).forEach(([t, n]) => console.log(`${String(n).padStart(6)}  ${t}`));
  console.log("\n=== Samples ===");
  samples.forEach((s) => console.log(s));

  if (!APPLY) {
    console.log("\n(DRY RUN — nothing written. Re-run with --apply to commit.)");
    await prisma.$disconnect();
    return;
  }

  console.log(`\nApplying ${updates.length} question updates + lawyer reassignments...`);
  const CHUNK = 100;
  let done = 0;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK);
    await Promise.all(
      chunk.flatMap((u) => {
        const ops: Promise<unknown>[] = [prisma.question.update({ where: { id: u.qid }, data: { serviceId: u.serviceId } })];
        for (const a of u.answers) {
          if (a.newLawyerId && a.newLawyerId !== a.oldLawyerId) {
            ops.push(prisma.answer.update({ where: { id: a.id }, data: { lawyerId: a.newLawyerId } }));
          }
        }
        return ops;
      })
    );
    done += chunk.length;
    if (done % 2000 < CHUNK) console.log(`  applied ${done}/${updates.length}`);
  }
  console.log(`DONE: reclassified ${updates.length} questions.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
