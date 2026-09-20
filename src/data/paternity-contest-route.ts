import { RUSSIAN_REGIONS } from "@/data/guardianship-territories";

export const PATERNITY_CONTEST_ROUTE = { categorySlug: "semya-i-deti", problemSlug: "osparivanie-otcovstva" } as const;
export const PATERNITY_CONTEST_SCENARIO_KEYS = ["recorded-parent", "biological-parent", "child-representative", "after-death"] as const;
export type PaternityContestScenarioKey = (typeof PATERNITY_CONTEST_SCENARIO_KEYS)[number];
export type PaternityContestField = { name: string; label: string; type?: "text" | "textarea" | "select" | "searchable"; required?: boolean; options?: Array<{ label: string; value: string }>; hint?: string };
export type PaternityContestScenario = { key: PaternityContestScenarioKey; title: string; choiceDescription: string; description: string[]; steps: string[]; documents: string[]; mainDocument: string; documentSlug: string; filing: string; term: string; fee: string; warning: string; helperFields: PaternityContestField[] };

const yesNoUnsure = [{ label: "Да", value: "yes" }, { label: "Нет", value: "no" }, { label: "Не уверен", value: "unsure" }];
const targetField: PaternityContestField = { name: "recordTarget", label: "Чью запись нужно оспорить?", type: "select", required: true, options: [{ label: "Запись об отце", value: "father" }, { label: "Запись о матери", value: "mother" }, { label: "Не уверен", value: "unsure" }] };
const recordBasisField: PaternityContestField = { name: "recordBasis", label: "На каком основании внесена запись?", type: "select", required: true, options: [{ label: "Брак или презумпция происхождения", value: "marriage" }, { label: "Совместное или единоличное заявление", value: "application" }, { label: "Решение суда", value: "court" }, { label: "Применение вспомогательных репродуктивных методов", value: "art" }, { label: "Суррогатное материнство", value: "surrogacy" }, { label: "Не знаю", value: "unknown" }] };
const commonFields: PaternityContestField[] = [
  targetField,
  recordBasisField,
  { name: "applicantData", label: "ФИО, адрес и контакты заявителя", type: "textarea", required: true },
  { name: "recordedParentData", label: "Сведения о лице, записанном родителем", type: "textarea", required: true },
  { name: "childData", label: "ФИО, дата рождения и реквизиты записи о рождении ребёнка", type: "textarea", required: true },
  { name: "otherParticipants", label: "Сведения о другом родителе и иных известных участниках", type: "textarea", required: true },
  { name: "circumstances", label: "Обстоятельства внесения записи и основания оспаривания", type: "textarea", required: true },
  { name: "evidence", label: "Какие законно полученные доказательства имеются?", type: "textarea", required: true },
  { name: "dnaExpectation", label: "Вы понимаете, что результат экспертизы заранее не гарантирован и оценивается судом вместе с другими доказательствами?", type: "select", required: true, options: yesNoUnsure },
  { name: "courtRegion", label: "Регион суда", type: "searchable", required: true, options: RUSSIAN_REGIONS.map(({ id, label }) => ({ value: id, label })) },
  { name: "courtName", label: "Полное наименование районного или городского суда", type: "textarea", required: true, hint: "Перенесите точное наименование с официальной страницы суда." },
  { name: "courtSource", label: "Ссылка на официальную страницу суда", type: "text", required: true },
  { name: "courtConfirmed", label: "Вы проверили суд и территориальную подсудность на официальном ресурсе?", type: "select", required: true, options: yesNoUnsure }
];

