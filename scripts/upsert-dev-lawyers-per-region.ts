import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const generatedPrefix = "dev-city-lawyer";
const targetLawyersPerRegion = 4;
const password = process.env.DEMO_LAWYER_PASSWORD || "dev-only-demo-lawyer-password";

type CityRow = {
  id: string;
  slug: string;
  name: string;
  region: string;
};

type ServiceRow = {
  id: string;
  slug: string;
  name: string;
};

type AvatarGender = "female" | "male";

type AvatarManifestEntry = {
  slug?: unknown;
  gender?: unknown;
};

type PlannedGeneratedLawyer = {
  slug: string;
  avatarGender: AvatarGender;
  avatarGenderIndex: number;
  city: CityRow;
  region: string;
  regionIndex: number;
  slot: number;
  globalIndex: number;
  services: ServiceRow[];
  primaryService: ServiceRow;
};

const maleFirstNames = [
  ["Александр", "Алексеевич"],
  ["Денис", "Сергеевич"],
  ["Игорь", "Дмитриевич"],
  ["Владимир", "Олегович"],
  ["Петр", "Николаевич"],
  ["Андрей", "Михайлович"],
  ["Николай", "Владимирович"],
  ["Станислав", "Петрович"],
  ["Михаил", "Юрьевич"],
  ["Григорий", "Кириллович"],
  ["Роман", "Ильич"],
  ["Антон", "Борисович"]
] as const;

const femaleFirstNames = [
  ["Марина", "Викторовна"],
  ["Елизавета", "Игоревна"],
  ["Софья", "Павловна"],
  ["Анастасия", "Андреевна"],
  ["Виктория", "Романовна"],
  ["Екатерина", "Евгеньевна"],
  ["Дарья", "Максимовна"],
  ["Татьяна", "Борисовна"],
  ["Юлия", "Станиславовна"],
  ["Полина", "Аркадьевна"],
  ["Ольга", "Денисовна"],
  ["Наталья", "Валерьевна"]
] as const;

const maleLastNames = [
  "Абрамов",
  "Авдеев",
  "Агапов",
  "Аксенов",
  "Антонов",
  "Архипов",
  "Афанасьев",
  "Баранов",
  "Беспалов",
  "Блинов",
  "Бобров",
  "Быков",
  "Веденин",
  "Власов",
  "Воронцов",
  "Гаврилов",
  "Галкин",
  "Дементьев",
  "Дорофеев",
  "Дьяков",
  "Евсеев",
  "Елисеев",
  "Емельянов",
  "Жданов",
  "Жуков",
  "Зверев",
  "Зиновьев",
  "Игнатьев",
  "Ильин",
  "Карпов",
  "Кириллов",
  "Климов",
  "Колесников",
  "Кондратьев",
  "Корнеев",
  "Крылов",
  "Кудрявцев",
  "Лавров",
  "Логинов",
  "Лукин",
  "Мальцев",
  "Матвеев",
  "Медведев",
  "Назаров",
  "Нестеров",
  "Никифоров",
  "Овчинников",
  "Пахомов",
  "Поляков",
  "Прохоров",
  "Рябов",
  "Сафонов",
  "Селиванов",
  "Серебряков",
  "Ситников",
  "Суворов",
  "Терентьев",
  "Титов",
  "Уваров",
  "Фадеев",
  "Филатов",
  "Харитонов",
  "Чернов",
  "Шаповалов",
  "Широков",
  "Юдин"
];

const femaleLastNames = [
  "Аверина",
  "Агафонова",
  "Акимова",
  "Андрианова",
  "Артамонова",
  "Баженова",
  "Басова",
  "Беспалова",
  "Бирюкова",
  "Блинова",
  "Боброва",
  "Булатова",
  "Веденеева",
  "Верещагина",
  "Виноградова",
  "Власова",
  "Воронцова",
  "Гаврилова",
  "Галкина",
  "Данилова",
  "Дементьева",
  "Дорофеева",
  "Евсеева",
  "Елисеева",
  "Жданова",
  "Жукова",
  "Захарова",
  "Зверева",
  "Зимина",
  "Зиновьева",
  "Ильина",
  "Карпова",
  "Кириллова",
  "Климова",
  "Колесникова",
  "Кондратьева",
  "Корнеева",
  "Кудрявцева",
  "Лаврова",
  "Логинова",
  "Лукина",
  "Мальцева",
  "Матвеева",
  "Медведева",
  "Назарова",
  "Нестерова",
  "Никифорова",
  "Овчинникова",
  "Пахомова",
  "Полякова",
  "Прохорова",
  "Рябова",
  "Сафонова",
  "Селиванова",
  "Серебрякова",
  "Ситникова",
  "Суворова",
  "Терентьева",
  "Титова",
  "Уварова",
  "Фадеева",
  "Филатова",
  "Харитонова",
  "Чернова",
  "Шаповалова",
  "Широкова",
  "Юдина"
];

