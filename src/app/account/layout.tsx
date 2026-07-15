import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { requireUserSession } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Мои дела",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await requireUserSession();

  return <AccountShell email={user.email}>{children}</AccountShell>;
}
