import type { Metadata } from "next";
import { ProfilePreview } from "@/components/lawyer-cabinet/LawyerProfilePreview";

export const metadata: Metadata = {
  title: "Предпросмотр профиля",
  robots: {
    index: false,
    follow: false
  }
};

export default function LawyerProfilePreviewPage() {
  return <ProfilePreview />;
}
