import type { ReactNode } from "react";
import { ProblemRelatedQuestions } from "@/components/questions/ContextRelatedQuestions";
import { getLegalProblem } from "@/data/legal-problems";

type ProblemDetailLayoutProps = {
  children: ReactNode;
  params: Promise<{ category: string; slug: string }>;
};

export default async function ProblemDetailLayout({ children, params }: ProblemDetailLayoutProps) {
  const { category, slug } = await params;
  const problem = getLegalProblem(category, slug);

  return (
    <>
      {children}
      {problem ? <ProblemRelatedQuestions problem={problem} /> : null}
    </>
  );
}
