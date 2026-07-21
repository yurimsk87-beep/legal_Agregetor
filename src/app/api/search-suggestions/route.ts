import { NextResponse } from "next/server";
import {
  buildLawyerSearchResults,
  buildQuestionSearchResults,
  getPopularSearchHints,
  getSearchMoreLabel,
  groupSearchResults,
  isUrgentSearch,
  searchSite,
  type SearchResultType
} from "@/lib/site-search";
import { getJudicialOrderProblemHref } from "@/lib/judicial-order-flow";
import { getLawyers, searchPublicQuestions } from "@/lib/repositories";

export const dynamic = "force-dynamic";

const minQueryLength = 2;
const suggestionTypes: SearchResultType[] = ["situation", "instruction", "document", "question", "lawyer"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  const hints = getPopularSearchHints().slice(0, 5);

  if (query.length < minQueryLength) {
    return NextResponse.json(
      {
        query,
        minQueryLength,
        hints,
        urgent: false,
        groups: []
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const [questionResults, lawyers] = await Promise.all([
    searchPublicQuestions(query, { take: 8 }).catch(() => []),
    getLawyers({ take: 8 }).catch(() => [])
  ]);
  const extraResults = [...buildQuestionSearchResults(questionResults), ...buildLawyerSearchResults(lawyers)];
  const results = searchSite(query, 50, extraResults);
  const groups = groupSearchResults(query, results, { limitPerGroup: 2, types: suggestionTypes }).map((group) => ({
    ...group,
    moreHref: getSuggestionMoreHref(group.type, query),
    moreLabel: getSearchMoreLabel(group.type)
  }));

  return NextResponse.json(
    {
      query,
      minQueryLength,
      hints,
      urgent: isUrgentSearch(query, results),
      groups
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

function getSuggestionMoreHref(type: SearchResultType, query: string) {
  const encodedQuery = encodeURIComponent(query);
  const judicialOrderHref = getJudicialOrderProblemHref(query);

  if (judicialOrderHref && (type === "situation" || type === "instruction")) return judicialOrderHref;
  if (type === "question") return `/questions/?q=${encodedQuery}`;
  if (type === "document") return `/documents/`;
  return `/problems/`;
}
