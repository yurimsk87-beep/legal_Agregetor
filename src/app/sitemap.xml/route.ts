import { sitemapIndex, xmlResponse } from "@/lib/sitemap";

export async function GET() {
  return xmlResponse(
    sitemapIndex([
      "/sitemap-pages.xml",
      "/sitemap-problems.xml",
      "/sitemap-documents.xml",
      "/sitemap-tools.xml",
      "/sitemap-lawyers.xml",
      "/sitemap-questions.xml"
    ])
  );
}
