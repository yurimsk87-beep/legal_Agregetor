import { PrismaClient } from "@prisma/client";
import {
  HARANT_QUESTION_CATEGORIES,
  HARANT_QUESTION_CATEGORY_PARENT_SPECIALIZATIONS,
  normalizeHarantCategoryName,
  type HarantQuestionCategory
} from "../src/lib/harant-question-categories";

const prisma = new PrismaClient();

type ServiceRow = Awaited<ReturnType<typeof loadServices>>[number];

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

async function main() {
  assertDevelopmentOnly();
  await ensureHarantCategoryServices();

  const services = await loadServices();
  const byName = new Map(services.map((service) => [normalizeHarantCategoryName(service.name), service]));
  const attached: Array<{ category: string; parent: string; lawyers: number }> = [];
  const direct: Array<{ category: string; lawyers: number }> = [];
  const missingParents: string[] = [];

  for (const categoryName of HARANT_QUESTION_CATEGORIES) {
    const category = byName.get(normalizeHarantCategoryName(categoryName));
    if (!category) {
      missingParents.push(`${categoryName}: category row missing`);
      continue;
    }

    const parent = pickParentSpecialization(categoryName, category, byName);
    if (!parent) {
      await prisma.service.update({
        where: { id: category.id },
        data: { parentId: null }
      });
      direct.push({ category: category.name, lawyers: category._count.lawyers });
      continue;
    }

    await prisma.service.update({
      where: { id: category.id },
      data: { parentId: parent.id }
    });
    attached.push({ category: category.name, parent: parent.name, lawyers: parent._count.lawyers });
  }

  const categoriesWithoutLawyerRoute = await findCategoriesWithoutLawyerRoute();

  console.log(
    JSON.stringify(
      {
        harantCategories: HARANT_QUESTION_CATEGORIES.length,
        attachedToSpecialization: attached.length,
        directSpecializations: direct.length,
        missingParents,
        categoriesWithoutLawyerRoute,
        attached,
        direct
      },
      null,
      2
    )
  );
}

async function loadServices() {
  return prisma.service.findMany({
    where: { isActive: true },
    include: { _count: { select: { lawyers: true, questions: true } } },
    orderBy: { name: "asc" }
  });
}

async function ensureHarantCategoryServices() {
  const services = await loadServices();
  const byName = new Set(services.map((service) => normalizeHarantCategoryName(service.name)));

  for (const categoryName of HARANT_QUESTION_CATEGORIES) {
    if (byName.has(normalizeHarantCategoryName(categoryName))) continue;
    await prisma.service.create({
      data: {
        name: categoryName,
        slug: await uniqueServiceSlug(slugify(categoryName)),
        shortDescription: `Вопросы по теме: ${categoryName}`,
        fullDescription: `Категория обращений из фильтра Harant: "${categoryName}".`,
        isActive: true
      }
    });
  }
}

function pickParentSpecialization(categoryName: HarantQuestionCategory, category: ServiceRow, servicesByName: Map<string, ServiceRow>) {
  const parentNames = HARANT_QUESTION_CATEGORY_PARENT_SPECIALIZATIONS[categoryName] ?? [];
  const candidates = parentNames
    .map((name) => servicesByName.get(normalizeHarantCategoryName(name)))
    .filter((service): service is ServiceRow => service !== undefined && service.id !== category.id);

  return candidates.find((service) => service._count.lawyers > 0) ?? candidates[0] ?? null;
}

async function findCategoriesWithoutLawyerRoute() {
  const categories = await prisma.service.findMany({
    where: { name: { in: [...HARANT_QUESTION_CATEGORIES] }, isActive: true },
    include: {
      parent: { include: { _count: { select: { lawyers: true } } } },
      _count: { select: { lawyers: true } }
    },
    orderBy: { name: "asc" }
  });

  return categories
    .filter((category) => category._count.lawyers === 0 && (category.parent?._count.lawyers ?? 0) === 0)
    .map((category) => category.name);
}

async function uniqueServiceSlug(slugBase: string) {
  const base = slugBase || "pravovye-voprosy";
  let slug = base.slice(0, 80);
  let index = 2;
  while (await prisma.service.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base.slice(0, 74)}-${index}`;
    index += 1;
  }
  return slug;
}

function slugify(value: string) {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "j",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "c",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya"
  };

  return value
    .toLowerCase()
    .replace(/[а-яё]/g, (char) => map[char] ?? "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function assertDevelopmentOnly() {
  const env = process.env.NODE_ENV;
  if (env === "production" || process.env.NEXT_PHASE === "phase-production-build" || process.env.VERCEL === "1") {
    throw new Error("Harant category specialization sync is development-only and must not run in production.");
  }
}
