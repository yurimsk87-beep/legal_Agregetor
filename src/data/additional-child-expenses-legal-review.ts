import type { AdditionalChildExpensesScenarioKey } from "@/data/additional-child-expenses-route";

export const ADDITIONAL_CHILD_EXPENSES_REVIEWED_AT = "2026-09-18";
export type AdditionalChildExpensesLegalPath = "assessment" | "agreement" | "court";

export type AdditionalChildExpensesLegalRule = {
  id: string;
  statement: string;
  norm: string;
  officialSource: string;
  url: string;
  checkedAt: string;
  scope: string;
  scenarios: AdditionalChildExpensesScenarioKey[];
  legalPath?: AdditionalChildExpensesLegalPath[];
  limitations: string;
};

export const ADDITIONAL_CHILD_EXPENSES_LEGAL_RULES: AdditionalChildExpensesLegalRule[] = [
  { id: "sk-86", statement: "При отсутствии соглашения суд может привлечь родителя к дополнительным расходам только при исключительных обстоятельствах; учитываются материальное и семейное положение и иные заслуживающие внимания интересы.", norm: "статья 86 СК РФ", officialSource: "Официальный интернет-портал правовой информации", url: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102038925", checkedAt: ADDITIONAL_CHILD_EXPENSES_REVIEWED_AT, scope: "Несовершеннолетние дети и нетрудоспособные совершеннолетние нуждающиеся дети; понесённые и необходимые будущие расходы.", scenarios: ["assessment", "agreement", "incurred", "future"], limitations: "Перечень обстоятельств открыт, но обычные расходы не становятся дополнительными автоматически." },
  { id: "vs-56-40-41", statement: "Необходимость расходов и исключительный характер обстоятельств подтверждаются доказательствами; понесённые расходы могут взыскиваться однократно, а будущие по общему правилу определяются в твёрдой сумме.", norm: "пункты 40–41 Постановления Пленума ВС РФ от 26.12.2017 № 56", officialSource: "Верховный Суд Российской Федерации", url: "https://www.vsrf.ru/documents/own/26297/", checkedAt: ADDITIONAL_CHILD_EXPENSES_REVIEWED_AT, scope: "Судебная оценка дополнительных расходов по статье 86 СК РФ.", scenarios: ["assessment", "incurred", "future"], legalPath: ["assessment", "court"], limitations: "Примеры расходов не гарантируют удовлетворение конкретного требования." },
  { id: "sk-99-100", statement: "Соглашение об уплате алиментов определяет размер, условия и порядок выплат, заключается письменно и удостоверяется нотариально.", norm: "статьи 99–100 СК РФ", officialSource: "Официальный интернет-портал правовой информации", url: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102038925", checkedAt: ADDITIONAL_CHILD_EXPENSES_REVIEWED_AT, scope: "Добровольный алиментный порядок; проект сервиса передаётся нотариусу.", scenarios: ["agreement"], legalPath: ["agreement"], limitations: "Проект не заменяет нотариально удостоверенное соглашение и не имеет силы исполнительного листа." },
  { id: "gpk-131-132", statement: "Иск должен содержать установленные сведения, обстоятельства, требования и перечень приложений.", norm: "статьи 131–132 ГПК РФ", officialSource: "Официальный интернет-портал правовой информации", url: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102078828", checkedAt: ADDITIONAL_CHILD_EXPENSES_REVIEWED_AT, scope: "Судебный черновик по уже понесённым или будущим расходам.", scenarios: ["incurred", "future"], legalPath: ["court"], limitations: "Подсудность, стороны, цена требования и доказательства проверяются индивидуально." },
  { id: "nk-333-36", statement: "Истцы по искам о взыскании алиментов освобождаются от уплаты государственной пошлины.", norm: "подпункт 2 пункта 1 статьи 333.36 НК РФ", officialSource: "ФНС России, Налоговый кодекс РФ", url: "https://www.nalog.gov.ru/html/nk.htm", checkedAt: ADDITIONAL_CHILD_EXPENSES_REVIEWED_AT, scope: "Требование о дополнительных расходах как разновидности алиментных платежей; иные объединённые требования оцениваются отдельно.", scenarios: ["incurred", "future"], legalPath: ["court"], limitations: "Льгота не исключает иных судебных расходов и требует проверки состава конкретного иска." }
];

export function getAdditionalChildExpensesRules(scenario: AdditionalChildExpensesScenarioKey, legalPath?: AdditionalChildExpensesLegalPath) {
  return ADDITIONAL_CHILD_EXPENSES_LEGAL_RULES.filter((rule) => rule.scenarios.includes(scenario) && (!legalPath || !rule.legalPath || rule.legalPath.includes(legalPath)));
}
