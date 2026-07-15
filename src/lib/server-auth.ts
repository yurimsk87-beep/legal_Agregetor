import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, verifySessionToken, type SessionPayload } from "./auth";
import { prisma } from "./prisma";

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, role: true, createdAt: true }
  });

  if (!user || user.email !== session.email || user.role !== session.role) {
    return null;
  }

  return user;
}

export async function getCurrentAdminUser() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}

export async function requireAdminSession() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login/?next=/admin/");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return user;
}

export async function getCurrentLawyerUser() {
  const user = await getCurrentUser();
  return user?.role === "LAWYER" ? user : null;
}

export async function requireLawyerSession() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login/?next=/lawyer-cabinet/");
  }

  if (user.role !== "LAWYER") {
    redirect("/");
  }

  return user;
}

export async function requireUserSession() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login/?next=/account/cases/");
  }

  if (user.role !== "USER") {
    redirect("/");
  }

  return user;
}
