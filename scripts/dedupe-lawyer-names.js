// Assigns unique gender-matched ФИО to dev-seed lawyer clones (slug dev-*),
// so all profiles have distinct names. Keeps gender (description regen handled
// separately by generate-lawyer-bios.js). Usage: node scripts/dedupe-lawyer-names.js [--apply]
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

const MALE_FIRST = ["Александр","Дмитрий","Сергей","Андрей","Алексей","Максим","Евгений","Михаил","Иван","Роман","Владимир","Николай","Павел","Кирилл","Артём","Денис","Игорь","Олег","Виталий","Константин","Антон","Юрий","Григорий","Степан","Вадим","Тимур","Борис","Леонид","Аркадий","Валерий","Геннадий","Семён"];
const FEMALE_FIRST = ["Анна","Мария","Елена","Ольга","Наталья","Ирина","Светлана","Татьяна","Юлия","Екатерина","Анастасия","Виктория","Дарья","София","Елизавета","Полина","Ксения","Алина","Марина","Вера","Галина","Людмила","Оксана","Надежда","Алла","Лидия","Валентина","Маргарита","Тамара","Раиса","Нина","Зоя"];
const LAST_M = ["Соколов","Кузнецов","Попов","Лебедев","Козлов","Новиков","Морозов","Волков","Зайцев","Семёнов","Голубев","Виноградов","Воробьёв","Степанов","Никитин","Кудрявцев","Баранов","Куликов","Алексеев","Сорокин","Мартынов","Дорофеев","Карпов","Власов","Маслов","Исаев","Тарасов","Беляев","Антонов","Ефремов","Громов","Киселёв","Макаров","Андреев","Ковалёв","Ильин","Гаврилов","Тимофеев","Сафонов","Жуков"];
const PATRO = [
  ["Сергеевич","Сергеевна"],["Иванович","Ивановна"],["Петрович","Петровна"],["Александрович","Александровна"],["Дмитриевич","Дмитриевна"],
  ["Андреевич","Андреевна"],["Алексеевич","Алексеевна"],["Михайлович","Михайловна"],["Николаевич","Николаевна"],["Владимирович","Владимировна"],
  ["Павлович","Павловна"],["Олегович","Олеговна"],["Игоревич","Игоревна"],["Романович","Романовна"],["Викторович","Викторовна"],
  ["Борисович","Борисовна"],["Константинович","Константиновна"],["Евгеньевич","Евгеньевна"],["Максимович","Максимовна"],["Степанович","Степановна"],
  ["Григорьевич","Григорьевна"],["Анатольевич","Анатольевна"],["Валерьевич","Валерьевна"],["Юрьевич","Юрьевна"],["Леонидович","Леонидовна"],
  ["Денисович","Денисовна"],["Артёмович","Артёмовна"],["Кириллович","Кирилловна"],["Тимофеевич","Тимофеевна"],["Геннадьевич","Геннадьевна"]
];

function femLast(m) {
  if (/(ов|ев|ёв|ин|ын)$/.test(m)) return m + "а";
  return m + "а";
}
function norm(s) { return String(s || "").toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim(); }
function genderOf(mid) { return /на$/.test(norm(mid)) ? "f" : "m"; }

function nameFor(g, k) {
  const firsts = g === "f" ? FEMALE_FIRST : MALE_FIRST;
  const a = (k * 9) % LAST_M.length;   // strides coprime to pool sizes => all parts vary each step
  const b = (k * 7) % firsts.length;
  const c = (k * 11) % PATRO.length;
  const last = g === "f" ? femLast(LAST_M[a]) : LAST_M[a];
  return { last, first: firsts[b], patro: PATRO[c][g === "f" ? 1 : 0] };
}

(async () => {
  const lawyers = await prisma.lawyer.findMany({ orderBy: { slug: "asc" } });
  const used = new Set();
  for (const l of lawyers) used.add(norm([l.lastName, l.firstName, l.middleName].join(" ")));

  const devs = lawyers.filter((l) => l.slug.startsWith("dev-"));
  const counter = { m: 0, f: 0 };
  const updates = [];

  for (const l of devs) {
    const g = genderOf(l.middleName);
    let pick = null;
    for (let guard = 0; guard < 100000; guard++) {
      const cand = nameFor(g, counter[g]++);
      const full = `${cand.last} ${cand.first} ${cand.patro}`;
      if (!used.has(norm(full))) { used.add(norm(full)); pick = cand; break; }
    }
    if (!pick) throw new Error("name pool exhausted for gender " + g);
    updates.push({ id: l.id, slug: l.slug, oldFio: [l.lastName, l.firstName, l.middleName].join(" "), gender: g, lastName: pick.last, firstName: pick.first, middleName: pick.patro });
  }

  // uniqueness check across ALL 216 after rename
  const finalNames = new Set();
  let dup = 0;
  for (const l of lawyers) {
    const u = updates.find((x) => x.id === l.id);
    const fio = u ? `${u.lastName} ${u.firstName} ${u.middleName}` : `${l.lastName} ${l.firstName} ${l.middleName}`;
    const k = norm(fio);
    if (finalNames.has(k)) dup++; else finalNames.add(k);
  }

  console.log("DEV_CLONES=" + devs.length + "  RENAMED=" + updates.length);
  console.log("UNIQUE_NAMES_AFTER=" + finalNames.size + " of " + lawyers.length + "  DUPLICATES=" + dup);
  console.log("\n--- примеры переименований ---");
  for (const u of updates.slice(0, 6)) console.log(`[${u.gender}] ${u.oldFio}  ->  ${u.lastName} ${u.firstName} ${u.middleName}`);

  if (APPLY) {
    const ts = Date.now();
    fs.writeFileSync(`/tmp/lawyer_names_backup_${ts}.json`,
      JSON.stringify(updates.map((u) => ({ id: u.id, oldFio: u.oldFio })), null, 0));
    let done = 0;
    for (const u of updates) {
      await prisma.lawyer.update({ where: { id: u.id }, data: { firstName: u.firstName, lastName: u.lastName, middleName: u.middleName } });
      done++;
    }
    console.log(`\nAPPLIED=${done}  backup=/tmp/lawyer_names_backup_${ts}.json`);
  } else {
    console.log("\nDRY RUN (no writes). Add --apply to rename.");
  }
  await prisma.$disconnect();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
