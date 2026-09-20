import {
  COURT_FEE_AMENDMENT_SOURCE,
  FAMILY_TOOLS_CHECKED_AT,
  NK_CONSULTANT_SOURCE,
  NK_FNS_SOURCE,
  type FamilyLegalSource
} from "@/data/family-legal-sources";

export type FamilyStateDutyClaimType = "divorce" | "property" | "non-property" | "alimony" | "divorce-property" | "other-mixed";

export type StateDutyComponent = {
  label: string;
  amount: number;
  formula: string;
  norm: string;
};

export type FamilyStateDutyResult = {
  claimType: FamilyStateDutyClaimType;
  claimTypeLabel: string;
  total: number | null;
  formula: string;
  priceRange: string | null;
  benefit: string | null;
  norm: string;
  sources: FamilyLegalSource[];
  checkedAt: string;
  limitations: string[];
  components: StateDutyComponent[];
  requiresManualReview: boolean;
};

type PropertyBand = {
  max: number;
  base: number;
  threshold: number;
  rate: number;
  range: string;
  formula: string;
};

const PROPERTY_BANDS: PropertyBand[] = [
  { max: 100_000, base: 4_000, threshold: 0, rate: 0, range: "до 100 000 ₽", formula: "4 000 ₽" },
  { max: 300_000, base: 4_000, threshold: 100_000, rate: 0.03, range: "от 100 001 ₽ до 300 000 ₽", formula: "4 000 ₽ + 3% суммы свыше 100 000 ₽" },
  { max: 500_000, base: 10_000, threshold: 300_000, rate: 0.025, range: "от 300 001 ₽ до 500 000 ₽", formula: "10 000 ₽ + 2,5% суммы свыше 300 000 ₽" },
  { max: 1_000_000, base: 15_000, threshold: 500_000, rate: 0.02, range: "от 500 001 ₽ до 1 000 000 ₽", formula: "15 000 ₽ + 2% суммы свыше 500 000 ₽" },
  { max: 3_000_000, base: 25_000, threshold: 1_000_000, rate: 0.01, range: "от 1 000 001 ₽ до 3 000 000 ₽", formula: "25 000 ₽ + 1% суммы свыше 1 000 000 ₽" },
  { max: 8_000_000, base: 45_000, threshold: 3_000_000, rate: 0.007, range: "от 3 000 001 ₽ до 8 000 000 ₽", formula: "45 000 ₽ + 0,7% суммы свыше 3 000 000 ₽" },
  { max: 24_000_000, base: 80_000, threshold: 8_000_000, rate: 0.0035, range: "от 8 000 001 ₽ до 24 000 000 ₽", formula: "80 000 ₽ + 0,35% суммы свыше 8 000 000 ₽" },
  { max: 50_000_000, base: 136_000, threshold: 24_000_000, rate: 0.003, range: "от 24 000 001 ₽ до 50 000 000 ₽", formula: "136 000 ₽ + 0,3% суммы свыше 24 000 000 ₽" },
  { max: 100_000_000, base: 214_000, threshold: 50_000_000, rate: 0.002, range: "от 50 000 001 ₽ до 100 000 000 ₽", formula: "214 000 ₽ + 0,2% суммы свыше 50 000 000 ₽" },
  { max: Number.POSITIVE_INFINITY, base: 314_000, threshold: 100_000_000, rate: 0.0015, range: "свыше 100 000 000 ₽", formula: "314 000 ₽ + 0,15% суммы свыше 100 000 000 ₽, но не более 900 000 ₽" }
];

const COMMON_SOURCES = [NK_FNS_SOURCE, COURT_FEE_AMENDMENT_SOURCE, NK_CONSULTANT_SOURCE];
const COMMON_LIMITATIONS = [
  "Расчёт предварительный и не подтверждает подсудность, цену иска или состав требований.",
  "Перед оплатой проверьте реквизиты, льготы и сумму на официальной странице выбранного суда."
];

