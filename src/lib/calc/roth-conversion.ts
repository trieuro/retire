/**
 * Roth Conversion Strategy Planner
 *
 * Goal: Convert traditional TSP/IRA to Roth during low-income years
 * (between retirement and RMD start) to reduce future RMD tax burden.
 *
 * Strategy: "Fill up" low tax brackets each year with conversions.
 */

import { TAX_BRACKETS_MFJ, TAX_STANDARD_DEDUCTION_MFJ } from "../constants";
import { estimateFederalTax } from "./tax";
import { calculateRMD, getRMDStartAge } from "./rmd";

export interface RothConversionYear {
  age: number;
  year: number;
  traditionalBalance: number;
  rothBalance: number;
  otherIncome: number;
  conversionAmount: number;
  taxOnConversion: number;
  effectiveTaxRate: number;
  targetBracket: string;
  projectedRMDWithout: number;
  projectedRMDWith: number;
  rmdSavings: number;
}

export interface RothConversionPlan {
  years: RothConversionYear[];
  totalConverted: number;
  totalTaxPaid: number;
  averageTaxRate: number;
  projectedRMDReduction: number;
  traditionalBalanceAtRMD: number;
  rothBalanceAtRMD: number;
}

/** Get the top of a tax bracket for MFJ (taxable income, not gross) */
function getBracketTop(bracketIndex: number): number {
  if (bracketIndex < 0 || bracketIndex >= TAX_BRACKETS_MFJ.length) return 0;
  return TAX_BRACKETS_MFJ[bracketIndex].max;
}

/** Get bracket label */
function getBracketLabel(bracketIndex: number): string {
  if (bracketIndex < 0 || bracketIndex >= TAX_BRACKETS_MFJ.length) return "0%";
  return `${(TAX_BRACKETS_MFJ[bracketIndex].rate * 100).toFixed(0)}%`;
}

/**
 * Plan Roth conversions to fill up to a target tax bracket.
 *
 * @param targetBracketIndex - Fill up to this bracket (0=10%, 1=12%, 2=22%, etc.)
 *   Recommended: 1 (12% bracket) for most retirees, 2 (22%) if aggressive
 */
export function planRothConversions(params: {
  currentAge: number;
  birthYear: number;
  retirementAge: number;
  traditionalBalance: number;
  rothBalance: number;
  annualPension: number;
  annualSSBenefit: number;
  ssStartAge: number;
  otherAnnualIncome: number;
  expectedReturnRate: number;
  targetBracketIndex: number;
  lifeExpectancy: number;
}): RothConversionPlan {
  const {
    currentAge, birthYear, retirementAge, expectedReturnRate,
    targetBracketIndex, lifeExpectancy,
  } = params;

  const rmdStartAge = getRMDStartAge(birthYear);
  const conversionStartAge = Math.max(currentAge, retirementAge);
  const conversionEndAge = rmdStartAge - 1; // Stop converting before RMDs start
  const currentYear = new Date().getFullYear();

  let traditionalBal = params.traditionalBalance;
  let rothBal = params.rothBalance;
  const years: RothConversionYear[] = [];
  let totalConverted = 0;
  let totalTaxPaid = 0;

  // Track what balance would be WITHOUT conversions for comparison
  let traditionalBalNoConversion = params.traditionalBalance;

  for (let age = conversionStartAge; age <= Math.min(conversionEndAge, lifeExpectancy); age++) {
    const yearIndex = age - currentAge;
    const year = currentYear + yearIndex;

    // Other income this year
    let otherIncome = params.annualPension;
    if (age >= params.ssStartAge) {
      otherIncome += params.annualSSBenefit;
    }
    otherIncome += params.otherAnnualIncome;

    // How much room in the target bracket?
    const bracketTop = getBracketTop(targetBracketIndex);
    const taxableIncomeBeforeConversion = Math.max(0, otherIncome - TAX_STANDARD_DEDUCTION_MFJ);
    const roomInBracket = Math.max(0, bracketTop - taxableIncomeBeforeConversion);

    // Convert up to the room available (don't exceed traditional balance)
    const conversionAmount = Math.min(roomInBracket, traditionalBal);

    // Tax on this conversion
    const taxWithout = estimateFederalTax(otherIncome, "married_joint");
    const taxWith = estimateFederalTax(otherIncome + conversionAmount, "married_joint");
    const taxOnConversion = taxWith - taxWithout;
    const effectiveRate = conversionAmount > 0 ? taxOnConversion / conversionAmount : 0;

    // Move money: traditional → Roth
    traditionalBal -= conversionAmount;
    rothBal += conversionAmount;
    totalConverted += conversionAmount;
    totalTaxPaid += taxOnConversion;

    // Growth on remaining balances
    traditionalBal *= (1 + expectedReturnRate);
    rothBal *= (1 + expectedReturnRate);
    traditionalBalNoConversion *= (1 + expectedReturnRate);

    // Projected RMDs at RMD start age (comparing with and without conversion)
    const projectedRMDWithout = calculateRMD(traditionalBalNoConversion, rmdStartAge, birthYear);
    const projectedRMDWith = calculateRMD(traditionalBal, rmdStartAge, birthYear);

    years.push({
      age,
      year,
      traditionalBalance: Math.round(traditionalBal),
      rothBalance: Math.round(rothBal),
      otherIncome: Math.round(otherIncome),
      conversionAmount: Math.round(conversionAmount),
      taxOnConversion: Math.round(taxOnConversion),
      effectiveTaxRate: Math.round(effectiveRate * 1000) / 10,
      targetBracket: getBracketLabel(targetBracketIndex),
      projectedRMDWithout: Math.round(projectedRMDWithout),
      projectedRMDWith: Math.round(projectedRMDWith),
      rmdSavings: Math.round(projectedRMDWithout - projectedRMDWith),
    });
  }

  const lastYear = years[years.length - 1];
  const avgRate = totalConverted > 0 ? totalTaxPaid / totalConverted : 0;

  return {
    years,
    totalConverted: Math.round(totalConverted),
    totalTaxPaid: Math.round(totalTaxPaid),
    averageTaxRate: Math.round(avgRate * 1000) / 10,
    projectedRMDReduction: lastYear ? lastYear.rmdSavings : 0,
    traditionalBalanceAtRMD: lastYear ? lastYear.traditionalBalance : Math.round(traditionalBal),
    rothBalanceAtRMD: lastYear ? lastYear.rothBalance : Math.round(rothBal),
  };
}
