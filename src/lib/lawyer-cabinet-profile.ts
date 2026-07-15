import type { Prisma } from "@prisma/client";
import { emptyLawyerProfile, mockLawyerProfile, type LawyerProfileDraft } from "@/lib/lawyer-cabinet-mock";

const forbiddenPattern =
  /(\+?\d[\d\s().-]{8,}\d|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|https?:\/\/|www\.|t\.me|wa\.me|@|telegram|whatsapp|viber|пишите мне|звоните мне|свяжитесь со мной|мой номер|моя почта)/i;

const profileFallback = process.env.NODE_ENV === "production" ? emptyLawyerProfile : mockLawyerProfile;

type LawyerForDraft = {
  firstName: string;
  lastName: string;
  middleName?: string | null;
  slug: string;
  photoUrl?: string | null;
  status: string;
  experienceYears: number;
  description: string;
  education: string;
  profileStatus: string;
  profile?: { about?: string | null; draftData?: Prisma.JsonValue | null } | null;
  cities?: { city?: { name: string; region: string } | null; officeAddress?: string | null; isPrimary?: boolean }[];
};

export function draftFromLawyer(lawyer: LawyerForDraft): LawyerProfileDraft {
  const primaryCity = lawyer.cities?.find((item) => item.isPrimary)?.city ?? lawyer.cities?.[0]?.city;
  const fallback: LawyerProfileDraft = {
    ...profileFallback,
    fullName: [lawyer.lastName, lawyer.firstName, lawyer.middleName].filter(Boolean).join(" "),
    slug: lawyer.slug,
    photoUrl: lawyer.photoUrl ?? "",
    city: primaryCity?.name ?? profileFallback.city,
    region: primaryCity?.region ?? profileFallback.region,
    legalStatus: lawyer.status === "ADVOCATE" ? "Адвокат" : "Юрист",
    experienceYears: lawyer.experienceYears,
    headline: lawyer.description ? lawyer.description.slice(0, 120) : profileFallback.headline,
    cardDescription: lawyer.description || profileFallback.cardDescription,
    about: lawyer.profile?.about || lawyer.description || profileFallback.about,
    education: lawyer.education
      ? [
          {
            id: "edu-current",
            institution: lawyer.education,
            faculty: "",
            specialty: "",
            qualification: "",
            graduationYear: "",
            description: ""
          }
        ]
      : profileFallback.education
  };

  return normalizeProfileDraft(lawyer.profile?.draftData, fallback);
}

export function normalizeProfileDraft(value: unknown, fallback: LawyerProfileDraft = profileFallback): LawyerProfileDraft {
  const input = isRecord(value) ? value : {};

  return {
    ...fallback,
    fullName: stringValue(input.fullName, fallback.fullName),
    slug: slugValue(input.slug, fallback.slug),
    photoUrl: stringValue(input.photoUrl, fallback.photoUrl ?? ""),
    coverUrl: stringValue(input.coverUrl, fallback.coverUrl ?? ""),
    city: stringValue(input.city, fallback.city),
    region: stringValue(input.region, fallback.region),
    legalStatus: stringValue(input.legalStatus, fallback.legalStatus),
    experienceYears: numberValue(input.experienceYears, fallback.experienceYears),
    headline: stringValue(input.headline, fallback.headline),
    cardDescription: stringValue(input.cardDescription, fallback.cardDescription),
    primarySpecializations: stringArray(input.primarySpecializations, fallback.primarySpecializations),
    additionalSpecializations: stringArray(input.additionalSpecializations, fallback.additionalSpecializations),
    workFormats: stringArray(input.workFormats, fallback.workFormats),
    about: stringValue(input.about, fallback.about),
    helpWith: stringValue(input.helpWith, fallback.helpWith),
    caseTypes: stringValue(input.caseTypes, fallback.caseTypes),
    consultationProcess: stringValue(input.consultationProcess, fallback.consultationProcess),
    advantages: stringValue(input.advantages, fallback.advantages),
    clientPreparation: stringValue(input.clientPreparation, fallback.clientPreparation),
    experience: Array.isArray(input.experience) ? input.experience.map((item, index) => ({ ...fallback.experience[0], id: `exp-${index + 1}`, ...(isRecord(item) ? item : {}) })) : fallback.experience,
    education: Array.isArray(input.education) ? input.education.map((item, index) => ({ ...fallback.education[0], id: `edu-${index + 1}`, ...(isRecord(item) ? item : {}) })) : fallback.education,
    services: Array.isArray(input.services) ? input.services.map((item, index) => ({ ...fallback.services[0], id: `service-${index + 1}`, ...(isRecord(item) ? item : {}) })) : fallback.services,
    courtCases: Array.isArray(input.courtCases) ? input.courtCases.map((item, index) => ({ ...fallback.courtCases[0], id: `case-${index + 1}`, ...(isRecord(item) ? item : {}) })) : fallback.courtCases,
    visibility: isRecord(input.visibility) ? mergeVisibility(fallback.visibility, input.visibility) : fallback.visibility
  };
}

export function profileContainsForbiddenContacts(profile: LawyerProfileDraft) {
  const values = [
    profile.cardDescription,
    profile.about,
    profile.helpWith,
    profile.caseTypes,
    profile.consultationProcess,
    profile.advantages,
    profile.clientPreparation,
    ...profile.experience.map((item) => item.description),
    ...profile.services.map((item) => item.description),
    ...profile.courtCases.map((item) => item.description)
  ];

  return values.some((value) => forbiddenPattern.test(value));
}

export function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    lastName: parts[0] ?? "Юрист",
    firstName: parts[1] ?? "ПравоПоиск",
    middleName: parts.slice(2).join(" ") || null
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" ? value.trim() : fallback;
}

function numberValue(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function stringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 40) : fallback;
}

function mergeVisibility(fallback: Record<string, boolean>, value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(fallback).map(([key, fallbackValue]) => [key, typeof value[key] === "boolean" ? value[key] : fallbackValue])
  );
}

function slugValue(value: unknown, fallback: string) {
  const raw = stringValue(value, fallback).toLowerCase();
  return raw.replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || fallback;
}
