import { urlSet, xmlResponse } from "@/lib/sitemap";
import { legalProblems } from "@/data/legal-problems";

export async function GET() {
  const categoryPaths = [...new Set(legalProblems.map((problem) => `/problems/${problem.categorySlug}/`))];
  return xmlResponse(
    urlSet([
      "/problems/",
      ...categoryPaths,
      ...legalProblems.map((problem) => `/problems/${problem.categorySlug}/${problem.slug}/`)
    ])
  );
}
