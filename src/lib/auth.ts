// Historical name: this session cookie is used for ADMIN, LAWYER and USER roles.
export const AUTH_COOKIE_NAME = "legal_admin_session";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 8;

export type SessionRole = "USER" | "LAWYER" | "ADMIN";

export type SessionPayload = {
  sub: string;
  email: string;
  role: SessionRole;
  iat: number;
  exp: number;
};

type SessionInput = {
  sub: string;
  email: string;
  role: SessionRole;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function createSessionToken(input: SessionInput) {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encodeBase64Url(
    JSON.stringify({
      ...input,
      iat: now,
      exp: now + AUTH_COOKIE_MAX_AGE
    })
  );
  const unsignedToken = `${header}.${payload}`;
  const signature = await sign(unsignedToken);

  return `${unsignedToken}.${signature}`;
}

export async function verifySessionToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expectedSignature = await sign(`${header}.${payload}`);
  if (!constantTimeEqual(signature, expectedSignature)) return null;

  try {
    const data = JSON.parse(decodeBase64Url(payload)) as SessionPayload;
    if (!data.sub || !data.email || !data.role || !data.exp) return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

async function sign(value: string) {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret === "change-me-in-production" || secret.length < 32)) {
    throw new Error("JWT_SECRET must be set to a strong value in production.");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret || "dev-only-change-me-in-production"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

function encodeBase64Url(value: string) {
  return bytesToBase64Url(encoder.encode(value));
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return decoder.decode(bytes);
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}
