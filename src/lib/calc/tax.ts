import {
  TAX_BRACKETS_MFJ,
  TAX_BRACKETS_SINGLE,
  TAX_STANDARD_DEDUCTION_MFJ,
  TAX_STANDARD_DEDUCTION_SINGLE,
  SS_TAX_THRESHOLD_MFJ_LOW,
  SS_TAX_THRESHOLD_MFJ_HIGH,
} from "../constants";

/** Estimate federal income tax */
export function estimateFederalTax(
  grossIncome: number,
  filingStatus: "married_joint" | "single",
): number {
  const brackets =
    filingStatus === "married_joint" ? TAX_BRACKETS_MFJ : TAX_BRACKETS_SINGLE;
  const deduction =
    filingStatus === "married_joint"
      ? TAX_STANDARD_DEDUCTION_MFJ
      : TAX_STANDARD_DEDUCTION_SINGLE;

  const taxableIncome = Math.max(0, grossIncome - deduction);
  let tax = 0;

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }

  return Math.round(tax);
}

/** Compute how much of SS benefits are taxable (MFJ) */
export function computeSSTaxableAmount(
  annualSSBenefit: number,
  otherIncome: number,
): number {
  // Combined income = other income + 50% of SS
  const combinedIncome = otherIncome + annualSSBenefit * 0.5;

  if (combinedIncome < SS_TAX_THRESHOLD_MFJ_LOW) {
    return 0;
  } else if (combinedIncome < SS_TAX_THRESHOLD_MFJ_HIGH) {
    return Math.min(annualSSBenefit * 0.5, (combinedIncome - SS_TAX_THRESHOLD_MFJ_LOW) * 0.5);
  } else {
    const base = Math.min(annualSSBenefit * 0.5, (SS_TAX_THRESHOLD_MFJ_HIGH - SS_TAX_THRESHOLD_MFJ_LOW) * 0.5);
    const additional = (combinedIncome - SS_TAX_THRESHOLD_MFJ_HIGH) * 0.85;
    return Math.min(annualSSBenefit * 0.85, base + additional);
  }
}

/** Compute effective tax rate */
export function effectiveTaxRate(
  grossIncome: number,
  filingStatus: "married_joint" | "single",
): number {
  if (grossIncome <= 0) return 0;
  const tax = estimateFederalTax(grossIncome, filingStatus);
  return tax / grossIncome;
}