export const PATERNITY_CONTEST_SCENARIOS: Record<PaternityContestScenarioKey, PaternityContestScenario> = {
  "recorded-parent": {
    key: "recorded-parent", title: "Вы записаны отцом или матерью", choiceDescription: "Проверить знание обстоятельств при регистрации и специальные ограничения.",
    description: ["Записанный родитель входит в установленный законом круг заявителей.", "Если записанный отец при добровольной записи знал, что биологическим отцом не является, одного этого основания недостаточно; отдельно проверяется нарушение волеизъявления."],
    steps: ["Проверьте актовую запись.", "Уточните основание записи и знание обстоятельств.", "Проверьте специальные ограничения.", "Соберите доказательства.", "Проверьте судебный черновик у юриста."],
    documents: ["Свидетельство или выписка о рождении.", "Документы об основании записи.", "Доказательства обстоятельств внесения записи.", "Документы о сторонах и месте их жительства."],
    mainDocument: "Черновик иска записанного родителя", documentSlug: "isk-ob-osparivanii-otcovstva-zapisannym-roditelem", filing: "В районный или городской суд после проверки подсудности.", term: "Единый срок рассмотрения и результат не прогнозируются.", fee: "Пошлина и возможные льготы проверяются перед подачей по актуальной редакции НК РФ.", warning: "Черновик не готов к подаче. Знание обстоятельств, волеизъявление и интересы ребёнка требуют судебной оценки.",
    helperFields: [targetField, recordBasisField, { name: "knewAtRegistration", label: "При регистрации вам было известно, что вы не являетесь биологическим родителем?", type: "select", required: true, options: yesNoUnsure }, { name: "willDefect", label: "Было ли нарушено ваше волеизъявление при внесении записи?", type: "select", required: true, options: [{ label: "Нет", value: "none" }, { label: "Угроза или насилие", value: "threat" }, { label: "Я не мог понимать значение своих действий или руководить ими", value: "incapacity" }, { label: "Иное обстоятельство", value: "other" }, { label: "Не уверен", value: "unsure" }] }, ...commonFields.slice(2)]
  },
  "biological-parent": {
    key: "biological-parent", title: "Вы считаете себя биологическим родителем", choiceDescription: "Проверить право заявителя и действующую запись о другом родителе.",
    description: ["Лицо, фактически являющееся отцом или матерью ребёнка, входит в круг заявителей по статье 52 СК РФ.", "Исключение существующей записи и установление происхождения другого лица нельзя подменять обращением в ЗАГС."],
    steps: ["Получите актуальную запись о рождении.", "Определите основание записи.", "Проверьте надлежащие требования и участников.", "Соберите доказательства.", "Проверьте черновик у юриста."],
    documents: ["Документ о рождении ребёнка.", "Сведения о записанном родителе.", "Доказательства предполагаемого происхождения.", "Документы о месте жительства участников."],
    mainDocument: "Черновик иска биологического родителя", documentSlug: "isk-ob-osparivanii-zapisi-biologicheskim-roditelem", filing: "В районный или городской суд после проверки требований и подсудности.", term: "Срок и результат конкретного дела не прогнозируются.", fee: "Пошлина определяется после проверки состава требований.", warning: "Если одновременно требуется установить происхождение, формулировки требований и круг участников проверяет юрист.", helperFields: commonFields
  },
  "child-representative": {
    key: "child-representative", title: "Обращается ребёнок или законный представитель", choiceDescription: "Проверить, входит ли заявитель в закрытый круг лиц.",
    description: ["После совершеннолетия ребёнок вправе оспаривать запись самостоятельно.", "За несовершеннолетнего действует его опекун или попечитель; закон отдельно называет опекуна родителя, признанного недееспособным."],
    steps: ["Подтвердите статус заявителя.", "Проверьте актовую запись.", "Определите участников.", "Соберите доказательства.", "Проверьте судебный черновик."],
    documents: ["Документ о рождении.", "Документы о совершеннолетии или полномочиях опекуна.", "Сведения о записанных родителях.", "Доказательства по спору."],
    mainDocument: "Черновик иска ребёнка или представителя", documentSlug: "isk-ob-osparivanii-otcovstva-rebenkom-ili-opekunom", filing: "В районный или городской суд после проверки статуса и подсудности.", term: "Срок и результат дела не прогнозируются.", fee: "Пошлина и льготы проверяются по статусу заявителя и требованиям.", warning: "Лицо вне перечня статьи 52 СК РФ не может использовать этот черновик.", helperFields: [{ name: "applicantRole", label: "Кто обращается?", type: "select", required: true, options: [{ label: "Совершеннолетний ребёнок", value: "adult-child" }, { label: "Опекун или попечитель ребёнка", value: "child-guardian" }, { label: "Опекун родителя, признанного недееспособным", value: "parent-guardian" }, { label: "Другое лицо", value: "other" }, { label: "Не уверен", value: "unsure" }] }, ...commonFields]
  },
  "after-death": {
    key: "after-death", title: "Записанный родитель умер", choiceDescription: "Проверить допустимость оспаривания после смерти и надлежащих участников.",
    description: ["Смерть записанного родителя сама по себе не исключает судебное оспаривание записи.", "Право конкретного заявителя, заинтересованные лица и последствия для ребёнка и наследственных прав требуют отдельной проверки."],
    steps: ["Подтвердите запись и смерть.", "Проверьте право заявителя.", "Определите заинтересованных лиц.", "Соберите доказательства.", "Проверьте черновик у юриста."],
    documents: ["Документы о рождении и смерти.", "Документы о статусе заявителя.", "Сведения о наследственных и иных заинтересованных лицах.", "Доказательства по записи."],
    mainDocument: "Черновик иска после смерти записанного родителя", documentSlug: "osparivanie-otcovstva-posle-smerti", filing: "В районный или городской суд после проверки заявителя, участников и подсудности.", term: "Единый срок и результат не указываются.", fee: "Пошлина определяется после квалификации требований.", warning: "Наследник только в силу наследственного статуса не включён автоматически в круг заявителей.", helperFields: [{ name: "applicantRole", label: "На каком основании обращается заявитель?", type: "select", required: true, options: [{ label: "Совершеннолетний ребёнок", value: "adult-child" }, { label: "Биологический родитель", value: "biological-parent" }, { label: "Опекун или попечитель ребёнка", value: "child-guardian" }, { label: "Только наследник или родственник", value: "heir-only" }, { label: "Другое или не уверен", value: "other" }] }, { name: "deathData", label: "ФИО записанного родителя, дата смерти и реквизиты документа о смерти", type: "textarea", required: true }, ...commonFields]
  }
};

export const PATERNITY_CONTEST_SCENARIO_CHOICES = PATERNITY_CONTEST_SCENARIO_KEYS.map((key) => ({ key, title: PATERNITY_CONTEST_SCENARIOS[key].title, description: PATERNITY_CONTEST_SCENARIOS[key].choiceDescription }));
export function getPaternityContestScenario(value?: string | null) { return PATERNITY_CONTEST_SCENARIO_KEYS.includes(value as PaternityContestScenarioKey) ? PATERNITY_CONTEST_SCENARIOS[value as PaternityContestScenarioKey] : null; }
export function getPaternityContestScenarioByDocumentSlug(slug: string) { return Object.values(PATERNITY_CONTEST_SCENARIOS).find((scenario) => scenario.documentSlug === slug) ?? null; }
