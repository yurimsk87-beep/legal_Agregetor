import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { getAiNavigatorAnalytics } from "@/lib/ai/navigator-analytics";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const url = new URL(request.url);
  try {
    const data = await getAiNavigatorAnalytics({
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      limit: Number(url.searchParams.get("limit")) || undefined,
      query: url.searchParams.get("query") ?? undefined
    });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[admin/ai-navigator/analytics] failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "ANALYTICS_FAILED", message: "Не удалось получить аналитику." }, { status: 500 });
  }
}
