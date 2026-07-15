import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

type TemplateRecord = {
  row: number;
  description: string;
};

type TemplatePayload = {
  templates: TemplateRecord[];
};

type Gender = "female" | "male";

type LawyerForDescription = {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  slug: string;
  status: "LAWYER" | "ADVOCATE";
  experienceYears: number;
  description: string;
  education: string;
  services: Array<{ service: { name: string; slug: string } }>;
  cities: Array<{ city: { name: string; region: string } }>;
};

type DescriptionBackupItem = {
  id: string;
  slug: string;
  fullName: string;
  oldDescription: string;
  newDescription: string;
};

const prisma = new PrismaClient();
let forbiddenGeographyTerms: string[] = [];

async function main() {
  const workbookPath = resolveWorkbookPath();
  const templates = readTemplates(workbookPath);

  if (!templates.length) {
    throw new Error("В файле не найдено ни одного шаблона в колонке 'Описание'.");
  }

  const lawyers = await prisma.lawyer.findMany({
    where: { active: true, blocked: false },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      profile: true,
      services: { include: { service: true } },
      cities: { include: { city: true } }
    }
  });
  const cities = await prisma.city.findMany({ where: { isActive: true }, select: { name: true, region: true } });
  forbiddenGeographyTerms = buildForbiddenGeographyTerms(cities);

  const backup: DescriptionBackupItem[] = [];
  const validationWarnings: string[] = [];

  for (const lawyer of lawyers) {
    const description = buildDescription(lawyer, templates);
    const warnings = validateDescription(lawyer, description);

    if (warnings.length) {
      validationWarnings.push(`${fullName(lawyer)}: ${warnings.join("; ")}`);
      continue;
    }

    backup.push({
      id: lawyer.id,
      slug: lawyer.slug,
      fullName: fullName(lawyer),
      oldDescription: lawyer.description,
      newDescription: description
    });

    await prisma.lawyer.update({
      where: { id: lawyer.id },
      data: { description }
    });

    await prisma.lawyerProfile.upsert({
      where: { lawyerId: lawyer.id },
      create: {
        lawyerId: lawyer.id,
        about: description,
        specializationText: serviceNames(lawyer, 8).join(", "),
        servicesAndPricesText: null,
        reviewsText: null
      },
      update: { about: description }
    });
  }

  const reportPath = writeBackupReport(backup, workbookPath, templates.length);

  console.log(
    JSON.stringify(
      {
        workbookPath,
        templatesFound: templates.length,
        lawyersFound: lawyers.length,
        descriptionsUpdated: backup.length,
        skippedByValidation: validationWarnings.length,
        validationWarnings,
        reportPath
      },
      null,
      2
    )
  );
}

