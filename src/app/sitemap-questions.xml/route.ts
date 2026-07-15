import { getSitemapEntries } from "@/lib/repositories";
import { urlSet, xmlResponse } from "@/lib/sitemap";

export async function GET() {
  return xmlResponse(urlSet(await getSitemapEntries("questions")));
}
