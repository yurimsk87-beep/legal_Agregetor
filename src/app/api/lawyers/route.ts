import { NextResponse } from "next/server";
import { getLawyers } from "@/lib/repositories";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lawyers = await getLawyers({
    citySlug: url.searchParams.get("city") ?? undefined,
    serviceSlug: url.searchParams.get("service") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    online: url.searchParams.get("online") === "true",
    price: url.searchParams.get("price") ?? undefined
  });

  return NextResponse.json({
    ok: true,
    canonicalPolicy: "All query-param filter URLs must be noindex and canonicalize to the clean landing page.",
    items: lawyers.map((lawyer) => ({
      id: lawyer.id,
      fullName: [lawyer.lastName, lawyer.firstName, lawyer.middleName].filter(Boolean).join(" "),
      slug: lawyer.slug,
      status: lawyer.status,
      isVerified: lawyer.isVerified,
      consultationPrice: lawyer.consultationPrice,
      cities: lawyer.cities.map((city) => city.name),
      services: lawyer.services.slice(0, 3).map((service) => service.name)
    }))
  });
}
