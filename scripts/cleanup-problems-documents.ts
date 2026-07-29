import { FaqEntityType, Prisma, PrismaClient, SeoPageType } from "@prisma/client";

const prisma = new PrismaClient();
const applyChanges = process.argv.includes("--apply");

const KEEP_DOCUMENT_SLUG = "zayavlenie-v-zags";
const KEEP_SCENARIO_SLUG = "brak-zags-i-smena-familii";
const KEEP_DOCUMENT_PATH = `/documents/${KEEP_DOCUMENT_SLUG}/`;
const KEEP_SCENARIO_PATH = `/problems/semya-i-deti/${KEEP_SCENARIO_SLUG}/`;

const documentWhere: Prisma.DocumentTemplateWhereInput = { slug: { not: KEEP_DOCUMENT_SLUG } };
const scenarioWhere: Prisma.LegalScenarioWhereInput = { slug: { not: KEEP_SCENARIO_SLUG } };
const seoPageWhere: Prisma.SeoPageWhereInput = {
  OR: [
    { type: SeoPageType.DOCUMENT, slug: { notIn: [KEEP_DOCUMENT_SLUG, KEEP_DOCUMENT_PATH] } },
    { type: SeoPageType.SITUATION, slug: { notIn: [KEEP_SCENARIO_SLUG, KEEP_SCENARIO_PATH] } }
  ]
};
const seoMergeWhere: Prisma.SeoMergeWhereInput = {
  OR: [
    { oldUrl: { startsWith: "/documents/" } },
    { oldUrl: { startsWith: "/problems/" } },
    { newUrl: { startsWith: "/documents/", not: { startsWith: KEEP_DOCUMENT_PATH } } },
    { newUrl: { startsWith: "/problems/", not: { startsWith: KEEP_SCENARIO_PATH } } }
  ]
};
const nextBestActionWhere: Prisma.NextBestActionWhereInput = {
  OR: [
    { url: { startsWith: "/documents/", not: { startsWith: KEEP_DOCUMENT_PATH } } },
    { url: { startsWith: "/problems/", not: { startsWith: KEEP_SCENARIO_PATH } } }
  ]
};

async function getAudit() {
  const [keptDocuments, keptScenarios, oldDocuments] = await Promise.all([
    prisma.documentTemplate.count({ where: { slug: KEEP_DOCUMENT_SLUG } }),
    prisma.legalScenario.count({ where: { slug: KEEP_SCENARIO_SLUG } }),
    prisma.documentTemplate.findMany({ where: documentWhere, select: { id: true, slug: true } })
  ]);
  const oldDocumentIds = oldDocuments.map(({ id }) => id);
  const oldDocumentSlugs = oldDocuments.map(({ slug }) => slug);
  const faqWhere: Prisma.FaqItemWhereInput = {
    entityType: FaqEntityType.DOCUMENT,
    OR: [
      { entityId: { in: oldDocumentIds } },
      { entityId: { in: oldDocumentSlugs } }
    ]
  };

  const [documents, scenarios, faqItems, seoPages, seoMerges, nextBestActions] = await Promise.all([
    prisma.documentTemplate.count({ where: documentWhere }),
    prisma.legalScenario.count({ where: scenarioWhere }),
    prisma.faqItem.count({ where: faqWhere }),
    prisma.seoPage.count({ where: seoPageWhere }),
    prisma.seoMerge.count({ where: seoMergeWhere }),
    prisma.nextBestAction.count({ where: nextBestActionWhere })
  ]);

  return {
    kept: { documents: keptDocuments, scenarios: keptScenarios },
    candidates: { documents, scenarios, faqItems, seoPages, seoMerges, nextBestActions },
    oldDocumentIds,
    oldDocumentSlugs
  };
}

function assertSingleKeptEntity(audit: Awaited<ReturnType<typeof getAudit>>) {
  if (audit.kept.documents !== 1 || audit.kept.scenarios !== 1) {
    throw new Error(
      `Cleanup stopped: expected exactly one kept document and scenario, found documents=${audit.kept.documents}, scenarios=${audit.kept.scenarios}.`
    );
  }
}

function assertApplyIsSafe() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Cleanup cannot run with NODE_ENV=production.");
  }
  if (process.env.CONTENT_CLEANUP_CONFIRM !== "KEEP_ONLY_ZAGS_REFERENCE") {
    throw new Error("Set CONTENT_CLEANUP_CONFIRM=KEEP_ONLY_ZAGS_REFERENCE to apply the cleanup.");
  }
  if (process.env.CONTENT_CLEANUP_BACKUP_CONFIRMED !== "YES") {
    throw new Error("Set CONTENT_CLEANUP_BACKUP_CONFIRMED=YES only after verifying a current database backup.");
  }
  if (process.env.CONTENT_CLEANUP_ALLOW_NON_PRODUCTION !== "YES") {
    throw new Error("Set CONTENT_CLEANUP_ALLOW_NON_PRODUCTION=YES for an explicitly selected non-production database.");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
  const parsed = new URL(databaseUrl);
  const allowedHosts = new Set(["localhost", "127.0.0.1", "::1", "postgres", "db"]);
  const databaseName = parsed.pathname.replace(/^\//, "");
  if (!allowedHosts.has(parsed.hostname) || /prod|production/i.test(databaseName)) {
    throw new Error("Cleanup --apply is allowed only for an explicitly confirmed local/non-production database.");
  }
}

async function main() {
  const audit = await getAudit();
  assertSingleKeptEntity(audit);

  console.log(JSON.stringify({
    mode: applyChanges ? "apply" : "dry-run",
    keep: {
      document: KEEP_DOCUMENT_SLUG,
      scenario: KEEP_SCENARIO_SLUG,
      ...audit.kept
    },
    candidates: audit.candidates,
    protectedTables: ["Question", "Answer", "Lawyer", "Lead", "AnalyticsEvent", "AdminAuditLog"]
  }, null, 2));

  if (!applyChanges) {
    console.log("Dry run complete. Database was not changed.");
    return;
  }

  assertApplyIsSafe();

  const deleted = await prisma.$transaction(async (tx) => {
    const faqWhere: Prisma.FaqItemWhereInput = {
      entityType: FaqEntityType.DOCUMENT,
      OR: [
        { entityId: { in: audit.oldDocumentIds } },
        { entityId: { in: audit.oldDocumentSlugs } }
      ]
    };

    const faqItems = await tx.faqItem.deleteMany({ where: faqWhere });
    const seoMerges = await tx.seoMerge.deleteMany({ where: seoMergeWhere });
    const nextBestActions = await tx.nextBestAction.deleteMany({ where: nextBestActionWhere });
    const seoPages = await tx.seoPage.deleteMany({ where: seoPageWhere });
    const documents = await tx.documentTemplate.deleteMany({ where: documentWhere });
    const scenarios = await tx.legalScenario.deleteMany({ where: scenarioWhere });
    return {
      documents: documents.count,
      scenarios: scenarios.count,
      faqItems: faqItems.count,
      seoPages: seoPages.count,
      seoMerges: seoMerges.count,
      nextBestActions: nextBestActions.count
    };
  });

  const after = await getAudit();
  assertSingleKeptEntity(after);
  if (Object.values(after.candidates).some((count) => count !== 0)) {
    throw new Error(`Post-cleanup verification failed: ${JSON.stringify(after.candidates)}`);
  }

  console.log(JSON.stringify({ deleted, verification: after.candidates }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
