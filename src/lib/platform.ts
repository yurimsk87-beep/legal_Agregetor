import { siteUrl } from "./seo";

function splitRegions(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const platformPhone = process.env.NEXT_PUBLIC_PLATFORM_PHONE || "";
const platformEmail = process.env.NEXT_PUBLIC_PLATFORM_EMAIL || "admin@pravopoisk.ru";

export const platformContacts = {
  name: process.env.NEXT_PUBLIC_PLATFORM_NAME || "ПравоПоиск",
  legalName: process.env.PLATFORM_LEGAL_NAME || "ООО «ПравоПоиск»",
  fullLegalName: process.env.PLATFORM_FULL_LEGAL_NAME || "Общество с ограниченной ответственностью «ПравоПоиск»",
  inn: process.env.PLATFORM_INN || "9709078420",
  kpp: process.env.PLATFORM_KPP || "772301001",
  ogrn: process.env.PLATFORM_OGRN || "1227700103245",
  director: process.env.PLATFORM_DIRECTOR || "Меренков Денис Владимирович",
  bankAccount: process.env.PLATFORM_BANK_ACCOUNT || "40702810201830003700",
  bankName: process.env.PLATFORM_BANK_NAME || "АО «Т-Банк»",
  bankBik: process.env.PLATFORM_BANK_BIK || "044525593",
  correspondentAccount: process.env.PLATFORM_CORRESPONDENT_ACCOUNT || "30101810200000000593",
  phone: platformPhone,
  phoneHref: platformPhone ? `tel:${platformPhone.replace(/[^\d+]/g, "")}` : "",
  email: platformEmail,
  emailHref: platformEmail ? `mailto:${platformEmail}` : "",
  address: process.env.NEXT_PUBLIC_PLATFORM_ADDRESS || "г. Москва, ул. Крутицкий Вал, д. 20",
  workHours: process.env.NEXT_PUBLIC_PLATFORM_WORK_HOURS || "Ежедневно с 9:00 до 21:00 по московскому времени",
  regions: splitRegions(process.env.NEXT_PUBLIC_PLATFORM_REGIONS || "Вся Россия"),
  yandexRegion: process.env.NEXT_PUBLIC_YANDEX_REGION || "Россия",
  siteUrl: siteUrl()
};

// Социальные сети платформы. В публичном интерфейсе и Organization.sameAs
// показываем только реально настроенные ссылки — заглушки вредят доверию.
const socialEnv: Record<string, string> = {
  telegram: process.env.NEXT_PUBLIC_SOCIAL_TELEGRAM || "",
  vk: process.env.NEXT_PUBLIC_SOCIAL_VK || "",
  dzen: process.env.NEXT_PUBLIC_SOCIAL_DZEN || "",
  youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || "",
  rutube: process.env.NEXT_PUBLIC_SOCIAL_RUTUBE || ""
};

export const platformSocialLinks = (
  [
    ["telegram", "Telegram"],
    ["vk", "ВКонтакте"],
    ["dzen", "Дзен"],
    ["youtube", "YouTube"],
    ["rutube", "Rutube"]
  ] as const
)
  .filter(([key]) => Boolean(socialEnv[key]))
  .map(([key, label]) => ({
    key,
    label,
    href: socialEnv[key],
    configured: true
  }));

// В sameAs — только реально настроенные профили (не заглушки).
export const platformSocialSameAs = platformSocialLinks.filter((item) => item.configured).map((item) => item.href);

export const platformTrustLinks = [
  { href: "/contacts/", label: "Контакты" },
  { href: "/legal/qna-rules/", label: "Правила вопросов и ответов" },
  { href: "/legal/lawyer-rules/", label: "Правила для юристов" }
];
