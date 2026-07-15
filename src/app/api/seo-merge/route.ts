import { NextResponse } from "next/server";
import { z } from "zod";
import { getSeoMerge } from "@/lib/repositories";

export const runtime = "nodejs";

const querySchema = z.object({
  path: z.string().min(1).max(500)
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ path: url.searchParams.get("path") });

  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const merge = await getSeoMerge(parsed.data.path);

  return NextResponse.json({
    ok: true,
    merge
  });
}
