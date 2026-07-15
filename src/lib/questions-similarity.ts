import { prisma } from "./prisma";

type SimilarQuestionInput = {
  title: string;
  text: string;
  cityId?: string | null;
  serviceId?: string | null;
  excludeQuestionId?: string;
  publicOnly?: boolean;
  limit?: number;
};

export async function findSimilarQuestions(input: SimilarQuestionInput) {
  const queryWords = importantWords(`${input.title} ${input.text}`);
  if (queryWords.length < 3) return [];

  const probeWords = queryWords.slice(0, 8);
  const rows = await prisma.question.findMany({
    where: {
      id: input.excludeQuestionId ? { not: input.excludeQuestionId } : undefined,
      serviceId: input.serviceId || undefined,
      cityId: input.cityId || undefined,
      status: input.publicOnly ? "PUBLISHED" : undefined,
      qualityStatus: input.publicOnly ? "APPROVED" : undefined,
      isIndexable: input.publicOnly ? true : undefined,
      OR: probeWords.flatMap((word) => [
        { title: { contains: word, mode: "insensitive" as const } },
        { text: { contains: word, mode: "insensitive" as const } }
      ])
    },
    select: { id: true, slug: true, title: true, text: true, qualityStatus: true, isIndexable: true },
    take: 20
  });

  return rows
    .map((row) => ({
      ...row,
      similarity: similarityScore(queryWords, importantWords(`${row.title} ${row.text}`))
    }))
    .filter((row) => row.similarity >= 0.42)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, input.limit ?? 5);
}

function importantWords(value: string) {
  const words = value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4 && !stopWords.has(word));

  return Array.from(new Set(words));
}

function similarityScore(left: string[], right: string[]) {
  if (!left.length || !right.length) return 0;
  const rightSet = new Set(right);
  const matched = left.filter((word) => rightSet.has(word)).length;
  return matched / Math.max(left.length, right.length);
}

const stopWords = new Set([
  "если",
  "как",
  "что",
  "это",
  "или",
  "для",
  "при",
  "надо",
  "нужно",
  "можно",
  "будет",
  "после",
  "через",
  "вопрос",
  "юрист",
  "юриста"
]);
