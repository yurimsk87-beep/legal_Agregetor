import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  articles,
  calculators,
  cases,
  checklists,
  cities,
  documentTemplates,
  faqItems,
  legalScenarios,
  lawyers,
  nextBestActions,
  questions,
  seoPages,
  services,
  videoPages
} from "../src/lib/sample-data";

const prisma = new PrismaClient();

async function main() {
  const environment = process.env.NODE_ENV || "development";
  const isProduction = environment === "production";
  const allowDemoData = environment === "development" || environment === "test";
  const adminEmail = readRequiredAdminEnv("ADMIN_EMAIL", isProduction);
  const adminPassword = readRequiredAdminEnv("ADMIN_PASSWORD", isProduction);
  const adminPasswordHash = adminEmail && adminPassword ? await bcrypt.hash(validateAdminPassword(adminPassword), 10) : null;
  const demoLawyerPasswordHash = allowDemoData ? await bcrypt.hash(process.env.DEMO_LAWYER_PASSWORD || "dev-only-demo-lawyer-password", 10) : null;

  await clearData();

  if (adminEmail && adminPasswordHash) {
    await prisma.user.create({
      data: {
        id: "user-admin",
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: "ADMIN"
      }
    });
  } else {
    console.warn("ADMIN_EMAIL and ADMIN_PASSWORD are not set. Skipping ADMIN user creation for non-production seed.");
  }

  await prisma.practiceArea.create({
    data: {
      id: "practice-general",
      name: "Основные юридические услуги",
      slug: "osnovnye-yuridicheskie-uslugi",
      description: "Коммерческие и информационные кластеры юридического агрегатора."
    }
  });

  await prisma.city.createMany({
    data: cities.map((city) => ({
      id: city.id,
      name: city.name,
      slug: city.slug,
      namePrepositional: city.namePrepositional,
      region: city.region,
      federalDistrict: city.federalDistrict,
      isActive: city.isActive,
      seoText: city.seoText
    })),
    skipDuplicates: true
  });

  await prisma.service.createMany({
    data: services.map((service) => ({
      id: service.id,
      name: service.name,
      slug: service.slug,
      shortDescription: service.shortDescription,
      fullDescription: service.fullDescription,
      isActive: service.isActive,
      parentId: service.parentId,
      practiceAreaId: "practice-general"
    })),
    skipDuplicates: true
  });

  if (!allowDemoData) {
    console.log(`Seed completed for ${environment}: admin/config data only. Demo LAWYER users and sample content were skipped.`);
    return;
  }

  for (const lawyer of lawyers) {
    await prisma.user.create({
      data: {
        id: lawyer.userId,
        email: `lawyer-${lawyer.id}@example.test`,
        phone: lawyer.phone,
        passwordHash: demoLawyerPasswordHash!,
        role: "LAWYER"
      }
    });

    await prisma.lawyer.create({
      data: {
        id: lawyer.id,
        userId: lawyer.userId!,
        firstName: lawyer.firstName,
        lastName: lawyer.lastName,
        middleName: lawyer.middleName,
        slug: lawyer.slug,
        photoUrl: lawyer.photoUrl,
        status: lawyer.status,
        experienceYears: lawyer.experienceYears,
        description: lawyer.description,
        education: lawyer.education,
        licenseNumber: lawyer.licenseNumber,
        isVerified: lawyer.isVerified,
        profileStatus: lawyer.isVerified ? "APPROVED" : "PENDING",
        active: true,
        blocked: false,
        // Demo profiles must not create client-review trust signals.
        rating: 0,
        reviewCount: 0,
        consultationPrice: lawyer.consultationPrice,
        primaryServiceId: lawyer.primaryServiceId,
        phone: lawyer.phone,
        whatsapp: lawyer.whatsapp,
        telegram: lawyer.telegram,
        email: lawyer.email,
        profile: lawyer.profile
          ? {
              create: {
                about: lawyer.profile.about,
                courtExperience: lawyer.profile.courtExperience,
                officeAddress: lawyer.profile.officeAddress,
                casesCount: lawyer.profile.casesCount,
                responseTimeMinutes: lawyer.profile.responseTimeMinutes
              }
            }
          : undefined,
        services: {
          create: lawyer.services.map((service, index) => ({
            serviceId: service.id,
            isPrimary: index === 0,
            proofLevel: lawyer.isVerified ? 2 : 1
          }))
        },
        cities: {
          create: lawyer.cities.map((city, index) => ({
            cityId: city.id,
            isPrimary: index === 0,
            officeAddress: lawyer.profile?.officeAddress
          }))
        },
        priceItems: {
          create: lawyer.priceItems?.map((item) => ({
            id: item.id,
            serviceId: item.serviceId,
            title: item.title,
            priceFrom: item.priceFrom,
            priceTo: item.priceTo
          }))
        },
        verifications: {
          create: lawyer.verifications?.map((item) => ({
            id: item.id,
            type: item.type as any,
            status: item.status as any,
            comment: item.comment
          }))
        }
      }
    });
  }

  for (const question of questions) {
    await prisma.question.create({
      data: {
        id: question.id,
        title: question.title,
        slug: question.slug,
        text: question.text,
        cityId: question.cityId,
        serviceId: question.serviceId,
        userName: question.userName,
        userEmail: question.userEmail,
        isAnonymous: question.authorType === "GUEST" || question.isAnonymous === true,
        summary: question.summary,
        status: question.status ?? "PUBLISHED",
        qualityStatus: question.qualityStatus ?? "APPROVED",
        isIndexable: question.isIndexable,
        isDuplicate: question.isDuplicate ?? false,
        trustScore: question.trustScore ?? (question.isIndexable ? 90 : 0),
        publishedAt: question.publishedAt,
        createdAt: question.createdAt,
        answers: {
          create: question.answers.map((answer) => ({
            id: answer.id,
            lawyerId: answer.lawyerId,
            text: answer.text,
            authorType: answer.authorType ?? "LAWYER",
            status: answer.status ?? "PUBLISHED",
            qualityStatus: answer.qualityStatus ?? "APPROVED",
            containsContactAttempt: answer.containsContactAttempt ?? false,
            publishedByAdmin: answer.publishedByAdmin ?? true,
            answerQualityScore: answer.answerQualityScore ?? 80,
            isModerated: answer.isModerated,
            publishedAt: answer.publishedAt,
            createdAt: answer.createdAt
          }))
        }
      }
    });
  }

  await prisma.answerQualityScore.createMany({
    data: questions.flatMap((question) =>
      question.answers.map((answer) => ({
        answerId: answer.id,
        lawyerId: answer.lawyerId,
        completeness: 18,
        clarity: 17,
        legalBasis: 15,
        noSpam: 20,
        usefulness: 18,
        totalScore: answer.answerQualityScore ?? 88
      }))
    ),
    skipDuplicates: true
  });

  for (const article of articles) {
    const status = article.status ?? (article.isIndexable ? "APPROVED" : "DRAFT");

    await prisma.article.create({
      data: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        shortAnswer: article.shortAnswer,
        importantPoints: article.importantPoints ?? [],
        steps: article.steps ?? [],
        documents: article.documents ?? [],
        deadlines: article.deadlines ?? [],
        prices: article.prices ?? [],
        risks: article.risks ?? [],
        mistakes: article.mistakes ?? [],
        serviceId: article.serviceId,
        cityId: article.cityId,
        authorId: article.authorId,
        reviewedByLawyerId: article.reviewedByLawyerId,
        status,
        isIndexable: status === "APPROVED" ? article.isIndexable : false,
        contentFreshness: article.contentFreshness ?? "FRESH",
        publishedAt: article.publishedAt,
        reviewedAt: article.reviewedAt
      }
    });
  }

  await prisma.faqItem.createMany({
    data: faqItems.map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      entityType: faq.entityType,
      entityId: faq.entityId,
      sortOrder: faq.sortOrder
    })),
    skipDuplicates: true
  });

  await prisma.seoPage.createMany({
    data: seoPages.map((page) => ({
      id: page.id,
      type: page.type,
      slug: page.slug,
      cityId: page.cityId,
      serviceId: page.serviceId,
      lawyerId: page.lawyerId,
      title: page.title,
      description: page.description,
      h1: page.h1,
      seoText: page.seoText,
      canonical: page.canonical,
      robots: page.robots ?? (page.isIndexable ? "index, follow" : "noindex, follow"),
      isIndexable: page.isIndexable,
      seoScore: page.seoScore ?? 80,
      seoMaturity: page.seoMaturity ?? "READY_FOR_INDEX",
      primaryKeyword: page.primaryKeyword,
      autoGeneratedTitle: page.title,
      autoGeneratedDescription: page.description,
      seoMode: "HYBRID"
    })),
    skipDuplicates: true
  });

  await prisma.documentTemplate.createMany({
    data: documentTemplates.map((document) => ({
      id: document.id,
      title: document.title,
      slug: document.slug,
      description: document.description,
      serviceId: document.serviceId,
      content: document.content,
      structure: document.structure,
      commonMistakes: document.commonMistakes,
      priceFrom: document.priceFrom,
      isIndexable: document.isIndexable,
      seoScore: document.seoScore,
      seoMaturity: document.seoMaturity
    })),
    skipDuplicates: true
  });

  await prisma.calculator.createMany({
    data: calculators.map((calculator) => ({
      id: calculator.id,
      title: calculator.title,
      slug: calculator.slug,
      description: calculator.description,
      formula: calculator.formula,
      example: calculator.example,
      serviceId: calculator.serviceId,
      isIndexable: calculator.isIndexable,
      seoScore: calculator.seoScore,
      seoMaturity: calculator.seoMaturity
    })),
    skipDuplicates: true
  });

  await prisma.case.createMany({
    data: cases.map((caseItem) => ({
      id: caseItem.id,
      title: caseItem.title,
      slug: caseItem.slug,
      situation: caseItem.situation,
      problem: caseItem.problem,
      lawyerActions: caseItem.lawyerActions,
      documentsPrepared: caseItem.documentsPrepared,
      result: caseItem.result,
      duration: caseItem.duration,
      clientReview: caseItem.clientReview,
      serviceId: caseItem.serviceId,
      cityId: caseItem.cityId,
      lawyerId: caseItem.lawyerId,
      isAnonymized: caseItem.isAnonymized,
      isIndexable: caseItem.isIndexable,
      seoScore: caseItem.seoScore,
      seoMaturity: caseItem.seoMaturity
    })),
    skipDuplicates: true
  });

  await prisma.checklist.createMany({
    data: checklists.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      items: item.items,
      serviceId: item.serviceId,
      isIndexable: item.isIndexable,
      seoScore: item.seoScore,
      seoMaturity: item.seoMaturity
    })),
    skipDuplicates: true
  });

  await prisma.videoPage.createMany({
    data: videoPages.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      description: item.description,
      transcript: item.transcript,
      timestamps: item.timestamps,
      relatedServiceId: item.relatedServiceId,
      relatedLawyerId: item.relatedLawyerId,
      isIndexable: item.isIndexable,
      seoScore: item.seoScore,
      seoMaturity: item.seoMaturity
    })),
    skipDuplicates: true
  });

  await prisma.legalScenario.createMany({
    data: legalScenarios.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      problem: item.problem,
      explanation: item.explanation,
      deadlines: item.deadlines,
      documents: item.documents,
      risks: item.risks,
      serviceId: item.serviceId,
      isIndexable: item.isIndexable,
      seoScore: item.seoScore,
      seoMaturity: item.seoMaturity
    })),
    skipDuplicates: true
  });

  await prisma.nextBestAction.createMany({
    data: nextBestActions.map((item) => ({
      id: item.id,
      pageType: item.pageType,
      serviceId: item.serviceId,
      cityId: item.cityId,
      actionType: item.actionType,
      title: item.title,
      url: item.url,
      priority: item.priority
    })),
    skipDuplicates: true
  });

  await seedSeoOperations();

  console.log(`Seed completed: ${cities.length} cities, ${services.length} services, ${lawyers.length} lawyers.`);
}

