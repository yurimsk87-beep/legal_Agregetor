import type { Metadata } from "next";
import { DocumentReviewRequestForm } from "@/components/document-review/DocumentReviewRequestForm";

export const metadata: Metadata = {
  title: "Проверка документа юристом",
  description: "Передайте сформированный документ и контекст ситуации юристу для проверки.",
  robots: { index: false, follow: true }
};

export default function DocumentReviewPage() {
  return <DocumentReviewRequestForm />;
}
