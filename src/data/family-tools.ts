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

export type FamilyToolSource = FamilyLegalSource;

export type FamilyToolDefinition = {
  slug: FamilyToolSlug;
  title: string;
  description: string;
  sources: FamilyToolSource[];
};

const checkedAt = FAMILY_TOOLS_CHECKED_AT;

const stateDutySources = [NK_FNS_SOURCE, COURT_FEE_AMENDMENT_SOURCE, NK_CONSULTANT_SOURCE];

const sk81: FamilyToolSource = {
  title: "Семейный кодекс РФ",
  norm: "статья 81",
  url: FAMILY_CODE_OFFICIAL_SOURCE.url,
  checkedAt,
  sourceType: "primary",
  limitation: "Долевой расчёт применим к алиментам на несовершеннолетних детей при отсутствии соглашения; суд может изменить доли."
};

const sk113: FamilyToolSource = {
  title: "Семейный кодекс РФ",
  norm: "статья 113",
  url: FAMILY_CODE_OFFICIAL_SOURCE.url,
  checkedAt,
  sourceType: "primary",
  limitation: "Инструмент даёт предварительную арифметику и не заменяет постановление судебного пристава о расчёте задолженности."
};

const courtSearch: FamilyToolSource = {
  title: "ГАС РФ «Правосудие»",
  norm: "официальный поиск территориальной подсудности",
  url: "https://sudrf.ru/index.php?id=300",
  checkedAt,
  sourceType: "primary",
  limitation: "Суд определяется по полному адресу и предмету требования. Сервис не выбирает суд автоматически."
};

const notaryTariffs: FamilyToolSource = {
  title: "Федеральная нотариальная палата",
  norm: "региональные тарифы",
  url: "https://notariat.ru/ru-ru/actions-and-tariffs/regional-rates/",
  checkedAt,
  sourceType: "primary",
  limitation: "Региональная часть тарифа зависит от субъекта РФ и нотариального действия; окончательную сумму сообщает нотариус."
};

export const familyTools: FamilyToolDefinition[] = [
  { slug: "family-state-duty", title: "Госпошлина по семейному спору", description: "Рассчитает федеральную госпошлину по выбранному требованию и отдельно покажет льготу, формулу и ограничения.", sources: stateDutySources },
  { slug: "claim-price", title: "Цена иска", description: "Сложит стоимость требований и компенсаций для предварительной проверки цены иска.", sources: stateDutySources },
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
import { COURT_FEE_AMENDMENT_SOURCE, FAMILY_CODE_OFFICIAL_SOURCE, FAMILY_TOOLS_CHECKED_AT, NK_CONSULTANT_SOURCE, NK_FNS_SOURCE, type FamilyLegalSource } from "@/data/family-legal-sources";
