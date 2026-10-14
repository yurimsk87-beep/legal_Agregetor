import type { NavigatorDocument } from "@/data/documents";
import type { FaqItem } from "@/lib/types";

type SeoDocument = NavigatorDocument & {
  shortTitle?: string | null;
  titleAccusative?: string | null;
  documentTypeAccusative?: string | null;
  generatorSeoTitle?: string | null;
  generatorSeoDescription?: string | null;
};

type DocumentIntent = {
  nominative: string;
  accusative: string;
  genitive: string;
};

type GeneratorSeoBlock = {
  title: string;
  text: string;
};

type GuidedResultKind = "official" | "checklist" | "prepared" | null;
function getGuidedResultKind(document: SeoDocument): GuidedResultKind {
  const value = document.resultKind;
  if (value === "officialForm" || value === "OFFICIAL_FORM") return "official";
  if (value === "checklist" || value === "CHECKLIST" || value === "legalReviewOnly" || value === "LEGAL_REVIEW_ONLY") return "checklist";
  if (value === "preparedData" || value === "PREPARED_DATA") return "prepared";
  return null;
}

const documentIntentPatterns: Array<[RegExp, DocumentIntent]> = [
  [/претенз/i, { nominative: "претензия", accusative: "претензию", genitive: "претензии" }],
  [/жалоб/i, { nominative: "жалоба", accusative: "жалобу", genitive: "жалобы" }],
  [/заявлен/i, { nominative: "заявление", accusative: "заявление", genitive: "заявления" }],
  [/исков|иск\b/i, { nominative: "иск", accusative: "иск", genitive: "иска" }],
  [/возражен/i, { nominative: "возражение", accusative: "возражение", genitive: "возражения" }],
  [/ходатайств/i, { nominative: "ходатайство", accusative: "ходатайство", genitive: "ходатайства" }],
  [/соглашен/i, { nominative: "соглашение", accusative: "соглашение", genitive: "соглашения" }],
  [/договор/i, { nominative: "договор", accusative: "договор", genitive: "договора" }],
  [/доверен/i, { nominative: "доверенность", accusative: "доверенность", genitive: "доверенности" }],
  [/акт/i, { nominative: "акт", accusative: "акт", genitive: "акта" }],
  [/рапорт/i, { nominative: "рапорт", accusative: "рапорт", genitive: "рапорта" }]
];

export function getDocumentShortTitle(document: Pick<SeoDocument, "title" | "shortTitle">) {
  return document.shortTitle?.trim() || document.title;
}

export function getDocumentTitle(document: Pick<SeoDocument, "title">) {
  return document.title;
}

export function getDocumentPageTitle(document: SeoDocument) {
  return (
    document.seoTitle?.trim() ||
    `${getDocumentShortTitle(document)}: образец, бланк и инструкция по заполнению`
  );
}

export function getDocumentH1(document: SeoDocument) {
  return getDocumentShortTitle(document);
}

export function getDocumentMetaDescription(document: SeoDocument) {
  return (
    document.seoDescription?.trim() ||
    `Разбираем, как составить документ: ${getDocumentShortTitle(document)}. Что указать, какие ошибки проверить и как подготовить образец для подачи.`
  );
}

export function getGeneratorPageTitle(document: SeoDocument) {
  const kind = getGuidedResultKind(document);
  if (kind === "official") return `${getDocumentShortTitle(document)}: подготовить сведения для официальной формы`;
  if (kind === "checklist") return `${getDocumentShortTitle(document)}: проверка и чек-лист`;
  if (kind === "prepared") return `${getDocumentShortTitle(document)}: подготовить данные`;
  return (
    document.generatorSeoTitle?.trim() ||
    `${getDocumentShortTitle(document)}: заполнить онлайн и скачать образец`
  );
}

export function getGeneratorMetaDescription(document: SeoDocument) {
  return (
    document.generatorSeoDescription?.trim() ||
    `Заполните документ онлайн или используйте готовый образец: ${getDocumentShortTitle(document)}. Подскажем, что указать, куда подать, какие сроки проверить и каких ошибок избежать.`
  );
}

export function getGeneratorH1(document: SeoDocument) {
  if (getGuidedResultKind(document)) return getDocumentShortTitle(document);
  const titleAccusative = document.titleAccusative?.trim();

  if (titleAccusative) return `Сформировать ${titleAccusative} онлайн`;

  return `${getDocumentShortTitle(document)}: сформировать онлайн`;
}

export function getGeneratorEyebrow(document: SeoDocument) {
  if (getGuidedResultKind(document)) return "Правовая проверка и подготовка сведений";
  return `${capitalize(getDocumentIntent(document).nominative)}: образец и онлайн-заполнение`;
}

