import {
  TAX_BRACKETS_MFJ,
  TAX_BRACKETS_SINGLE,
  TAX_STANDARD_DEDUCTION_MFJ,
  TAX_STANDARD_DEDUCTION_SINGLE,
  SS_TAX_THRESHOLD_MFJ_LOW,
  SS_TAX_THRESHOLD_MFJ_HIGH,
} from "../constants";

// Delaware state tax brackets (2025)
const DE_TAX_BRACKETS: { min: number; max: number; rate: number }[] = [
  { min: 0, max: 2000, rate: 0.0 },
  { min: 2000, max: 5000, rate: 0.022 },
  { min: 5000, max: 10000, rate: 0.039 },
  { min: 10000, max: 20000, rate: 0.048 },
  { min: 20000, max: 25000, rate: 0.052 },
  { min: 25000, max: 60000, rate: 0.055 },
  { min: 60000, max: Infinity, rate: 0.066 },
];

const DE_STANDARD_DEDUCTION_MFJ = 6500;
const DE_STANDARD_DEDUCTION_SINGLE = 3250;
// Delaware pension exclusion for age 60+ or disabled
const DE_PENSION_EXCLUSION_60_PLUS = 12500;

// Maryland state tax brackets (2025, MFJ)
const MD_TAX_BRACKETS: { min: number; max: number; rate: number }[] = [
  { min: 0, max: 1000, rate: 0.02 },
  { min: 1000, max: 2000, rate: 0.03 },
  { min: 2000, max: 3000, rate: 0.04 },
  { min: 3000, max: 100000, rate: 0.0475 },
  { min: 100000, max: 125000, rate: 0.05 },
  { min: 125000, max: 150000, rate: 0.0525 },
  { min: 150000, max: 250000, rate: 0.055 },
  { min: 250000, max: Infinity, rate: 0.0575 },
];

// Harford County local tax rate
const MD_COUNTY_RATE = 0.0306;

// Maryland standard deduction: 15% of AGI, min $4,550, max $5,150 (MFJ 2025)
const MD_STD_DEDUCTION_MFJ_MIN = 4550;
const MD_STD_DEDUCTION_MFJ_MAX = 5150;
const MD_STD_DEDUCTION_SINGLE_MIN = 2275;
const MD_STD_DEDUCTION_SINGLE_MAX = 2575;
const MD_STD_DEDUCTION_RATE = 0.15;

// Maryland pension exclusion: up to $36,200 for age 65+
const MD_PENSION_EXCLUSION_65_PLUS = 36200;

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

/** Estimate Delaware state income tax */
export function estimateDelawareTax(params: {
  pensionIncome: number;
  tspWithdrawal: number;
  ssIncome: number;
  otherIncome: number;
  filingStatus: "married_joint" | "single";
  age: number;
}): number {
  const { pensionIncome, tspWithdrawal, ssIncome, otherIncome, filingStatus, age } = params;

  // Delaware does NOT tax Social Security benefits
  let taxableIncome = tspWithdrawal + otherIncome;

  // FERS pension: $12,500 exclusion if age 60+, per person
  // For MFJ, each spouse can claim the exclusion on their own pension
  if (age >= 60) {
    const pensionAfterExclusion = Math.max(0, pensionIncome - DE_PENSION_EXCLUSION_60_PLUS);
    taxableIncome += pensionAfterExclusion;
  } else {
    taxableIncome += pensionIncome;
  }

  // Standard deduction
  const deduction = filingStatus === "married_joint"
    ? DE_STANDARD_DEDUCTION_MFJ
    : DE_STANDARD_DEDUCTION_SINGLE;
  taxableIncome = Math.max(0, taxableIncome - deduction);

  // Apply DE brackets
  let tax = 0;
  for (const bracket of DE_TAX_BRACKETS) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }

  return Math.round(tax);
}

/** Estimate Maryland state + county income tax */
export function estimateMarylandTax(params: {
  pensionIncome: number;
  tspWithdrawal: number;
  ssIncome: number;
  otherIncome: number;
  filingStatus: "married_joint" | "single";
  age: number;
}): number {
  const { pensionIncome, tspWithdrawal, otherIncome, filingStatus, age } = params;

  // Maryland does NOT tax Social Security benefits
  let grossIncome = pensionIncome + tspWithdrawal + otherIncome;

  // Pension exclusion: up to $36,200 for age 65+
  if (age >= 65) {
    const pensionExclusion = Math.min(pensionIncome, MD_PENSION_EXCLUSION_65_PLUS);
    grossIncome -= pensionExclusion;
  }

  // Maryland standard deduction: 15% of AGI, with min/max
  const dedMin = filingStatus === "married_joint" ? MD_STD_DEDUCTION_MFJ_MIN : MD_STD_DEDUCTION_SINGLE_MIN;
  const dedMax = filingStatus === "married_joint" ? MD_STD_DEDUCTION_MFJ_MAX : MD_STD_DEDUCTION_SINGLE_MAX;
  const deduction = Math.max(dedMin, Math.min(dedMax, grossIncome * MD_STD_DEDUCTION_RATE));
  const taxableIncome = Math.max(0, grossIncome - deduction);

  // State tax
  let stateTax = 0;
  for (const bracket of MD_TAX_BRACKETS) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    stateTax += taxableInBracket * bracket.rate;
  }

  // County tax (Harford County: 3.06% on taxable income)
  const countyTax = taxableIncome * MD_COUNTY_RATE;

  return Math.round(stateTax + countyTax);
}

/** Estimate combined federal + state tax */
export function estimateTotalTax(params: {
  pensionIncome: number;
  tspWithdrawal: number;
  ssIncome: number;
  otherIncome: number;
  filingStatus: "married_joint" | "single";
  age: number;
  state: string;
}): { federal: number; state: number; total: number } {
  const { pensionIncome, tspWithdrawal, ssIncome, otherIncome, filingStatus, state, age } = params;

  // Federal tax
  const nonSSIncome = pensionIncome + tspWithdrawal + otherIncome;
  const ssTaxable = computeSSTaxableAmount(ssIncome, nonSSIncome);
  const federalTaxableIncome = nonSSIncome + ssTaxable;
  const federal = estimateFederalTax(federalTaxableIncome, filingStatus);

  // State tax
  let stateTax = 0;
  if (state === "DE") {
    stateTax = estimateDelawareTax({
      pensionIncome,
      tspWithdrawal,
      ssIncome,
      otherIncome,
      filingStatus,
      age,
    });
  } else if (state === "MD") {
    stateTax = estimateMarylandTax({
      pensionIncome,
      tspWithdrawal,
      ssIncome,
      otherIncome,
      filingStatus,
      age,
    });
  }

  return {
    federal,
    state: stateTax,
    total: federal + stateTax,
  };
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