function resolveWorkbookPath() {
  const input = process.argv[2];
  if (!input) {
    throw new Error("Передайте путь к harant_yers.xlsx первым аргументом.");
  }

  const resolved = path.resolve(input);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Файл не найден: ${resolved}`);
  }

  return resolved;
}

function readTemplates(workbookPath: string) {
  const extractorPath = path.join(process.cwd(), "scripts", "extract-lawyer-description-templates.py");
  const pythonBin = process.env.PYTHON_BIN || "python";
  const result = spawnSync(pythonBin, [extractorPath, workbookPath], {
    encoding: "utf8",
    windowsHide: true
  });

  if (result.status !== 0) {
    throw new Error(`Не удалось прочитать Excel: ${result.stderr || result.stdout}`);
  }

  const payload = JSON.parse(result.stdout) as TemplatePayload;
  return payload.templates
    .map((template) => ({
      row: template.row,
      description: cleanText(template.description)
    }))
    .filter((template) => template.description.length >= 80);
}

function buildDescription(lawyer: LawyerForDescription, templates: TemplateRecord[]) {
  const gender = inferGender(lawyer);
  const template = chooseTemplate(lawyer, templates);
  const archetype = detectLawyerArchetype(lawyer) ?? detectTemplateArchetype(template.description);
  const name = fullName(lawyer);
  const statusLabel = lawyer.status === "ADVOCATE" ? "адвокат" : "юрист";
  const services = serviceNames(lawyer, 8);
  const serviceText = formatList(services);
  const experience = yearsPhrase(lawyer.experienceYears);
  const readyWord = gender === "female" ? "готова" : "готов";
  const education = formatEducation(lawyer.education);
  const focus = focusSentence(archetype, serviceText);
  const evidence = evidenceSentence(archetype);
  const principle = workPrincipleSentence(archetype, lawyer.slug);
  const reviewWord = gender === "female" ? "проверяю" : "проверяю";

  const description = [
    `Здравствуйте! Меня зовут ${name}, я ${statusLabel}. Мой профессиональный опыт — ${experience}.`,
    `Образование: ${education}.`,
    `Специализации: ${serviceText}.`,
    `${focus} На консультации ${reviewWord} документы, сроки, доказательства и возможные риски, чтобы клиент понимал не только желаемый результат, но и реальную процессуальную картину. ${evidence}`,
    `${principle} Если ситуация требует сопровождения, ${lawyer.firstName} ${readyWord} подготовить позицию, заявления, жалобы, претензии или иные документы, а также заранее объяснить порядок дальнейших действий и формат работы.`
  ].join("\n\n");

  return normalizeGeneratedDescription(stripForbiddenGeography(description));
}

function detectLawyerArchetype(lawyer: LawyerForDescription) {
  const names = serviceNames(lawyer, 20);
  const primary = names[0]?.toLowerCase() ?? "";
  const all = names.join(" ").toLowerCase();
  const groups = [
    ["military", /военн|сво|контракт|призыв|ввк/],
    ["criminal", /уголов|следств|сизо|полици|наркот|обвин|правонаруш/],
    ["auto", /дтп|авто|штраф|гибдд|осаго|каско/],
    ["debt", /банкрот|кредит|долг|задолж|исполнительн|пристав|коллектор/],
    ["family", /семейн|алимент|развод|брак|дет|опек|отцовств|материнск/],
    ["property", /недвиж|жилищ|жкх|земел|кадастр|росреестр|ипотек|собственност/],
    ["labor", /труд|увольнен|зарплат|работодател|работник|отпуск/],
    ["consumer", /потребител|товар|услуг|возврат|продавец|магазин/],
    ["inheritance", /наслед/],
    ["business", /арбитраж|бизнес|договор|контракт|юридическ|закуп|тендер/],
    ["medical", /медицин|здоров|врач|больниц/],
    ["tax", /налог|ндфл|фнс/],
    ["migration", /миграц|гражданств|иностран|рвп|внж/],
    ["documents", /документ|иск|жалоб|претенз|заявлен|доверенност/]
  ] as const;

  const primaryMatch = groups.find(([, pattern]) => pattern.test(primary));
  if (primaryMatch) return primaryMatch[0];

  const anyMatch = groups.find(([, pattern]) => pattern.test(all));
  return anyMatch?.[0] ?? null;
}

function detectTemplateArchetype(template: string) {
  const text = template.toLowerCase();

  if (/военн|сво|контракт|призыв|ввк/.test(text)) return "military";
  if (/уголов|следств|сизо|полици|наркот|обвин/.test(text)) return "criminal";
  if (/дтп|авто|гибдд|осаго|каско/.test(text)) return "auto";
  if (/банкрот|кредит|долг|задолж|исполнительн|пристав/.test(text)) return "debt";
  if (/семейн|алимент|развод|брак|дет/.test(text)) return "family";
  if (/недвиж|жилищ|жкх|земел|кадастр|росреестр/.test(text)) return "property";
  if (/труд|увольнен|зарплат|работодател/.test(text)) return "labor";
  if (/потребител|товар|услуг|возврат|продавец/.test(text)) return "consumer";
  if (/наслед/.test(text)) return "inheritance";
  if (/арбитраж|бизнес|договор|контракт|юридическ/.test(text)) return "business";
  if (/медицин|здоров|врач|больниц/.test(text)) return "medical";
  if (/налог|ндфл|фнс/.test(text)) return "tax";
  if (/миграц|гражданств|иностран|рвп|внж/.test(text)) return "migration";
  if (/документ|иск|жалоб|претенз|заявлен/.test(text)) return "documents";

  return "general";
}

function chooseTemplate(lawyer: LawyerForDescription, templates: TemplateRecord[]) {
  const lawyerText = serviceNames(lawyer, 20).join(" ").toLowerCase();
  const scored = templates.map((template, index) => ({
    template,
    score: templateScore(template.description.toLowerCase(), lawyerText) + deterministicWeight(lawyer.slug, index)
  }));

  scored.sort((left, right) => right.score - left.score);
  return scored[0]?.template ?? templates[0];
}

function templateScore(templateText: string, lawyerText: string) {
  const keywordGroups = [
    ["уголов", "следств", "сизо", "полици", "наркот"],
    ["банкрот", "кредит", "долг", "задолж", "пристав"],
    ["семейн", "алимент", "развод", "брак", "дет"],
    ["недвиж", "жилищ", "жкх", "земел", "кадастр"],
    ["арбитраж", "бизнес", "договор", "контракт"],
    ["военн", "сво", "призыв", "ввк"],
    ["документ", "иск", "жалоб", "претенз", "заявлен"]
  ];

  return keywordGroups.reduce((score, group) => {
    const templateMatches = group.some((keyword) => templateText.includes(keyword));
    const lawyerMatches = group.some((keyword) => lawyerText.includes(keyword));
    return score + (templateMatches && lawyerMatches ? 100 : 0);
  }, 0);
}

function focusSentence(archetype: string, serviceText: string) {
  const fallback = `В работе по направлениям ${serviceText} делает акцент на фактах, документах и понятной правовой позиции.`;

  const variants: Record<string, string> = {
    criminal:
      "В уголовных и административных делах важно быстро оценить процессуальный статус, доказательства, сроки обжалования и риски для клиента.",
    debt:
      "В спорах о долгах, кредитах и исполнительном производстве важно проверить основание взыскания, сроки, документы банка или взыскателя и действия приставов.",
    auto:
      "В автомобильных спорах важно зафиксировать обстоятельства ДТП или нарушения, проверить документы ГИБДД, страховые материалы, сроки обращения и размер ущерба.",
    family:
      "В семейных спорах важно отделить эмоциональную часть конфликта от юридически значимых обстоятельств: интересов детей, имущества, алиментов и доказательств.",
    property:
      "В имущественных, жилищных и земельных вопросах важно внимательно проверить документы, историю объекта, права сторон и возможные ограничения.",
    labor:
      "В трудовых спорах важно проверить документы работодателя, сроки обращения, выплаты, основания увольнения или привлечения к ответственности.",
    consumer:
      "В потребительских спорах важно определить требования к продавцу или исполнителю, сроки ответа, доказательства недостатков и порядок возврата денег.",
    inheritance:
      "В наследственных вопросах важно проверить сроки, круг наследников, документы на имущество, завещание и основания для восстановления или защиты прав.",
    business:
      "В договорных и арбитражных спорах важно проверить условия договора, доказательства исполнения, претензионный порядок и судебную перспективу.",
    medical:
      "В медицинских вопросах важно оценить документы, качество оказания помощи, причинно-следственную связь и порядок обращения в контролирующие органы или суд.",
    tax:
      "В налоговых вопросах важно проверить основание начислений, уведомления, сроки, документы и возможность представить пояснения или возражения.",
    migration:
      "В миграционных вопросах важно разобраться со статусом, сроками пребывания, документами, основаниями отказа и порядком обжалования решений.",
    military:
      "В военных вопросах важно разобраться со статусом, рапортами, выплатами, медицинскими документами, ВВК и порядком обжалования решений.",
    documents:
      "При подготовке документов важно точно сформулировать требования, подтвердить факты и выбрать адресата обращения или суда."
  };

  return variants[archetype] ?? fallback;
}

function evidenceSentence(archetype: string) {
  const variants: Record<string, string> = {
    criminal:
      "Перед рекомендациями проверяю постановления, протоколы, материалы дела, переписку и иные документы, которые влияют на защиту.",
    debt:
      "Для оценки обычно нужны договор, расчет задолженности, судебные акты, постановления приставов, платежные документы и переписка.",
    auto:
      "Для оценки обычно нужны постановления, схема ДТП, извещения, страховые документы, фотографии повреждений, заключения эксперта и переписка со страховой.",
    family:
      "Для разбора могут понадобиться свидетельства, соглашения, судебные документы, переписка, платежные подтверждения и сведения о детях или имуществе.",
    property:
      "Для оценки обычно нужны выписки, договоры, платежные документы, технические материалы, переписка и решения органов или суда.",
    labor:
      "Для оценки обычно нужны трудовой договор, приказы, расчетные листки, переписка, графики, заявления и документы о выплатах.",
    consumer:
      "Для оценки обычно нужны чек, договор или заказ, переписка, фото недостатков, акт проверки, претензия и ответ продавца или исполнителя.",
    inheritance:
      "Для оценки обычно нужны свидетельства, документы о родстве, выписки на имущество, завещание, справки нотариуса и сведения о сроках обращения.",
    business:
      "Для вывода проверяются договор, акты, счета, переписка, претензии, платежные документы и процессуальные сроки.",
    medical:
      "Для оценки обычно нужны медицинские документы, заключения, направления, результаты обследований, договор на услуги и ответы клиники или ведомства.",
    tax:
      "Для оценки обычно нужны уведомления, требования, декларации, платежные документы, переписка с налоговым органом и расчет спорной суммы.",
    migration:
      "Для оценки обычно нужны паспортные данные, миграционные документы, уведомления, решения органов, сроки въезда и пребывания.",
    military:
      "Для анализа важны контракт, рапорты, медицинские заключения, выписки, приказы, ответы командования и документы по выплатам.",
    documents:
      "Перед подготовкой текста уточняю цель обращения, адресата, сроки, документы и доказательства, которые нужно приложить."
  };

  return variants[archetype] ?? "Для точного вывода сначала проверяю документы, переписку, сроки и фактические обстоятельства.";
}

function serviceNames(lawyer: LawyerForDescription, limit: number) {
  const names = lawyer.services
    .map((item) => item.service.name.trim())
    .filter(Boolean);

  return Array.from(new Set(names)).slice(0, limit);
}

function fullName(lawyer: { firstName: string; lastName: string; middleName?: string | null }) {
  return [lawyer.lastName, lawyer.firstName, lawyer.middleName].filter(Boolean).join(" ");
}

function yearsPhrase(years: number) {
  const mod10 = years % 10;
  const mod100 = years % 100;
  const word = mod10 === 1 && mod100 !== 11 ? "год" : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "года" : "лет";
  return `${years} ${word}`;
}

function formatList(values: string[]) {
  if (!values.length) return "консультации, подготовка документов и сопровождение правовых вопросов";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} и ${values[1]}`;

  return `${values.slice(0, -1).join(", ")} и ${values.at(-1)}`;
}

