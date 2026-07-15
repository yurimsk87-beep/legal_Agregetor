import { NextResponse } from "next/server";
import { getCities, getQuestionCategoryServices } from "@/lib/repositories";

export const runtime = "nodejs";

export async function GET() {
  const [cities, services] = await Promise.all([getCities(), getQuestionCategoryServices()]);

  return NextResponse.json({
    ok: true,
    cities: cities.map((city) => ({
      id: city.id,
      name: city.name,
      namePrepositional: city.namePrepositional,
      slug: city.slug,
      region: city.region,
      federalDistrict: city.federalDistrict,
      isActive: city.isActive,
      seoText: ""
    })),
    services: services.map((service) => ({
      id: service.id,
      name: service.name,
      slug: service.slug,
      shortDescription: service.shortDescription,
      fullDescription: "",
      isActive: service.isActive,
      parentId: service.parentId
    }))
  });
}
