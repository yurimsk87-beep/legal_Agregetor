export const SURROGACY_ORIGIN_ROUTE = {
  categorySlug: "semya-i-deti",
  problemSlug: "surrogatnoe-materinstvo-i-proiskhozhdenie-rebenka",
  documentSlug: "surrogatnoe-materinstvo-list-dannyh"
} as const;

export const SURROGACY_ORIGIN_KEYS = ["registration", "consents", "origin", "dispute", "foreign"] as const;
export type SurrogacyOriginKey = (typeof SURROGACY_ORIGIN_KEYS)[number];
export type SurrogacyOriginField = {
  name: string;
  label: string;
  type: "select" | "textarea";
  options?: { value: string; label: string }[];
};
export type SurrogacyOriginScenario = {
  key: SurrogacyOriginKey;
  title: string;
  summary: string;
  questions: SurrogacyOriginField[];
  evidence: string[];
  nextSteps: string[];
};

const yesNoUnknown = [
  { value: "yes", label: "Да" },
  { value: "no", label: "Нет" },
  { value: "unsure", label: "Не знаю" }
];

export const SURROGACY_ORIGIN_SCENARIOS: Record<SurrogacyOriginKey, SurrogacyOriginScenario> = {
  registration: {
    key: "registration",
    title: "Зарегистрировать рождение",
    summary: "Проверить документы о рождении и согласие суррогатной матери перед обращением в ЗАГС.",
    questions: [
      { name: "childBorn", label: "Ребёнок уже родился?", type: "select", options: yesNoUnknown },
      { name: "applicants", label: "Кто предполагает обратиться: супруги, одинокая женщина или другое лицо?", type: "select", options: [{ value: "spouses", label: "Супруги" }, { value: "single-woman", label: "Одинокая женщина" }, { value: "other", label: "Иное лицо" }, { value: "unsure", label: "Не знаю" }] },
      { name: "birthRecord", label: "Запись о рождении уже составлена?", type: "select", options: yesNoUnknown },
      { name: "medicalProof", label: "Есть медицинский документ о рождении?", type: "select", options: yesNoUnknown },
      { name: "surrogateConsent", label: "Есть подтверждённое согласие суррогатной матери на запись заявителей родителями?", type: "select", options: yesNoUnknown }
    ],
    evidence: ["Документ о рождении из медицинской организации.", "Документ о согласии суррогатной матери, если он получен.", "Договор и документы о семейном положении и гражданстве участников."],
    nextSteps: ["Сверьте основания для записи родителей по статье 51 СК РФ и документы для регистрации рождения.", "Уточните в компетентном органе ЗАГС действующий перечень для вашей ситуации.", "До подачи передайте документы на юридическую проверку."]
  },
  consents: {
    key: "consents",
    title: "Проверить согласия",
    summary: "Разделить согласие на медицинское вмешательство, согласие супруга суррогатной матери и согласие на запись родителей.",
    questions: [
      { name: "stage", label: "На каком этапе находится программа?", type: "select", options: [{ value: "before", label: "До переноса эмбриона" }, { value: "pregnancy", label: "Беременность" }, { value: "born", label: "Ребёнок родился" }, { value: "unsure", label: "Не знаю" }] },
      { name: "surrogateMarried", label: "Суррогатная мать состоит в зарегистрированном браке?", type: "select", options: yesNoUnknown },
      { name: "medicalConsent", label: "Есть письменное информированное согласие на медицинское вмешательство?", type: "select", options: yesNoUnknown },
      { name: "spouseConsent", label: "Если суррогатная мать замужем, есть письменное согласие её супруга?", type: "select", options: yesNoUnknown },
      { name: "registrationConsent", label: "Если ребёнок родился, есть согласие суррогатной матери на запись родителей?", type: "select", options: yesNoUnknown }
    ],
    evidence: ["Имеющиеся письменные согласия и документы медицинской организации.", "Документ о семейном положении суррогатной матери.", "Договор о суррогатном материнстве."],
    nextSteps: ["Не подменяйте согласие на медицинское вмешательство согласием на запись родителей.", "Сверьте форму, момент и адресата каждого согласия с медицинской организацией и юристом."]
  },
  origin: {
    key: "origin",
    title: "Установить происхождение ребёнка",
    summary: "Проверить действующую запись о родителях и факты, которые влияют на её изменение.",
    questions: [
      { name: "birthRecord", label: "Есть запись акта о рождении?", type: "select", options: yesNoUnknown },
      { name: "recordedParents", label: "Кто сейчас записан родителями?", type: "textarea" },
      { name: "surrogateConsent", label: "Известна позиция суррогатной матери по записи родителей?", type: "select", options: [{ value: "yes", label: "Согласие есть" }, { value: "no", label: "Согласия нет" }, { value: "unsure", label: "Неизвестно" }] },
      { name: "statusChange", label: "Брак или гражданство предполагаемых родителей изменились после заключения договора?", type: "select", options: yesNoUnknown }
    ],
    evidence: ["Актовая запись и свидетельство о рождении, если оформлены.", "Договор, медицинские документы и согласия.", "Документы о браке и гражданстве на юридически значимые даты."],
    nextSteps: ["Сверьте сведения актовой записи с документами участников.", "Не выбирайте способ изменения записи без проверки основания и возможного судебного спора."]
  },
  dispute: {
    key: "dispute",
    title: "Разобрать возникший спор",
    summary: "Отказ в согласии, конфликт о записи родителей или передаче ребёнка требует индивидуальной проверки.",
    questions: [
      { name: "disputeSubject", label: "О чём возник спор?", type: "select", options: [{ value: "consent", label: "Согласие на запись родителей" }, { value: "record", label: "Сведения в актовой записи" }, { value: "care", label: "С кем будет жить ребёнок" }, { value: "other", label: "Иной спор" }] },
      { name: "childBorn", label: "Ребёнок уже родился?", type: "select", options: yesNoUnknown },
      { name: "birthRecord", label: "Есть действующая запись о рождении?", type: "select", options: yesNoUnknown },
      { name: "courtAct", label: "Есть судебный акт или уже открыто дело?", type: "select", options: yesNoUnknown },
      { name: "childSafety", label: "Есть непосредственная угроза жизни или здоровью ребёнка?", type: "select", options: yesNoUnknown }
    ],
    evidence: ["Договор, согласия и переписка сторон.", "Актовая запись, медицинские документы и судебные материалы, если есть.", "Документы о положении и безопасности ребёнка."],
    nextSteps: ["При непосредственной угрозе ребёнку обратитесь за срочной помощью; подготовка чек-листа не должна задерживать обращение.", "В иных случаях передайте материалы специалисту для определения требований и суда."]
  },
  foreign: {
    key: "foreign",
    title: "Есть иностранный элемент",
    summary: "Гражданство, страна рождения и иностранные документы требуют отдельной проверки; маршрут не определяет применимое право автоматически.",
    questions: [
      { name: "countries", label: "Какие государства связаны с договором, рождением и проживанием ребёнка?", type: "textarea" },
      { name: "citizenship", label: "Гражданство каждого участника на дату заключения договора", type: "textarea" },
      { name: "childLocation", label: "В каком государстве сейчас находится ребёнок?", type: "textarea" },
      { name: "foreignRecord", label: "Есть иностранное свидетельство или судебное решение?", type: "select", options: yesNoUnknown },
      { name: "contractDate", label: "Когда заключён договор и началась программа?", type: "textarea" }
    ],
    evidence: ["Договор и документы о гражданстве участников на дату его заключения.", "Документы о рождении, гражданстве и месте нахождения ребёнка.", "Иностранные актовые записи и судебные решения, если есть."],
    nextSteps: ["Проверьте применимость российских ограничений и переходных положений по датам.", "Получите индивидуальную консультацию по праву соответствующих государств; не используйте этот лист как основание для трансграничной подачи."]
  }
};

export function getSurrogacyOriginScenario(value?: string | null) {
  return SURROGACY_ORIGIN_KEYS.includes(value as SurrogacyOriginKey)
    ? SURROGACY_ORIGIN_SCENARIOS[value as SurrogacyOriginKey]
    : null;
}
