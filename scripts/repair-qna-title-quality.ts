import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BAD_TITLE_CONTAINS = [
  "как решить вопрос по",
  "как действовать по вопросу",
  "юридическая консультация по ситуации",
  "мождноли",
  "веренцификац",
  "будети",
  "плотит",
  "мотериально",
  "как с вами связаться",
  "написать в max",
  "написать в макс",
  "судебная практика выигранных дел",
  "как нибудь",
  "каким то образом",
  "каким-то образом",
  "не не д",
  "такого рода характеристику"
];

const BAD_TAILS = new Set([
  "который",
  "которая",
  "которые",
  "что",
  "чтобы",
  "если",
  "без",
  "но",
  "и",
  "или",
  "как",
  "в",
  "на",
  "с",
  "по",
  "о",
  "об",
  "от",
  "для",
  "при",
  "у"
]);

const GENERIC_TITLES = new Set([
  "Как защитить права по вопросу военной службы?",
  "Как получить или обжаловать социальную выплату?",
  "Как взыскать компенсацию причиненного ущерба?",
  "Как защитить права в гражданском споре?",
  "Как решить жилищный спор и защитить права?",
  "Как защитить права в семейном споре?",
  "Как действовать в правовой ситуации и защитить права?",
  "Как действовать при судебном споре или исполнительном производстве?",
  "Как оспорить действия банка по счету или кредиту?",
  "Как решить вопрос с миграционными документами?",
  "Как защитить трудовые права работника?",
  "Как решить спор с недвижимостью или имуществом?"
]);

const QUESTION_START =
  /^(как|можно ли|могу ли|можем ли|имею ли|имеют ли|что|что делать|кто|куда|где|нужно ли|нужно|положены ли|положена ли|положен ли|полагается ли|полагаются ли|законно ли|правомерно ли|могут ли|может ли|сможет ли|смогу ли|имеет ли|должен ли|должна ли|должны ли|обязан ли|обязана ли|обязаны ли|какие|какой|какая|какова|каков|каким образом|сколько|возникнет ли|будет ли|будут ли|будем ли|придется ли|нужна ли|есть ли|стоит ли|когда|чем|почему|допускается ли|следует ли)([\s,]|$)/i;

type QuestionRow = {
  id: string;
  publicNumber: string | null;
  title: string;
  text: string;
  seoQualityScore: number;
  updatedAt: Date;
  service: { name: string } | null;
};

async function main() {
  const recentMinutesArg = process.argv.find((arg) => arg.startsWith("--recent-minutes="));
  const recentMinutes = recentMinutesArg ? Number(recentMinutesArg.split("=")[1]) : 0;
  const force = process.argv.includes("--force") || Number.isFinite(recentMinutes) && recentMinutes > 0;
  const where = recentMinutes > 0 ? { updatedAt: { gte: new Date(Date.now() - recentMinutes * 60 * 1000) } } : undefined;

  const questions = await prisma.question.findMany({
    where,
    select: {
      id: true,
      publicNumber: true,
      title: true,
      text: true,
      seoQualityScore: true,
      updatedAt: true,
      service: { select: { name: true } }
    },
    orderBy: { publicNumber: "asc" }
  });

  let repaired = 0;
  const examples: Array<{ publicNumber: string | null; before: string; after: string }> = [];

  for (const question of questions) {
    if (!force && !shouldRepairTitle(question.title) && !shouldRepairByText(question)) continue;

    const nextTitle = generateTitle(question, force);
    if (!nextTitle || nextTitle === question.title || isLowQualityTitle(nextTitle)) continue;

    const slug = await uniqueSlug(question.id, slugify(`q-${question.publicNumber ?? question.id}-${nextTitle}`));
    await prisma.question.update({
      where: { id: question.id },
      data: {
        title: nextTitle,
        enrichedTitle: nextTitle,
        slug,
        seoQualityScore: Math.max(question.seoQualityScore ?? 0, 80)
      }
    });
    repaired += 1;
    if (examples.length < 20) {
      examples.push({ publicNumber: question.publicNumber, before: question.title, after: nextTitle });
    }
  }

  console.log(JSON.stringify({ scanned: questions.length, repaired, examples }, null, 2));
}