export function calculateFamilyStateDuty(type: FamilyStateDutyClaimType, propertyAmount?: number): FamilyStateDutyResult | null {
  if (type === "property" || type === "divorce-property") {
    const property = calculatePropertyDutyComponent(propertyAmount);
    if (!property) return null;
    if (type === "property") return result(type, "Имущественный иск, подлежащий оценке", property.amount, property.formula, property.range, null, "Подпункт 1 пункта 1 статьи 333.19 НК РФ", [property]);
    const divorce = fixedComponent("Расторжение брака", 5_000, "5 000 ₽", "Подпункт 5 пункта 1 статьи 333.19 НК РФ");
    return result(type, "Расторжение брака и раздел имущества", divorce.amount + property.amount, `${divorce.formula} + (${property.formula})`, property.range, null, "Статья 333.19 и подпункт 1 пункта 1 статьи 333.20 НК РФ", [divorce, property]);
  }

  if (type === "divorce") {
    const component = fixedComponent("Расторжение брака", 5_000, "5 000 ₽", "Подпункт 5 пункта 1 статьи 333.19 НК РФ");
    return result(type, component.label, component.amount, component.formula, null, null, component.norm, [component]);
  }
  if (type === "non-property") {
    const component = fixedComponent("Неимущественное требование физического лица", 3_000, "3 000 ₽", "Подпункт 3 пункта 1 статьи 333.19 НК РФ");
    return result(type, component.label, component.amount, component.formula, null, null, component.norm, [component]);
  }
  if (type === "alimony") {
    return result(type, "Взыскание алиментов истцом", 0, "0 ₽", null, "Истец по требованию о взыскании алиментов освобождён от уплаты госпошлины.", "Подпункт 2 пункта 1 статьи 333.36 НК РФ", [{ label: "Взыскание алиментов", amount: 0, formula: "0 ₽ - применяется льгота", norm: "Подпункт 2 пункта 1 статьи 333.36 НК РФ" }]);
  }

  return {
    claimType: type,
    claimTypeLabel: "Несколько самостоятельных требований",
    total: null,
    formula: "Автоматическое суммирование не выполнено",
    priceRange: null,
    benefit: null,
    norm: "Статья 333.20 НК РФ",
    sources: COMMON_SOURCES,
    checkedAt: FAMILY_TOOLS_CHECKED_AT,
    limitations: ["Требуется отдельная проверка госпошлины для нескольких требований.", ...COMMON_LIMITATIONS],
    components: [],
    requiresManualReview: true
  };
}

export function calculatePropertyStateDutyAmount(price: number) {
  return calculatePropertyDutyComponent(price)?.amount ?? null;
}

function calculatePropertyDutyComponent(price: number | undefined): StateDutyComponent & { range: string } | null {
  if (!Number.isFinite(price) || (price ?? 0) <= 0) return null;
  const safePrice = price as number;
  const band = PROPERTY_BANDS.find((item) => safePrice <= item.max);
  if (!band) return null;
  const uncapped = band.base + Math.max(0, safePrice - band.threshold) * band.rate;
  const amount = Math.round(Math.min(900_000, uncapped) * 100) / 100;
  return { label: "Имущественное требование", amount, formula: band.formula, norm: "Подпункт 1 пункта 1 статьи 333.19 НК РФ", range: band.range };
}

function fixedComponent(label: string, amount: number, formula: string, norm: string): StateDutyComponent {
  return { label, amount, formula, norm };
}

function result(
  claimType: FamilyStateDutyClaimType,
  claimTypeLabel: string,
  total: number,
  formula: string,
  priceRange: string | null,
  benefit: string | null,
  norm: string,
  components: StateDutyComponent[]
): FamilyStateDutyResult {
  return { claimType, claimTypeLabel, total, formula, priceRange, benefit, norm, sources: COMMON_SOURCES, checkedAt: FAMILY_TOOLS_CHECKED_AT, limitations: COMMON_LIMITATIONS, components, requiresManualReview: false };
}

