import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { cities, lawyers } from "../src/lib/sample-data";

const prisma = new PrismaClient();

const targetCitySlugs = [
  "moskva",
  "sankt-peterburg",
  "novosibirsk",
  "ekaterinburg",
  "kazan",
  "krasnoyarsk",
  "nizhniy-novgorod",
  "chelyabinsk",
  "ufa",
  "krasnodar",
  "samara",
  "rostov-na-donu",
  "omsk",
  "voronezh",
  "perm",
  "volgograd",
  "saratov",
  "tyumen",
  "tolyatti",
  "mahachkala",
  "barnaul",
  "izhevsk",
  "khabarovsk",
  "ulyanovsk",
  "irkutsk",
  "vladivostok",
  "yaroslavl",
  "stavropol",
  "sevastopol",
  "naberezhnye-chelny",
  "tomsk",
  "balashikha",
  "kemerovo",
  "orenburg",
  "novokuznetsk",
  "ryazan"
];

async function main() {
  assertUnique(targetCitySlugs, "target city slugs");
  assertUnique(
    lawyers.map((lawyer) => lawyer.slug),
    "lawyer slugs"
  );

  if (targetCitySlugs.length !== 36 || lawyers.length !== 36) {
    throw new Error(`Expected 36 cities and 36 lawyers, got ${targetCitySlugs.length} cities and ${lawyers.length} lawyers.`);
  }

  await migrateNizhnyNovgorodSlug();

  const targetCities = targetCitySlugs.map((slug) => {
    const city = cities.find((item) => item.slug === slug);
    if (!city) throw new Error(`Missing city in sample-data: ${slug}`);
    return city;
  });

  for (const city of targetCities) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      update: {
        name: city.name,
        namePrepositional: city.namePrepositional,
        region: city.region,
        federalDistrict: city.federalDistrict,
        isActive: true,
        seoText: city.seoText
      },
      create: {
        id: city.id,
        name: city.name,
        slug: city.slug,
        namePrepositional: city.namePrepositional,
        region: city.region,
        federalDistrict: city.federalDistrict,
        isActive: true,
        seoText: city.seoText
      }
    });
  }

  const dbCities = await prisma.city.findMany({ where: { slug: { in: targetCitySlugs } } });
  const cityBySlug = new Map(dbCities.map((city) => [city.slug, city]));
  const dbServices = await prisma.service.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
  const serviceBySlug = new Map(dbServices.map((service) => [service.slug, service]));
  if (dbServices.length === 0) throw new Error("No active services in DB.");

  const passwordHash = await bcrypt.hash(process.env.DEMO_LAWYER_PASSWORD || "dev-only-demo-lawyer-password", 10);
  let createdLawyers = 0;
  let updatedLawyers = 0;

  for (const [index, seedLawyer] of lawyers.entries()) {
    const citySlug = targetCitySlugs[index];
    const city = cityBySlug.get(citySlug);
    if (!city) throw new Error(`Missing city in DB: ${citySlug}`);

    const assignedServices = seedLawyer.serviceSlugs
      .map((slug) => serviceBySlug.get(slug))
      .filter((service): service is (typeof dbServices)[number] => Boolean(service));
    while (assignedServices.length < 3) {
      const fallbackService = dbServices[(index + assignedServices.length) % dbServices.length] ?? dbServices[0];
      if (!fallbackService) throw new Error("No active service fallback is available.");
      assignedServices.push(fallbackService);
    }
    const primaryService = assignedServices[0];
    if (!primaryService) throw new Error(`No primary service for lawyer: ${seedLawyer.slug}`);

    const existingLawyer = await prisma.lawyer.findUnique({ where: { slug: seedLawyer.slug }, select: { id: true } });
    const userId = seedLawyer.userId ?? `user-lawyer-${index + 1}`;

    await prisma.user.upsert({
      where: { id: userId },
      update: {
        role: "LAWYER",
        phone: null
      },
      create: {
        id: userId,
        email: `lawyer-${index + 1}@example.test`,
        phone: null,
        passwordHash,
        role: "LAWYER"
      }
    });

    const lawyer = existingLawyer
      ? await prisma.lawyer.update({
          where: { id: existingLawyer.id },
          data: {
            photoUrl: seedLawyer.photoUrl,
            primaryServiceId: primaryService.id,
            phone: null,
            whatsapp: null,
            telegram: null,
            email: null,
            active: true,
            blocked: false,
            isVerified: true,
            profileStatus: "APPROVED"
          },
          select: { id: true }
        })
      : await prisma.lawyer.create({
          data: {
            id: seedLawyer.id,
            userId,
            firstName: seedLawyer.firstName,
            lastName: seedLawyer.lastName,
            middleName: seedLawyer.middleName,
            slug: seedLawyer.slug,
            photoUrl: seedLawyer.photoUrl,
            status: seedLawyer.status,
            experienceYears: seedLawyer.experienceYears,
            description: seedLawyer.description,
            education: seedLawyer.education,
            licenseNumber: seedLawyer.licenseNumber,
            isVerified: true,
            rating: 0,
            reviewCount: 0,
            consultationPrice: seedLawyer.consultationPrice,
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

    if (existingLawyer) {
      updatedLawyers++;
    } else {
      createdLawyers++;
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
        officeAddress: `${city.name}, деловой центр, кабинет ${20 + index}`
      },
      create: {
        lawyerId: lawyer.id,
        cityId: city.id,
        isPrimary: true,
        officeAddress: `${city.name}, деловой центр, кабинет ${20 + index}`
      }
    });

    await prisma.lawyerProfile.upsert({
      where: { lawyerId: lawyer.id },
      update: {
        officeAddress: `${city.name}, деловой центр, кабинет ${20 + index}`
      },
      create: {
        lawyerId: lawyer.id,
        about:
          seedLawyer.profile?.about ??
          "Юрист начинает с короткого разбора ситуации, выделяет риски и предлагает практичный план дальнейших действий.",
        courtExperience: seedLawyer.profile?.courtExperience,
        officeAddress: `${city.name}, деловой центр, кабинет ${20 + index}`,
        casesCount: seedLawyer.profile?.casesCount ?? 0,
        responseTimeMinutes: seedLawyer.profile?.responseTimeMinutes ?? 60,
        consentToAdminAssistedAnswers: true,
        adminAssistedConsentAt: new Date(),
        adminAssistedConsentComment: "Granted for dev lawyer profile coverage."
      }
    });

    for (const [serviceIndex, service] of assignedServices.entries()) {
      await prisma.lawyerService.upsert({
        where: { lawyerId_serviceId: { lawyerId: lawyer.id, serviceId: service.id } },
        update: {
          isPrimary: serviceIndex === 0
        },
        create: {
          lawyerId: lawyer.id,
          serviceId: service.id,
          isPrimary: serviceIndex === 0,
          proofLevel: 1
        }
      });
    }

    for (const item of seedLawyer.priceItems ?? []) {
      const service = dbServices.find((row) => row.id === item.serviceId);
      if (!service) continue;
      await prisma.priceItem.upsert({
        where: { id: item.id },
        update: {
          serviceId: item.serviceId,
          title: item.title,
          priceFrom: item.priceFrom,
          priceTo: item.priceTo
        },
        create: {
          id: item.id,
          lawyerId: lawyer.id,
          serviceId: item.serviceId,
          title: item.title,
          priceFrom: item.priceFrom,
          priceTo: item.priceTo
        }
      });
    }
  }

  const [cityCount, lawyerCount, cityLinkGroups, targetCityCount] = await Promise.all([
    prisma.city.count(),
    prisma.lawyer.count(),
    prisma.lawyerCity.groupBy({ by: ["lawyerId"], _count: { cityId: true } }),
    prisma.city.count({ where: { slug: { in: targetCitySlugs } } })
  ]);
  const invalidCityLinks = cityLinkGroups.filter((group) => group._count.cityId !== 1).length;

  console.log(
    JSON.stringify(
      {
        cityCount,
        targetCityCount,
        lawyerCount,
        createdLawyers,
        updatedLawyers,
        invalidCityLinks
      },
      null,
      2
    )
  );
}

async function migrateNizhnyNovgorodSlug() {
  const legacy = await prisma.city.findUnique({ where: { slug: "nizhnij-novgorod" } });
  const canonical = await prisma.city.findUnique({ where: { slug: "nizhniy-novgorod" } });
  if (legacy && !canonical) {
    await prisma.city.update({
      where: { slug: "nizhnij-novgorod" },
      data: { slug: "nizhniy-novgorod" }
    });
  }
}

function assertUnique(values: string[], label: string) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length > 0) throw new Error(`Duplicate ${label}: ${Array.from(new Set(duplicates)).join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