function shouldRepairTitle(title: string) {
  const normalized = normalizeForCheck(title);
  const wc = wordCount(title);
  return (
    wc < 5 ||
    wc > 16 ||
    BAD_TITLE_CONTAINS.some((fragment) => normalized.includes(fragment)) ||
    /^(я|мы|мой|моя|у меня|у нас|как я|как мне|кто то|если|так вот|есть ли шанс)\b/.test(normalized) ||
    /(в данном случае|в этом случае|в данной ситуации|какие мои действия|какие дальнейшие действия|сколько по времени ждать|что делать дальше)/.test(normalized) ||
    /(как с (ними|этим) бороться|как бороться с этим|что-то можно предпринять|что то можно предпринять|как решить с )/.test(normalized) ||
    GENERIC_TITLES.has(ensureQuestion(title)) ||
    BAD_TAILS.has(lastWord(normalized))
  );
}

function shouldRepairByText(question: QuestionRow) {
  const title = normalizeForCheck(question.title);
  const text = normalizeForCheck(question.text);
  return (
    /временн.*регистрац/.test(title) && /поликлиник|полис|прикреплен/.test(text) ||
    /увольнен|увольнение|заявление на увольнение/.test(title) && /долев.*квартир|комнат|раздел.*имуществ/.test(text) ||
    /семейн.*спор/.test(title) && /оплачиваем.*выходн|ребен.*инвалид.*выходн|бухгалтер.*оплат/.test(text) ||
    /судебном споре|исполнительном производстве/.test(title) && /график общения|бывший муж.*ребен|видеться.*ребен/.test(text)
  );
}

function generateTitle(question: QuestionRow, forceFromText = false) {
  const category = question.service?.name ?? "";
  const source = `${stripBadPrefix(question.title)} ${question.text}`;
  const focused = focusedTitle(source);
  if (focused && !isLowQualityTitle(focused)) return ensureQuestion(focused);

  const fromCurrent = normalizeCandidate(stripBadPrefix(question.title));
  if (!forceFromText && fromCurrent && !GENERIC_TITLES.has(ensureQuestion(fromCurrent)) && !isLowQualityTitle(fromCurrent)) return ensureQuestion(fromCurrent);

  const fromText = extractDirectQuestion(question.text);
  if (fromText && !isLowQualityTitle(fromText)) return ensureQuestion(fromText);

  return categoryFallback(category, source);
}

