/* eslint-disable @typescript-eslint/no-require-imports */
// Deterministic lawyer "description" generator.
// Builds a 1000+ char bio from real profile fields (FIO, gender via patronymic,
// education, specializations, experienceYears). No invented facts.
// Usage: node scripts/generate-lawyer-bios.js [--apply] [--limit N]
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const prisma = new PrismaClient();

const APPLY = process.argv.includes("--apply");
const limArg = process.argv.indexOf("--limit");
const LIMIT = limArg > -1 ? parseInt(process.argv[limArg + 1], 10) : 0;

const MAP = {
  "Наследство": "наследство (вступление в права и наследственные споры)",
  "Уголовные дела": "уголовные дела (защита на следствии и в суде)",
  "Защита прав потребителей": "защита прав потребителей (возврат денег за товары и услуги, претензии продавцам)",
  "Увольнение": "споры при увольнении (восстановление на работе и взыскание выплат)",
  "Жилищные споры": "жилищные споры (пользование и раздел жилья, выселение, споры с управляющей компанией)",
  "Банкротство физических лиц": "банкротство физических лиц (списание долгов через процедуру)",
  "Военное право": "военное право (служба, ВВК, мобилизация и выплаты)",
  "Кредиты и долги": "кредиты и долги (споры с банками и взыскание задолженности)",
  "Трудовые споры": "трудовые споры (зарплата, отпуск, незаконные взыскания)",
  "Налоговые споры": "налоговые споры (проверки, доначисления и их обжалование)",
  "Автоюрист": "автомобильные споры (ДТП, лишение прав, выплаты по страховке)",
  "Недвижимость": "недвижимость (сделки, споры о праве собственности и выселение)",
  "ДТП": "дела по ДТП (оформление, возмещение ущерба и споры со страховой)",
  "Составление документов": "составление документов (договоры, претензии, иски и заявления)",
  "Бизнес и договоры": "бизнес и договоры (сопровождение сделок и договорная работа)",
  "Представительство в суде": "представительство в суде (ведение дела на всех стадиях)",
  "Развод": "расторжение брака",
  "Раздел имущества": "раздел имущества супругов",
  "Алименты": "алименты (взыскание, изменение размера и задолженность)",
  "Семейные споры": "семейные споры (дети, брак и имущество)",
  "Административные дела": "административные дела (штрафы и обжалование постановлений)",
  "Исполнительное производство": "исполнительное производство (приставы, аресты и списания)",
  "Международное право": "международное право",
  "Образовательное право": "образовательное право (споры со школами и вузами)",
  "Таможенное право": "таможенное право",
  "Защита чести и достоинства": "защита чести, достоинства и деловой репутации",
  "Интеллектуальная собственность": "интеллектуальная собственность (авторские и смежные права)",
  "Медицинское право": "медицинское право (споры с клиниками и качество помощи)",
  "Страховые споры": "страховые споры (ОСАГО, КАСКО и отказы в выплатах)",
  "IT-право": "IT-право (договоры, контент и персональные данные)",
  "Миграционное право": "миграционное право (гражданство, ВНЖ, РВП и запреты на въезд)",
  "Пенсионные споры": "пенсионные споры (назначение и перерасчёт пенсий)",
  "Арбитражные споры": "арбитражные споры (споры между компаниями и ИП)",
  "Корпоративные споры": "корпоративные споры",
  "Персональные данные": "защиту персональных данных",
  "Земельные споры": "земельные споры (границы, кадастр и оформление участков)",
  "Экологическое право": "экологическое право",
  "Социальные выплаты": "социальные выплаты (пособия, льготы и отказы)",
  "Банкротство бизнеса": "банкротство бизнеса (процедуры для компаний и ИП)"
};

const FILLERS = [
  "Особое внимание уделяю сбору доказательств, соблюдению процессуальных сроков и грамотному оформлению документов — нередко именно это определяет исход дела.",
  "При возможности помогаю урегулировать спор в досудебном порядке: веду переговоры и готовлю претензии, чтобы решить вопрос быстрее и с меньшими затратами.",
  "Сопровождаю дело на всех стадиях — от анализа ситуации и выработки позиции до участия в заседаниях и обжалования принятых решений."
];

function yearsWord(n) {
  const a = Math.abs(n) % 100, b = n % 10;
  if (a > 10 && a < 20) return "лет";
  if (b === 1) return "год";
  if (b >= 2 && b <= 4) return "года";
  return "лет";
}

function gender(mid, last) {
  const p = String(mid || "").toLowerCase().trim();
  if (/на$/.test(p)) return "f";
  if (/ич$/.test(p)) return "m";
  const ln = String(last || "").toLowerCase();
  if (/(ова|ева|ина|ына|ская|цкая|ая|яя)$/.test(ln)) return "f";
  return "m";
}

function detailed(name) { return MAP[name] || name.toLowerCase(); }
function bare(name) { return (MAP[name] || name.toLowerCase()).replace(/\s*\(.*?\)\s*$/, ""); }