function formatEducation(value: string) {
  const cleaned = cleanText(value || "");
  if (!cleaned) return "высшее юридическое образование и повышение квалификации по профильным направлениям";

  const lower = cleaned.toLowerCase();
  const parts: string[] = [];

  if (/юриспруд|юрид|прав[ао]/.test(lower)) {
    parts.push("юридическое образование");
  } else {
    parts.push("профильное образование в сфере права и сопровождения правовых вопросов");
  }

  if (/магистр/.test(lower)) {
    parts.push("квалификация: магистр");
  } else if (/специалист/.test(lower)) {
    parts.push("квалификация: специалист");
  } else if (/бакалавр/.test(lower)) {
    parts.push("квалификация: бакалавр");
  }

  if (/повышени[ея] квалификац|курс|программ|семинар|дополнительн|процесс|медиац|адвокат/.test(lower) || cleaned.split(/[;\n]/).length > 1) {
    parts.push("дополнительная подготовка по профильным направлениям");
  }

  return Array.from(new Set(parts)).join(", ");
}

function workPrincipleSentence(archetype: string, seed: string) {
  const common = [
    "В работе придерживаюсь спокойного и честного подхода: сначала разбираю факты, затем предлагаю правовой маршрут без лишних обещаний.",
    "Считаю важным заранее обсудить перспективы, риски и расходы, чтобы клиент принимал решение на основании документов, а не ожиданий.",
    "Не навязываю лишние действия: сначала определяю, можно ли решить вопрос переговорами или документами, и только затем предлагаю судебный сценарий.",
    "Внимательно отношусь к деталям дела, потому что сроки, доказательства и формулировки требований часто влияют на итог сильнее, чем кажется на первом разговоре."
  ];

  const byArchetype: Record<string, string[]> = {
    criminal: [
      "В делах с риском уголовной ответственности особенно важно быстро понять процессуальный статус человека и не давать объяснений без оценки материалов.",
      "По таким обращениям сначала проверяю постановления, протоколы и линию обвинения, а затем предлагаю защитную позицию."
    ],
    family: [
      "В семейных спорах стараюсь отделить эмоции от юридически значимых обстоятельств, чтобы сохранить фокус на детях, имуществе и доказательствах.",
      "По семейным вопросам важно заранее понять, какие договоренности возможны без суда, а какие требования лучше сразу оформлять документально."
    ],
    debt: [
      "В долговых вопросах важно проверить основание взыскания, расчет суммы, сроки давности и действия приставов до того, как выбирать стратегию.",
      "По кредитным и исполнительным спорам сначала оцениваю документы взыскателя и только после этого предлагаю вариант защиты."
    ],
    property: [
      "В имущественных вопросах начинаю с проверки документов и истории права, потому что именно там чаще всего находятся ключевые риски.",
      "По недвижимости, жилью и земле важно сопоставить документы, фактическое пользование объектом и возможные ограничения."
    ],
    business: [
      "В коммерческих спорах обращаю внимание на договор, переписку, акты и претензионный порядок, чтобы позиция была подтверждена документами.",
      "Для бизнеса важно не только выиграть спор, но и сохранить управляемость сроков, документов и будущих обязательств."
    ]
  };

  const variants = [...(byArchetype[archetype] ?? []), ...common];
  return variants[deterministicWeight(seed, variants.length) % variants.length];
}

