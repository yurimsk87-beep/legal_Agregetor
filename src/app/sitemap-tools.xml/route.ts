import { urlSet, xmlResponse } from "@/lib/sitemap";
import { navigatorTools } from "@/data/tools";

export async function GET() {
  const toolPaths = navigatorTools.filter((tool) => tool.status === "available").map((tool) => `/tools/${tool.slug}/`);

  return xmlResponse(urlSet(["/tools/", ...toolPaths]));
}
