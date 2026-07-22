import type { Metadata } from "next";
import { JudicialOrderCheckFlow } from "@/components/check/JudicialOrderCheckFlow";

export const metadata: Metadata = {
  title: "Проверка ситуации по судебному приказу",
  description: "Короткая диагностика судебного приказа: срок, риски, возражение и проверка документа юристом.",
  robots: { index: false, follow: true }
};

export default function CheckPage() {
  return <JudicialOrderCheckFlow />;
}
