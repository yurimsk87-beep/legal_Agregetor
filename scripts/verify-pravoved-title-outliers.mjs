import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const badNeedles = [
  "Как старшего брата",
  "Как на четверых",
  "Что делать , куда обращаться",
  "Как можно штраф плотит",
  "Как можна штраф плотит",
  "Как с вами связаться",
  "Как написать в макс",
  "Есть ли у Вас судебная практика"
];

const sampleNeedles = [
  "Можно ли выкупить долю брата",
  "Как оспорить отказ в единовременной выплате",
  "Как рассчитать алименты на детей от разных браков"
];

try {
  const found = [];
  for (const needle of badNeedles) {
    const rows = await prisma.question.findMany({
      where: { title: { contains: needle, mode: "insensitive" } },
      select: { publicNumber: true, title: true },
      take: 10
    });
    if (rows.length) found.push({ needle, rows });
  }

  const samples = await prisma.question.findMany({
    where: {
      OR: sampleNeedles.map((needle) => ({
        title: { contains: needle, mode: "insensitive" }
      }))
    },
    select: {
      publicNumber: true,
      title: true,
      service: { select: { name: true } }
    },
    orderBy: { publicNumber: "asc" }
  });

  const count = await prisma.question.count();
  console.log(JSON.stringify({ count, found, samples }, null, 2));
} finally {
  await prisma.$disconnect();
}
