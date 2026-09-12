import type { ParentalRightsDeprivationScenarioKey } from "@/data/parental-rights-deprivation-route";

export const PARENTAL_RIGHTS_DEPRIVATION_REVIEWED_AT = "2026-09-12";

export type ParentalRightsDeprivationLegalPath = "assessment" | "court" | "existing" | "support" | "emergency" | "adult-special";

export type ParentalRightsDeprivationRule = {
  id: string;
  statement: string;
  norm: string;
  officialSource: string;
  url: string;
  checkedAt: string;
  scope: string;
  scenarios: ParentalRightsDeprivationScenarioKey[];
  legalPaths: ParentalRightsDeprivationLegalPath[];
  limitations: string;
};

const skUrl = "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102038925";
const gpkUrl = "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102078828";
const plenumUrl = "https://vsrf.ru/files/24385/";

export const PARENTAL_RIGHTS_DEPRIVATION_RULES: ParentalRightsDeprivationRule[] = [
  {
    id: "sk-69",
    statement: "Основания лишения родительских прав перечислены законом исчерпывающе.",
    norm: "Статья 69 СК РФ",
    officialSource: "Официальный интернет-портал правовой информации",
    url: skUrl,
    checkedAt: PARENTAL_RIGHTS_DEPRIVATION_REVIEWED_AT,
    scope: "Применяется для выбора предполагаемого основания только в отношении родителя.",
    scenarios: ["grounds", "court", "existing", "support"],
    legalPaths: ["assessment", "court", "existing", "support", "adult-special"],
    limitations: "Ответ пользователя не доказывает основание; виновное поведение и доказательства оценивает суд."
  },
  {
    id: "plenum-44-extreme",
    statement: "Лишение прав является крайней мерой и допускается, когда защитить ребёнка иначе невозможно.",
    norm: "Пункты 13–18 Постановления Пленума ВС РФ от 14.11.2017 № 44",
    officialSource: "Верховный Суд Российской Федерации",
    url: plenumUrl,
    checkedAt: PARENTAL_RIGHTS_DEPRIVATION_REVIEWED_AT,
    scope: "Разграничивает лишение, ограничение и ситуации без достаточного основания.",
    scenarios: ["grounds", "court", "existing", "support"],
    legalPaths: ["assessment", "court", "existing", "support"],
    limitations: "Нельзя автоматически выводить необходимость лишения из конфликта, диагноза или одного факта неучастия."
  },
  {
    id: "sk-70",
    statement: "Лишение производится судом; участвуют прокурор и орган опеки, а суд решает вопрос содержания ребёнка.",
    norm: "Статья 70 СК РФ",
    officialSource: "Официальный интернет-портал правовой информации",
    url: skUrl,
    checkedAt: PARENTAL_RIGHTS_DEPRIVATION_REVIEWED_AT,
    scope: "Судебная процедура, круг заявителей и вопрос алиментов.",
    scenarios: ["court", "existing", "support"],
    legalPaths: ["court", "existing", "support", "adult-special"],
    limitations: "Процессуальный статус конкретного заявителя и состав требований проверяются до подачи."
  },
  {
    id: "plenum-44-jurisdiction",
    statement: "Дело рассматривает районный суд; общее правило — по месту жительства ответчика.",
    norm: "Пункт 2 Постановления Пленума ВС РФ от 14.11.2017 № 44; статьи 24, 28 и 29 ГПК РФ",
    officialSource: "Верховный Суд Российской Федерации",
    url: plenumUrl,
    checkedAt: PARENTAL_RIGHTS_DEPRIVATION_REVIEWED_AT,
    scope: "Родовая и территориальная подсудность судебного требования.",
    scenarios: ["court", "existing", "support"],
    legalPaths: ["court", "existing", "support", "adult-special"],
    limitations: "Подача по месту истца возможна не автоматически; основание и объединение с алиментами требуют проверки."
  },
  {
    id: "gpk-131-132",
    statement: "Судебный документ и приложения должны отвечать требованиям процессуального закона.",
    norm: "Статьи 131 и 132 ГПК РФ",
    officialSource: "Официальный интернет-портал правовой информации",
    url: gpkUrl,
    checkedAt: PARENTAL_RIGHTS_DEPRIVATION_REVIEWED_AT,
    scope: "Содержание и приложения искового заявления.",
    scenarios: ["court", "existing", "support"],
    legalPaths: ["court", "existing", "support", "adult-special"],
    limitations: "Помощник не подтверждает полноту доказательств, участников и просительной части."
  },
  {
    id: "ks-49-2026",
    statement: "Совершеннолетний может требовать лишения прав в специальном случае преступления родителя, совершённого против него до 18 лет и являющегося основанием статьи 69 СК РФ.",
    norm: "Постановление КС РФ от 16.07.2026 № 49-П",
    officialSource: "Официальный интернет-портал правовой информации",
    url: "https://publication.pravo.gov.ru/document/0001202607170001",
    checkedAt: PARENTAL_RIGHTS_DEPRIVATION_REVIEWED_AT,
    scope: "Только специальный путь совершеннолетнего потерпевшего от преступления родителя.",
    scenarios: ["grounds", "court", "existing", "support"],
    legalPaths: ["adult-special"],
    limitations: "Не распространяется автоматически на иные основания или иных совершеннолетних заявителей."
  },
  {
    id: "sk-77-emergency",
    statement: "Непосредственная угроза жизни или здоровью ребёнка требует срочного защитного порядка, а не ожидания подготовки иска.",
    norm: "Статья 77 СК РФ; пункты 28–33 Постановления Пленума ВС РФ № 44",
    officialSource: "Верховный Суд Российской Федерации",
    url: plenumUrl,
    checkedAt: PARENTAL_RIGHTS_DEPRIVATION_REVIEWED_AT,
    scope: "Stop-flow при реальной непосредственной угрозе ребёнку.",
    scenarios: ["grounds", "court", "existing", "support"],
    legalPaths: ["emergency"],
    limitations: "Решение о немедленном отобрании относится к компетенции органа опеки; сервис его не принимает."
  },
  {
    id: "mchs-112",
    statement: "Единый номер 112 используется для вызова экстренных оперативных служб.",
    norm: "Система-112",
    officialSource: "МЧС России",
    url: "https://csoor.organizations.mchs.gov.ru/deyatelnost/poleznaya-informaciya/poleznye-sovety/sistema112",
    checkedAt: PARENTAL_RIGHTS_DEPRIVATION_REVIEWED_AT,
    scope: "Только при ситуации, требующей немедленного реагирования.",
    scenarios: ["grounds", "court", "existing", "support"],
    legalPaths: ["emergency"],
    limitations: "Не использовать для несрочных справочных вопросов."
  }
];

export function getParentalRightsDeprivationRules(scenario: ParentalRightsDeprivationScenarioKey, legalPath?: ParentalRightsDeprivationLegalPath) {
  return PARENTAL_RIGHTS_DEPRIVATION_RULES.filter((rule) => rule.scenarios.includes(scenario) && (!legalPath || rule.legalPaths.includes(legalPath)));
}