async function seedSeoOperations() {
  await prisma.ratingRule.createMany({
    data: [
      { title: "Проверка профиля", description: "Подтвержденные контакты и документы повышают доверие.", weight: 25 },
      { title: "Отзывы по теме", description: "Модерированные отзывы усиливают контекстный рейтинг.", weight: 25 },
      { title: "Ответы и кейсы", description: "Полезные ответы и кейсы повышают релевантность.", weight: 20 },
      { title: "Конверсия и скорость", description: "Учитываются скорость реакции и заявки.", weight: 15 }
    ],
    skipDuplicates: true
  });

  const source = await prisma.legalSource.create({
    data: {
      id: "source-gk-rf",
      title: "Гражданский кодекс РФ",
      codeName: "ГК РФ",
      articleNumber: "1110",
      url: "https://www.consultant.ru/document/cons_doc_LAW_34154/",
      lastCheckedAt: new Date("2026-05-12")
    }
  });

  await prisma.legalSource.createMany({
    data: [
      {
        id: "source-sk-rf",
        title: "Семейный кодекс РФ",
        codeName: "СК РФ",
        articleNumber: "80",
        url: "https://www.consultant.ru/document/cons_doc_LAW_8982/",
        lastCheckedAt: new Date("2026-05-12")
      },
      {
        id: "source-gpk-rf",
        title: "Гражданский процессуальный кодекс РФ",
        codeName: "ГПК РФ",
        articleNumber: "131",
        url: "https://www.consultant.ru/document/cons_doc_LAW_39570/",
        lastCheckedAt: new Date("2026-05-12")
      }
    ],
    skipDuplicates: true
  });

  await prisma.articleLegalSource.createMany({
    data: articles.slice(0, 3).map((article) => ({ articleId: article.id, legalSourceId: source.id })),
    skipDuplicates: true
  });

  await prisma.keywordDemand.createMany({
    data: [
      {
        keyword: "юрист по наследству москва",
        region: "Москва",
        monthlySearches: 1200,
        competitionLevel: 8,
        intentType: "LOCAL",
        priority: 95,
        source: "manual"
      },
      {
        keyword: "заявление на алименты",
        region: "Россия",
        monthlySearches: 2400,
        competitionLevel: 7,
        intentType: "DOCUMENT",
        priority: 90,
        source: "manual"
      }
    ],
    skipDuplicates: true
  });

  const city = cities[0];
  const service = services[4];
  await prisma.searchIntent.create({
    data: {
      id: "intent-moskva-nasledstvo",
      name: "Юрист по наследству в Москве",
      slug: "yurist-po-nasledstvu-v-moskve",
      type: "LOCAL",
      cityId: city.id,
      serviceId: service.id,
      primaryKeyword: "юрист по наследству москва",
      secondaryKeywords: ["наследственный юрист москва", "адвокат по наследству москва"],
      recommendedPageType: "CITY_SERVICE",
      priority: 95
    }
  });

  const seoPage = await prisma.seoPage.findFirst({ where: { slug: "moskva/nasledstvo", type: "CITY_SERVICE" } });
  if (seoPage) {
    await prisma.keywordTarget.create({
      data: {
        keyword: "юрист по наследству москва",
        primaryPageId: seoPage.id,
        secondaryPageIds: ["article-1"],
        intentType: "LOCAL",
        priority: 95
      }
    });

    await prisma.seoScore.create({
      data: {
        pageId: seoPage.id,
        score: seoPage.seoScore,
        hasTitle: true,
        hasDescription: true,
        hasH1: true,
        hasSeoText: true,
        hasFaq: true,
        hasLawyers: true,
        hasPrices: true,
        hasLinks: true,
        hasJsonLd: true,
        hasCta: true,
        notes: "Seed quality snapshot."
      }
    });

    await prisma.seoMaturity.create({
      data: {
        pageId: seoPage.id,
        status: "READY_FOR_INDEX",
        reason: "Есть спрос, юристы, FAQ, цены, перелинковка и CTA.",
        updatedBy: "seed"
      }
    });

    await prisma.indexStatus.create({
      data: {
        pageId: seoPage.id,
        status: "SUBMITTED",
        source: "seed"
      }
    });
  }

  await prisma.potentialSeoPage.create({
    data: {
      id: "potential-kazan-nasledstvo",
      cityId: cities[5].id,
      serviceId: service.id,
      intentId: "intent-moskva-nasledstvo",
      estimatedDemand: 220,
      lawyersCount: 3,
      contentReady: true,
      faqReady: false,
      priceBlockReady: false,
      reviewsReady: false,
      status: "IN_PROGRESS"
    }
  });

  await prisma.seoMerge.create({
    data: {
      oldUrl: "/advokat-po-nasledstvu/",
      newUrl: "/nasledstvo/",
      reason: "Потенциальная каннибализация с основной страницей услуги.",
      redirectType: "REDIRECT_301"
    }
  });

  await prisma.analyticsEvent.createMany({
    data: [
      {
        type: "CTA_CLICK",
        url: "/",
        sourcePage: "/",
        targetType: "NAVIGATION",
        targetId: "hero-pick-lawyer",
        payload: { placement: "hero" }
      },
      {
        type: "LAWYER_PROFILE_CLICK",
        url: "/[city]/[service]",
        sourcePage: "/[city]/[service]",
        targetType: "LAWYER",
        targetId: lawyers[0].id,
        payload: { placement: "city-service-listing" }
      },
      {
        type: "LEAD_CREATED",
        url: "/[slug]",
        sourcePage: "/[slug]",
        targetType: "PAGE",
        targetId: "service-nasledstvo",
        payload: { format: "online" }
      }
    ],
    skipDuplicates: true
  });

  await prisma.competitorPage.create({
    data: {
      competitorName: "manual-example",
      url: "https://example.com/moskva/nasledstvo/",
      pageType: "CITY_SERVICE",
      targetKeyword: "юрист по наследству москва",
      title: "Юристы по наследству в Москве",
      h1: "Юрист по наследству в Москве",
      wordCount: 3200,
      faqCount: 6,
      hasPrices: true,
      hasReviews: true,
      hasLawyers: true,
      notes: "Ручная запись для сравнения структуры."
    }
  });

  for (const lawyer of lawyers.slice(0, 10)) {
    await prisma.lawyerProfileQualityScore.create({
      data: {
        lawyerId: lawyer.id,
        hasPhoto: Boolean(lawyer.photoUrl),
        hasDescription: Boolean(lawyer.description),
        hasSpecialization: lawyer.services.length > 0,
        hasPrice: Boolean(lawyer.consultationPrice),
        hasReviews: false,
        hasVerification: lawyer.isVerified,
        hasContacts: Boolean(lawyer.phone || lawyer.whatsapp || lawyer.telegram),
        totalScore: lawyer.isVerified ? 86 : 68
      }
    });

  }

  // TODO: create LawyerServiceRating only from verified reviews or confirmed platform requests.
}

