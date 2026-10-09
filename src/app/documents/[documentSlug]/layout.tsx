import type { ReactNode } from "react";
import { DocumentRelatedQuestions } from "@/components/questions/ContextRelatedQuestions";
import { getNavigatorDocument } from "@/data/documents";

type DocumentDetailLayoutProps = {
  children: ReactNode;
  params: Promise<{ documentSlug: string }>;
};

export default async function DocumentDetailLayout({ children, params }: DocumentDetailLayoutProps) {
  const { documentSlug } = await params;
  const document = getNavigatorDocument(documentSlug);

  return (
    <>
      {children}
      {document ? <DocumentRelatedQuestions document={document} /> : null}
    </>
  );
}
