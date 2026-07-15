import type { Metadata } from "next";
import { LawyerProfileEditor } from "@/components/lawyer-cabinet/LawyerProfileEditor";

export const metadata: Metadata = {
  title: "Профиль юриста",
  robots: {
    index: false,
    follow: false
  }
};

export default function LawyerProfilePage() {
  return <LawyerProfileEditor />;
}