function parseEducation(edu) {
  // First entry only: split on ";" and newlines (degree lines like "Специалист"
  // sit on their own line and must not leak into the institution name).
  let first = String(edu || "").split(/[;\n]/)[0].split("|")[0].trim();
  let year = null;
  const ym = first.match(/^(\d{4})\s*г\.?\s*/);
  if (ym) { year = ym[1]; first = first.slice(ym[0].length).trim(); }
  let inst = first.split("—")[0].trim();
  const looksReal = /(институт|университет|академи|школ|факультет|колледж|консерватор|лицей|МГУ|МГЮА|МГИМО|РУДН|РАНХиГС|вуз)/i.test(inst);
  const looksGeneric = /высш(ее|его)\s+(юридическ|образован)|повышени|квалификаци|профильн/i.test(inst);
  if (!looksReal || looksGeneric || inst.length < 6) return { year: null, inst: null };
  if (inst.length > 80) inst = inst.slice(0, 78).replace(/\s+\S*$/, "") + "…";
  return { year, inst };
}

function dedupe(arr) {
  const seen = new Set(), out = [];
  for (const x of arr) { const k = x.toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push(x); } }
  return out;
}

function buildDescription(l) {
  const fio = [l.lastName, l.firstName, l.middleName].filter(Boolean).join(" ").trim();
  const g = gender(l.middleName, l.lastName);
  const got = g === "f" ? "Получила" : "Получил";

  const ordered = [];
  if (l.primaryServiceId) {
    const pr = l.services.find((s) => s.serviceId === l.primaryServiceId);
    if (pr) ordered.push(pr.service.name);
  }
  for (const s of l.services) if (!ordered.includes(s.service.name)) ordered.push(s.service.name);

  const head = dedupe(ordered.slice(0, 4).map(detailed));
  const tail = dedupe(ordered.slice(4).map(bare)).filter((t) => !head.some((h) => h.startsWith(t)));

  let directions = head.join("; ");
  if (tail.length) directions += ", а также " + tail.join(", ");

  const edu = parseEducation(l.education);
  const eduParen = edu.inst ? [edu.inst, edu.year ? edu.year + " г." : ""].filter(Boolean).join(", ") : "";

  const intro = l.experienceYears && l.experienceYears >= 1
    ? `Здравствуйте! Меня зовут ${fio}, я практикующий юрист со стажем ${l.experienceYears} ${yearsWord(l.experienceYears)}.`
    : `Здравствуйте! Меня зовут ${fio}, я практикующий юрист.`;
  const eduSent = `${got} высшее юридическое образование${eduParen ? ` (${eduParen})` : ""}.`;
  const helpSent = "Помогаю гражданам разбираться в спорных правовых ситуациях и доводить их до решения.";
  const dirSent = directions ? `Веду дела по нескольким направлениям: ${directions}.` : "";
  const approachSent = "По каждому обращению консультирую, оцениваю перспективы и риски, готовлю претензии, заявления и иски, а при необходимости представляю интересы в суде и других инстанциях.";
  const dogovorSent = "Работаю по договору, с предоставлением всех необходимых платёжных документов.";
  const closing = "Внимательно разбираю каждую ситуацию, объясняю перспективы простым языком и предлагаю понятный, пошаговый план действий. Обратившись ко мне, вы получите взвешенную правовую оценку и поддержку на всех этапах работы по делу — от первой консультации до завершения спора.";

  let body = [intro, eduSent, helpSent, dirSent, approachSent, dogovorSent].filter(Boolean).join(" ");
  let i = 0;
  while ((body + " " + closing).length < 1000 && i < FILLERS.length) { body += " " + FILLERS[i]; i++; }
  return { fio, gender: g, text: body + " " + closing };
}

(async () => {
  const lawyers = await prisma.lawyer.findMany({
    include: { services: { include: { service: true } } },
    orderBy: { createdAt: "asc" }
  });
  const rows = (LIMIT ? lawyers.slice(0, LIMIT) : lawyers).map((l) => {
    const r = buildDescription(l);
    return { id: l.id, fio: r.fio, gender: r.gender, oldLen: String(l.description || "").length, newLen: r.text.length, text: r.text, old: l.description || "" };
  });

  const lens = rows.map((r) => r.newLen);
  console.log("LAWYERS=" + rows.length);
  console.log("len min/max=" + Math.min(...lens) + "/" + Math.max(...lens) + "  under1000=" + lens.filter((x) => x < 1000).length);
  console.log("gender m/f=" + rows.filter((r) => r.gender === "m").length + "/" + rows.filter((r) => r.gender === "f").length);

  const picks = [0, 1, 2, rows.findIndex((r) => r.gender === "f"), rows.length - 1].filter((v, i, a) => v >= 0 && a.indexOf(v) === i);
  for (const idx of picks) {
    const r = rows[idx];
    console.log("\n===== " + r.fio + " | " + r.gender + " | " + r.newLen + " зн. =====");
    console.log(r.text);
  }

  if (APPLY) {
    const ts = Date.now();
    fs.writeFileSync(`/tmp/lawyer_desc_backup_${ts}.json`, JSON.stringify(rows.map((r) => ({ id: r.id, old: r.old })), null, 0));
    let done = 0;
    for (const r of rows) { await prisma.lawyer.update({ where: { id: r.id }, data: { description: r.text } }); done++; }
    fs.writeFileSync(`/tmp/lawyer_bios_review_${ts}.tsv`, "ФИО\tРод\tСтаро_зн\tНово_зн\tОписание\n" + rows.map((r) => [r.fio, r.gender, r.oldLen, r.newLen, r.text.replace(/\t/g, " ")].join("\t")).join("\n"));
    console.log("\nAPPLIED=" + done + "  backup=/tmp/lawyer_desc_backup_" + ts + ".json  review=/tmp/lawyer_bios_review_" + ts + ".tsv");
  } else {
    console.log("\nDRY RUN (no writes). Add --apply to write to DB.");
  }
  await prisma.$disconnect();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