async function clearData() {
  await prisma.answerQualityScore.deleteMany();
  await prisma.lawyerProfileQualityScore.deleteMany();
  await prisma.lawyerServiceRating.deleteMany();
  await prisma.competitorPage.deleteMany();
  await prisma.seoMerge.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.indexStatus.deleteMany();
  await prisma.botVisit.deleteMany();
  await prisma.contentFreshness.deleteMany();
  await prisma.lawChange.deleteMany();
  await prisma.articleLegalSource.deleteMany();
  await prisma.legalSource.deleteMany();
  await prisma.seoMaturity.deleteMany();
  await prisma.seoScore.deleteMany();
  await prisma.keywordTarget.deleteMany();
  await prisma.keywordDemand.deleteMany();
  await prisma.potentialSeoPage.deleteMany();
  await prisma.searchIntent.deleteMany();
  await prisma.nextBestAction.deleteMany();
  await prisma.legalScenario.deleteMany();
  await prisma.videoPage.deleteMany();
  await prisma.checklist.deleteMany();
  await prisma.calculator.deleteMany();
  await prisma.case.deleteMany();
  await prisma.documentTemplate.deleteMany();
  await prisma.priceItem.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.ratingRule.deleteMany();
  await prisma.seoPage.deleteMany();
  await prisma.faqItem.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.article.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.review.deleteMany();
  await prisma.lawyerCity.deleteMany();
  await prisma.lawyerService.deleteMany();
  await prisma.lawyerProfile.deleteMany();
  await prisma.lawyer.deleteMany();
  await prisma.service.deleteMany();
  await prisma.practiceArea.deleteMany();
  await prisma.city.deleteMany();
  await prisma.user.deleteMany();
}

function readRequiredAdminEnv(name: "ADMIN_EMAIL" | "ADMIN_PASSWORD", isProduction: boolean) {
  const value = process.env[name]?.trim();
  if (!value && isProduction) {
    throw new Error(`${name} must be set before running prisma seed in production.`);
  }
  return value || null;
}

function validateAdminPassword(password: string) {
  const weakPasswords = new Set(["change-me", "password", "admin", "123456"]);
  const normalized = password.trim().toLowerCase();

  if (weakPasswords.has(normalized) || password.length < 12) {
    throw new Error("ADMIN_PASSWORD is too weak for seed. Use a unique password with at least 12 characters.");
  }

  return password;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
