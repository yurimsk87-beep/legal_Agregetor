import type { ReactNode } from "react";
import { ProblemRelatedQuestions } from "@/components/questions/ContextRelatedQuestions";
import { LegalRouteJourney } from "@/components/documents/LegalRouteJourney";
import { getLegalRouteV1 } from "@/data/legal-route-standard";
import { getLegalProblem } from "@/data/legal-problems";

type ProblemDetailLayoutProps = {
  children: ReactNode;
  params: Promise<{ category: string; slug: string }>;
};

export default async function ProblemDetailLayout({ children, params }: ProblemDetailLayoutProps) {
  const { category, slug } = await params;
  const problem = getLegalProblem(category, slug);
  const route = problem ? getLegalRouteV1(category, slug) : null;

  return (
    <>
      {route ? <LegalRouteJourney stage="situation" title={route.title} problemUrl={route.problemUrl} scenarioUrl={route.scenarios.length === 1 ? route.scenarios[0].scenarioUrl : undefined} /> : null}
      <div className="legal-route-shell">{children}</div>
      {problem ? <ProblemRelatedQuestions problem={problem} /> : null}
    </>
  );
}
