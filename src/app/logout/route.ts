import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

const NEXT_AUTH_COOKIE_NAME = "legal_session";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete(NEXT_AUTH_COOKIE_NAME);

  return NextResponse.redirect(new URL("/login/?loggedOut=1", request.url));
}
