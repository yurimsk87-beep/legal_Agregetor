import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";

// Лёгкий эндпоинт для клиентского хедера: отдаёт только роль текущего пользователя
// (без PII). Нужен, чтобы хедер не читал сессионную куку на сервере — иначе весь
// сайт рендерится динамически (no-store) и soft-404 отдаёт 200 вместо 404.
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser().catch(() => null);
  return NextResponse.json({ role: user?.role ?? null }, { headers: { "Cache-Control": "private, no-store" } });
}
