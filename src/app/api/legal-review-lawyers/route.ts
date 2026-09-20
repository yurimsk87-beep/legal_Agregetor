import { NextResponse } from "next/server";
import { getLawyers } from "@/lib/repositories";
import { normalizeFamilyReviewService, selectReviewLawyers } from "@/lib/legal-review-lawyers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const service = normalizeFamilyReviewService(url.searchParams.get("service")?.trim());
  const candidates = await getLawyers({ serviceSlug: service, take: 20 });
  const lawyers = selectReviewLawyers(candidates);

  return NextResponse.json({
    ok: true,
    service,
    items: lawyers.map((lawyer) => ({
      id: lawyer.id,
      slug: lawyer.slug,
      fullName: [lawyer.lastName, lawyer.firstName, lawyer.middleName].filter(Boolean).join(" "),
      photoUrl: lawyer.photoUrl,
      specialization: lawyer.services.map((item) => item.name).slice(0, 3).join(", ") || lawyer.profile?.specializationText || "Семейное право",
      cityId: lawyer.cities[0]?.id ?? null
    })),
    message: lawyers.length ? null : "Профильные юристы по этой теме сейчас не найдены. Можно задать вопрос без выбора специалиста."
  });
}
