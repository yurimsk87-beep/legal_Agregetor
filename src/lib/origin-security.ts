export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin) return allowedOrigins(request).has(normalizeOrigin(origin));
  if (!referer) return true;

  try {
    return allowedOrigins(request).has(new URL(referer).origin);
  } catch {
    return false;
  }
}

function allowedOrigins(request: Request) {
  const requestUrl = new URL(request.url);
  const origins = new Set([requestUrl.origin]);
  const forwardedProtocol = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const protocol = forwardedProtocol || requestUrl.protocol.replace(/:$/, "");

  const host = firstHeaderValue(request.headers.get("host"));
  if (host) {
    try {
      origins.add(new URL(`${protocol}://${host}`).origin);
    } catch {
      // Ignore a malformed Host header instead of treating it as a trusted origin.
    }
  }

  return origins;
}

function firstHeaderValue(value: string | null) {
  return value?.split(",", 1)[0]?.trim() || "";
}

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

