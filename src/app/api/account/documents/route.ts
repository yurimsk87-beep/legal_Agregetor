import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/server-auth";
import { checkRateLimit, readJsonWithLimit, rejectCrossOrigin, RequestPayloadTooLargeError } from "@/lib/request-security";
import { decryptSavedDocument, encryptSavedDocument } from "@/lib/saved-document-crypto";
import { validateSavedDocument } from "@/lib/saved-document-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const MAX_VERSIONS = 100;
// The V1 contract permits 40k Unicode chars; UTF-8 Cyrillic needs ~120k bytes.
const bodyLimit = 180_000;

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "USER") return NextResponse.json({ message: "Войдите в личный кабинет." }, { status: 401, headers });
  try {
    const rows = await prisma.savedLegalDocument.findMany({
      where: { userId: user.id },
      select: { versionId: true, encryptedPayload: true, createdAt: true },
      orderBy: { createdAt: "desc" }, take: MAX_VERSIONS
    });
    const documents = rows.map((row) => {
      const result = decryptSavedDocument(row.encryptedPayload, user.id, row.versionId);
      return {
        versionId: result.versionId,
        documentTitle: result.documentTitle,
        categorySlug: result.categorySlug, routeSlug: result.routeSlug,
        documentSlug: result.documentSlug, scenarioKey: result.scenarioKey,
        resultKind: result.resultKind, requiresLegalReview: result.requiresLegalReview,
        createdAt: row.createdAt.toISOString()
      };
    });
    return NextResponse.json({ documents }, { headers });
  } catch {
    return NextResponse.json({ message: "Архив временно недоступен. Проверьте конфигурацию хранилища." }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  const origin = rejectCrossOrigin(request);
  if (origin) return origin;
  const user = await getCurrentUser();
  if (!user || user.role !== "USER") return NextResponse.json({ message: "Войдите в личный кабинет." }, { status: 401, headers });
  const limited = checkRateLimit({ key: "save-document:" + user.id, limit: 30, windowMs: 60 * 60 * 1000 });
  if (limited) return limited;
  let body: unknown;
  try { body = await readJsonWithLimit(request, bodyLimit); }
  catch (error) {
    return NextResponse.json({ message: error instanceof RequestPayloadTooLargeError ? "Документ слишком большой." : "Некорректный JSON." }, { status: error instanceof RequestPayloadTooLargeError ? 413 : 400, headers });
  }
  const result = validateSavedDocument(
    typeof body === "object" && body !== null && "documentResult" in body ? body.documentResult : null
  );
  if (!result) return NextResponse.json({ message: "Сценарий или версия документа не подтверждены." }, { status: 400, headers });
  let encryptedPayload: string;
  try { encryptedPayload = encryptSavedDocument(result, user.id); }
  catch { return NextResponse.json({ message: "Шифрование архива не настроено." }, { status: 503, headers }); }

  try {
    const count = await prisma.savedLegalDocument.count({ where: { userId: user.id } });
    if (count >= MAX_VERSIONS) return NextResponse.json({ message: "Лимит архива: 100 версий. Удалите ненужные версии." }, { status: 409, headers });
    await prisma.savedLegalDocument.create({
      data: { versionId: result.versionId, userId: user.id, encryptedPayload }
    });
    return NextResponse.json({ versionId: result.versionId, saved: true }, { status: 201, headers });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return NextResponse.json({ message: "Эта версия уже сохранена." }, { status: 409, headers });
    }
    return NextResponse.json({ message: "Не удалось сохранить версию. Попробуйте снова." }, { status: 503, headers });
  }
}