function focusedTitle(source: string) {
  const lower = normalizeForCheck(source);

  if (/(виновник.*скрыл|скрылся).*(гаи|гибдд|каско|постановлен|страхов)|каско.*(гаи|гибдд|постановлен)|постановлен.*(гаи|гибдд).*страхов/.test(lower)) {
    return "Что делать, если ГИБДД долго не выносит постановление после ДТП?";
  }
  if (/нбки|кредитн.*истор|((мфо|микрозайм|кредит).*(закрыт|погаш|просроч|чеков.*не осталось|документ.*не осталось))/.test(lower)) {
    return "Как исправить запись в НБКИ после погашения долга без документов?";
  }
  if (/алиментн.*соглашен|недействительн.*сделк|реституц|исполнительн.*лист.*алимент/.test(lower)) {
    return "Как исполняется решение суда о возврате алиментов по недействительному соглашению?";
  }
  if (/тур|путевк|туроператор/.test(lower) && /(вернуть|возврат|компенсац|отказаться|не смогли воспользоваться)/.test(lower)) {
    return "Можно ли вернуть деньги за тур или путевку?";
  }
  if (/виз|миграцион|внж|рвп|патент/.test(lower) && /продл/.test(lower)) {
    return "Можно ли продлить визу или миграционный статус?";
  }
  if (/пристав|исполнительн/.test(lower) && /(магазин|бизнес|работающ|торгов)/.test(lower)) {
    return "Как приставы взыскивают долг при наличии работающего бизнеса?";
  }
  if (/сво|военнослуж|контракт/.test(lower) && /член.*сем|сем.*участник/.test(lower)) {
    return "Можно ли признать родственника членом семьи участника СВО?";
  }
  if (/временн.*регистрац|регистрац.*временн/.test(lower)) {
    return "Можно ли оформить временную регистрацию и уведомить ведомство?";
  }
  if (/компенсац.*утрат.*жиль|утрат.*жиль.*компенсац/.test(lower)) {
    return "Можно ли получить компенсацию за утраченное жилье?";
  }
  if (/цвет.*(авто|машин|автомоб)|однотонн.*цвет/.test(lower)) {
    return "Можно ли обжаловать отказ в регистрации изменения цвета автомобиля?";
  }
  if (/забор|границ.*участ|межеван/.test(lower)) {
    return "Как решить спор с соседом по границе участка?";
  }
  if (/(увольнен|уволиться|работодател|работник|труд|зарплат)/.test(lower) && /(заявлен|расчет|расчете|компенсац)/.test(lower)) {
    return "Как написать заявление на увольнение, чтобы получить выплаты?";
  }
  if (/верификац|веренцификац|вывести деньги|вывод.*денег/.test(lower)) {
    return "Можно ли вывести деньги без прохождения верификации?";
  }
  if (/(без вести|погиб|смерт).*(завещан|наслед|архив|справк.*смерт)|завещан.*(погиб|без вести|смерт)/.test(lower)) {
    return "Какие документы нужны для наследства после гибели родственника?";
  }
  if (/самозанят|гпх|фактическ.*трудов|трудов.*отношен/.test(lower)) {
    return "Можно ли признать отношения с самозанятым трудовыми?";
  }
  if (/сдач.*на права|экзамен.*права|третья сдача|4-я попытка|четвертая попытка/.test(lower)) {
    return "Когда можно пересдать экзамен на права после третьей попытки?";
  }
  if (/аванс.*5000|5000.*аванс|юр.*компан.*рефинанс|рефинансирован.*кредит/.test(lower)) {
    return "Как вернуть аванс за юридические услуги по рефинансированию?";
  }
  if (/футболк.*нет войне|надпис.*нет войне/.test(lower)) {
    return "Может ли быть ответственность за футболку с надписью «Нет войне»?";
  }
  if (/срочник.*подписал контракт|подписал контракт.*срочн|рапорт.*расторжен.*контракт|контракт.*минобороны/.test(lower)) {
    return "Можно ли расторгнуть контракт с Минобороны после подписания срочником?";
  }
  if (/об.?яснительн|объяснительн/.test(lower) && /(от и тб|охран.*труд|работодатель)/.test(lower)) {
    return "Как правильно написать объяснительную работодателю по охране труда?";
  }
  if (/оплачиваем.*выходн|4 оплачиваем.*выход|ребен.*инвалид.*выходн|дополнительн.*выходн.*ребен.*инвалид/.test(lower)) {
    return "Как взыскать оплату дополнительных выходных по уходу за ребенком-инвалидом?";
  }
  if (/график общения|бывший муж.*ребен|видеться.*ребен|продлен.*срок.*общен/.test(lower)) {
    return "Какие доказательства нужны для ограничения общения отца с ребенком?";
  }
  if (/ребен.*инвалид|сын.*инвалид|дочь.*инвалид|инвалид.*детства/.test(lower) && /досрочн.*пенси|пенси.*50/.test(lower)) {
    return "Можно ли досрочно выйти на пенсию родителю ребенка-инвалида?";
  }
  if (/приостанов.*списан|списан.*счет|исполнительн.*производств/.test(lower) && /(сво|военнослуж|участник.*сво)/.test(lower)) {
    return "Можно ли приостановить списание долга из-за участия родственника в СВО?";
  }
  if (/поликлиник.*отказ|отказ.*прикреплен|прикреп.*поликлиник|электронн.*полис/.test(lower)) {
    return "Может ли поликлиника отказать в прикреплении из-за электронного полиса?";
  }
  if (/(иск|заявлен).*(долев.*квартир|комнат|компенсац.*кв)|долев.*квартир.*компенсац/.test(lower)) {
    return "Как подать иск о разделе долевой квартиры и компенсации?";
  }
  if (/сдач.*квартир.*ипотек|ипотек.*квартир.*сдач|ипотек.*сдач/.test(lower)) {
    return "Какие риски есть при сдаче ипотечной квартиры в аренду?";
  }
  if (/опоздан|снять прем|лишить прем|уволить.*опоздан/.test(lower)) {
    return "Могут ли уволить или лишить премии за опоздание?";
  }
  if (/виновник.*обезопасить|обезопасить.*(суд|иск)|виновник.*подадут в суд/.test(lower)) {
    return "Как виновнику ДТП снизить риск последующего иска?";
  }

  return "";
}

