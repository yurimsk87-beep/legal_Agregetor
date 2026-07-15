import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { PrismaClient, type ContentStatus, type FaqEntityType } from "@prisma/client";

const prisma = new PrismaClient();

type ImportPayload = {
  articles?: ImportedArticle[];
  faqs?: ImportedFaq[];
  legalSources?: ImportedLegalSource[];
};

type ImportedArticle = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  serviceSlug: string;
  authorSlug?: string;
  reviewedByLawyerSlug?: string;
  status?: ContentStatus;
  publishedAt?: string;
  reviewedAt?: string;
  legalSourceIds?: string[];
};

type ImportedFaq = {
  id?: string;
  question: string;
  answer: string;
  entityType: FaqEntityType;
  entityId?: string;
  sortOrder?: number;
};

type ImportedLegalSource = {
  id: string;
  title: string;
  codeName: string;
  articleNumber?: string;
  url: string;
  lastCheckedAt?: string;
};

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error("Usage: npm run content:import -- ./content.json|./content.csv");
  }

  const absolutePath = resolve(filePath);
  const payload = await loadPayload(absolutePath);

  for (const source of payload.legalSources ?? []) {
    await prisma.legalSource.upsert({
      where: { id: source.id },
      create: {
        id: source.id,
        title: source.title,
        codeName: source.codeName,
        articleNumber: source.articleNumber || null,
        url: source.url,
        lastCheckedAt: source.lastCheckedAt ? new Date(source.lastCheckedAt) : new Date()
      },
      update: {
        title: source.title,
        codeName: source.codeName,
        articleNumber: source.articleNumber || null,
        url: source.url,
        lastCheckedAt: source.lastCheckedAt ? new Date(source.lastCheckedAt) : new Date()
      }
    });
  }

  for (const article of payload.articles ?? []) {
    await upsertArticle(article);
  }

  for (const faq of payload.faqs ?? []) {
    await upsertFaq(faq);
  }

  console.log(
    `Imported content: ${payload.articles?.length ?? 0} articles, ${payload.faqs?.length ?? 0} FAQ, ${
      payload.legalSources?.length ?? 0
    } legal sources.`
  );
}

async function loadPayload(filePath: string): Promise<ImportPayload> {
  const raw = await readFile(filePath, "utf8");
  if (extname(filePath).toLowerCase() === ".json") {
    return JSON.parse(raw) as ImportPayload;
  }

  if (extname(filePath).toLowerCase() === ".csv") {
    return { articles: parseCsv(raw).map(csvRowToArticle) };
  }

  throw new Error("Only JSON and CSV imports are supported.");
}

async function upsertArticle(input: ImportedArticle) {
  const service = await prisma.service.findUnique({ where: { slug: input.serviceSlug } });
  if (!service) throw new Error(`Service not found: ${input.serviceSlug}`);

  const author = input.authorSlug
    ? await prisma.lawyer.findUnique({ where: { slug: input.authorSlug } })
    : await prisma.lawyer.findFirst({ orderBy: { createdAt: "asc" } });
  if (!author) throw new Error("Article author lawyer was not found.");

  const reviewedBy = input.reviewedByLawyerSlug
    ? await prisma.lawyer.findUnique({ where: { slug: input.reviewedByLawyerSlug } })
    : null;
  const status = input.status ?? "DRAFT";

  const article = await prisma.article.upsert({
    where: { slug: input.slug },
    create: {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: input.content,
      serviceId: service.id,
      authorId: author.id,
      reviewedByLawyerId: reviewedBy?.id ?? null,
      reviewedAt: input.reviewedAt ? new Date(input.reviewedAt) : null,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
      status,
      isIndexable: status === "APPROVED"
    },
    update: {
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      serviceId: service.id,
      authorId: author.id,
      reviewedByLawyerId: reviewedBy?.id ?? null,
      reviewedAt: input.reviewedAt ? new Date(input.reviewedAt) : null,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
      status,
      isIndexable: status === "APPROVED"
    }
  });

  if (input.legalSourceIds?.length) {
    await prisma.articleLegalSource.deleteMany({ where: { articleId: article.id } });
    await prisma.articleLegalSource.createMany({
      data: input.legalSourceIds.map((legalSourceId) => ({ articleId: article.id, legalSourceId })),
      skipDuplicates: true
    });
  }
}

async function upsertFaq(input: ImportedFaq) {
  if (input.id) {
    await prisma.faqItem.upsert({
      where: { id: input.id },
      create: {
        id: input.id,
        question: input.question,
        answer: input.answer,
        entityType: input.entityType,
        entityId: input.entityId || null,
        sortOrder: input.sortOrder ?? 0
      },
      update: {
        question: input.question,
        answer: input.answer,
        entityType: input.entityType,
        entityId: input.entityId || null,
        sortOrder: input.sortOrder ?? 0
      }
    });
    return;
  }

  await prisma.faqItem.create({
    data: {
      question: input.question,
      answer: input.answer,
      entityType: input.entityType,
      entityId: input.entityId || null,
      sortOrder: input.sortOrder ?? 0
    }
  });
}

function csvRowToArticle(row: Record<string, string>): ImportedArticle {
  return {
    slug: required(row, "slug"),
    title: required(row, "title"),
    excerpt: required(row, "excerpt"),
    content: required(row, "content"),
    serviceSlug: required(row, "serviceSlug"),
    authorSlug: row.authorSlug || undefined,
    reviewedByLawyerSlug: row.reviewedByLawyerSlug || undefined,
    status: (row.status as ContentStatus | undefined) || "DRAFT",
    publishedAt: row.publishedAt || undefined,
    reviewedAt: row.reviewedAt || undefined,
    legalSourceIds: row.legalSourceIds ? row.legalSourceIds.split("|").map((item) => item.trim()).filter(Boolean) : undefined
  };
}

function parseCsv(input: string) {
  const rows = input.trim().split(/\r?\n/).filter(Boolean).map(parseCsvLine);
  const [headers, ...values] = rows;
  if (!headers?.length) return [];

  return values.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

function parseCsvLine(line: string) {
  const result: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      result.push(value.trim());
      value = "";
    } else {
      value += char;
    }
  }

  result.push(value.trim());
  return result;
}

function required(row: Record<string, string>, key: string) {
  const value = row[key]?.trim();
  if (!value) throw new Error(`CSV field is required: ${key}`);
  return value;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