const educationVariants = [
  "Высшее юридическое образование. Дополнительная подготовка по гражданскому процессу и досудебному урегулированию споров.",
  "Высшее юридическое образование. Повышение квалификации по профильным направлениям частной практики и судебного представительства.",
  "Высшее юридическое образование. Практические курсы по договорной работе, претензионному порядку и защите прав граждан.",
  "Высшее юридическое образование. Дополнительное обучение по подготовке правовых документов и сопровождению обращений в суд."
];

async function main() {
  const [cities, services] = await Promise.all([
    prisma.city.findMany({ where: { isActive: true }, orderBy: { slug: "asc" }, select: { id: true, slug: true, name: true, region: true } }),
    prisma.service.findMany({ where: { isActive: true, parentId: null }, orderBy: { slug: "asc" }, select: { id: true, slug: true, name: true } })
  ]);

  if (!cities.length) throw new Error("No active cities found.");
  if (!services.length) throw new Error("No active parent services found.");

  const avatarGenders = loadAvatarGenderManifest();
  const citiesByRegion = groupCitiesByRegion(cities);
  const regions = [...citiesByRegion.keys()].sort((a, b) => a.localeCompare(b, "ru"));
  const manualLawyerCounts = await getActiveManualLawyerCountsByRegion(regions);
  const usedLastNames = await getActiveManualLastNames();
  const plannedLawyers = planGeneratedLawyers(regions, citiesByRegion, manualLawyerCounts, services, avatarGenders);
  const targetGeneratedSlugs = new Set(plannedLawyers.map((lawyer) => lawyer.slug));
  const missingPhotoSlugs = plannedLawyers.filter((lawyer) => !hasGeneratedPhoto(lawyer.slug)).map((lawyer) => lawyer.slug);

  if (missingPhotoSlugs.length) {
    throw new Error(`Missing generated lawyer photos: ${missingPhotoSlugs.join(", ")}`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  let created = 0;
  let updated = 0;

  for (const plannedLawyer of plannedLawyers) {
    const result = await upsertGeneratedLawyer(plannedLawyer, passwordHash, usedLastNames);
    if (result === "created") created++;
    if (result === "updated") updated++;
  }

  const disabledExtras = await prisma.lawyer.updateMany({
    where: {
      slug: { startsWith: `${generatedPrefix}-`, notIn: [...targetGeneratedSlugs] },
      active: true
    },
    data: { active: false }
  });

  const coverage = await buildRegionCoverageReport(regions);

  console.log(
    JSON.stringify(
      {
        cities: cities.length,
        regions: regions.length,
        targetLawyersPerRegion,
        plannedGeneratedLawyers: plannedLawyers.length,
        created,
        updated,
        disabledExtraGeneratedLawyers: disabledExtras.count,
        avatarGenderCounts: countAvatarGenders(plannedLawyers),
        ...coverage
      },
      null,
      2
    )
  );
}

function groupCitiesByRegion(cities: CityRow[]) {
  const grouped = new Map<string, CityRow[]>();
  for (const city of cities) {
    const regionCities = grouped.get(city.region) ?? [];
    regionCities.push(city);
    grouped.set(city.region, regionCities);
  }

  for (const regionCities of grouped.values()) {
    regionCities.sort((a, b) => a.slug.localeCompare(b.slug));
  }

  return grouped;
}

async function getActiveManualLawyerCountsByRegion(regions: string[]) {
  const counts = new Map(regions.map((region) => [region, new Set<string>()]));
  const lawyers = await prisma.lawyer.findMany({
    where: {
      active: true,
      blocked: false,
      profileStatus: "APPROVED",
      NOT: { slug: { startsWith: `${generatedPrefix}-` } }
    },
    select: {
      id: true,
      cities: { select: { city: { select: { region: true } } } }
    }
  });

  for (const lawyer of lawyers) {
    for (const region of new Set(lawyer.cities.map((item) => item.city.region))) {
      const regionLawyers = counts.get(region);
      if (regionLawyers) regionLawyers.add(lawyer.id);
    }
  }

  return new Map([...counts.entries()].map(([region, lawyerIds]) => [region, lawyerIds.size]));
}

async function getActiveManualLastNames() {
  const lawyers = await prisma.lawyer.findMany({
    where: {
      active: true,
      blocked: false,
      profileStatus: "APPROVED",
      NOT: { slug: { startsWith: `${generatedPrefix}-` } }
    },
    select: { lastName: true }
  });

  return new Set(lawyers.map((lawyer) => lawyer.lastName.trim()).filter(Boolean));
}

function planGeneratedLawyers(
  regions: string[],
  citiesByRegion: Map<string, CityRow[]>,
  manualLawyerCounts: Map<string, number>,
  services: ServiceRow[],
  avatarGenders: Map<string, AvatarGender>
) {
  const plannedLawyers: PlannedGeneratedLawyer[] = [];
  const avatarGenderIndexes: Record<AvatarGender, number> = { female: 0, male: 0 };

  for (const [regionIndex, region] of regions.entries()) {
    const regionCities = citiesByRegion.get(region) ?? [];
    const manualCount = manualLawyerCounts.get(region) ?? 0;
    const generatedNeeded = Math.max(0, targetLawyersPerRegion - manualCount);
    const serviceGroups = splitServicesForRegion(services, generatedNeeded, regionIndex);

    for (let slot = 0; slot < generatedNeeded; slot++) {
      const city = regionCities[slot % regionCities.length];
      const cityPhotoSlot = Math.floor(slot / regionCities.length) + 1;
      const slug = `${generatedPrefix}-${city.slug}-${cityPhotoSlot}`;
      const avatarGender = getRequiredAvatarGender(avatarGenders, slug);
      const avatarGenderIndex = avatarGenderIndexes[avatarGender]++;
      const assignedServices = serviceGroups[slot] ?? [services[(regionIndex + slot) % services.length] ?? services[0]];

      plannedLawyers.push({
        slug,
        avatarGender,
        avatarGenderIndex,
        city,
        region,
        regionIndex,
        slot,
        globalIndex: plannedLawyers.length,
        services: assignedServices,
        primaryService: assignedServices[0] ?? services[0]
      });
    }
  }

  return plannedLawyers;
}

function splitServicesForRegion(services: ServiceRow[], groupCount: number, regionIndex: number) {
  if (groupCount <= 0) return [];

  const rotated = services.map((_, index) => services[(index + regionIndex) % services.length]);
  const groups: ServiceRow[][] = Array.from({ length: groupCount }, () => []);

  for (const [index, service] of rotated.entries()) {
    groups[index % groupCount].push(service);
  }

  return groups;
}

async function upsertGeneratedLawyer(plannedLawyer: PlannedGeneratedLawyer, passwordHash: string, usedLastNames: Set<string>) {
  const { firstName, lastName, middleName } = buildName(plannedLawyer.avatarGender, plannedLawyer.avatarGenderIndex, usedLastNames);
  const fullName = [lastName, firstName, middleName].join(" ");
  const photoUrl = generatedLawyerPhotoUrl(plannedLawyer.slug);
  const userId = `user-${plannedLawyer.slug}`;
  const lawyerId = `lawyer-${plannedLawyer.slug}`;
  const officeAddress = `${plannedLawyer.city.name}, деловой центр, кабинет ${100 + plannedLawyer.slot}`;
  const serviceNames = plannedLawyer.services.map((service) => service.name);
  const experienceYears = 7 + ((plannedLawyer.globalIndex + plannedLawyer.regionIndex) % 16);
  const education = educationVariants[(plannedLawyer.globalIndex + plannedLawyer.slot) % educationVariants.length];
  const description = buildDescription(fullName, "юрист", experienceYears, education, plannedLawyer.primaryService.name, serviceNames);

  await prisma.user.upsert({
    where: { id: userId },
    update: {
      role: "LAWYER",
      phone: null
    },
    create: {
      id: userId,
      email: `${plannedLawyer.slug}@example.test`,
      phone: null,
      passwordHash,
      role: "LAWYER"
    }
  });

  const existing = await prisma.lawyer.findUnique({ where: { slug: plannedLawyer.slug }, select: { id: true } });
  const lawyerData = {
    firstName,
    lastName,
    middleName,
    photoUrl,
    status: "LAWYER" as const,
    experienceYears,
    description,
    education,
    licenseNumber: null,
    isVerified: true,
    rating: 0,
    reviewCount: 0,
    consultationPrice: null,
    primaryServiceId: plannedLawyer.primaryService.id,
    phone: null,
    whatsapp: null,
    telegram: null,
    email: null,
    active: true,
    blocked: false,
    profileStatus: "APPROVED" as const
  };

  const lawyer = existing
    ? await prisma.lawyer.update({
        where: { id: existing.id },
        data: lawyerData,
        select: { id: true }
      })
    : await prisma.lawyer.create({
        data: {
          id: lawyerId,
          userId,
          slug: plannedLawyer.slug,
          ...lawyerData
        },
        select: { id: true }
      });

  await prisma.lawyerCity.deleteMany({
    where: {
      lawyerId: lawyer.id,
      cityId: { not: plannedLawyer.city.id }
    }
  });

  await prisma.lawyerCity.upsert({
    where: { lawyerId_cityId: { lawyerId: lawyer.id, cityId: plannedLawyer.city.id } },
    update: {
      isPrimary: true,
      officeAddress
    },
    create: {
      lawyerId: lawyer.id,
      cityId: plannedLawyer.city.id,
      isPrimary: true,
      officeAddress
    }
  });

  await prisma.lawyerProfile.upsert({
    where: { lawyerId: lawyer.id },
    update: {
      about: description,
      specializationText: buildSpecializationText(serviceNames),
      servicesAndPricesText: "Стоимость и формат помощи уточняются после описания ситуации через платформу.",
      courtExperience: buildCourtExperience(plannedLawyer.primaryService.name),
      officeAddress,
      responseTimeMinutes: 35 + plannedLawyer.slot * 10
    },
    create: {
      lawyerId: lawyer.id,
      about: description,
      specializationText: buildSpecializationText(serviceNames),
      servicesAndPricesText: "Стоимость и формат помощи уточняются после описания ситуации через платформу.",
      reviewsText: null,
      courtExperience: buildCourtExperience(plannedLawyer.primaryService.name),
      officeAddress,
      casesCount: 0,
      responseTimeMinutes: 35 + plannedLawyer.slot * 10,
      consentToAdminAssistedAnswers: false
    }
  });

  await prisma.lawyerService.deleteMany({
    where: {
      lawyerId: lawyer.id,
      serviceId: { notIn: plannedLawyer.services.map((service) => service.id) }
    }
  });

  for (const [serviceIndex, service] of plannedLawyer.services.entries()) {
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

  return existing ? "updated" : "created";
}

function buildName(avatarGender: AvatarGender, avatarGenderIndex: number, usedLastNames: Set<string>) {
  if (avatarGender === "female") {
    const firstName = femaleFirstNames[avatarGenderIndex % femaleFirstNames.length];
    return {
      firstName: firstName[0],
      middleName: firstName[1],
      lastName: takeUniqueLastName(femaleLastNames, usedLastNames, "female")
    };
  }

  const firstName = maleFirstNames[avatarGenderIndex % maleFirstNames.length];
  return {
    firstName: firstName[0],
    middleName: firstName[1],
    lastName: takeUniqueLastName(maleLastNames, usedLastNames, "male")
  };
}

function takeUniqueLastName(lastNames: readonly string[], usedLastNames: Set<string>, gender: AvatarGender) {
  const lastName = lastNames.find((candidate) => !usedLastNames.has(candidate));

  if (!lastName) {
    throw new Error(`Not enough unique ${gender} last names for generated lawyer profiles.`);
  }

  usedLastNames.add(lastName);
  return lastName;
}

function loadAvatarGenderManifest() {
  const manifestPath = join(process.cwd(), "public", "generated-lawyer-photos", "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as AvatarManifestEntry[];

  if (!Array.isArray(manifest)) {
    throw new Error("Generated lawyer photo manifest must be a JSON array.");
  }

  const genders = new Map<string, AvatarGender>();
  const invalidEntries: string[] = [];

  for (const [index, entry] of manifest.entries()) {
    const slug = typeof entry.slug === "string" ? entry.slug : null;
    const gender = normalizeAvatarGender(entry.gender);

    if (!slug || !gender) {
      invalidEntries.push(`#${index + 1}`);
      continue;
    }

    genders.set(slug, gender);
  }

  if (invalidEntries.length) {
    throw new Error(`Generated lawyer photo manifest has invalid gender metadata: ${invalidEntries.slice(0, 20).join(", ")}`);
  }

  return genders;
}

function getRequiredAvatarGender(avatarGenders: Map<string, AvatarGender>, slug: string) {
  const gender = avatarGenders.get(slug);
  if (!gender) throw new Error(`Missing avatar gender in generated lawyer photo manifest for ${slug}.`);
  return gender;
}

function normalizeAvatarGender(value: unknown): AvatarGender | null {
  return value === "female" || value === "male" ? value : null;
}

function countAvatarGenders(plannedLawyers: PlannedGeneratedLawyer[]) {
  return plannedLawyers.reduce(
    (counts, lawyer) => {
      counts[lawyer.avatarGender]++;
      return counts;
    },
    { female: 0, male: 0 }
  );
}

function buildDescription(fullName: string, statusLabel: string, experienceYears: number, education: string, primaryServiceName: string, serviceNames: string[]) {
  return [
    `Здравствуйте! Меня зовут ${fullName}, я ${statusLabel}. Мой профессиональный опыт - ${yearsPhrase(experienceYears)}.`,
    `Образование: ${trimFinalPunctuation(education)}.`,
    `Специализации: ${formatServiceList(serviceNames, 10)}.`,
    `Основной профиль - ${primaryServiceName}. В работе опираюсь на документы, сроки, доказательства и понятный план действий. Сначала оцениваю перспективы и риски, затем предлагаю безопасный следующий шаг без лишних обещаний и навязанных услуг.`,
    "Если ситуация требует сопровождения, помогу подготовить позицию, заявления, жалобы, претензии или иные документы, а также заранее объяснить порядок дальнейших действий и формат работы."
  ].join("\n\n");
}

function trimFinalPunctuation(value: string) {
  return value.trim().replace(/[.!?]+$/g, "");
}

function buildSpecializationText(serviceNames: string[]) {
  return `Специализации: ${formatServiceList(serviceNames, 14)}.`;
}

function buildCourtExperience(primaryServiceName: string) {
  return `Готовит позицию по направлению "${primaryServiceName}", помогает с претензиями, заявлениями, доказательствами и процессуальными документами. Представительство подключается, когда это требуется по ситуации.`;
}

function formatServiceList(serviceNames: string[], maxItems = 7) {
  const visible = serviceNames.slice(0, maxItems).join(", ");
  const hiddenCount = serviceNames.length - maxItems;
  return hiddenCount > 0 ? `${visible} и еще ${hiddenCount} направлений` : visible;
}

function yearsPhrase(years: number) {
  const mod10 = years % 10;
  const mod100 = years % 100;
  const word = mod10 === 1 && mod100 !== 11 ? "год" : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "года" : "лет";
  return `${years} ${word}`;
}

function hasGeneratedPhoto(slug: string) {
  return existsSync(join(process.cwd(), "public", "generated-lawyer-photos", `${slug}.png`));
}

function generatedLawyerPhotoUrl(slug: string) {
  return `/generated-lawyer-photos/${slug}.png?v=realistic-headshots-20260609`;
}

async function buildRegionCoverageReport(regions: string[]) {
  const publicLawyers = await prisma.lawyer.findMany({
    where: {
      active: true,
      blocked: false,
      profileStatus: "APPROVED"
    },
    select: {
      id: true,
      slug: true,
      cities: { select: { city: { select: { region: true } } } }
    }
  });

  const totalByRegion = new Map(regions.map((region) => [region, new Set<string>()]));
  const generatedByRegion = new Map(regions.map((region) => [region, new Set<string>()]));

  for (const lawyer of publicLawyers) {
    for (const region of new Set(lawyer.cities.map((item) => item.city.region))) {
      totalByRegion.get(region)?.add(lawyer.id);
      if (lawyer.slug.startsWith(`${generatedPrefix}-`)) generatedByRegion.get(region)?.add(lawyer.id);
    }
  }

  const regionCounts = Object.fromEntries([...totalByRegion.entries()].map(([region, lawyerIds]) => [region, lawyerIds.size]));
  const generatedRegionCounts = Object.fromEntries([...generatedByRegion.entries()].map(([region, lawyerIds]) => [region, lawyerIds.size]));
  const regionsWithoutFourLawyers = [...totalByRegion.entries()]
    .filter(([, lawyerIds]) => lawyerIds.size !== targetLawyersPerRegion)
    .map(([region, lawyerIds]) => ({ region, activePublicLawyers: lawyerIds.size }));

  return {
    regionCounts,
    generatedRegionCounts,
    regionsWithoutFourLawyers
  };
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
