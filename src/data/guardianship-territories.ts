import type { SearchableSelectOption } from "@/lib/searchable-select";
import type { City } from "@/lib/types";

export const TERRITORY_NOT_FOUND_ID = "territory-not-found";
export const CITY_MUNICIPALITY_PREFIX = "city-municipality-";

export type RussianRegion = SearchableSelectOption;

export type GuardianshipAuthority = {
  id: string;
  name: string;
  address: string;
  website: string;
  sourceUrl: string;
  sourceName: string;
  lastVerifiedAt: string;
  verificationStatus: "verified";
};

export type GuardianshipMunicipality = {
  id: string;
  regionId: string;
  name: string;
  authorities: GuardianshipAuthority[];
};

export type GuardianshipCity = Pick<City, "id" | "name" | "region" | "slug">;

export const GUARDIANSHIP_DIRECTORY_METADATA = {
  regionSourceUrl: "https://www.gov.ru/main/regions/regioni-44.html",
  regionSourceName: "Сервер органов государственной власти России: субъекты России",
  authoritySearchUrl: "https://www.gov.ru/main/regions/regioni-44.html",
  lastVerifiedAt: "2026-08-13",
  isComplete: false,
  note: "Единого подтверждённого федерального реестра всех муниципальных органов опеки не найдено. В локальный список включены только записи, сверенные с официальными сайтами; отсутствие записи не означает отсутствие органа."
} as const;

export const RUSSIAN_REGIONS: RussianRegion[] = [
  ["region-adygea", "Республика Адыгея (Адыгея)"], ["region-altai-republic", "Республика Алтай"],
  ["region-bashkortostan", "Республика Башкортостан"], ["region-buryatia", "Республика Бурятия"],
  ["region-dagestan", "Республика Дагестан"], ["region-donetsk", "Донецкая Народная Республика"],
  ["region-ingushetia", "Республика Ингушетия"], ["region-kabardino-balkaria", "Кабардино-Балкарская Республика"],
  ["region-kalmykia", "Республика Калмыкия"], ["region-karachay-cherkessia", "Карачаево-Черкесская Республика"],
  ["region-karelia", "Республика Карелия"], ["region-komi", "Республика Коми"],
  ["region-crimea", "Республика Крым"], ["region-lugansk", "Луганская Народная Республика"],
  ["region-mari-el", "Республика Марий Эл"], ["region-mordovia", "Республика Мордовия"],
  ["region-sakha", "Республика Саха (Якутия)"], ["region-north-ossetia", "Республика Северная Осетия - Алания"],
  ["region-tatarstan", "Республика Татарстан (Татарстан)"], ["region-tuva", "Республика Тыва"],
  ["region-udmurtia", "Удмуртская Республика"], ["region-khakassia", "Республика Хакасия"],
  ["region-chechnya", "Чеченская Республика"], ["region-chuvashia", "Чувашская Республика - Чувашия"],
  ["region-altai-krai", "Алтайский край"], ["region-zabaykalsky", "Забайкальский край"],
  ["region-kamchatka", "Камчатский край"], ["region-krasnodar", "Краснодарский край"],
  ["region-krasnoyarsk", "Красноярский край"], ["region-perm", "Пермский край"],
  ["region-primorsky", "Приморский край"], ["region-stavropol", "Ставропольский край"],
  ["region-khabarovsk", "Хабаровский край"], ["region-amur", "Амурская область"],
  ["region-arkhangelsk", "Архангельская область"], ["region-astrakhan", "Астраханская область"],
  ["region-belgorod", "Белгородская область"], ["region-bryansk", "Брянская область"],
  ["region-vladimir", "Владимирская область"], ["region-volgograd", "Волгоградская область"],
  ["region-vologda", "Вологодская область"], ["region-voronezh", "Воронежская область"],
  ["region-zaporozhye", "Запорожская область"], ["region-ivanovo", "Ивановская область"],
  ["region-irkutsk", "Иркутская область"], ["region-kaliningrad", "Калининградская область"],
  ["region-kaluga", "Калужская область"], ["region-kemerovo", "Кемеровская область - Кузбасс"],
  ["region-kirov", "Кировская область"], ["region-kostroma", "Костромская область"],
  ["region-kurgan", "Курганская область"], ["region-kursk", "Курская область"],
  ["region-leningrad", "Ленинградская область"], ["region-lipetsk", "Липецкая область"],
  ["region-magadan", "Магаданская область"], ["region-moscow-oblast", "Московская область"],
  ["region-murmansk", "Мурманская область"], ["region-nizhny-novgorod", "Нижегородская область"],
  ["region-novgorod", "Новгородская область"], ["region-novosibirsk", "Новосибирская область"],
  ["region-omsk", "Омская область"], ["region-orenburg", "Оренбургская область"],
  ["region-oryol", "Орловская область"], ["region-penza", "Пензенская область"],
  ["region-pskov", "Псковская область"], ["region-rostov", "Ростовская область"],
  ["region-ryazan", "Рязанская область"], ["region-samara", "Самарская область"],
  ["region-saratov", "Саратовская область"], ["region-sakhalin", "Сахалинская область"],
  ["region-sverdlovsk", "Свердловская область"], ["region-smolensk", "Смоленская область"],
  ["region-tambov", "Тамбовская область"], ["region-tver", "Тверская область"],
  ["region-tomsk", "Томская область"], ["region-tula", "Тульская область"],
  ["region-tyumen", "Тюменская область"], ["region-ulyanovsk", "Ульяновская область"],
  ["region-kherson", "Херсонская область"], ["region-chelyabinsk", "Челябинская область"],
  ["region-yaroslavl", "Ярославская область"], ["region-moscow", "Москва"],
  ["region-saint-petersburg", "Санкт-Петербург"], ["region-sevastopol", "Севастополь"],
  ["region-jewish-autonomous", "Еврейская автономная область"], ["region-nenets", "Ненецкий автономный округ"],
  ["region-khanty-mansi", "Ханты-Мансийский автономный округ - Югра"], ["region-chukotka", "Чукотский автономный округ"],
  ["region-yamalo-nenets", "Ямало-Ненецкий автономный округ"]
].map(([id, label]) => ({ id, label }));

