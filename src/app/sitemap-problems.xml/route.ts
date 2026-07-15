import { urlSet, xmlResponse } from "@/lib/sitemap";
import { legalCategories } from "@/data/legal-categories";
import { legalProblems } from "@/data/legal-problems";

export async function GET() {
  return xmlResponse(
    urlSet([
      "/problems/",
      ...legalCategories.map((category) => `/problems/${category.slug}/`),
      ...legalProblems.map((problem) => `/problems/${problem.categorySlug}/${problem.slug}/`)
    ])
  );
}
