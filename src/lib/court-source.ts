export const OFFICIAL_COURT_SEARCH_URL = "https://sudrf.ru/index.php?id=300";

export function isOfficialCourtSource(value?: string | null) {
  try {
    const host = new URL(value ?? "").hostname.toLowerCase();
    return (
      host === "sudrf.ru" ||
      host.endsWith(".sudrf.ru") ||
      host === "msudrf.ru" ||
      host.endsWith(".msudrf.ru") ||
      host === "vsrf.ru" ||
      host.endsWith(".vsrf.ru") ||
      host === "mos-gorsud.ru" ||
      host.endsWith(".mos-gorsud.ru")
    );
  } catch {
    return false;
  }
}