export const GUARDIANSHIP_MUNICIPALITIES: GuardianshipMunicipality[] = [
  {
    id: "moscow-gagarinsky",
    regionId: "region-moscow",
    name: "Муниципальный округ Гагаринский",
    authorities: [{
      id: "moscow-gagarinsky-administration",
      name: "Администрация муниципального округа Гагаринский в городе Москве",
      address: "119296, Москва, Университетский проспект, д. 5",
      website: "https://gagarinskoe.com/administration/opeka/",
      sourceUrl: "https://gagarinskoe.com/administration/opeka/",
      sourceName: "Официальный сайт муниципального округа Гагаринский",
      lastVerifiedAt: "2026-08-13",
      verificationStatus: "verified"
    }]
  },
  {
    id: "spb-gagarinskoe",
    regionId: "region-saint-petersburg",
    name: "Муниципальный округ Гагаринское",
    authorities: [{
      id: "spb-gagarinskoe-guardianship",
      name: "Отдел опеки и попечительства местной администрации МО Гагаринское",
      address: "Санкт-Петербург, Витебский проспект, д. 41, корп. 1",
      website: "https://mogagarinskoe.ru/opeka.php/",
      sourceUrl: "https://mogagarinskoe.ru/opeka.php/spravochnaya-i-kontaktnaya-informacziya-otdela.html",
      sourceName: "Официальный сайт МО Гагаринское",
      lastVerifiedAt: "2026-08-13",
      verificationStatus: "verified"
    }]
  },
  {
    id: "spb-kupchino",
    regionId: "region-saint-petersburg",
    name: "Муниципальный округ Купчино",
    authorities: [{
      id: "spb-kupchino-guardianship",
      name: "Отдел опеки и попечительства МА ВМО «Купчино»",
      address: "192071, Санкт-Петербург, ул. Бухарестская, д. 43, лит. А",
      website: "https://mokupchino.ru/index.php/2016-04-17-21-44-53/strukturnye-podrazdeleniya/opeka",
      sourceUrl: "https://mokupchino.ru/index.php/2016-04-17-21-44-53/strukturnye-podrazdeleniya/opeka",
      sourceName: "Официальный сайт МО Купчино",
      lastVerifiedAt: "2026-08-13",
      verificationStatus: "verified"
    }]
  },
  {
    id: "smolensk-gagarinsky",
    regionId: "region-smolensk",
    name: "Гагаринский муниципальный округ",
    authorities: [{
      id: "smolensk-gagarinsky-education",
      name: "Управление по образованию и молодёжной политике Администрации МО «Гагаринский муниципальный округ» Смоленской области",
      address: "Смоленская область, г. Гагарин, ул. Ленина, д. 9/1",
      website: "https://edu.admin-smolensk.ru/spravochniki/perechen-organov-opeki-i-popechitelstva-municipalnyh-okrugov/",
      sourceUrl: "https://edu.admin-smolensk.ru/spravochniki/perechen-organov-opeki-i-popechitelstva-municipalnyh-okrugov/",
      sourceName: "Министерство образования и науки Смоленской области: перечень органов опеки",
      lastVerifiedAt: "2026-08-13",
      verificationStatus: "verified"
    }]
  }
];

