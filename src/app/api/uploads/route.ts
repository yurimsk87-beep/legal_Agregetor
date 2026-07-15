import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import {
  StorageConfigurationError,
  StorageValidationError,
  storageService,
  type UploadKind
} from "@/lib/storage";
import { checkRateLimit, clientKey, payloadTooLargeResponse, rejectCrossOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

const uploadKinds = new Set<UploadKind>(["lawyer-photo", "document", "generic"]);

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "LAWYER")) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const limited = checkRateLimit({ key: `upload:${clientKey(request, user.id)}`, limit: 10, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 12 * 1024 * 1024) {
    return payloadTooLargeResponse();
  }

  if (!request.headers.get("content-type")?.toLowerCase().includes("multipart/form-data")) {
    return NextResponse.json({ ok: false, message: "Expected multipart/form-data." }, { status: 415 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!isUploadFile(file)) {
      return NextResponse.json({ ok: false, message: "File field is required." }, { status: 400 });
    }

    const kind = parseUploadKind(formData.get("kind"));
    if (user.role === "LAWYER" && kind !== "lawyer-photo") {
      return NextResponse.json({ ok: false, message: "Lawyers can upload only profile photos." }, { status: 403 });
    }

    const prefix = parseOptionalString(formData.get("prefix"));
    const result = await storageService.uploadFile({ file, kind, prefix });

    return NextResponse.json({ ok: true, file: result }, { status: 201 });
  } catch (error) {
    if (error instanceof StorageValidationError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    if (error instanceof StorageConfigurationError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    console.error("Upload failed", error);
    return NextResponse.json({ ok: false, message: "Upload failed." }, { status: 500 });
  }
}

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "arrayBuffer" in value &&
      "size" in value &&
      "type" in value &&
      typeof value.arrayBuffer === "function"
  );
}

function parseUploadKind(value: FormDataEntryValue | null): UploadKind {
  if (typeof value === "string" && uploadKinds.has(value as UploadKind)) {
    return value as UploadKind;
  }

  return "generic";
}

function parseOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}
