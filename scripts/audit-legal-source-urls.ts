import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Source-link audit is NOT a legal-content verification.
 * --live performs HTTP GET and checks the actual destination/title.
 * --strict fails on act-level links and unverified/unreachable article URLs.
 */
type Entry = { registry: string; key: string; norm: string; url: string };
type Result = Entry & {
  sourceKind: "official" | "reference" | "unknown";
  specificity: "article" | "act-only" | "unknown";
  httpStatus: number | null;
  destination: string | null;
  pageTitle: string | null;
  articleInTitle: boolean | null;
  status: "CHECKED" | "ARTICLE_NOT_CONFIRMED" | "ACT_ONLY" | "HTTP_ERROR" | "UNAVAILABLE" | "NOT_CHECKED";
};

const dataDir = path.resolve("src/data");
const isLive = process.argv.includes("--live");
const strict = process.argv.includes("--strict");
const entries: Entry[] = [];
const files = fs.readdirSync(dataDir).filter((name) =>
  /(?:legal-review|legal-sources|legal-references)\.ts$/.test(name)
);
const excluded = new Set(["__proto__", "constructor"]);

function visit(value: unknown, registry: string, key: string, depth = 0, seen = new WeakSet<object>()) {
  if (!value || typeof value !== "object" || depth > 7 || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(item, registry, key + "[" + index + "]", depth + 1, seen));
    return;
  }
  const obj = value as Record<string, unknown>;
  const url = typeof obj.url === "string" ? obj.url : undefined;
  const norm = [obj.norm, obj.article, obj.provisions, obj.act]
    .flatMap((part) => Array.isArray(part) ? part : [part])
    .filter((part): part is string => typeof part === "string")
    .join(" ");
  if (url && norm && !excluded.has(key)) entries.push({ registry, key, norm, url });
  for (const [childKey, child] of Object.entries(obj)) {
    if (!excluded.has(childKey) && child && typeof child === "object") {
      visit(child, registry, key + "." + childKey, depth + 1, seen);
    }
  }
}

function classifyUrl(url: string, norm: string): Pick<Result, "sourceKind" | "specificity"> {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const sourceKind: Result["sourceKind"] =
      host === "consultant.ru" || host.endsWith(".consultant.ru")
        ? "reference"
        : host === "pravo.gov.ru" || host.endsWith(".pravo.gov.ru") ||
          host === "nalog.gov.ru" || host.endsWith(".nalog.gov.ru") ||
          host === "vsrf.ru" || host.endsWith(".vsrf.ru") ||
          host === "sfr.gov.ru" || host.endsWith(".sfr.gov.ru")
          ? "official" : "unknown";
    const articleMention = /(?:ст\.?|стать(?:я|и|е|ю)|част[ьи])\s*\d+/iu.test(norm);
    if (!articleMention) return { sourceKind, specificity: "unknown" };
    const consultantRoot = /\/document\/cons_doc_LAW_\d+\/?$/i.test(u.pathname);
    const officialActOnly = host.endsWith("pravo.gov.ru") &&
      (/^\/proxy\/ips\//i.test(u.pathname) || /^\/document\//i.test(u.pathname)) &&
      !u.hash && !u.searchParams.has("article");
    const fnsRoot = /\/html\/nk\.htm$/i.test(u.pathname);
    return { sourceKind, specificity: consultantRoot || officialActOnly || fnsRoot ? "act-only" : "article" };
  } catch {
    return { sourceKind: "unknown", specificity: "unknown" };
  }
}

async function readLimited(response: Response, maxBytes = 120_000): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const parts: Uint8Array[] = [];
  let length = 0;
  try {
    while (length < maxBytes) {
      const { value, done } = await reader.read();
      if (done) break;
      parts.push(value);
      length += value.length;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return new TextDecoder("utf-8").decode(Buffer.concat(parts).subarray(0, maxBytes));
}

function titleOf(html: string) {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    ?.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim() || null;
}

function articleMatchesTitle(norm: string, title: string | null): boolean | null {
  const match = norm.match(/(?:ст\.?|стать(?:я|и|е|ю))\s*(\d+(?:\.\d+)?)/iu);
  if (!match || !title) return null;
  const expected = match[1].replace(".", "\\.");
  return new RegExp("(?:Статья|Ст\\.)\\s*" + expected + "(?![\\d.])", "iu").test(title);
}

async function examine(entry: Entry): Promise<Result> {
  const meta = classifyUrl(entry.url, entry.norm);
  const base: Result = { ...entry, ...meta, httpStatus: null, destination: null,
    pageTitle: null, articleInTitle: null, status: isLive ? "UNAVAILABLE" : "NOT_CHECKED" };
  if (!isLive) return base;
  try {
    const response = await fetch(entry.url, {
      method: "GET", redirect: "follow",
      headers: { Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(14_000)
    });
    base.httpStatus = response.status;
    base.destination = response.url;
    if (!response.ok) {
      base.status = "HTTP_ERROR";
      await response.body?.cancel();
      return base;
    }
    const html = await readLimited(response);
    base.pageTitle = titleOf(html);
    base.articleInTitle = articleMatchesTitle(entry.norm, base.pageTitle);
    const finalSpecificity = classifyUrl(response.url, entry.norm).specificity;
    if (meta.specificity === "act-only" || finalSpecificity === "act-only") {
      base.status = "ACT_ONLY";
    } else {
      base.status = base.articleInTitle === true ? "CHECKED" : "ARTICLE_NOT_CONFIRMED";
    }
    return base;
  } catch {
    // A timeout, blocked crawler or TLS failure is NOT an HTTP 404.
    return base;
  }
}

async function main() {
  for (const file of files) {
    const loadedRegistry = await import(pathToFileURL(path.join(dataDir, file)).href) as Record<string, unknown>;
    for (const [key, value] of Object.entries(loadedRegistry)) visit(value, file, key);
  }
  const unique = [...new Map(entries.map((entry) => [entry.registry + ":" + entry.key + ":" + entry.url, entry])).values()];
  const results: Result[] = [];
  // Small concurrency avoids hammering official sites.
  for (let i = 0; i < unique.length; i += 3) {
    const batch = await Promise.all(unique.slice(i, i + 3).map(examine));
    results.push(...batch);
  }
  const counts = Object.fromEntries([...new Set(results.map((r) => r.status))].map((key) => [key, results.filter((r) => r.status === key).length]));
  const report = { checkedAt: new Date().toISOString(), mode: isLive ? "HTTP_GET" : "STRUCTURAL_ONLY",
    scannedRegistries: files, total: results.length, counts, results };
  fs.mkdirSync("docs", { recursive: true });
  const outfile = process.env.LEGAL_LINK_AUDIT_OUTPUT || "docs/legal-links-live-audit.json";
  fs.writeFileSync(outfile, JSON.stringify(report, null, 2) + "\n");
  process.stdout.write(JSON.stringify({ mode: report.mode, total: report.total, counts, outfile }) + "\n");
  if (strict && results.some((r) => r.specificity === "act-only" || r.status !== "CHECKED")) process.exitCode = 1;
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Legal link audit failed"); process.exitCode = 1; });
