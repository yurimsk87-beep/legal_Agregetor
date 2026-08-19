import { NextResponse } from "next/server";
import { isStoredLeadAttachment, readLeadPdfAttachment } from "@/lib/lead-attachments";
import { prisma } from "@/lib/prisma";
import { logAdminAudit } from "@/lib/request-security";
import { getCurrentAdminUser } from "@/lib/server-auth";

type RouteProps = {
  params: Promise<{ leadId: string }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const { leadId } = await params;
  const admin = await getCurrentAdminUser();
  if (!admin) return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, sourceType: true, structuredPayload: true }
  });
  if (!lead || lead.sourceType !== "DOCUMENT_REVIEW") {
    return NextResponse.json({ ok: false, message: "PDF не найден." }, { status: 404 });
  }

  const payload = lead.structuredPayload && typeof lead.structuredPayload === "object" && !Array.isArray(lead.structuredPayload)
    ? lead.structuredPayload as Record<string, unknown>
    : null;
  const attachment = payload?.documentReviewAttachment;
  if (!isStoredLeadAttachment(attachment)) {
    return NextResponse.json({ ok: false, message: "PDF не найден." }, { status: 404 });
  }

  try {
    const file = await readLeadPdfAttachment(attachment);
    await logAdminAudit({
      request,
      adminId: admin.id,
      action: "LEAD_ATTACHMENT_DOWNLOADED",
      entityType: "Lead",
      entityId: lead.id
    });
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="document-review.pdf"; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return NextResponse.json({ ok: false, message: "PDF не найден." }, { status: 404 });
  }
}
