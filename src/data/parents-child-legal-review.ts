import type { ParentsChildScenarioKey } from "@/data/parents-child-route";

export const PARENTS_CHILD_REVIEWED_AT = "2026-09-08";

export type ParentsChildLegalRule = {
  id: string;
  statement: string;
  norm: string;
  url: string;
  scenarios: ParentsChildScenarioKey[];
  scope: string;
};

export const PARENTS_CHILD_LEGAL_RULES: ParentsChildLegalRule[] = [
  {
    id: "sk-65-residence",
    statement: "При раздельном проживании родителей место жительства ребёнка определяется соглашением родителей, а при споре — судом исходя из интересов ребёнка и с учётом его мнения.",
    norm: "пункт 3 статьи 65 СК РФ",
    url: "https://www.consultant.ru/document/cons_doc_LAW_8982/62983d3753a7a65cbeec6d5ca47586894b5ae733/",
    scenarios: ["residence", "change"],
    scope: "Не предсказывает, с кем суд оставит ребёнка, и не устанавливает преимущество матери или отца."
  },
  {
    id: "sk-66-communication",
    statement: "Родители вправе заключить письменное соглашение о порядке осуществления родительских прав отдельно проживающим родителем; спор разрешает суд.",
    norm: "пункты 1 и 2 статьи 66 СК РФ",
    url: "https://www.consultant.ru/document/cons_doc_LAW_8982/089e2c39f3d69b45c77a033d3c169a39ced19370/",
    scenarios: ["communication", "change", "enforcement"],
    scope: "Содержание графика формулирует пользователь; сервис не определяет подходящий объём общения."
  },
  {
    id: "sk-57-opinion",
    statement: "Ребёнок вправе выражать мнение; учёт мнения ребёнка, достигшего десяти лет, обязателен, кроме случая, когда это противоречит его интересам.",
    norm: "статья 57 СК РФ",
    url: "https://www.consultant.ru/document/cons_doc_LAW_8982/4ba9f61459033a7654e973b5d343f3853f55c89e/",
    scenarios: ["residence", "communication", "change"],
    scope: "Сервис не опрашивает ребёнка и не подменяет оценку суда или органа опеки."
  },
  {
    id: "sk-78-guardianship",
    statement: "При рассмотрении судом споров, связанных с воспитанием детей, орган опеки привлекается к участию в деле и представляет акт обследования и заключение.",
    norm: "статья 78 СК РФ",
    url: "https://www.consultant.ru/document/cons_doc_LAW_8982/89a95ffdef29e0133a9ed546817ed5bf5155cedd/",
    scenarios: ["residence", "communication", "change"],
    scope: "Пользователь не должен придумывать заключение органа опеки или мнение ребёнка."
  },
  {
    id: "vs-plenum-10",
    statement: "Суд оценивает совокупность обстоятельств и интересы ребёнка; лучшее материальное положение одного родителя само по себе не решает спор.",
    norm: "пункты 5 и 8 Постановления Пленума ВС РФ от 27.05.1998 № 10",
    url: "https://vsrf.ru/documents/own/8220/",
    scenarios: ["residence", "communication", "change"],
    scope: "Перечень обстоятельств не превращается в автоматический прогноз исхода дела."
  },
  {
    id: "vs-review-jurisdiction",
    statement: "Споры о воспитании детей рассматриваются районным судом; общее правило территориальной подсудности — место жительства ответчика.",
    norm: "статьи 24 и 28 ГПК РФ; Обзор ВС РФ от 20.07.2011",
    url: "https://vsrf.ru/documents/all/15101/",
    scenarios: ["residence", "communication", "change"],
    scope: "Конкретный суд по адресу автоматически не определяется без подтверждённого территориального справочника."
  },
  {
    id: "gpk-claim-content",
    statement: "В иске указываются предусмотренные законом сведения, обстоятельства и требования; к нему прилагаются документы по установленному перечню.",
    norm: "статьи 131 и 132 ГПК РФ",
    url: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102078828",
    scenarios: ["residence", "communication", "change"],
    scope: "Помощник формирует только маркированный черновик и не подтверждает его готовность к подаче без юридической проверки."
  },
  {
    id: "enforcement-109-3",
    statement: "Требования о передаче ребёнка и порядке общения исполняются судебным приставом-исполнителем по правилам исполнительного производства.",
    norm: "статья 109.3 Федерального закона № 229-ФЗ",
    url: "https://epp.genproc.gov.ru/upload/iblock/c0c/sayetmh8w7waa5ynnlxfvkpkrtw53jtx.pdf",
    scenarios: ["enforcement"],
    scope: "Помощник не придумывает подразделение ФССП и требует проверить исполнительный документ и стадию производства."
  },
  {
    id: "emergency-112",
    statement: "При реальной угрозе жизни или здоровью следует использовать единый номер экстренных служб 112.",
    norm: "официальная инструкция МЧС России",
    url: "https://76.mchs.gov.ru/deyatelnost/poleznaya-informaciya/rekomendacii-naseleniyu/sistema-112",
    scenarios: ["residence", "communication", "change", "enforcement"],
    scope: "Срочный экран не заменяет обращение в полицию, медицинскую помощь или иной компетентный орган."
  }
];

export function getParentsChildRules(scenario: ParentsChildScenarioKey) {
  return PARENTS_CHILD_LEGAL_RULES.filter((rule) => rule.scenarios.includes(scenario));
}
