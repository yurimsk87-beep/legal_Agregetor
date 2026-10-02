import { calculatePropertyStateDutyAmount } from "@/lib/family-state-duty";

export function calculatePropertyStateDuty(price: number) {
  return calculatePropertyStateDutyAmount(price);
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
