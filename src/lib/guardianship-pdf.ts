import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { getGuardianshipLegalReviewDate } from "@/data/guardianship-legal-review";
import type { GuardianshipDecision } from "@/lib/guardianship-validator";

export function getGuardianshipPdfFilename(outcomeKey: string, isDraft = false) {
  return `${isDraft ? "CHERNOVIK-" : ""}opeka-${outcomeKey}.pdf`;
}

export function buildGuardianshipPdfText(decision: GuardianshipDecision, draft: string) {
  return [
    decision.resultLabel.toUpperCase(),
    decision.requiresLegalReview ? "ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА" : "НЕ ЯВЛЯЕТСЯ ОФИЦИАЛЬНЫМ БЛАНКОМ",
    decision.documentTitle,
    "",
    ...decision.notices,
    ...(decision.issues.length ? ["", "Что нужно уточнить:", ...decision.issues.map((issue) => `- ${issue.message}`)] : []),
    "",
    `Можно подавать результат сразу: ${decision.filingReady ? "да" : "нет"}.`,
    ...(decision.requiresLegalReview ? ["Причина: результат требует юридической проверки до подачи."] : []),
    "",
    "Подготовленные сведения:",
    ...(decision.preparedData.length
      ? decision.preparedData.map((item) => `- ${item.label}: ${item.value}`)
      : ["- Для этого результата персональные сведения не требуются."]),
    "",
    `Пошлина и расходы: ${decision.fee}`,
    `Срок: ${decision.deadline}`,
    "",
    "Предоставляет заявитель:",
    ...decision.providedDocuments.map((item) => `- ${item.title}: ${item.purpose} Формат: ${item.format}.`),
    "",
    "Сведения, получаемые межведомственно:",
    ...(decision.interagencyInformation.length
      ? decision.interagencyInformation.map((item) => `- ${item.title}: ${item.purpose}`)
      : ["- Для этого результата не указаны."]),
    "",
    "Дополнительные документы:",
    ...[...decision.originals, ...decision.copies, ...decision.regionalDocuments, ...decision.additionalDocuments].map((item) => `- ${item}`),
    "",
    "Алгоритм действий:",
    ...decision.filingSteps.map((item, index) => `${index + 1}. ${item}`),
    ...(draft ? ["", "Маркированный черновик:", draft] : [])
  ].join("\n");
}

export async function createGuardianshipPdfBlob(decision: GuardianshipDecision, draft: string) {
  if (!decision.pdfAvailable || decision.resultKind === "urgent") {
    throw new Error("PDF недоступен для этого результата.");
  }

  const [pdfMakeModule, vfsModule] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts")
  ]);
  const pdfMake = pdfMakeModule.default;
  const vfs = vfsModule.default as unknown as Record<string, string>;
  (pdfMake as typeof pdfMake & { addVirtualFileSystem: (files: Record<string, string>) => void }).addVirtualFileSystem(vfs);

  const content: Content[] = [
    {
      unbreakable: true,
      stack: [
        { text: decision.resultLabel, style: "eyebrow" },
        { text: decision.documentTitle, style: "title" },
        {
          text: decision.requiresLegalReview
            ? "ЧЕРНОВИК — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА"
            : `${decision.resultLabel.toUpperCase()} — НЕ ОФИЦИАЛЬНЫЙ БЛАНК`,
          style: "warning"
        }
      ]
    },
    ...decision.notices.map((text) => ({ text, margin: [0, 0, 0, 6] }) as Content),
    ...(decision.issues.length ? [section("Что нужно уточнить", decision.issues.map((issue) => issue.message))] : []),
    section("Статус использования", [
      decision.filingReady ? "Результат можно использовать по инструкции." : "Результат нельзя считать готовым к подаче.",
      ...(decision.requiresLegalReview ? ["До подачи требуется юридическая проверка."] : [])
    ]),
    preparedDataSection(decision),
    section("Пошлина и расходы", [decision.fee]),
    section("Срок", [decision.deadline]),
    documentSection("Предоставляет заявитель", decision.providedDocuments),
    documentSection("Орган получает межведомственно", decision.interagencyInformation),
    section("Оригиналы", decision.originals),
    section("Копии", decision.copies),
    section("Зависит от региона", decision.regionalDocuments),
    section("Дополнительно по ответам", decision.additionalDocuments),
    { text: "Алгоритм действий", style: "heading" },
    { ol: [...decision.filingSteps], margin: [0, 0, 0, 12] }
  ];

  if (draft) {
    content.push(
      { text: "Маркированный черновик", style: "heading" },
      { text: draft, style: "draft" }
    );
  }

  const reviewedAt = getGuardianshipLegalReviewDate().split("-").reverse().join(".");

  const definition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [42, 48, 42, 60],
    footer: (currentPage, pageCount) => ({
      margin: [42, 12, 42, 0],
      columns: [
        { text: `Правовая сверка: ${reviewedAt}`, style: "footerNote" },
        { text: `Страница ${currentPage} из ${pageCount}`, alignment: "right", style: "footerNote" }
      ]
    }),
    defaultStyle: { font: "Roboto", fontSize: 10, lineHeight: 1.35, color: "#18181b" },
    content,
    styles: {
      eyebrow: { fontSize: 10, bold: true, color: "#166534", margin: [0, 0, 0, 8] },
      title: { fontSize: 20, bold: true, margin: [0, 0, 0, 12] },
      warning: { fontSize: 11, bold: true, color: decision.requiresLegalReview ? "#92400e" : "#3f3f46", margin: [0, 0, 0, 12] },
      heading: { fontSize: 13, bold: true, margin: [0, 12, 0, 6] },
      draft: { fontSize: 9, lineHeight: 1.4, margin: [0, 0, 0, 12] },
      footerNote: { fontSize: 8, color: "#71717a", margin: [0, 16, 0, 0] }
    },
    info: {
      title: decision.documentTitle,
      subject: decision.resultLabel,
      creator: "ПравоПоиск"
    }
  };

  return new Promise<Blob>((resolve, reject) => {
    try {
      pdfMake.createPdf(definition).getBlob(resolve);
    } catch (error) {
      reject(error);
    }
  });
}

function section(title: string, items: string[]): Content {
  if (!items.length) return { text: "" };
  return {
    unbreakable: items.length <= 4,
    stack: [
      { text: title, style: "heading" },
      { ul: [...items] }
    ]
  };
}

function preparedDataSection(decision: GuardianshipDecision): Content {
  const rows = decision.preparedData.length
    ? decision.preparedData.map((item) => [
        { text: item.label, bold: true, margin: [0, 2, 4, 2] },
        { text: item.value, margin: [0, 2, 0, 2] }
      ])
    : [[{ text: "Для этого результата персональные сведения не требуются.", colSpan: 2 }, {}]];
  return {
    stack: [
      { text: "Подготовленные сведения", style: "heading" },
      ...rows.map((row) => ({
        unbreakable: true,
        table: { widths: ["38%", "62%"], body: [row] },
        layout: "lightHorizontalLines"
      }))
    ]
  };
}

function documentSection(title: string, items: GuardianshipDecision["providedDocuments"]): Content {
  return section(title, items.map((item) => `${item.title}. ${item.purpose} Формат: ${item.format}. ${item.selfProvision}`));
}

