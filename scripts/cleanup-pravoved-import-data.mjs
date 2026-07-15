import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const inputPath = resolve("pravoved_parser/outputs/pravoved_1250_answered_questions_site_import.json");
const payload = JSON.parse(readFileSync(inputPath, "utf8"));
const sourceRows = Array.isArray(payload.rows) ? payload.rows : [];

function fixTextRu(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/Мождноли/gi, "Можно ли")
    .replace(/Можноли/gi, "Можно ли")
    .replace(/Можно ли ли/gi, "Можно ли")
    .replace(/Можно ли я/gi, "Могу ли я")
    .replace(/какт[оа]/gi, "как-то")
    .replace(/веренцификаци[юб]/gi, "верификацию")
    .replace(/верификаци[юб]/gi, "верификацию")
    .replace(/бнз/gi, "без")
    .replace(/\bМождноли\b/gi, "Можно ли")
    .replace(/\bМожноли\b/gi, "Можно ли")
    .replace(/\bкакт[оа]\b/gi, "как-то")
    .replace(/\bверенцификаци[юб]\b/gi, "верификацию")
    .replace(/\bверификаци[юб]\b/gi, "верификацию")
    .replace(/\bбнз\b/gi, "без")
    .replace(/\bпо больше\b/gi, "побольше")
    .replace(/\bни какой\b/gi, "никакой")
    .replace(/\bне законн/gi, "незаконн")
    .replace(/\bгениальн(ая|ую|ой) доверенн/gi, "генеральн$1 доверенн")
    .replace(/осужд\s*нн/gi, "осужденн")
    .replace(/\bпоо\s+гпк\s+рф\b/gi, "по ГПК РФ")
    .replace(/\bгпк\s+рф\b/gi, "ГПК РФ")
    .replace(/\bгк\s+рф\b/gi, "ГК РФ")
    .replace(/\bсво\b/gi, "СВО")
    .replace(/\bввк\b/gi, "ВВК")
    .replace(/\bжкх\b/gi, "ЖКХ")
    .replace(/\bндфл\b/gi, "НДФЛ")
    .replace(/\bрф\b/gi, "РФ")
    .trim();
}

function cap(value) {
  const text = fixTextRu(value).trim();
  return text ? text[0].toLocaleUpperCase("ru-RU") + text.slice(1) : "";
}