function buildForbiddenGeographyTerms(cities: Array<{ name: string; region: string }>) {
  const terms = new Set<string>();

  for (const city of cities) {
    addGeographyTerm(terms, city.name);
    addGeographyTerm(terms, city.region);
  }

  return Array.from(terms)
    .filter((term) => term.length >= 4)
    .sort((left, right) => right.length - left.length);
}

function addGeographyTerm(terms: Set<string>, value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return;

  terms.add(normalized);

  if (normalized === "Москва") {
    ["Москвы", "Москве", "Москву", "Москвой"].forEach((term) => terms.add(term));
  }

  if (normalized === "Санкт-Петербург") {
    ["Санкт-Петербурга", "Санкт-Петербурге", "Санкт-Петербургом"].forEach((term) => terms.add(term));
  }

  if (normalized.endsWith("ская область")) {
    terms.add(normalized.replace(/ская область$/, "ской области"));
    terms.add(normalized.replace(/ская область$/, "скую область"));
  }

  if (normalized.endsWith("цкая область")) {
    terms.add(normalized.replace(/цкая область$/, "цкой области"));
    terms.add(normalized.replace(/цкая область$/, "цкую область"));
  }

  if (normalized.endsWith("ский край")) {
    terms.add(normalized.replace(/ский край$/, "ского края"));
    terms.add(normalized.replace(/ский край$/, "ском крае"));
  }

  if (normalized.endsWith("ая область")) {
    terms.add(normalized.replace(/ая область$/, "ой области"));
    terms.add(normalized.replace(/ая область$/, "ую область"));
  }
}

