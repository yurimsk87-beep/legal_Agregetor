import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { LockKeyhole } from "lucide-react";
import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME, createSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMetadata, type SearchParams } from "@/lib/seo";
import { getCurrentSession } from "@/lib/server-auth";
import { auditIdentifier, checkRateLimit, logAdminAudit, maskEmailForAudit, normalizeAuditRequestId } from "@/lib/request-security";

type LoginPageProps = {
  searchParams?: Promise<SearchParams>;
};

export async function generateMetadata({ searchParams }: LoginPageProps): Promise<Metadata> {
  const query = searchParams ? await searchParams : undefined;

  return buildMetadata({
    title: "Вход в сервис",
    description: "Авторизация пользователя, администратора или юриста платформы.",
    path: "/login/",
    isIndexable: false,
    searchParams: query
  });
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = searchParams ? await searchParams : undefined;
  const nextPath = normalizeNext(firstParam(query?.next));
  const session = await getCurrentSession();

  if (session) {
    redirect(destinationAfterLogin(session.role, nextPath));
  }

  const hasError = firstParam(query?.error) === "1";
  const loggedOut = firstParam(query?.loggedOut) === "1";
  const rateLimited = firstParam(query?.rate) === "1";

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full rounded-lg border border-line bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-ink text-white">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-ink">Вход в сервис</h1>
            <p className="mt-1 text-sm text-zinc-600">Используйте учетную запись, чтобы открыть личный кабинет, админку или кабинет юриста.</p>
          </div>
        </div>

        {hasError ? (
          <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            Неверный email, пароль или роль пользователя.
          </p>
        ) : null}
        {loggedOut ? (
          <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            Вы вышли из админки.
          </p>
        ) : null}

        {rateLimited ? (
          <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
            Слишком много попыток входа. Попробуйте позже.
          </p>
        ) : null}

        <form action={loginAction} className="mt-6 grid gap-4">
          <input type="hidden" name="next" value={nextPath} />
          <label className="grid gap-1 text-sm font-medium text-zinc-700">
            Email
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              className="min-h-11 rounded-md border border-line px-3 outline-none focus:border-trust"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-700">
            Пароль
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="min-h-11 rounded-md border border-line px-3 outline-none focus:border-trust"
            />
          </label>
          <button type="submit" className="min-h-11 rounded-md bg-ink px-5 text-sm font-semibold text-white hover:bg-trust">
            Войти
          </button>
        </form>
      </div>
    </section>
  );
}

async function loginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = normalizeNext(String(formData.get("next") ?? ""));
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";
  const emailHash = auditIdentifier("email", email);
  const maskedEmail = maskEmailForAudit(email);
  const requestId = normalizeAuditRequestId(headerStore.get("x-request-id") ?? headerStore.get("x-correlation-id"));
  const limited = checkRateLimit({ key: `login:${ip}:${emailHash || "empty"}`, limit: 5, windowMs: 10 * 60 * 1000 });

  if (limited) {
    await logAdminAudit({
      action: "LOGIN_RATE_LIMITED",
      entityType: "AUTH",
      entityId: emailHash,
      actorRole: "UNAUTHENTICATED",
      requestId,
      afterSnapshot: { emailHash, maskedEmail }
    });
    redirect(`/login/?rate=1&next=${encodeURIComponent(nextPath)}`);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    await logAdminAudit({
      action: "LOGIN_FAILED",
      entityType: "AUTH",
      entityId: emailHash,
      actorRole: user?.role ?? "UNAUTHENTICATED",
      requestId,
      afterSnapshot: { emailHash, maskedEmail, role: user?.role ?? null }
    });
    redirect(`/login/?error=1&next=${encodeURIComponent(nextPath)}`);
  }

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    role: user.role
  });
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE
  });

  redirect(destinationAfterLogin(user.role, nextPath));
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function normalizeNext(value: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/admin/";
  if (value.startsWith("/login") || value.startsWith("/logout")) return "/admin/";
  return value;
}

function destinationAfterLogin(role: string, nextPath: string) {
  if (role === "ADMIN") {
    return nextPath.startsWith("/admin") ? nextPath : "/admin/";
  }

  if (role === "LAWYER") {
    return nextPath.startsWith("/lawyer-cabinet") ? nextPath : "/lawyer-cabinet/";
  }

  if (role === "USER") {
    return nextPath.startsWith("/account") ? nextPath : "/account/cases/";
  }

  return "/";
}
