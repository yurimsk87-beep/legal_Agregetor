import type { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { isSameOriginRequest } from "./origin-security";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  message?: string;
};

type RateBucket = {
  count: number;
  resetAt: number;
};

type AuditInput = {
  request?: Request;
  adminId?: string | null;
  actorRole?: string | null;
  requestId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeSnapshot?: unknown;
  afterSnapshot?: unknown;
};

// NOTE: counters live in process memory. In a multi-instance / serverless
// deployment each instance keeps its own bucket, so the effective limit is
// multiplied by the number of running instances and resets on cold start.
// Acceptable for the single-instance MVP, but NOT production-grade for
// horizontal scaling.
//
// Redis is already provisioned (see docker-compose `redis` service / REDIS_URL),
// but no Redis client is bundled and `checkRateLimit` is synchronous, so a
// shared store would require turning every call site async. Deferred on purpose.
// TODO(rate-limit): back this with a shared store (REDIS_URL) before scaling out.
const buckets = new Map<string, RateBucket>();
const defaultRateMessage = "Слишком много запросов. Попробуйте позже.";

let warnedAboutInMemoryLimiter = false;
function warnInMemoryLimiterOnce() {
  if (warnedAboutInMemoryLimiter || process.env.NODE_ENV !== "production") return;
  warnedAboutInMemoryLimiter = true;
  console.warn(
    "[request-security] Rate limiter uses in-memory counters and is not shared across instances. " +
      "Configure a Redis-backed limiter (REDIS_URL) before horizontal scaling."
  );
}

export function clientKey(request: Request, userId?: string | null) {
  return userId ? `user:${userId}` : `ip:${getClientIp(request)}`;
}

export function checkRateLimit(options: RateLimitOptions) {
  warnInMemoryLimiterOnce();
  const now = Date.now();
  const existing = buckets.get(options.key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(options.key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  if (existing.count >= options.limit) {
    return NextResponse.json(
      {
        ok: false,
        message: options.message ?? defaultRateMessage
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((existing.resetAt - now) / 1000)))
        }
      }
    );
  }

  existing.count += 1;
  return null;
}

export function rejectCrossOrigin(request: Request) {
  return isSameOriginRequest(request)
    ? null
    : NextResponse.json({ ok: false, message: "Cross-origin request is not allowed." }, { status: 403 });
}

export async function readJsonWithLimit<T = unknown>(request: Request, maxBytes = 16_384): Promise<T> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(length) && length > maxBytes) {
    throw new RequestPayloadTooLargeError();
  }

  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    throw new RequestPayloadTooLargeError();
  }

  return JSON.parse(text || "null") as T;
}

export class RequestPayloadTooLargeError extends Error {
  constructor() {
    super("Request payload is too large.");
    this.name = "RequestPayloadTooLargeError";
  }
}

export function payloadTooLargeResponse() {
  return NextResponse.json({ ok: false, message: "Слишком большой запрос." }, { status: 413 });
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export function auditIdentifier(scope: string, value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;

  return `${scope}:sha256:${createHash("sha256").update(normalized).digest("hex")}`;
}

export function maskEmailForAudit(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;

  const [local = "", domain = ""] = normalized.split("@", 2);
  const [domainName = "", ...domainSuffix] = domain.split(".");
  const maskedDomain = `${domainName.slice(0, 1) || "*"}***${domainSuffix.length ? `.${domainSuffix.at(-1)}` : ""}`;

  return `${local.slice(0, 1) || "*"}***@${maskedDomain}`;
}

export function getAuditRequestId(request?: Request) {
  const value = request?.headers.get("x-request-id") ?? request?.headers.get("x-correlation-id");
  return normalizeAuditRequestId(value);
}

export function normalizeAuditRequestId(value?: string | null) {
  return value && /^[a-zA-Z0-9._:-]{1,128}$/.test(value) ? value : null;
}

export async function logAdminAudit(input: AuditInput) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: input.adminId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        beforeSnapshot: toJson(input.beforeSnapshot),
        afterSnapshot: toJson(withAuditContext(input.afterSnapshot, input.adminId, input.actorRole, input.requestId ?? getAuditRequestId(input.request))),
        ip: null,
        userAgent: null
      }
    });
  } catch {
    // Audit logging must not break the user-facing flow.
  }
}

export async function logModeration(input: Omit<AuditInput, "adminId"> & { moderatorId?: string | null; reason?: string | null }) {
  try {
    await prisma.moderationLog.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId ?? "",
        action: input.action,
        reason: safeAuditCode(input.reason),
        moderatorId: input.moderatorId ?? null,
        beforeSnapshot: toJson(input.beforeSnapshot),
        afterSnapshot: toJson(withAuditContext(input.afterSnapshot, input.moderatorId, input.actorRole, input.requestId ?? getAuditRequestId(input.request)))
      }
    });
  } catch {
    // Moderation logging is best-effort in MVP.
  }
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  const sanitized = sanitizeAuditValue(value);
  return sanitized === undefined ? undefined : (JSON.parse(JSON.stringify(sanitized)) as Prisma.InputJsonValue);
}

function withAuditContext(value: unknown, actorId?: string | null, actorRole?: string | null, requestId?: string | null) {
  return {
    ...(isRecord(value) ? value : {}),
    ...(actorId ? { actorId } : {}),
    ...(actorRole ? { actorRole } : {}),
    ...(requestId ? { requestId } : {})
  };
}

function sanitizeAuditValue(value: unknown, key?: string): unknown {
  if (value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return safeAuditString(key, value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return undefined;
  if (!isRecord(value)) return undefined;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([entryKey]) => safeAuditKeys.has(entryKey))
      .map(([entryKey, entryValue]) => [entryKey, sanitizeAuditValue(entryValue, entryKey)])
      .filter(([, entryValue]) => entryValue !== undefined)
  );
}

function safeAuditString(key: string | undefined, value: string) {
  if (!key || !safeAuditStringKeys.has(key)) return undefined;
  return value.slice(0, 160);
}

function safeAuditCode(value?: string | null) {
  return value && /^[A-Z0-9_:-]{1,80}$/.test(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

const safeAuditKeys = new Set([
  "id",
  "status",
  "previousStatus",
  "newStatus",
  "oldStatus",
  "qualityStatus",
  "previousQualityStatus",
  "newQualityStatus",
  "outcome",
  "previousOutcome",
  "newOutcome",
  "profileStatus",
  "previousProfileStatus",
  "newProfileStatus",
  "isIndexable",
  "previousIsIndexable",
  "newIsIndexable",
  "isModerated",
  "previousIsModerated",
  "newIsModerated",
  "containsContactAttempt",
  "previousContainsContactAttempt",
  "newContainsContactAttempt",
  "isDuplicate",
  "previousIsDuplicate",
  "newIsDuplicate",
  "count",
  "filters",
  "sourceType",
  "cityId",
  "serviceId",
  "lawyerId",
  "dateFrom",
  "dateTo",
  "role",
  "actorId",
  "actorRole",
  "requestId",
  "maskedEmail",
  "emailHash"
]);

const safeAuditStringKeys = new Set([
  "id",
  "status",
  "previousStatus",
  "newStatus",
  "oldStatus",
  "qualityStatus",
  "previousQualityStatus",
  "newQualityStatus",
  "outcome",
  "previousOutcome",
  "newOutcome",
  "profileStatus",
  "previousProfileStatus",
  "newProfileStatus",
  "sourceType",
  "cityId",
  "serviceId",
  "lawyerId",
  "dateFrom",
  "dateTo",
  "role",
  "actorId",
  "actorRole",
  "requestId",
  "maskedEmail",
  "emailHash"
]);