function stripForbiddenGeography(value: string) {
  let cleaned = value;

  for (const term of forbiddenGeographyTerms) {
    const pattern = new RegExp(`(^|[^А-Яа-яЁё])${escapeRegExp(term)}(?=$|[^А-Яа-яЁё])`, "giu");
    cleaned = cleaned.replace(pattern, "$1");
  }

  return normalizeGeneratedDescription(cleaned);
}

function findForbiddenGeography(value: string) {
  const found = new Set<string>();

  for (const term of forbiddenGeographyTerms) {
    const pattern = new RegExp(`(^|[^А-Яа-яЁё])${escapeRegExp(term)}(?=$|[^А-Яа-яЁё])`, "iu");
    if (pattern.test(value)) found.add(term);
  }

  return Array.from(found);
}

function normalizeGeneratedDescription(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s*([—-])\s*([.;,])/g, "$2")
    .replace(/(?:,\s*){2,}/g, ", ")
    .replace(/;\s*;/g, ";")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function inferGender(lawyer: { firstName: string; lastName: string; middleName?: string | null }): Gender {
  const firstName = lawyer.firstName.toLowerCase();
  const middleName = lawyer.middleName?.toLowerCase() ?? "";
  const lastName = lawyer.lastName.toLowerCase();
  const femaleFirstNames = new Set([
    "анна",
    "алена",
    "алёна",
    "александра",
    "анастасия",
    "валентина",
    "валерия",
    "вера",
    "виктория",
    "галина",
    "дарья",
    "елена",
    "елизавета",
    "екатерина",
    "жанна",
    "зоя",
    "ина",
    "инна",
    "ирина",
    "кристина",
    "ксения",
    "лариса",
    "любовь",
    "людмила",
    "маргарита",
    "марина",
    "мария",
    "надежда",
    "наталья",
    "нина",
    "оксана",
    "ольга",
    "полина",
    "светлана",
    "софия",
    "татьяна",
    "юлия"
  ]);
  const maleFirstNames = new Set([
    "азамат",
    "александр",
    "алексей",
    "андрей",
    "антон",
    "артем",
    "артём",
    "борис",
    "вадим",
    "валерий",
    "василий",
    "виктор",
    "виталий",
    "владимир",
    "владислав",
    "вячеслав",
    "геннадий",
    "георгий",
    "григорий",
    "денис",
    "дмитрий",
    "евгений",
    "иван",
    "игорь",
    "илья",
    "кирилл",
    "константин",
    "лев",
    "максим",
    "михаил",
    "никита",
    "николай",
    "олег",
    "павел",
    "петр",
    "пётр",
    "роман",
    "сергей",
    "станислав",
    "тимур",
    "юрий",
    "ярослав"
  ]);

  if (/(вна|ична|кызы)$/.test(middleName)) return "female";
  if (/(вич|оглы)$/.test(middleName)) return "male";
  if (femaleFirstNames.has(firstName)) return "female";
  if (maleFirstNames.has(firstName)) return "male";
  if (/(ова|ева|ёва|ина|ая|ская|цкая)$/.test(lastName)) return "female";
  if (/(ов|ев|ёв|ин|ый|ий|ой|ский|цкий)$/.test(lastName)) return "male";
  if (/[ая]$/.test(firstName) && firstName !== "илья" && firstName !== "никита") return "female";

  return "male";
}

