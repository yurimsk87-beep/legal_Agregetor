// Lightweight on-site audit: BFS-crawls the local dev server, follows internal
// links (capping "heavy" detail sections so we don't crawl 50k Q&A), and flags
// broken links, thin pages, raw/placeholder pages and soft-404s.
//
//   AUDIT_BASE=http://localhost:3000 tsx scripts/site-crawl-audit.ts

const BASE = process.env.AUDIT_BASE || "http://localhost:3000";
const MAX_PAGES = Number(process.env.AUDIT_MAX_PAGES || 400);
const HEAVY = ["/questions/", "/lawyers/", "/yuristy/", "/legal/", "/video/", "/checklist/", "/reestr-advokatov/", "/blog/", "/cases/", "/calculators/"];
const HEAVY_CAP = 6;
const SKIP = ["/admin", "/lawyer-cabinet", "/lawyer/", "/api", "/login", "/_next", "/search"];
const RAW_MARKERS = [/\bскоро\b/i, /в разработке/i, /coming soon/i, /lorem ipsum/i, /placeholder/i, /\bTODO\b/, /\bFIXME\b/, /страница не найдена/i, /ничего не найдено/i, /функция появится/i, /в ближайшее время/i];
const THIN_TEXT = 700; // visible-text chars below this = thin

type Rec = { url: string; status: number; textLen: number; raw: string[]; from?: string; title: string };
const seen = new Set<string>();
const results: Rec[] = [];
const heavyCount: Record<string, number> = {};
const linkSources = new Map<string, string>(); // url -> first page that linked it

function normalize(href: string, from: string): string | null {
  let u: URL;
  try { u = new URL(href, from.startsWith("http") ? from : BASE + from); } catch { return null; }
  if (u.origin !== BASE) return null;
  if (!u.pathname.startsWith("/")) return null;
  if (SKIP.some((s) => u.pathname.startsWith(s))) return null;
  if (/\.(png|jpg|jpeg|svg|webp|ico|css|js|xml|txt|json|pdf|woff2?)$/i.test(u.pathname)) return null;
  return u.pathname + u.search; // keep query out of dedupe key below
}

function heavyPrefix(path: string) {
  return HEAVY.find((h) => path.startsWith(h));
}

function visibleText(html: string) {
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  return body.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
}

function extractLinks(html: string) {
  const links: string[] = [];
  const re = /href="([^"#]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) links.push(m[1]);
  return links;
}

function titleOf(html: string) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return (m?.[1] ?? "").trim().slice(0, 80);
}

async function crawl() {
  const queue: { path: string; from?: string }[] = [{ path: "/" }];
  // explicit seeds for finite sections
  for (const s of ["/about/", "/contacts/", "/problems/", "/documents/", "/tools/", "/lawyers/", "/yuristy/", "/questions/", "/video/", "/checklist/", "/specializations/", "/reestr-advokatov/", "/for-lawyers/", "/how-rating-works/", "/how-we-check-lawyers/", "/proverka-advokata/", "/reestr-advokatov/", "/answer-rules/", "/question-rules/", "/review-policy/", "/privacy/", "/terms/", "/contacts/"]) {
    queue.push({ path: s, from: "/" });
  }

  while (queue.length && results.length < MAX_PAGES) {
    const { path, from } = queue.shift()!;
    const key = path.split("?")[0];
    if (seen.has(key)) continue;
    const hp = heavyPrefix(key);
    if (hp && key !== hp) {
      heavyCount[hp] = (heavyCount[hp] ?? 0) + 1;
      if (heavyCount[hp] > HEAVY_CAP) continue;
    }
    seen.add(key);
    if (!linkSources.has(key) && from) linkSources.set(key, from);

    let status = 0;
    let html = "";
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(BASE + path, { redirect: "manual", headers: { Accept: "text/html" }, signal: ctrl.signal }).finally(() => clearTimeout(to));
      status = res.status;
      if (status >= 200 && status < 300) html = await res.text();
      else if (status >= 300 && status < 400) {
        // follow one redirect (trailing slash)
        const loc = res.headers.get("location");
        if (loc) { const n = normalize(loc, path); if (n && !seen.has(n.split("?")[0])) queue.unshift({ path: n, from }); }
      }
    } catch {
      status = -1;
    }

    const text = html ? visibleText(html) : "";
    const raw = html ? RAW_MARKERS.filter((r) => r.test(text)).map((r) => r.source) : [];
    results.push({ url: key, status, textLen: text.length, raw, from: linkSources.get(key), title: titleOf(html) });
    if (results.length % 10 === 0 || status <= 0 || status >= 400) console.error(`[${results.length}] ${status} ${key} (${text.length}b)`);
    await new Promise((r) => setTimeout(r, 120)); // ease load on the dev compiler

    if (html) {
      for (const href of extractLinks(html)) {
        const n = normalize(href, path);
        if (!n) continue;
        const nk = n.split("?")[0];
        if (seen.has(nk)) continue;
        if (!linkSources.has(nk)) linkSources.set(nk, key);
        queue.push({ path: n, from: key });
      }
    }
  }
}

(async () => {
  await crawl();
  const broken = results.filter((r) => r.status < 200 || r.status >= 400);
  const softNotFound = results.filter((r) => r.status >= 200 && r.status < 300 && r.raw.some((s) => /найден/i.test(s)));
  const thin = results.filter((r) => r.status >= 200 && r.status < 300 && r.textLen < THIN_TEXT && !broken.includes(r));
  const raw = results.filter((r) => r.raw.length && !softNotFound.includes(r));

  console.log(`\n=== CRAWL AUDIT (${results.length} pages, base ${BASE}) ===`);
  console.log(`Broken (status<200 or >=400): ${broken.length}`);
  broken.forEach((r) => console.log(`  [${r.status}] ${r.url}   (linked from ${r.from ?? "?"})`));
  console.log(`\nSoft-404 (200 but "не найдено/найдена"): ${softNotFound.length}`);
  softNotFound.forEach((r) => console.log(`  ${r.url}`));
  console.log(`\nRaw/placeholder (Скоро/в разработке/TODO/...): ${raw.length}`);
  raw.forEach((r) => console.log(`  ${r.url}   markers: ${r.raw.join(", ")}`));
  console.log(`\nThin (visible text < ${THIN_TEXT} chars): ${thin.length}`);
  thin.sort((a, b) => a.textLen - b.textLen).forEach((r) => console.log(`  [${r.textLen}b] ${r.url}`));

  const fs = await import("node:fs");
  fs.mkdirSync("reports", { recursive: true });
  fs.writeFileSync("reports/site-crawl-audit.json", JSON.stringify({ generatedAt: new Date().toISOString(), totals: { pages: results.length, broken: broken.length, softNotFound: softNotFound.length, raw: raw.length, thin: thin.length }, broken, softNotFound, raw, thin }, null, 2));
  console.log("\nFull report: reports/site-crawl-audit.json");
})();