function extractDirectQuestion(value: string) {
  const text = normalizeCandidate(value);
  const sentences = text.split(/(?<=[?!.])\s+/).map((item) => item.trim()).filter(Boolean);
  const candidates: string[] = [];

  for (const sentence of sentences) {
    const match = sentence.match(
      /(можно ли|могу ли|можем ли|имею ли право|имеет ли право|законно ли|правомерно ли|что делать|как поступить|как действовать|как оформить|как получить|как обжаловать|как вернуть|куда обращаться|какие документы|кто должен|могут ли|может ли|нужно ли)[^?!.]{12,180}/i
    );
    if (match) candidates.push(match[0]);
  }

  return candidates
    .map(normalizeCandidate)
    .map(ensureQuestion)
    .filter((candidate) => !isLowQualityTitle(candidate))
    .sort((a, b) => scoreTitle(b) - scoreTitle(a))[0] ?? "";
}

function categoryFallback(category: string, source: string) {
  const key = normalizeForCheck(`${category} ${source}`);
  const sourceKey = normalizeForCheck(source);
  if (/военкомат|военнослуж|контракт|сво|мобилиз|ввк|рапорт/.test(sourceKey)) return "Как защитить права по вопросу военной службы?";
  if (/банк|кредит|втб|сбер|счет|карта|займ|мфо/.test(sourceKey)) return "Как оспорить действия банка по счету или кредиту?";
  if (/иск|суд|исполнительн|пристав/.test(sourceKey)) return "Как действовать при судебном споре или исполнительном производстве?";
  if (/квартир|комнат|дол[яи]|имущество|недвижим/.test(sourceKey)) return "Как решить спор с недвижимостью или имуществом?";
  if (/военн|призыв|сво|мобилиз/.test(key)) return "Как защитить права по вопросу военной службы?";
  if (/труд|увольн|работ|зарплат/.test(key)) return "Как защитить трудовые права работника?";
  if (/семейн|алимент|брак|развод|ребен/.test(key)) return "Как защитить права в семейном споре?";
  if (/наслед|завещан|нотариус/.test(key)) return "Как оформить наследство и защитить права?";
  if (/миграц|гражданств|внж|патент|виз/.test(key)) return "Как решить вопрос с миграционными документами?";
  if (/долг|кредит|банкрот|исполнител|пристав/.test(key)) return "Что делать с долгом или исполнительным производством?";
  if (/недвиж|жилищ|земел|жкх|квартир|дом/.test(key)) return "Как решить спор с недвижимостью или жильем?";
  if (/административ|штраф|коап|постановлен/.test(key)) return "Как оспорить штраф или административное постановление?";
  if (/уголов|полици|следств|побои|мошен/.test(key)) return "Как защитить права по уголовному делу?";
  if (/налог|деклараци/.test(key)) return "Как разобраться с налогом и декларацией?";
  if (/тур|путевк/.test(key)) return "Можно ли вернуть деньги за тур или путевку?";
  return "Как действовать в правовой ситуации и защитить права?";
}

function stripBadPrefix(value: string) {
  return value
    .replace(/^как решить вопрос по теме:\s*/i, "")
    .replace(/^как решить вопрос по категории\s+[^:]+:\s*/i, "")
    .replace(/^как действовать по вопросу:\s*/i, "")
    .replace(/^юридическая консультация по ситуации:\s*/i, "")
    .trim();
}

