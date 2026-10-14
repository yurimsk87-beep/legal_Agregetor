import type { ReactNode } from "react";
import { DocumentRelatedQuestions } from "@/components/questions/ContextRelatedQuestions";
import { LegalRouteJourney } from "@/components/documents/LegalRouteJourney";
import { getLegalRouteRegistry } from "@/data/legal-route-standard";
import { getNavigatorDocument } from "@/data/documents";

type DocumentDetailLayoutProps = {
  children: ReactNode;
  params: Promise<{ documentSlug: string }>;
};

export default async function DocumentDetailLayout({ children, params }: DocumentDetailLayoutProps) {
  const { documentSlug } = await params;
  const document = getNavigatorDocument(documentSlug);
  const matches = document ? getLegalRouteRegistry().flatMap((route) => route.scenarios.filter((scenario) => scenario.documentSlug === documentSlug).map((scenario) => ({ route, scenario }))) : [];
  const knownMatch = matches.length === 1 ? matches[0] : null;

  return (
    <>
      {knownMatch ? <LegalRouteJourney stage="document" title={knownMatch.route.title} problemUrl={knownMatch.route.problemUrl} scenarioUrl={knownMatch.scenario.scenarioUrl} /> : document ? <LegalRouteJourney stage="document" title={document.title} /> : null}
      <div className="legal-route-shell">{children}</div>
      {document ? <DocumentRelatedQuestions document={document} /> : null}
    </>
  );
}
