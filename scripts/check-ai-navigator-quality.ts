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
const parentsChildProblem = "/problems/semya-i-deti/roditeli-i-rebenok-posle-razvoda/";
const parentsChildDocuments = [
  "/documents/mesto-zhitelstva-rebenka-posle-razvoda/",
  "/documents/poryadok-obshcheniya-s-rebenkom/",
  "/documents/izmenenie-poryadka-po-rebenku/",
  "/documents/ispolnenie-resheniya-o-rebenke/"
];
const parentsChildContent = [parentsChildProblem, ...parentsChildDocuments];
const childSupportProblem = "/problems/semya-i-deti/alimenty-na-rebenka/";
const childSupportDocuments = [
  "/documents/soglashenie-ob-uplate-alimentov-na-rebenka/",
  "/documents/vzyskanie-alimentov-na-rebenka/",
  "/documents/izmenenie-razmera-alimentov-na-rebenka/",
  "/documents/raschet-zadolzhennosti-po-alimentam/",
  "/documents/ispolnenie-alimentov-na-rebenka/"
];
const childSupportContent = [childSupportProblem, ...childSupportDocuments];
const deprivationProblem = "/problems/semya-i-deti/lishenie-roditelskih-prav/";
const deprivationDocuments = [
  "/documents/proverka-osnovaniy-lisheniya-roditelskih-prav/",
  "/documents/isk-o-lishenii-roditelskih-prav/",
  "/documents/uchet-resheniy-pri-lishenii-roditelskih-prav/",
  "/documents/lishenie-roditelskih-prav-i-alimenty/"
];
const deprivationContent = [deprivationProblem, ...deprivationDocuments];
const allowedContentPrefixes = [allowedProblem, allowedDocument, divorceProblem, ...divorceDocuments, ...guardianshipContent, ...parentsChildContent, ...childSupportContent, ...deprivationContent];

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
  { query: "усыновить ребёнка", expected: [], forbidden: [...guardianshipContent, ...childSupportContent, ...deprivationContent] },
  { query: "опека над недееспособным взрослым", expected: [], forbidden: [...guardianshipContent, ...parentsChildContent, ...deprivationContent] },
  { query: "После развода ребёнок должен жить со мной", expected: [parentsChildProblem, parentsChildDocuments[0]] },
  { query: "С кем останется ребёнок после развода", expected: [parentsChildProblem, parentsChildDocuments[0]] },
  { query: "Бывшая жена не даёт видеть сына", expected: [parentsChildProblem, parentsChildDocuments[1]] },
  { query: "Бывший муж хочет видеть ребёнка", expected: [parentsChildProblem, parentsChildDocuments[1]] },
  { query: "Хотим договориться о порядке общения", expected: [parentsChildProblem, parentsChildDocuments[1]] },
  { query: "изменить график общения с ребёнком", expected: [parentsChildProblem, parentsChildDocuments[2]] },
  { query: "Есть решение суда, но ребёнка всё равно не дают видеть", expected: [parentsChildProblem, parentsChildDocuments[3]] },
  { query: "Как определить место жительства ребёнка", expected: [parentsChildProblem, parentsChildDocuments[0]] },
  { query: "взыскать алименты на ребёнка", expected: [childSupportProblem, childSupportDocuments[1]], forbidden: parentsChildContent },
  { query: "соглашение об алиментах на ребёнка", expected: [childSupportProblem, childSupportDocuments[0]] },
  { query: "алименты в твёрдой сумме на ребёнка", expected: [childSupportProblem, childSupportDocuments[1]] },
  { query: "изменить размер алиментов на ребёнка", expected: [childSupportProblem, childSupportDocuments[2]] },
  { query: "задолженность по алиментам на ребёнка", expected: [childSupportProblem, childSupportDocuments[3], childSupportDocuments[4]] },
  { query: "бывший муж не платит алименты на сына", expected: [childSupportProblem, childSupportDocuments[3], childSupportDocuments[4]] },
  { query: "алименты жене", expected: [], forbidden: [...childSupportContent, ...deprivationContent] },
  { query: "дополнительные расходы на ребёнка", expected: [], forbidden: [...childSupportContent, ...deprivationContent] },
  { query: "лишить отца родительских прав", expected: [deprivationProblem, deprivationDocuments[1]], forbidden: [...guardianshipContent, ...parentsChildContent] },
  { query: "есть ли основания лишить родительских прав", expected: [deprivationProblem, deprivationDocuments[0]] },
  { query: "лишение родительских прав после решения об ограничении", expected: [deprivationProblem, deprivationDocuments[2]] },
  { query: "лишить родительских прав и взыскать алименты", expected: [deprivationProblem, deprivationDocuments[3]], forbidden: childSupportContent },
  { query: "ограничить родительские права", expected: [], forbidden: deprivationContent },
  { query: "восстановить родительские права после лишения", expected: [], forbidden: deprivationContent },
  { query: "как развестись без спора о детях", expected: [divorceProblem], forbidden: parentsChildContent }
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
