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
const divorceProblem = "/problems/semya-i-deti/razvod-i-razdel-imushchestva/";
const divorceDocuments = [
  "/documents/zayavlenie-o-rastorzhenii-braka-v-zags/",
  "/documents/isk-o-rastorzhenii-braka/",
  "/documents/soglashenie-o-razdele-imushchestva/",
  "/documents/isk-o-razdele-imushchestva-suprugov/"
];
const guardianshipProblem = "/problems/semya-i-deti/opeka-i-popechitelstvo-nad-rebenkom/";
const guardianshipDocuments = [
  "/documents/zayavlenie-o-naznachenii-opekuna-rebenku/",
  "/documents/zayavlenie-roditelya-o-naznachenii-opekuna/",
  "/documents/dokumenty-po-imushchestvu-podopechnogo/",
  "/documents/zhaloba-na-organ-opeki/"
];
const guardianshipContent = [guardianshipProblem, ...guardianshipDocuments];
const allowedContentPrefixes = [allowedProblem, allowedDocument, divorceProblem, ...divorceDocuments, ...guardianshipContent];

const queries = [
  { query: "хочу зарегистрировать брак", expected: [allowedProblem, allowedDocument] },
  { query: "сменить фамилию после свадьбы", expected: [allowedProblem, allowedDocument] },
  { query: "получить повторное свидетельство", expected: [allowedProblem, allowedDocument] },
  { query: "исправить ошибку в записи загс", expected: [allowedProblem, allowedDocument] },
  { query: "как развестись", expected: [divorceProblem, ...divorceDocuments.slice(0, 2)] },
  { query: "развод через загс", expected: [divorceProblem, divorceDocuments[0]] },
  { query: "супруг не согласен на развод", expected: [divorceProblem, divorceDocuments[1]] },
  { query: "раздел имущества после развода", expected: [divorceProblem, divorceDocuments[2], divorceDocuments[3]] },
  { query: "соглашение о разделе имущества", expected: [divorceProblem, divorceDocuments[2]] },
  { query: "ипотека при разводе", expected: [divorceProblem, divorceDocuments[2], divorceDocuments[3]] },
  { query: "супруг продал имущество перед разводом", expected: [divorceProblem, divorceDocuments[3]] },
  { query: "срок раздела имущества", expected: [divorceProblem, divorceDocuments[3]] },
  { query: "оформить опеку над ребёнком", expected: guardianshipContent },
  { query: "стать опекуном ребёнка", expected: guardianshipContent },
  { query: "опека над ребёнком до 14 лет", expected: guardianshipContent },
  { query: "попечительство над ребёнком 15 лет", expected: guardianshipContent },
  { query: "предварительная опека", expected: guardianshipContent },
  { query: "срочно назначить опекуна ребёнку", expected: guardianshipContent },
  { query: "опека бабушкой по заявлению родителей на определённый период", expected: guardianshipContent },
  { query: "родители уезжают ребёнок остаётся с родственником", expected: guardianshipContent },
  { query: "заявление родителей о назначении опекуна", expected: guardianshipContent },
  { query: "отчёт опекуна", expected: guardianshipContent },
  { query: "номинальный счёт опекуна", expected: guardianshipContent },
  { query: "разрешение опеки на имущество ребёнка", expected: guardianshipContent },
  { query: "продажа квартиры ребёнка разрешение опеки", expected: guardianshipContent },
  { query: "орган опеки отказал", expected: guardianshipContent },
  { query: "орган опеки не отвечает", expected: guardianshipContent },
  { query: "усыновить ребёнка", expected: [], forbidden: guardianshipContent },
  { query: "опека над недееспособным взрослым", expected: [], forbidden: guardianshipContent }
];

async function main() {
  let failed = 0;

  for (const testCase of queries) {
    const { query, expected } = testCase;
    const forbidden: string[] = "forbidden" in testCase ? testCase.forbidden ?? [] : [];
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
    const primaryIsAllowed = expected.length === 0 || expected.some((allowed) => primaryHref.startsWith(allowed));
    const forbiddenLinks = [primaryHref, ...contentLinks].filter(
      (href) => href && forbidden.some((blocked) => href.startsWith(blocked))
    );

    if (!primaryIsAllowed || invalidLinks.length || forbiddenLinks.length) {
      failed += 1;
      console.error(
        "FAIL " + query + ": primary=" + (primaryHref || "none") + " invalid=" + (invalidLinks.join(",") || "none") + " forbidden=" + (forbiddenLinks.join(",") || "none")
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
