export function calculatePropertyStateDuty(price: number) {
  if (!Number.isFinite(price) || price <= 0) return null;
  let duty: number;
  if (price <= 100_000) duty = 4_000;
  else if (price <= 300_000) duty = 4_000 + (price - 100_000) * 0.03;
  else if (price <= 500_000) duty = 10_000 + (price - 300_000) * 0.025;
  else if (price <= 1_000_000) duty = 15_000 + (price - 500_000) * 0.02;
  else if (price <= 3_000_000) duty = 25_000 + (price - 1_000_000) * 0.01;
  else if (price <= 8_000_000) duty = 45_000 + (price - 3_000_000) * 0.007;
  else if (price <= 24_000_000) duty = 80_000 + (price - 8_000_000) * 0.0035;
  else if (price <= 50_000_000) duty = 136_000 + (price - 24_000_000) * 0.003;
  else if (price <= 100_000_000) duty = 214_000 + (price - 50_000_000) * 0.002;
  else duty = Math.min(900_000, 314_000 + (price - 100_000_000) * 0.0015);
  return Math.round(duty * 100) / 100;
}

export function calculateClaimPrice(items: number[]) {
  if (!items.length || items.some((item) => !Number.isFinite(item) || item < 0)) return null;
  return Math.round(items.reduce((sum, item) => sum + item, 0) * 100) / 100;
}

export function calculateAlimonyShare(income: number, children: number) {
  if (!Number.isFinite(income) || income < 0 || !Number.isInteger(children) || children < 1) return null;
  const share = children === 1 ? 1 / 4 : children === 2 ? 1 / 3 : 1 / 2;
  return { share, amount: Math.round(income * share * 100) / 100 };
}

export function calculatePreliminaryAlimonyDebt(accrued: number, paid: number) {
  if (![accrued, paid].every((value) => Number.isFinite(value) && value >= 0)) return null;
  return Math.max(0, Math.round((accrued - paid) * 100) / 100);
}

export function determineAlimonyProcedure(input: {
  percentageOnly: boolean;
  hasPaternityDispute: boolean;
  hasOtherRecipients: boolean;
  hasOtherDispute: boolean;
}) {
  return input.percentageOnly && !input.hasPaternityDispute && !input.hasOtherRecipients && !input.hasOtherDispute
    ? "order"
    : "claim";
}
