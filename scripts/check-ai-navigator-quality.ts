export {};

type NavigatorResponse = {
  primaryAction: { label: string; href: string } | null;
  sections: {
    situations: Array<{ href: string }>;
    instructions: Array<{ href: string }>;
    documents: Array<{ href: string }>;
  };
};

const baseUrl = process.env.AI_NAVIGATOR_CHECK_URL || "http://localhost:3000";
const allowedProblem = "/problems/semya-i-deti/brak-zags-i-smena-familii/";
const allowedDocument = "/documents/zayavlenie-v-zags/";
const allowedContentPrefixes = [allowedProblem, allowedDocument];

const queries = [
  "хочу зарегистрировать брак",
  "сменить фамилию после свадьбы",
  "получить повторное свидетельство",
  "исправить ошибку в записи загс"
];

async function main() {
  let failed = 0;

  for (const query of queries) {
    const url = new URL("/api/ai-navigator?fast=1", baseUrl);
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query })
    });
    if (!response.ok) {
      failed += 1;
      console.error("FAIL " + query + ": HTTP " + response.status);
      continue;
    }

    const data = (await response.json()) as NavigatorResponse;
    const contentLinks = [
      ...data.sections.situations,
      ...data.sections.instructions,
      ...data.sections.documents
    ].map((item) => item.href);
    const invalidLinks = contentLinks.filter(
      (href) => !allowedContentPrefixes.some((allowed) => href.startsWith(allowed))
    );
    const primaryHref = data.primaryAction?.href ?? "";
    const primaryIsAllowed = allowedContentPrefixes.some((allowed) => primaryHref.startsWith(allowed));

    if (!primaryIsAllowed || invalidLinks.length) {
      failed += 1;
      console.error(
        "FAIL " + query + ": primary=" + (primaryHref || "none") + " invalid=" + (invalidLinks.join(",") || "none")
      );
    } else {
      console.log("PASS " + query + ": " + primaryHref);
    }
  }

  if (failed) {
    throw new Error("AI navigator quality failed: " + failed + "/" + queries.length);
  }

  console.log("AI navigator quality passed: " + queries.length + "/" + queries.length);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
