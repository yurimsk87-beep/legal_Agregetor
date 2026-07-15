import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const generatedPrefix = "dev-city-lawyer";
const lawyersPerCity = 5;
const password = process.env.DEMO_LAWYER_PASSWORD || "dev-only-demo-lawyer-password";

const firstNames = [
  "Александр",
  "Марина",
  "Денис",
  "Елизавета",
  "Игорь",
  "София",
  "Владимир",
  "Анастасия",
  "Петр",
  "Виктория",
  "Андрей",
  "Екатерина",
  "Николай",
  "Дарья",
  "Станислав",
  "Татьяна",
  "Михаил",
  "Юлия",
  "Григорий",
  "Полина"
];

const lastNames = [
  "Савельев",
  "Мельникова",
  "Орлов",
  "Крылова",
  "Фролов",
  "Романова",
  "Богданов",
  "Сергеева",
  "Тихонов",
  "Лазарева",
  "Филиппов",
  "Гордеева",
  "Панов",
  "Калинина",
  "Миронов",
  "Ефимова",
  "Анисимов",
  "Белоусова",
  "Комаров",
  "Селезнева"
];

const middleNames = [
  "Алексеевич",
  "Викторовна",
  "Сергеевич",
  "Игоревна",
  "Дмитриевич",
  "Павловна",
  "Олегович",
  "Андреевна",
  "Николаевич",
  "Романовна",
  "Михайлович",
  "Евгеньевна",
  "Владимирович",
  "Максимовна",
  "Петрович",
  "Борисовна",
  "Юрьевич",
  "Станиславовна",
  "Кириллович",
  "Аркадьевна"
];

async function main() {
  const [cities, services] = await Promise.all([
    prisma.city.findMany({ where: { isActive: true }, orderBy: { slug: "asc" } }),
    prisma.service.findMany({ where: { isActive: true, parentId: null }, orderBy: { slug: "asc" } })
  ]);

  if (cities.length !== 36) throw new Error(`Expected 36 active cities, got ${cities.length}.`);
  if (services.length === 0) throw new Error("No active parent services found.");

  const passwordHash = await bcrypt.hash(password, 10);
  let created = 0;
  let updated = 0;

  for (const [cityIndex, city] of cities.entries()) {
    const serviceGroups = splitServicesForCity(services, cityIndex);

    for (let slot = 0; slot < lawyersPerCity; slot++) {
      const globalIndex = cityIndex * lawyersPerCity + slot;
      const firstName = firstNames[globalIndex % firstNames.length];
      const lastName = lastNames[globalIndex % lastNames.length];
      const middleName = middleNames[globalIndex % middleNames.length];
      const slug = `${generatedPrefix}-${city.slug}-${slot + 1}`;
      const photoUrl = generatedLawyerPhotoUrl(slug);
      const userId = `user-${slug}`;
      const lawyerId = `lawyer-${slug}`;
      const assignedServices = serviceGroups[slot] ?? [services[globalIndex % services.length] ?? services[0]];
      const primaryService = assignedServices[0] ?? services[0];

      await prisma.user.upsert({
        where: { id: userId },
        update: {
          role: "LAWYER",
          phone: null
        },
        create: {
          id: userId,
          email: `${slug}@example.test`,
          phone: null,
          passwordHash,
          role: "LAWYER"
        }
      });

      const existing = await prisma.lawyer.findUnique({ where: { slug }, select: { id: true } });
      const lawyer = existing
        ? await prisma.lawyer.update({
            where: { id: existing.id },
            data: {
              firstName,
              lastName,
              middleName,
              photoUrl,
              status: "LAWYER",
              experienceYears: 6 + (globalIndex % 17),
              description: buildDescription(lastName, firstName, city.name, primaryService.name),
              education: "Высшее юридическое образование, повышение квалификации по профильным направлениям практики.",
              licenseNumber: null,
              isVerified: true,
              rating: 0,
              reviewCount: 0,
              consultationPrice: null,
              primaryServiceId: primaryService.id,
              phone: null,
              whatsapp: null,
              telegram: null,
              email: null,
              active: true,
              blocked: false,
              profileStatus: "APPROVED"
            },
            select: { id: true }
          })
        : await prisma.lawyer.create({
            data: {
              id: lawyerId,
              userId,
              firstName,
              lastName,
              middleName,
              slug,
              photoUrl,
              status: "LAWYER",
              experienceYears: 6 + (globalIndex % 17),
              description: buildDescription(lastName, firstName, city.name, primaryService.name),
              education: "Высшее юридическое образование, повышение квалификации по профильным направлениям практики.",
              licenseNumber: null,
              isVerified: true,
              rating: 0,
              reviewCount: 0,
              consultationPrice: null,
              primaryServiceId: primaryService.id,
              phone: null,
              whatsapp: null,
              telegram: null,
              email: null,
              active: true,
              blocked: false,
              profileStatus: "APPROVED"
            },
            select: { id: true }
          });

      if (existing) {
        updated++;
      } else {
        created++;
      }

      await prisma.lawyerCity.deleteMany({
        where: {
          lawyerId: lawyer.id,
          cityId: { not: city.id }
        }
      });

      await prisma.lawyerCity.upsert({
        where: { lawyerId_cityId: { lawyerId: lawyer.id, cityId: city.id } },
        update: {
          isPrimary: true,
          officeAddress: `${city.name}, деловой центр, кабинет ${100 + slot}`
        },
        create: {
          lawyerId: lawyer.id,
          cityId: city.id,
          isPrimary: true,
          officeAddress: `${city.name}, деловой центр, кабинет ${100 + slot}`
        }
      });

      await prisma.lawyerProfile.upsert({
        where: { lawyerId: lawyer.id },
        update: {
          about: buildAbout(city.name, assignedServices.map((service) => service.name)),
          officeAddress: `${city.name}, деловой центр, кабинет ${100 + slot}`,
          responseTimeMinutes: 40 + slot * 10
        },
        create: {
          lawyerId: lawyer.id,
          about: buildAbout(city.name, assignedServices.map((service) => service.name)),
          courtExperience: "Готовит документы, сопровождает переговоры и представляет позицию клиента в суде, когда это требуется по ситуации.",
          officeAddress: `${city.name}, деловой центр, кабинет ${100 + slot}`,
          casesCount: 0,
          responseTimeMinutes: 40 + slot * 10,
          consentToAdminAssistedAnswers: false
        }
      });

      await prisma.lawyerService.deleteMany({
        where: {
          lawyerId: lawyer.id,
          serviceId: { notIn: assignedServices.map((service) => service.id) }
        }
      });

      for (const [serviceIndex, service] of assignedServices.entries()) {
        await prisma.lawyerService.upsert({
          where: { lawyerId_serviceId: { lawyerId: lawyer.id, serviceId: service.id } },
          update: {
            isPrimary: serviceIndex === 0,
            proofLevel: 1
          },
          create: {
            lawyerId: lawyer.id,
            serviceId: service.id,
            isPrimary: serviceIndex === 0,
            proofLevel: 1
          }
        });
      }
    }
  }

  const coverage = await buildCoverageReport(cities, services);

  console.log(
    JSON.stringify(
      {
        cities: cities.length,
        services: services.length,
        lawyersPerCity,
        expectedGeneratedLawyers: cities.length * lawyersPerCity,
        created,
        updated,
        ...coverage
      },
      null,
      2
    )
  );
}