export function getGeneratorLead(document: SeoDocument) {
  if (getGuidedResultKind(document) === "official") return "Ответьте на вопросы и перенесите подтверждённые сведения в утверждённый официальный бланк. Сервис не заменяет официальную форму.";
  if (getGuidedResultKind(document)) return "Ответьте на вопросы и получите перечень проверенных обстоятельств и дальнейших действий. Результат не является готовым процессуальным документом.";
  const documentType = getDocumentTypeGenitive(document);

  return `Ответьте на несколько вопросов - сервис подготовит черновик ${documentType}. Его можно использовать как образец, проверить перед подачей и сохранить для дальнейшего использования.`;
}

export function getGeneratorLegalDescription(_document: SeoDocument) {
  return "Сервис использует общую структуру документа и подсказки по теме. Перед подачей проверьте факты, адресата, сроки, суммы и приложения; порядок подачи зависит от вашей ситуации.";
}

export function getDocumentOnlineFillCtaLabel(_document: SeoDocument) {
  return getGuidedResultKind(_document) ? "Проверить условия и подготовить сведения" : "Сформировать документ";
}

export function getDocumentSampleCtaLabel(_document: SeoDocument) {
  return getGuidedResultKind(_document) === "official" ? "Открыть официальную форму" : getGuidedResultKind(_document) ? "Скачать результат PDF" : "Скачать образец";
}

export function getDocumentInstructionCtaLabel(document: SeoDocument) {
  const documentType = getDocumentTypeAccusative(document);

  return documentType === "документ" ? "Как правильно составить" : `Как правильно составить ${documentType}`;
}

export function getDocumentCardCtaLabel(document: SeoDocument) {
  return getGuidedResultKind(document) ? "Проверить порядок" : document.templateSlug ? "Сформировать" : "Скачать образец";
}

export function getDocumentTypeLabel(document: SeoDocument) {
  return getDocumentIntent(document).nominative;
}

export function getDocumentSeoBlocks(document: SeoDocument): GeneratorSeoBlock[] {
  const kind = getGuidedResultKind(document);
  if (kind) return getSafeGuidedBlocks(document, kind);
  const title = getDocumentShortTitle(document);
  const sampleTitle = document.titleAccusative?.trim() ? `Скачать образец ${document.titleAccusative.trim()}` : `Скачать образец: ${title}`;
  const fillTitle = document.titleAccusative?.trim()
    ? `Как правильно заполнить ${document.titleAccusative.trim()}`
    : `Как правильно заполнить ${getDocumentTypeAccusative(document)}`;
  const blankTitle = document.titleAccusative?.trim() ? `Где взять бланк ${document.titleAccusative.trim()}` : `Где взять бланк: ${title}`;

  return [
    {
      title: sampleTitle,
      text: "Вы можете использовать этот документ как образец: заполните данные, проверьте факты, сроки, адресата и приложения. После заполнения сохраните текст и используйте его для подачи."
    },
    {
      title: fillTitle,
      text: "Укажите данные заявителя, адресата, даты событий, описание ситуации и конкретное требование. Не ограничивайтесь общими фразами - документ должен показывать, что именно произошло и чего вы просите."
    },
    {
      title: blankTitle,
      text: "Отдельный обязательный бланк обычно не требуется, если закон или ведомство не установили специальную форму. Важно, чтобы в документе были реквизиты, факты, требование, дата, подпись и приложения."
    },
    {
      title: "Что проверить перед подачей",
      text: "Проверьте срок подачи, правильного адресата, номера дел и документов, доказательства, копии приложений и способ отправки."
    }
  ];
}

export function getGeneratorSeoBlocks(document: SeoDocument): GeneratorSeoBlock[] {
  const kind = getGuidedResultKind(document);
  if (kind) return getSafeGuidedBlocks(document, kind);
  const title = getDocumentShortTitle(document);
  const documentType = getDocumentTypeAccusative(document);
  const sampleTitle = document.titleAccusative?.trim() ? `Скачать образец ${document.titleAccusative.trim()}` : `Скачать образец: ${title}`;
  const blankTitle = document.titleAccusative?.trim() ? `Где взять бланк ${document.titleAccusative.trim()}` : `Где взять бланк: ${title}`;

  return [
    {
      title: sampleTitle,
      text: "Вы можете использовать этот документ как образец: заполните данные, проверьте факты, сроки, адресата и приложения. После заполнения сохраните текст и используйте его для подачи."
    },
    {
      title: `Как правильно заполнить ${documentType}`,
      text: "Укажите данные заявителя, адресата, даты событий, описание ситуации и конкретное требование. Не ограничивайтесь общими фразами - документ должен показывать, что именно произошло и чего вы просите."
    },
    {
      title: blankTitle,
      text: "Отдельный обязательный бланк обычно не требуется, если закон или ведомство не установили специальную форму. Важно, чтобы в документе были реквизиты, факты, требование, дата, подпись и приложения."
    },
    {
      title: "Что проверить перед подачей",
      text: "Проверьте срок подачи, правильного адресата, номера дел и документов, доказательства, копии приложений и способ отправки."
    }
  ];
}

