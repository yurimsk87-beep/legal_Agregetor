import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { draftFromLawyer, normalizeProfileDraft, profileContainsForbiddenContacts } from "@/lib/lawyer-cabinet-profile";
import { getCurrentLawyerUser } from "@/lib/server-auth";
import {
  checkRateLimit,
  clientKey,
  logModeration,
  payloadTooLargeResponse,
  readJsonWithLimit,
  rejectCrossOrigin,
  RequestPayloadTooLargeError
} from "@/lib/request-security";

export const runtime = "nodejs";

export async function GET() {
  const lawyer = await getSessionLawyer();
  if (!lawyer) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    profile: draftFromLawyer(lawyer),
    status: lawyer.profileStatus,
    savedAt: lawyer.profile?.updatedAt ?? lawyer.updatedAt,
    submittedAt: lawyer.profile?.submittedAt ?? null
  });
}

export async function PATCH(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const lawyer = await getSessionLawyer();
  if (!lawyer) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const limited = checkRateLimit({ key: `lawyer-profile:${clientKey(request, lawyer.userId)}`, limit: 20, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await readJsonWithLimit(request, 48_000);
  } catch (error) {
    if (error instanceof RequestPayloadTooLargeError) return payloadTooLargeResponse();
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const submit = Boolean(isRecord(body) && body.submit);
  const profile = normalizeProfileDraft(isRecord(body) ? body.profile : null, draftFromLawyer(lawyer));
  profile.legalStatus = lawyer.status === "ADVOCATE" ? "Адвокат" : "Юрист";

  if (submit && profileContainsForbiddenContacts(profile)) {
    return NextResponse.json(
      {
        ok: false,
        message: "В публичном профиле нельзя указывать прямые контакты. Уберите телефон, email, ссылки или мессенджеры."
      },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.lawyer.update({
      where: { id: lawyer.id },
      data: {
        firstName: lawyer.firstName,
        lastName: lawyer.lastName,
        middleName: lawyer.middleName,
        slug: lawyer.slug,
        photoUrl: lawyer.photoUrl,
        status: lawyer.status,
        experienceYears: lawyer.experienceYears,
        description: lawyer.description,
        education: lawyer.education,
        profileStatus: submit && lawyer.profileStatus !== "APPROVED" ? "PENDING" : lawyer.profileStatus,
        profile: {
          upsert: {
            create: {
              about: profile.about || profile.cardDescription,
              courtExperience: profile.courtCases.map((item) => `${item.title}: ${item.result}`).join("\n") || null,
              casesCount: profile.courtCases.length,
              draftData: profile as unknown as Prisma.InputJsonValue,
              submittedAt: submit ? new Date() : null
            },
            update: {
              about: profile.about || profile.cardDescription,
              courtExperience: profile.courtCases.map((item) => `${item.title}: ${item.result}`).join("\n") || null,
              casesCount: profile.courtCases.length,
              draftData: profile as unknown as Prisma.InputJsonValue,
              submittedAt: submit ? new Date() : lawyer.profile?.submittedAt ?? null
            }
          }
        }
      },
      include: {
        profile: true,
        cities: { include: { city: true } }
      }
    });

    if (submit) {
      await logModeration({
        entityType: "LawyerProfile",
        entityId: lawyer.id,
        action: "SUBMITTED",
        reason: "LAWYER_PROFILE_SUBMITTED",
        moderatorId: lawyer.userId,
        actorRole: "LAWYER",
        beforeSnapshot: { previousProfileStatus: lawyer.profileStatus },
        afterSnapshot: { newProfileStatus: submit ? "PENDING" : updated.profileStatus }
      });
    }

    return NextResponse.json({
      ok: true,
      profile: draftFromLawyer(updated),
      status: submit ? "PENDING" : updated.profileStatus,
      submittedAt: updated.profile?.submittedAt ?? null,
      message: submit
        ? "Профиль отправлен на модерацию. После проверки он появится в каталоге юристов."
        : "Черновик профиля сохранен."
    });
  } catch (error) {
    if (isUniqueSlugError(error)) {
      return NextResponse.json({ ok: false, message: "Такой slug уже занят другим юристом." }, { status: 409 });
    }

    console.error("Lawyer profile save failed", error);
    return NextResponse.json({ ok: false, message: "Не удалось сохранить профиль." }, { status: 500 });
  }
}

async function getSessionLawyer() {
  const user = await getCurrentLawyerUser();
  if (!user) return null;

  return prisma.lawyer.findUnique({
    where: { userId: user.id },
    include: {
      profile: true,
      cities: { include: { city: true } }
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isUniqueSlugError(error: unknown) {
  return isRecord(error) && error.code === "P2002";
}

