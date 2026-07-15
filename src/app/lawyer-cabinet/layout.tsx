import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LawyerCabinetShell } from "@/components/lawyer-cabinet/LawyerCabinetShell";
import { requireLawyerSession } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Кабинет юриста",
  robots: {
    index: false,
    follow: false
  }
};

export default async function LawyerCabinetLayout({ children }: { children: ReactNode }) {
  const lawyer = await requireLawyerSession();

  return <LawyerCabinetShell email={lawyer.email}>{children}</LawyerCabinetShell>;
}