const notFoundOption = (label: string): SearchableSelectOption => ({
  id: TERRITORY_NOT_FOUND_ID,
  label,
  description: "Выберите этот вариант, чтобы получить официальный порядок поиска. Готовый документ сформирован не будет."
});

const CITY_REGION_OVERRIDES: Record<string, string> = {
  moskva: "region-moscow",
  "sankt-peterburg": "region-saint-petersburg",
  sevastopol: "region-sevastopol"
};

export function getGuardianshipRegionOptions() {
  return RUSSIAN_REGIONS;
}

export function getGuardianshipMunicipalityOptions(
  regionId: string | undefined,
  cities: GuardianshipCity[] = []
): SearchableSelectOption[] {
  if (!regionId) return [];
  const verified = GUARDIANSHIP_MUNICIPALITIES
    .filter((municipality) => municipality.regionId === regionId)
    .map((municipality) => ({ id: municipality.id, label: municipality.name }));
  const cityOptions = cities
    .filter((city) => getGuardianshipCityRegionId(city) === regionId)
    .map((city) => ({
      id: `${CITY_MUNICIPALITY_PREFIX}${city.slug}`,
      label: city.name,
      description: "Город из внутреннего списка ПравоПоиска. Орган опеки потребуется подтвердить отдельно.",
      keywords: [city.region]
    }));
  const options = [...verified, ...cityOptions]
    .filter((option, index, all) => all.findIndex((candidate) => candidate.id === option.id) === index)
    .sort((left, right) => left.label.localeCompare(right.label, "ru"));
  return [...options, notFoundOption("Нужного города или муниципального образования нет в списке")];
}

export function getGuardianshipAuthorityOptions(municipalityId: string | undefined): SearchableSelectOption[] {
  if (!municipalityId || municipalityId === TERRITORY_NOT_FOUND_ID) return [];
  const municipality = GUARDIANSHIP_MUNICIPALITIES.find((item) => item.id === municipalityId);
  const verified = municipality?.authorities.map((authority) => ({
    id: authority.id,
    label: authority.name,
    description: authority.address
  })) ?? [];
  return [...verified, notFoundOption("Не нашёл нужный орган опеки")];
}

export function isCityMunicipalityId(value: string | undefined) {
  return Boolean(value?.startsWith(CITY_MUNICIPALITY_PREFIX));
}

export function findGuardianshipTerritory(regionId: string | undefined, municipalityId: string | undefined, authorityId: string | undefined) {
  const region = RUSSIAN_REGIONS.find((item) => item.id === regionId);
  const municipality = GUARDIANSHIP_MUNICIPALITIES.find((item) => item.id === municipalityId && item.regionId === regionId);
  const authority = municipality?.authorities.find((item) => item.id === authorityId);
  return { region, municipality, authority };
}

function getGuardianshipCityRegionId(city: GuardianshipCity) {
  const override = CITY_REGION_OVERRIDES[city.slug];
  if (override) return override;
  const cityRegion = normalizeRegionName(city.region);
  return RUSSIAN_REGIONS.find((region) => {
    const regionName = normalizeRegionName(region.label);
    return regionName === cityRegion || regionName.startsWith(`${cityRegion} `) || cityRegion.startsWith(`${regionName} `);
  })?.id;
}

function normalizeRegionName(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ");
}
