export type FamilyToolSlug =
  | "family-state-duty"
  | "claim-price"
  | "alimony-shares"
  | "alimony-debt-estimate"
  | "notary-costs"
  | "court-finder"
  | "order-or-claim"
  | "family-document-check"
  | "where-to-file";

export type FamilyToolSource = {
  title: string;
  norm: string;
  url: string;
  checkedAt: string;
  limitation: string;
};

export type FamilyToolDefinition = {
  slug: FamilyToolSlug;
  title: string;
  description: string;
  sources: FamilyToolSource[];
};

const checkedAt = "2026-09-19";

const nk33319: FamilyToolSource = {
  title: "Налоговый кодекс РФ",
  norm: "статья 333.19",
  url: "https://www.consultant.ru/document/cons_doc_LAW_28165/5f32d7850f7f21fcd36f7e20f6160e99b257ade9/",
  checkedAt,
  limitation: "Федеральные размеры пошлины. Льготы и особенности конкретного требования проверяются отдельно."
};

const sk81: FamilyToolSource = {
  title: "Семейный кодекс РФ",
  norm: "статья 81",
  url: "https://www.consultant.ru/document/cons_doc_LAW_8982/73d58c51a5e2f45aa447f01754320272901772ae/",
  checkedAt,
  limitation: "Долевой расчёт применим к алиментам на несовершеннолетних детей при отсутствии соглашения; суд может изменить доли."
};

const sk113: FamilyToolSource = {
  title: "Семейный кодекс РФ",
  norm: "статья 113",
  url: "https://www.consultant.ru/document/cons_doc_LAW_8982/fcc960557d1910655be3fdd176d6d6bec466afb7/",
  checkedAt,
  limitation: "Инструмент даёт предварительную арифметику и не заменяет постановление судебного пристава о расчёте задолженности."
};

const courtSearch: FamilyToolSource = {
  title: "ГАС РФ «Правосудие»",
  norm: "официальный поиск территориальной подсудности",
  url: "https://sudrf.ru/index.php?id=300",
  checkedAt,
  limitation: "Суд определяется по полному адресу и предмету требования. Сервис не выбирает суд автоматически."
};

const notaryTariffs: FamilyToolSource = {
  title: "Федеральная нотариальная палата",
  norm: "региональные тарифы",
  url: "https://notariat.ru/ru-ru/actions-and-tariffs/regional-rates/",
  checkedAt,
  limitation: "Региональная часть тарифа зависит от субъекта РФ и нотариального действия; окончательную сумму сообщает нотариус."
};

export const familyTools: FamilyToolDefinition[] = [
  { slug: "family-state-duty", title: "Госпошлина по семейному спору", description: "Предварительно рассчитает федеральную госпошлину по выбранному виду обращения.", sources: [nk33319] },
  { slug: "claim-price", title: "Цена иска", description: "Сложит стоимость требований и компенсаций для предварительной проверки цены иска.", sources: [nk33319] },
  { slug: "alimony-shares", title: "Доли алиментов", description: "Покажет ориентир долевого взыскания на одного, двух или трёх и более детей.", sources: [sk81] },
  { slug: "alimony-debt-estimate", title: "Предварительная задолженность по алиментам", description: "Сопоставит начисленные и уплаченные суммы без подмены расчёта ФССП.", sources: [sk113] },
  { slug: "notary-costs", title: "Расходы у нотариуса", description: "Объяснит состав единого нотариального тарифа и откроет официальный региональный справочник.", sources: [notaryTariffs] },
  { slug: "court-finder", title: "Найти суд", description: "Откроет официальный поиск суда и поможет проверить реквизиты найденной страницы.", sources: [courtSearch] },
  { slug: "order-or-claim", title: "Судебный приказ или иск", description: "Проверит, допустим ли упрощённый приказной путь для требования об алиментах.", sources: [sk81, courtSearch] },
  { slug: "family-document-check", title: "Проверка комплекта документов", description: "Соберёт проверочный список перед подачей семейного документа.", sources: [courtSearch] },
  { slug: "where-to-file", title: "Куда обращаться", description: "Разделит обращение в ЗАГС, к нотариусу и в суд без угадывания конкретного органа.", sources: [courtSearch, notaryTariffs] }
];

export function getFamilyTool(slug: string) {
  return familyTools.find((tool) => tool.slug === slug) ?? null;
}
