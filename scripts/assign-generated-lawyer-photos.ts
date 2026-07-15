import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const minProfilePhotoBytes = 60_000;
const photoVersion = "realistic-headshots-20260609";

async function main() {
  const photoDir = path.resolve("public/generated-lawyer-photos");
  const manifestPath = path.join(photoDir, "manifest.json");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) as ManifestRecord[] : [];
  const manifestBySlug = new Map(manifest.map((record) => [record.slug, record]));
  const lawyers = await prisma.lawyer.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, slug: true }
  });

  const invalidPhotoFiles: string[] = [];
  for (const lawyer of lawyers) {
    const filename = `${lawyer.slug}.png`;
    const absolutePath = path.join(photoDir, filename);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Missing generated photo for ${lawyer.slug}: ${absolutePath}`);
    }
    if (fs.statSync(absolutePath).size < minProfilePhotoBytes) {
      invalidPhotoFiles.push(`${lawyer.slug}: ${absolutePath}`);
      continue;
    }
  }

  if (invalidPhotoFiles.length) {
    throw new Error(
      [
        `Found ${invalidPhotoFiles.length} generated photo files below ${minProfilePhotoBytes} bytes.`,
        "Run: python scripts/generate-lawyer-portraits.py --mode replace-invalid",
        invalidPhotoFiles.slice(0, 20).join("\n")
      ].join("\n")
    );
  }

  let updated = 0;
  for (const lawyer of lawyers) {
    const filename = `${lawyer.slug}.png`;
    await prisma.lawyer.update({
      where: { id: lawyer.id },
      data: { photoUrl: `/generated-lawyer-photos/${filename}?v=${photoVersion}` }
    });
    updated++;
  }

  const duplicates = await prisma.lawyer.groupBy({
    by: ["photoUrl"],
    where: { photoUrl: { not: null } },
    _count: { photoUrl: true },
    having: { photoUrl: { _count: { gt: 1 } } }
  });

  console.log(
    JSON.stringify(
      {
        updated,
        duplicatePhotoGroups: duplicates.length,
        styleDistribution: countBy(manifestBySlug, (record) => record.style?.visualStyle?.id ?? "unknown"),
        sourceDistribution: countBy(manifestBySlug, (record) => record.imageSource?.id ?? "unknown")
      },
      null,
      2
    )
  );
}

type ManifestRecord = {
  slug: string;
  imageSource?: { id?: string };
  style?: {
    visualStyle?: { id?: string };
  };
};

function countBy(records: Map<string, ManifestRecord>, getKey: (record: ManifestRecord) => string) {
  const counts: Record<string, number> = {};
  for (const record of records.values()) {
    const key = getKey(record);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
