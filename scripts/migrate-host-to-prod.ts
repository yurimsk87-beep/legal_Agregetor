// One-time host -> prod content migration.
//
// Copies the lawyer graph and ALL questions/answers from the local (host) DB to
// production. Host wins on conflicts. Prod-only data (leads, analytics, admin
// users) is left untouched. Requires an SSH tunnel to the prod DB.
//
//   LOCAL_DATABASE_URL=...  PROD_DATABASE_URL=...  tsx migrate-host-to-prod.ts [--apply]
//
// Dry-run by default: reports what WOULD be migrated.

import { PrismaClient } from "@prisma/client";

const APPLY = process.argv.includes("--apply");
const LOCAL_URL = process.env.LOCAL_DATABASE_URL;
const PROD_URL = process.env.PROD_DATABASE_URL;
if (!LOCAL_URL || !PROD_URL) {
  console.error("Set LOCAL_DATABASE_URL and PROD_DATABASE_URL");
  process.exit(1);
}

const local = new PrismaClient({ datasources: { db: { url: LOCAL_URL } } });
const prod = new PrismaClient({ datasources: { db: { url: PROD_URL } } });

const BATCH = 1000;

async function upsertAll<T extends { id: string }>(
  label: string,
  rows: T[],
  upsertOne: (row: T) => Promise<unknown>
) {
  if (!APPLY) {
    console.log(`  ${label}: ${rows.length} (dry-run)`);
    return;
  }
  let done = 0;
  for (const row of rows) {
    await upsertOne(row);
    done += 1;
    if (done % 500 === 0) console.log(`  ${label}: ${done}/${rows.length}`);
  }
  console.log(`  ${label}: ${rows.length} done`);
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);

  // ---- Lawyer graph + referenced services/cities/users (host wins) ----
  const lawyers = await local.lawyer.findMany();
  const lawyerUserIds = [...new Set(lawyers.map((l) => l.userId))];
  const users = await local.user.findMany({ where: { id: { in: lawyerUserIds } } });
  const cities = await local.city.findMany();
  const services = await local.service.findMany();
  const profiles = await local.lawyerProfile.findMany();
  const lawyerServices = await local.lawyerService.findMany();
  const lawyerCities = await local.lawyerCity.findMany();

  console.log("\n== Lawyer graph (host wins) ==");
  // Order matters for FKs: User -> City/Service -> Lawyer -> Profile -> junctions.
  // Prisma's create/update input types are stricter than the row types (Json nulls,
  // relation shapes); the rows come straight from the same schema, so cast.
  await upsertAll("users", users, (u) => prod.user.upsert({ where: { id: u.id }, update: u as any, create: u as any }));
  await upsertAll("cities", cities, (c) => prod.city.upsert({ where: { id: c.id }, update: c as any, create: c as any }));
  await upsertAll("services", services, (s) => prod.service.upsert({ where: { id: s.id }, update: s as any, create: s as any }));
  await upsertAll("lawyers", lawyers, (l) => prod.lawyer.upsert({ where: { id: l.id }, update: l as any, create: l as any }));
  await upsertAll("profiles", profiles, (p) => prod.lawyerProfile.upsert({ where: { id: p.id }, update: p as any, create: p as any }));

  if (APPLY) {
    await prod.lawyerService.createMany({ data: lawyerServices as any, skipDuplicates: true });
    await prod.lawyerCity.createMany({ data: lawyerCities as any, skipDuplicates: true });
    console.log(`  lawyerServices: ${lawyerServices.length}, lawyerCities: ${lawyerCities.length} (createMany skipDuplicates)`);
  } else {
    console.log(`  lawyerServices: ${lawyerServices.length}, lawyerCities: ${lawyerCities.length} (dry-run)`);
  }

  // ---- Questions + answers: insert the ones missing on prod ----
  console.log("\n== Questions / answers ==");
  const prodQ = await prod.question.findMany({ select: { id: true } });
  const prodIds = new Set(prodQ.map((q) => q.id));
  console.log(`  prod has ${prodIds.size} questions, host has ${await local.question.count()}`);

  let scanned = 0;
  let inserted = 0;
  let insertedAnswers = 0;
  for (let skip = 0; ; skip += BATCH) {
    const batch = await local.question.findMany({ orderBy: { id: "asc" }, skip, take: BATCH });
    if (!batch.length) break;
    scanned += batch.length;
    const fresh = batch.filter((q) => !prodIds.has(q.id));
    if (fresh.length) {
      if (APPLY) {
        await prod.question.createMany({ data: fresh as any, skipDuplicates: true });
        const freshIds = fresh.map((q) => q.id);
        const answers = await local.answer.findMany({ where: { questionId: { in: freshIds } } });
        if (answers.length) {
          await prod.answer.createMany({ data: answers as any, skipDuplicates: true });
          insertedAnswers += answers.length;
        }
      } else {
        const freshIds = fresh.map((q) => q.id);
        insertedAnswers += await local.answer.count({ where: { questionId: { in: freshIds } } });
      }
      inserted += fresh.length;
    }
    if (scanned % 10000 < BATCH) console.log(`  scanned ${scanned}, new so far ${inserted}`);
  }

  console.log(`\n${APPLY ? "MIGRATED" : "WOULD MIGRATE"}: ${inserted} questions, ${insertedAnswers} answers`);
  await local.$disconnect();
  await prod.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await local.$disconnect().catch(() => {});
  await prod.$disconnect().catch(() => {});
  process.exit(1);
});
