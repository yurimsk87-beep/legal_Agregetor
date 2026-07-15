export const canonicalCitySlugAliases: Record<string, string> = {
  spb: "sankt-peterburg",
  "nizhnij-novgorod": "nizhniy-novgorod"
};

export const canonicalServiceSlugAliases: Record<string, string> = {
  "administrativnoe-pravo": "administrativnye-dela",
  arbitrazh: "arbitrazhnye-spory",
  "bankrotstvo-fizicheskih-lic": "bankrotstvo-fizicheskih-lits",
  "biznes-i-arbitrazh": "biznes-dogovory",
  "dolgi": "kredity-dolgi",
  "medicinskoe-pravo": "meditsinskoe-pravo",
  "migracionnoe-pravo": "migratsionnoe-pravo",
  "nalogovyj-yurist": "nalogovye-spory",
  "pensii-i-posobiya": "sotsialnye-vyplaty",
  "semejnoe-pravo": "semeynye-spory",
  "strahovoe-pravo": "strahovye-spory",
  "trudovoe-pravo": "trudovye-spory",
  "ugolovnoe-pravo": "ugolovnye-dela",
  "ugolovnyj-advokat": "ugolovnye-dela",
  "voennyj-yurist": "voennoe-pravo",
  "yurist-dlya-biznesa": "biznes-dogovory",
  "zashchita-chesti-i-dostoinstva": "zashchita-chesti-dostoinstva",
  "zashchita-prav-potrebitelej": "zashchita-prav-potrebiteley",
  "zemelnoe-pravo": "zemelnye-spory",
  "zhilishchnye-voprosy": "zhilishchnye-spory",
  zhkh: "zhilishchnye-spory"
};

export function canonicalizePublicPathSegments(pathname: string) {
  const segments = pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  if (segments.length === 0) return "/";

  const canonicalSegments = segments.map((segment) => canonicalCitySlugAliases[segment] ?? canonicalServiceSlugAliases[segment] ?? segment);

  return `/${canonicalSegments.join("/")}/`;
}
