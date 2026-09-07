import { getNavigatorDocument } from "@/data/documents";
import { getLegalCategory } from "@/data/legal-categories";
import { getLegalProblem } from "@/data/legal-problems";

export function isUnknownNavigatorPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] === "documents") {
    if (segments.length === 1) return false;
    return segments.length !== 2 || !getNavigatorDocument(segments[1]);
  }

  if (segments[0] === "problems") {
    if (segments.length === 1) return false;
    if (segments.length === 2) return !getLegalCategory(segments[1]);
    if (segments.length === 3) return !getLegalProblem(segments[1], segments[2]);
    return true;
  }

  return false;
}
