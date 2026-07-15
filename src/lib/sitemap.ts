import { absoluteUrl, siteUrl } from "./seo";

export function xmlResponse(body: string) {
  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=900, stale-while-revalidate=3600"
    }
  });
}

export function sitemapIndex(paths: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    (path) => `  <sitemap>
    <loc>${absoluteSitemapUrl(path)}</loc>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;
}

export function urlSet(paths: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    (path) => `  <url>
    <loc>${absoluteUrl(path)}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === "/" ? "1.0" : "0.7"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
}

function absoluteSitemapUrl(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}${cleanPath}`;
}