function normalizeCandidate(value: string) {
  const cleaned = value
    .replace(/\[контакт скрыт платформой\]/gi, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[^\p{L}\p{N}\s.,?!:;()«»"№/%-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  const normalized = fixTypos(cleaned)
    .replace(/^[^A-Za-zА-Яа-яЁё0-9]+/, "")
    .replace(/^[-–—·•~\s]+/, "")
    .replace(/[?!.]+$/g, "")
    .replace(/\bможем ли мы\b/gi, "Можно ли")
    .replace(/\bможем ли\b/gi, "Можно ли")
    .replace(/\bмогу ли я\b/gi, "Можно ли")
    .replace(/\bимею ли я право\b/gi, "Можно ли")
    .replace(/\bможет-ли\b/gi, "Может ли")
    .replace(/\bможно-ли\b/gi, "Можно ли")
    .replace(/\bчто[-\s]?то можно предпринять\b/gi, "Что можно предпринять")
    .replace(/\bв данном случае\b/gi, "")
    .replace(/\bв этом случае\b/gi, "")
    .replace(/\bв данной ситуации\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s,;:-]+|[\s,;:-]+$/g, "");

  return sentenceCase(normalized);
}

function fixTypos(value: string) {
  return value
    .replace(/\bмождноли\b/gi, "можно ли")
    .replace(/\bможноли\b/gi, "можно ли")
    .replace(/\bкакто\b/gi, "как-то")
    .replace(/\bлутше\b/gi, "лучше")
    .replace(/\bверенцификаци[юб]\b/gi, "верификацию")
    .replace(/\bверификаци[юб]\b/gi, "верификацию")
    .replace(/\bбнз\b/gi, "без")
    .replace(/\bплотит\b/gi, "платить")
    .replace(/\bкомпенсац[ыи]й\b/gi, "компенсации")
    .replace(/\bросч[её]т[еи]\b/gi, "расчете")
    .replace(/\bпо неустойки\b/gi, "по неустойке")
    .replace(/\bчленом семь\b/gi, "членом семьи")
    .replace(/\bчтоб\b/gi, "чтобы");
}

function ensureQuestion(value: string) {
  const normalized = normalizeCandidate(value).replace(/[?!.]+$/g, "").trim();
  return normalized ? `${normalized}?` : "";
}

function isLowQualityTitle(title: string) {
  const normalized = normalizeForCheck(title);
  const wc = wordCount(title);
  return (
    !title ||
    wc < 5 ||
    wc > 16 ||
    BAD_TITLE_CONTAINS.some((fragment) => normalized.includes(fragment)) ||
    /(в данном случае|в этом случае|в данной ситуации|какие мои действия|какие дальнейшие действия|сколько по времени ждать|что делать дальше)/.test(normalized) ||
    /(как с (ними|этим) бороться|как бороться с этим|что-то можно предпринять|что то можно предпринять)/.test(normalized) ||
    /^(я|мы|мой|моя|мои|у меня|у нас|если|так вот)\b/.test(normalized) ||
    BAD_TAILS.has(lastWord(normalized))
  );
}

function scoreTitle(title: string) {
  const wc = wordCount(title);
  let score = 0;
  if (wc >= 6 && wc <= 14) score += 3;
  if (QUESTION_START.test(title)) score += 2;
  if (/суд|пристав|долг|выплат|увольн|алимент|жиль|штраф|договор|наслед|военн|миграц|компенсац/i.test(title)) score += 2;
  if (/мне|мо[йяи]|у меня|у нас/i.test(title)) score -= 1;
  return score;
}

function wordCount(value: string) {
  return (value.match(/[A-Za-zА-Яа-яЁё0-9]+/g) ?? []).length;
}

function lastWord(value: string) {
  return value.replace(/[?!.]+$/g, "").split(/\s+/).filter(Boolean).at(-1) ?? "";
}

function normalizeForCheck(value: string) {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/[?!.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceCase(value: string) {
  const text = value.trim();
  return text ? `${text[0].toLocaleUpperCase("ru-RU")}${text.slice(1)}` : "";
}

async function uniqueSlug(questionId: string, baseSlug: string) {
  let slug = baseSlug;
  let index = 2;
  while (true) {
    const existing = await prisma.question.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === questionId) return slug;
    slug = `${baseSlug}-${index}`;
    index += 1;
  }
}

function slugify(value: string) {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "j",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "c",
    ч: "ch",
    ш: "sh",
    щ: "shch",
    ы: "y",
    э: "e",
    ю: "yu",
    я: "ya",
    ь: "",
    ъ: ""
  };

  return (
    value
      .toLowerCase()
      .split("")
      .map((char) => map[char] ?? char)
      .join("")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90) || `question-${Date.now()}`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
