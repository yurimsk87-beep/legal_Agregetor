import { urlSet, xmlResponse } from "@/lib/sitemap";
import { navigatorDocuments } from "@/data/documents";

export async function GET() {
  // Генератор встроен в страницу документа, отдельных /generator/ URL больше нет.
  const documentPaths = navigatorDocuments.map((document) => `/documents/${document.slug}/`);

  return xmlResponse(urlSet(["/documents/", ...documentPaths]));
}