function splitServicesForCity<T>(services: T[], cityIndex: number) {
  const rotated = services.map((_, index) => services[(index + cityIndex) % services.length]);
  const groups: T[][] = Array.from({ length: lawyersPerCity }, () => []);
  for (const [index, service] of rotated.entries()) {
    groups[index % lawyersPerCity].push(service);
  }
  return groups;
}

async function buildCoverageReport(cities: { id: string; slug: string }[], services: { id: string; slug: string }[]) {
  const generatedLawyerCount = await prisma.lawyer.count({ where: { slug: { startsWith: `${generatedPrefix}-` } } });
  const cityCounts = await prisma.city.findMany({
    where: { id: { in: cities.map((city) => city.id) } },
    select: {
      slug: true,
      _count: {
        select: {
          lawyers: {
            where: {
              lawyer: {
                slug: { startsWith: `${generatedPrefix}-` }
              }
            }
          }
        }
      }
    }
  });
  const citiesWithoutFiveGenerated = cityCounts
    .filter((city) => city._count.lawyers !== lawyersPerCity)
    .map((city) => ({ slug: city.slug, generatedLawyers: city._count.lawyers }));

  const missingCityServiceCoverage: string[] = [];
  for (const city of cities) {
    const serviceIds = new Set(
      (
        await prisma.lawyerService.findMany({
          where: {
            serviceId: { in: services.map((service) => service.id) },
            lawyer: {
              slug: { startsWith: `${generatedPrefix}-` },
              cities: { some: { cityId: city.id } }
            }
          },
          select: { serviceId: true }
        })
      ).map((item) => item.serviceId)
    );

    for (const service of services) {
      if (!serviceIds.has(service.id)) missingCityServiceCoverage.push(`${city.slug}:${service.slug}`);
    }
  }

  return {
    generatedLawyerCount,
    citiesWithoutFiveGenerated,
    missingCityServiceCoverageCount: missingCityServiceCoverage.length,
    missingCityServiceCoverage: missingCityServiceCoverage.slice(0, 20)
  };
}

function buildDescription(lastName: string, firstName: string, cityName: string, serviceName: string) {
  return `${lastName} ${firstName} ведет консультации в городе ${cityName} по направлению «${serviceName}» и смежным юридическим вопросам. Контакты специалиста не публикуются, рейтинг и отзывы не имитируются, обращение проходит только через модерируемый маршрут платформы.`;
}

function buildAbout(cityName: string, serviceNames: string[]) {
  return `Юрист принимает задачи из города ${cityName} по направлениям: ${serviceNames.join(", ")}. Первичный маршрут остается Q&A-first: пользователь описывает ситуацию, получает модерируемый ответ и только затем при необходимости создает приватное обращение через платформу.`;
}

function generatedLawyerPhotoUrl(slug: string) {
  return `/generated-lawyer-photos/${slug}.png?v=realistic-headshots-20260609`;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
