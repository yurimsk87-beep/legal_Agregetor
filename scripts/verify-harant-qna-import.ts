import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const badTitleStarts = [
  "я ",
  "мы ",
  "мой ",
  "моя ",
  "у меня ",
  "у нас ",
  "как я ",
  "как мне ",
  "кто то ",
  "где не ",
  "будучи ",
  "ранее был ",
  "законно ли это",
  "если ",
  "так вот",
  "есть ли шанс",
  "вот в",
  "существует ли какое"
];

const badTitleContains = [
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
  "судебная практика выигранных дел",
  "как нибудь",
  "каким то образом",
  "не не д",
  "такого рода характеристику"
];

async function main() {
  const [questions, answers, indexed, samples, grouped, suspiciousAnswers] = await Promise.all([
    prisma.question.count(),
    prisma.answer.count(),
    prisma.question.count({ where: { isIndexable: true } }),
    prisma.question.findMany({
      take: 12,
      orderBy: { publicNumber: "asc" },
      select: {
        publicNumber: true,
        title: true,
        userName: true,
        service: { select: { name: true } }
      }
    }),
    prisma.question.groupBy({
      by: ["serviceId"],
      _count: { _all: true },
      orderBy: { _count: { serviceId: "desc" } },
      take: 12
    }),
    prisma.answer.findMany({
      where: {
        OR: [
          { text: { contains: "напишите мне", mode: "insensitive" } },
          { text: { contains: "поставить оценку", mode: "insensitive" } },
          { text: { contains: "донат", mode: "insensitive" } },
          { text: { contains: "pravoved.ru/lawyer", mode: "insensitive" } }
        ]
      },
      take: 20,
      select: { id: true, text: true, question: { select: { publicNumber: true, title: true } } }
    })
  ]);

  const serviceIds = grouped.map((item) => item.serviceId).filter((id): id is string => Boolean(id));
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true }
  });
  const serviceMap = new Map(services.map((service) => [service.id, service.name]));

  const allTitles = await prisma.question.findMany({ select: { publicNumber: true, title: true, service: { select: { name: true } } } });
  const suspiciousTitles = allTitles.filter((question) => {
    const title = question.title.toLowerCase().replace(/[?!.]+$/g, "");
    return (
      title.split(/\s+/).length < 5 ||
      title.split(/\s+/).length > 16 ||
      badTitleStarts.some((start) => title.startsWith(start)) ||
      badTitleContains.some((fragment) => title.includes(fragment))
    );
  });

  console.log(
    JSON.stringify(
      {
        questions,
        answers,
        indexed,
        suspiciousTitles: suspiciousTitles.slice(0, 20),
        suspiciousTitleCount: suspiciousTitles.length,
        suspiciousAnswerCount: suspiciousAnswers.length,
        samples,
        topCategories: grouped.map((item) => ({
          name: serviceMap.get(item.serviceId ?? "") ?? null,
          count: item._count._all
        }))
      },
      null,
      2
    )
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
