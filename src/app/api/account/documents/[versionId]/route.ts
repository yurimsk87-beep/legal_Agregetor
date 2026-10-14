import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { decryptSavedDocument } from "@/lib/saved-document-crypto";
import { rejectCrossOrigin } from "@/lib/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
type Context = { params: Promise<{ versionId: string }> };
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function GET(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user || user.role !== "USER") return NextResponse.json({ message: "Необходимо войти." }, { status: 401, headers });
  const { versionId } = await params;
  if (!isUuid(versionId)) return NextResponse.json({ message: "Версия не найдена." }, { status: 404, headers });
  try {
    const record = await prisma.savedLegalDocument.findFirst({
      where: { versionId, userId: user.id },
      select: { encryptedPayload: true }
    });
    if (!record) return NextResponse.json({ message: "Версия не найдена." }, { status: 404, headers });
    const documentResult = decryptSavedDocument(record.encryptedPayload, user.id, versionId);
    return NextResponse.json({ documentResult }, { headers });
  } catch {
    return NextResponse.json({ message: "Не удалось открыть версию." }, { status: 503, headers });
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const origin = rejectCrossOrigin(request);
  if (origin) return origin;
  const user = await getCurrentUser();
  if (!user || user.role !== "USER") return NextResponse.json({ message: "Необходимо войти." }, { status: 401, headers });
  const { versionId } = await params;
  if (!isUuid(versionId)) return NextResponse.json({ message: "Версия не найдена." }, { status: 404, headers });
  try {
    const deleted = await prisma.savedLegalDocument.deleteMany({ where: { versionId, userId: user.id } });
    if (!deleted.count) return NextResponse.json({ message: "Версия не найдена." }, { status: 404, headers });
    return NextResponse.json({ deleted: true }, { headers });
  } catch {
    return NextResponse.json({ message: "Не удалось удалить версию." }, { status: 503, headers });
  }
}