export function getGeneratorFaqs(document: SeoDocument): FaqItem[] {
  const kind = getGuidedResultKind(document);
  if (kind) return getSafeGuidedFaqs(document, kind);
  const title = getDocumentShortTitle(document);
  const documentType = getDocumentTypeAccusative(document);
  const entityId = `document-generator-${document.slug}`;

  return [
    {
      id: `${entityId}-sample`,
      question: `Где скачать образец: ${title}?`,
      answer: "На этой странице можно использовать готовый образец и заполнить документ онлайн. Перед подачей проверьте адресата, срок, факты и приложения.",
      entityType: "DOCUMENT",
      entityId,
      sortOrder: 1
    },
    {
      id: `${entityId}-fill`,
      question: `Как правильно заполнить ${documentType}?`,
      answer: `Опишите ситуацию по датам, укажите участников, документы, суммы и конкретное требование. Формулировки должны быть проверяемыми: без лишних эмоций и общих фраз.`,
      entityType: "DOCUMENT",
      entityId,
      sortOrder: 2
    },
    {
      id: `${entityId}-submit`,
      question: `Куда подавать ${documentType}?`,
      answer: "Порядок подачи зависит от ситуации и адресата. Проверьте, кому направляется документ: другой стороне, должностному лицу, ведомству или в суд.",
      entityType: "DOCUMENT",
      entityId,
      sortOrder: 3
    },
    {
      id: `${entityId}-lawyer`,
      question: "Нужно ли показывать документ юристу?",
      answer: `Если есть риск пропуска срока, спор по суммам, несколько адресатов или уже идет суд, лучше задать вопрос юристу и проверить стратегию до подачи документа.`,
      entityType: "DOCUMENT",
      entityId,
      sortOrder: 4
    }
  ];
}

function getSafeGuidedBlocks(document: SeoDocument, kind: Exclude<GuidedResultKind, null>): GeneratorSeoBlock[] {
  const name = getDocumentShortTitle(document);
  return [
    {
      title: kind === "official" ? "Где получить официальную форму" : "Как получить персональный результат",
      text: kind === "official"
        ? "Используйте действующий официальный бланк из указанного источника. Сервис помогает проверить процедуру и подготовить сведения, но не выдаёт неофициальный документ вместо обязательной формы."
        : `Ответьте на вопросы по теме «${name}». Результатом будет перечень сведений, проверок и действий. Он не является готовым иском или заявлением для подачи.`
    },
    {
      title: "Что проверить перед использованием",
      text: "Проверьте актуальность процедуры, полномочия заявителя, подтверждённые обстоятельства, адресата и все обязательные приложения. При споре или неопределённости необходима юридическая проверка."
    }
  ];
}
function getSafeGuidedFaqs(document: SeoDocument, kind: Exclude<GuidedResultKind, null>): FaqItem[] {
  const title = getDocumentShortTitle(document);
  return [
    {
      id: `document-generator-${document.slug}-scope`,
      question: `Какой результат доступен: ${title}?`,
      answer: kind === "official"
        ? "Можно подготовить сведения и открыть официальный бланк. Внутренний результат не подменяет утверждённую форму."
        : "Сервис выдаёт проверочный материал и перечень действий, а не документ, готовый к подаче.",
      entityType: "DOCUMENT",
      entityId: `document-generator-${document.slug}`,
      sortOrder: 1
    },
    {
      id: `document-generator-${document.slug}-review`,
      question: "Нужно ли проверять результат перед использованием?",
      answer: "Да. Проверьте процедуру, полномочия, факты и приложения; при судебном или ином споре необходима индивидуальная юридическая оценка.",
      entityType: "DOCUMENT",
      entityId: `document-generator-${document.slug}`,
      sortOrder: 2
    }
  ];
}

function getDocumentTypeAccusative(document: SeoDocument) {
  return document.documentTypeAccusative?.trim() || getDocumentIntent(document).accusative;
}

function getDocumentTypeGenitive(document: SeoDocument) {
  return getDocumentIntent(document).genitive;
}

function getDocumentIntent(document: SeoDocument): DocumentIntent {
  const source = `${document.documentType ?? ""} ${document.category ?? ""} ${document.title}`.toLowerCase();

  return documentIntentPatterns.find(([pattern]) => pattern.test(source))?.[1] ?? { nominative: "документ", accusative: "документ", genitive: "документа" };
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
