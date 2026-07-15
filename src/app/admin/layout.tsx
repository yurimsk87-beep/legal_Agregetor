import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminSession } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Админка ПравоПоиск",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminSession();

  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
