import { NextResponse } from "next/server";
import { getLawyers } from "@/lib/repositories";
import { getFamilyReviewLawyers, normalizeFamilyReviewService, selectReviewLawyers } from "@/lib/legal-review-lawyers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedService = url.searchParams.get("service")?.trim();
  const result = requestedService === "trudovye-spory"
    ? { service: "trudovye-spory", lawyers: selectReviewLawyers(await getLawyers({ serviceSlug: "trudovye-spory", take: 20 })) }
    : await getFamilyReviewLawyers(normalizeFamilyReviewService(requestedService), (filters) => getLawyers(filters));
  const lawyers = result.lawyers;

  return NextResponse.json({
    ok: true,
    service: result.service,
    items: lawyers.map((lawyer) => ({
      id: lawyer.id,
      slug: lawyer.slug,
      fullName: [lawyer.lastName, lawyer.firstName, lawyer.middleName].filter(Boolean).join(" "),
      photoUrl: lawyer.photoUrl,
      specialization: lawyer.services.map((item) => item.name).slice(0, 3).join(", ") || lawyer.profile?.specializationText || (result.service === "trudovye-spory" ? "Трудовое право" : "Семейное право"),
      cityId: lawyer.cities[0]?.id ?? null
    })),
    message: lawyers.length ? null : "Профильные юристы по этой теме сейчас не найдены. Можно задать вопрос без выбора специалиста."
  });
}