function validateDescription(lawyer: LawyerForDescription, description: string) {
  const warnings: string[] = [];
  const name = fullName(lawyer);

  if (!description.includes(name)) warnings.push("нет ФИО юриста");
  if (description.length < 500) warnings.push("описание слишком короткое");
  if (hasForbiddenMarketing(description)) warnings.push("есть рекламные или контактные формулировки");
  const geographyMatches = findForbiddenGeography(description);
  if (geographyMatches.length) warnings.push(`есть география: ${geographyMatches.slice(0, 5).join(", ")}`);
  if (hasForeignFullName(lawyer, description)) warnings.push("найдено чужое ФИО");

  return warnings;
}

function hasForbiddenMarketing(value: string) {
  return /(?:гарантир|100\s*%|98\s*%|звоните|напишите|личн(?:ое|ые|ом)\s+сообщ|чат|телефон|whatsapp|telegram|t\.me|wa\.me|https?:\/\/|www\.|@|✅|🌟|донат|ссылка)/i.test(
    value
  );
}

function hasForeignFullName(lawyer: LawyerForDescription, description: string) {
  const own = new Set([lawyer.firstName, lawyer.lastName, lawyer.middleName].filter(Boolean));
  const fullNamePattern = /\b[А-ЯЁ][а-яё-]{2,}\s+[А-ЯЁ][а-яё-]{2,}\s+[А-ЯЁ][а-яё-]{2,}\b/g;
  const matches = description.match(fullNamePattern) ?? [];

  return matches.some((match) => match !== fullName(lawyer) && match.split(/\s+/).some((part) => !own.has(part)));
}

function deterministicWeight(seed: string, index: number) {
  let hash = 0;
  const value = `${seed}:${index}`;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }

  return hash % 17;
}

function cleanText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function writeBackupReport(backup: DescriptionBackupItem[], workbookPath: string, templatesFound: number) {
  const reportsDir = path.join(process.cwd(), "reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(reportsDir, `lawyer-description-rewrite-${timestamp}.json`);

  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        workbookPath,
        templatesFound,
        updated: backup.length,
        lawyers: backup
      },
      null,
      2
    ),
    "utf8"
  );

  return reportPath;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
