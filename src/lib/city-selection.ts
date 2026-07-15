import type { City } from "@/lib/types";

export const cityStorageKey = "pravopoisk_city";
export const cityChangedEventName = "pravopoisk:city-changed";

export type StoredCitySelection =
  | Pick<City, "id" | "name" | "slug" | "region">
  | {
      id: "";
      name: "Россия";
      slug: "";
      region?: "";
    };
