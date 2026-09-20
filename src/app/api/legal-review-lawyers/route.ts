import { NextResponse } from "next/server";
import { getLawyers } from "@/lib/repositories";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const service = url.searchParams.get("service")?.trim() || "semeynye-spory";
  const candidates = await getLawyers({ serviceSlug: service, take: 20 });

  // The current production schema has no presence/last-seen field. Never infer
  // Online from profile status, response time, a hash, or recent DB updates.
  const online = candidates.filter((lawyer) => (lawyer as typeof lawyer & { presenceVerified?: boolean }).presenceVerified === true).slice(0, 4);

  return NextResponse.json({
    ok: true,
    availabilityVerified: true,
    items: online.map((lawyer) => ({
      id: lawyer.id,
      slug: lawyer.slug,
      fullName: [lawyer.lastName, lawyer.firstName, lawyer.middleName].filter(Boolean).join(" "),
      photoUrl: lawyer.photoUrl,
      specialization: lawyer.services.map((item) => item.name).slice(0, 3).join(", ") || lawyer.profile?.specializationText || "Семейное право",
      cityId: lawyer.cities[0]?.id ?? null,
      online: true
    })),
    message: online.length ? null : "Подтверждённых Online-профилей по этой теме сейчас нет. Можно задать вопрос без выбора специалиста."
  });
}