function stripIntro(value) {
  return fixTextRu(value)
    .replace(/^(здравствуйте|добрый день|доброе утро|добрый вечер|доброй ночи)[,!\.\s-]*/i, "")
    .replace(/^(подскажите|скажите|пожалуйста|прошу подсказать)[,!\.\s-]*/i, "")
    .replace(/^(у меня|у нас)\s+(такой|следующий)?\s*вопрос[:,]?\s*/i, "")
    .replace(/^вопрос[:,]?\s*/i, "")
    .replace(/прошу оценить возможные действия, сроки, документы и риски\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureQuestion(value) {
  const text = cap(String(value || "").replace(/[.!]+$/g, "").replace(/\?+$/g, "").trim());
  return text ? `${text}?` : "";
}

function words(value) {
  return String(value || "")
    .replace(/[?!.:,;()«»"'`´]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function trimWords(value, max = 14) {
  const list = words(value);
  return list.length > max ? list.slice(0, max).join(" ") : String(value || "").replace(/[?!.]+$/g, "").trim();
}

function normalizedKey(value) {
  return fixTextRu(value)
    .toLocaleLowerCase("ru-RU")
    .replace(/\[контакт скрыт платформой\]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function badTitle(value) {
  const key = normalizedKey(value);
  const count = words(value).length;
  const questionStart = /^(могу ли|можно ли|имею ли|как|какие|какой|какая|какова|каков|каким образом|что|кто|куда|где|почему|законно ли|правомерно ли|положен|положены|положена|нужно ли|нужно|нужна ли|есть ли|будет ли|будут ли|будем ли|возникнет ли|имеет ли|имеют ли|могут ли|может ли|стоит ли|когда|обязана ли|обязан ли|должен ли|должна ли|будем ли|полагаются ли|смогу ли|сможет ли)/i;
  return (
    !key ||
    count < 4 ||
    count > 16 ||
    !questionStart.test(key) ||
    /^как действовать по вопросу/.test(key) ||
    /^как решить вопрос по теме/.test(key) ||
    /^можно ли этот вопрос/.test(key) ||
    /^что\s+(?!делать|будет|грозит|нужно|можно|означает|положено|предпринять|требовать|проверить|считается|изменится|получит|полагается)/i.test(key) ||
    /^(я|мы|у меня|у нас|мой|моя|мои|муж|жена|сын|дочь|отец|мама|машина|квартира|или|и)\b/i.test(key) ||
    /\b(следующий вопрос|подскажите|скажите|пожалуйста|нужна консультация|с уважением|личн.*чат|контакт скрыт|материалах на сайте)\b/i.test(key) ||
    /\b(что|если|и|или|в|на|по|с|без|но|его|ее|её)$/i.test(key)
  );
}

function focusedTitle(question) {
  const key = normalizedKey(question);
  if (/верификац/.test(key) && /вывести деньги|вывод денег|без оплаты|обойти/.test(key)) return "Можно ли вывести деньги без прохождения верификации?";
  if (/отчисл|академическ|задолженн|бакалавр|целев/.test(key) && /вуз|университет|курс|бюджет/.test(key)) return "Можно ли восстановиться в вузе после отчисления за академическую задолженность?";
  if (/нет печати о гражданстве|печати о гражданстве|свидетельств.*рожд/.test(key) && /паспорт|гражданств/.test(key)) return "Что делать, если нет отметки о гражданстве в свидетельстве о рождении?";
  if (/квартир/.test(key) && /снимал|аренд|без договора|холодильник|сломал/.test(key)) return "Что делать, если арендодатель требует деньги за сломанный холодильник?";
  if (/курсант|комендат/.test(key) && /лирик|прегабалин|наркот|психотроп/.test(key)) return "Как доложить в комендатуру об употреблении Лирики курсантом?";
  if (/сизо|осужден|осужд/.test(key) && /контракт|сво/.test(key) && /выплат/.test(key)) return "Положены ли выплаты семье военнослужащего, подписавшего контракт из СИЗО?";
  if (/бывш.*муж|согласия бывшего/.test(key) && /дарствен|дарени|доч/.test(key)) return "Можно ли оформить дарение долей детям без согласия бывшего мужа?";
  if (/дарственную на своих дочек|дочк.*по 1 4/.test(key)) return "Можно ли оформить дарственную детям без согласия бывшего мужа?";
  if (/онлайн курс|онлайн-курс|курс/.test(key) && /отказ|уменьшить оплат|договор/.test(key)) return "Можно ли отказаться от онлайн-курса и уменьшить оплату по договору?";
  if (/незаконн.*уголовн.*преслед/.test(key)) return "Что делать при незаконном уголовном преследовании?";
  if (/стоянк/.test(key) && /вещдок|веществен|264 1|уголовн/.test(key)) return "Кто оплачивает стоянку автомобиля, признанного вещественным доказательством?";
  if (/минн|взрывн|травм|перелом|палец|плюснев/.test(key) && /мобилиз|военнослуж|сво|ввк/.test(key)) return "Как пройти ВВК после минно-взрывной травмы у мобилизованного?";
  if (/инвалидн/.test(key) && /групп/.test(key)) return "Как переоформить группу инвалидности после тяжелой травмы?";
  if (/потере кормильц/.test(key) && /уход/.test(key)) return "Можно ли получать выплату по уходу за ребенком по потере кормильца?";
  if (/трактовать пункт|пункт 4/.test(key)) return "Как трактовать спорный пункт договора?";
  if (/не выходи на связь|последн.*место нахожд|енак/.test(key)) return "Куда обращаться, если родственник не выходит на связь?";
  if (/завещан/.test(key) && /украин|при украине/.test(key)) return "Можно ли открыть наследственное дело по завещанию, составленному при Украине?";
  if (/ввк|категор/.test(key) && /обжал|оспор|комисс/.test(key)) return "Как обжаловать решение ВВК по категории годности?";
  if (/переул|темн|ночью|камер/.test(key) && /16 лет|несовершеннолет|друг/.test(key)) return "Что грозит несовершеннолетним за конфликт ночью без камер?";
  if (/выехать из россии|выезд из россии|покинуть россию/.test(key) && /вернуться|комисс|военком|медкомисс/.test(key)) return "Можно ли выехать из России и вернуться перед комиссией?";
  if (/минобороны|военнослуж|военн/.test(key) && /нуждающ.*жиль|статус.*нуждающ|жилье|жильё/.test(key)) return "Какие условия признания военнослужащего нуждающимся в жилье?";
  if (/ветеран.*боев|удостоверение ветерана/.test(key)) return "Как получить удостоверение ветерана боевых действий?";
  if (/материнск|маткапитал|мат капитал/.test(key) && /несовершеннолет|ребен|ребён|дол/.test(key) && /квартир|покуп|сделк/.test(key)) return "Как проверить покупку квартиры с маткапиталом и долей ребенка?";
  if (/материнск|маткапитал|мат капитал/.test(key) && /реквизит/.test(key) && /друг/.test(key)) return "Можно ли оформить выплату из маткапитала на реквизиты другого человека?";
  if (/заявлен|писать/.test(key) && /полиц|полицейск/.test(key)) return "Как правильно написать заявление в полицию самостоятельно?";
  if (/казахстан/.test(key) && /доминикан|90 дней|срок пребыван|въезд|выезд/.test(key)) return "Как считать срок пребывания гражданина Казахстана за границей?";
  if (/украинск.*номер|донецк.*номер|автомобиль.*украин/.test(key) && /выехать|выезд|конфискац/.test(key)) return "Можно ли выехать из РФ на автомобиле с украинскими номерами?";
  if (/ипотечн.*квартир|квартира.*ипотек/.test(key)) return "Что будет с ипотечной квартирой при разделе имущества?";
  if (/жена|супруга/.test(key) && /участник.*сво|зоне сво|сво/.test(key)) return "Какие права есть у жены участника СВО?";
  if (/погиб|без вести|пропал/.test(key) && /сво|военнослуж|выплат/.test(key)) return "Какие выплаты положены семье погибшего или пропавшего участника СВО?";
  if (/подар|перевод/.test(key) && /муж|супруг|брак|развод/.test(key)) return "Может ли супруг взыскать подарки и переводы после брака?";
  if (/ранен|ранение|травм/.test(key) && /сво|военнослуж|выплат|документ/.test(key)) return "Как получить выплату за ранение военнослужащего на СВО?";
  if (/проезд/.test(key) && /отпуск|месту отпуска|компенсац/.test(key)) return "Положена ли компенсация проезда к месту отпуска военнослужащему?";
  if (/контракт/.test(key) && /аннулир|расторг|выплат/.test(key)) return "Что делать, если контракт аннулировали после выплаты?";
  if (/115\s*фз|115фз|заблокировали карту|блокировк.*карт/.test(key)) return "Что делать при блокировке карты по 115-ФЗ?";
  if (/сдавать/.test(key) && /квартир/.test(key) && /самозан/.test(key)) return "Может ли жена сдавать квартиру в аренду и платить налог как самозанятая?";
  if (/самозанят/.test(key) && /тренер|обуча/.test(key) && /декрет/.test(key)) return "Можно ли работать самозанятым тренером во время декретного отпуска?";
  if (/отдали машину/.test(key) && /автосервис/.test(key)) return "Что делать, если автосервис не возвращает машину после ремонта?";
  if (/генеральн.*доверенн|доверенн/.test(key) && /осужден|машин|автомобил/.test(key)) return "Как оформить генеральную доверенность осужденному для распоряжения автомобилем?";
  return "";
}

function extractDirectTitle(question) {
  const clean = stripIntro(question);
  const candidates = [];
  const questionMatches = clean.match(/[^?]{20,220}\?/g) || [];
  candidates.push(...questionMatches);

  const markers = /(могу ли|можно ли|могу\s+|смогу ли|сможет ли|имею ли|обязан[аы]? ли|долж[её]н ли|законно ли|правомерно ли|как |какие |какой |что |кто |куда |где |почему |положен[аы]? ли|полагаются ли|стоит ли|нужно ли|нужна ли|будет ли|будем ли|возникнет ли|имеет ли|имеют ли|есть ли|пропустят ли)/i;
  const sentences = clean.split(/[.!?\n]+/).map((part) => part.trim()).filter(Boolean);
  for (const sentence of sentences) {
    const index = sentence.search(markers);
    if (index >= 0) candidates.push(sentence.slice(index));
  }

  let best = "";
  let bestScore = -1000;
  for (const raw of candidates) {
    let candidate = stripIntro(raw).replace(/^[,\s-]+/, "").replace(/^(и|или)\s+/i, "").trim();
    if (!candidate) continue;
    candidate = candidate
      .replace(/^могу\s+я\s+/i, "Могу ли я ")
      .replace(/^могу\s+/i, "Можно ли ")
      .replace(/^как\s+(мне|нам|вам)\s+/i, "Как ")
      .replace(/^имею ли я права?\s+/i, "Имею ли я право ")
      .replace(/^пропустят\b/i, "Пропустят ли");
    candidate = trimWords(candidate, 14);
    const key = normalizedKey(candidate);
    const count = words(candidate).length;
    let score = 0;
    if (/^(могу ли|можно ли|имею ли|как|какие|какой|что|кто|куда|где|почему|законно ли|правомерно ли|положен|нужно ли|нужна ли|есть ли|будет ли|имеет ли)/i.test(candidate)) score += 8;
    if (/суд|иск|договор|выплат|штраф|долг|увол|военн|сво|квартир|налог|пристав|доверенн|наслед|ребен|ребён|алим|полици|ввк|банк|карта|арест|компенсац|расторж|возврат/.test(key)) score += 5;
    if (count >= 6 && count <= 14) score += 4;
    if (count < 4 || count > 16) score -= 8;
    if (/здравствуйте|подскажите|пожалуйста|уважением|контакт скрыт/.test(key)) score -= 8;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best && !badTitle(best) ? ensureQuestion(best) : "";
}

function fallbackTopicTitle(row) {
  const key = normalizedKey(`${row.rawQuestion} ${row.rawCategory}`);
  if (/наслед/.test(key)) return "Как оформить наследство и защитить свои права?";
  if (/алимент/.test(key)) return "Как взыскать алименты и подтвердить расходы на ребенка?";
  if (/развод|расторж.*брак/.test(key)) return "Как оформить развод и защитить свои права?";
  if (/долг|кредит|пристав|исполнительн/.test(key)) return "Как действовать при взыскании долга через приставов?";
  if (/увол|работодател|зарплат|больничн|отпуск/.test(key)) return "Как защитить трудовые права при споре с работодателем?";
  if (/квартир|жиль|жкх|сосед|зали/.test(key)) return "Как решить жилищный спор и защитить свои права?";
  if (/налог|ндфл/.test(key)) return "Когда нужно платить налог и как рассчитать сумму?";
  if (/уголовн|полици|судим|обвин/.test(key)) return "Как защитить права по уголовному делу?";
  if (/военн|сво|контракт|ввк|мобилиз/.test(key)) return "Как защитить права военнослужащего в спорной ситуации?";
  if (/потребител|возврат|товар|услуг/.test(key)) return "Как защитить права потребителя и вернуть деньги?";
  return "Как действовать в правовой ситуации и защитить свои права?";
}

function duplicateClusterKey(questionKey) {
  if (/сына отчислили/.test(questionKey) && /четвертого курса бакалавриата/.test(questionKey)) {
    return "student-bachelor-dismissal";
  }
  return "";
}

function makeTitle(row) {
  return focusedTitle(row.rawQuestion) || extractDirectTitle(row.rawQuestion) || fallbackTopicTitle(row);
}

const seenQuestions = new Set();
const seenQuestionPrefixes = new Set();
const seenClusters = new Set();
const rows = [];
let removedQuestionDups = 0;
let removedBadTitles = 0;

for (const row of sourceRows) {
  const questionKey = normalizedKey(row.rawQuestion);
  if (!questionKey) continue;
  const questionPrefix = questionKey.slice(0, 280);
  const clusterKey = duplicateClusterKey(questionKey);
  if (
    seenQuestions.has(questionKey) ||
    (questionPrefix.length > 140 && seenQuestionPrefixes.has(questionPrefix)) ||
    (clusterKey && seenClusters.has(clusterKey))
  ) {
    removedQuestionDups += 1;
    continue;
  }
  seenQuestions.add(questionKey);
  if (questionPrefix.length > 140) seenQuestionPrefixes.add(questionPrefix);
  if (clusterKey) seenClusters.add(clusterKey);
  const copy = { ...row, additionalCategory: "" };
  copy.rawTitle = ensureQuestion(makeTitle(copy));
  if (badTitle(copy.rawTitle)) {
    removedBadTitles += 1;
    continue;
  }
  rows.push(copy);
}

const usedTitles = new Set();
const uniqueRows = [];
let removedTitleDups = 0;

for (const row of rows) {
  let title = ensureQuestion(row.rawTitle);
  let titleKey = normalizedKey(title);
  if (usedTitles.has(titleKey)) {
    const direct = extractDirectTitle(row.rawQuestion);
    if (direct && !usedTitles.has(normalizedKey(direct))) title = direct;
  }
  titleKey = normalizedKey(title);
  if (usedTitles.has(titleKey)) {
    removedTitleDups += 1;
    continue;
  }
  row.rawTitle = title;
  usedTitles.add(titleKey);
  uniqueRows.push(row);
}

for (const row of uniqueRows) {
  const key = normalizedKey(row.rawQuestion);
  if (/дарственную на своих дочек|дочк.*по 1 4/.test(key)) {
    row.rawTitle = "Можно ли оформить дарственную детям без согласия бывшего мужа?";
  } else if (/сдавать/.test(key) && /квартир/.test(key) && /самозан/.test(key)) {
    row.rawTitle = "Может ли жена сдавать квартиру в аренду и платить налог как самозанятая?";
  } else if (/отдали машину/.test(key) && /автосервис/.test(key)) {
    row.rawTitle = "Что делать, если автосервис не возвращает машину после ремонта?";
  }
}

payload.rows = uniqueRows;
writeFileSync(inputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

const stats = {
  sourceRows: sourceRows.length,
  outputRows: uniqueRows.length,
  removedQuestionDups,
  removedBadTitles,
  removedTitleDups,
  nonemptyAdditional: uniqueRows.filter((row) => normalizedKey(row.additionalCategory)).length,
  duplicateTitles: uniqueRows.length - usedTitles.size,
  badTitles: uniqueRows.filter((row) => badTitle(row.rawTitle)).length
};

console.log(JSON.stringify(stats, null, 2));
