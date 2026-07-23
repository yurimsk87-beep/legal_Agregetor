import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const applyChanges = process.argv.includes("--apply");
const confirmation = process.env.CONTENT_CLEANUP_CONFIRM;

async function main() {
  const documentWhere = { slug: { not: "zayavlenie-v-zags" } };
  const scenarioWhere = { slug: { not: "brak-zags-i-smena-familii" } };

  const [documentsToDelete, scenariosToDelete] = await Promise.all([
    prisma.documentTemplate.count({ where: documentWhere }),
    prisma.legalScenario.count({ where: scenarioWhere })
  ]);

  console.log(
    JSON.stringify(
      {
        mode: applyChanges ? "apply" : "dry-run",
        documentsToDelete,
        scenariosToDelete,
        keep: {
          document: "zayavlenie-v-zags",
          scenario: "brak-zags-i-smena-familii"
        }
      },
      null,
      2
    )
  );

  if (!applyChanges) {
    console.log("Dry run complete. Database was not changed.");
    return;
  }

  if (confirmation !== "KEEP_ONLY_ZAGS_REFERENCE") {
    throw new Error(
      "Set CONTENT_CLEANUP_CONFIRM=KEEP_ONLY_ZAGS_REFERENCE to apply the cleanup."
    );
  }

  const [deletedDocuments, deletedScenarios] = await prisma.$transaction([
    prisma.documentTemplate.deleteMany({ where: documentWhere }),
    prisma.legalScenario.deleteMany({ where: scenarioWhere })
  ]);

  console.log(
    JSON.stringify(
      {
        deletedDocuments: deletedDocuments.count,
        deletedScenarios: deletedScenarios.count
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
