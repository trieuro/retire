/**
 * Roth Conversion Strategy Planner
 *
 * Goal: Convert traditional TSP/IRA to Roth during low-income years
 * (between retirement and RMD start) to reduce future RMD tax burden.
 *
 * Two-phase strategy:
 *   Phase 1 (pre-SS): Aggressively fill a higher bracket while income is low
 *   Phase 2 (post-SS): Scale back to a lower bracket once SS income starts
 */

import { TAX_BRACKETS_MFJ, TAX_STANDARD_DEDUCTION_MFJ } from "../constants";
import { estimateTotalTax } from "./tax";
import { calculateRMD, getRMDStartAge } from "./rmd";

export interface RothConversionYear {
  age: number;
  year: number;
  phase: 1 | 2;
  traditionalBalance: number;
  rothBalance: number;
  otherIncome: number;
  expenses: number;
  expenseGap: number;
  tspWithdrawalForExpenses: number;
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
 * Plan Roth conversions with a two-phase bracket strategy.
 *
 * Phase 1 (retirement to SS start): Fill up to phase1BracketIndex (aggressive)
 * Phase 2 (SS start to RMD):        Fill up to phase2BracketIndex (conservative)
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
  spousalSSBenefit: number;
  spousalSSStartAge: number;
  otherAnnualIncome: number;
  expectedReturnRate: number;
  /** Bracket target for Phase 1 (pre-SS, aggressive) */
  phase1BracketIndex: number;
  /** Bracket target for Phase 2 (post-SS, conservative) */
  phase2BracketIndex: number;
  annualExpenses: number;
  inflationRate: number;
  lifeExpectancy: number;
  filingStatus?: "married_joint" | "single";
  state?: string;
}): RothConversionPlan {
  const {
    currentAge, birthYear, retirementAge, expectedReturnRate,
    phase1BracketIndex, phase2BracketIndex, lifeExpectancy,
    annualExpenses, inflationRate,
    filingStatus = "married_joint",
    state = "MD",
  } = params;

  const rmdStartAge = getRMDStartAge(birthYear);
  const conversionStartAge = Math.max(currentAge, retirementAge);
  const conversionEndAge = rmdStartAge - 1;
  const currentYear = new Date().getFullYear();

  let traditionalBal = params.traditionalBalance;
  let rothBal = params.rothBalance;
  const years: RothConversionYear[] = [];
  let totalConverted = 0;
  let totalTaxPaid = 0;

  let traditionalBalNoConversion = params.traditionalBalance;

  for (let age = conversionStartAge; age <= Math.min(conversionEndAge, lifeExpectancy); age++) {
    const yearIndex = age - currentAge;
    const year = currentYear + yearIndex;

    // Determine phase: before SS = phase 1 (aggressive), after = phase 2
    const ssStarted = age >= params.ssStartAge;
    const phase: 1 | 2 = ssStarted ? 2 : 1;
    const targetBracketIndex = ssStarted ? phase2BracketIndex : phase1BracketIndex;

    // Income this year (pension + SS + spousal SS + other)
    let otherIncome = params.annualPension;
    const ssIncome = ssStarted ? params.annualSSBenefit : 0;
    const spousalSS = age >= params.spousalSSStartAge ? params.spousalSSBenefit : 0;
    otherIncome += ssIncome + spousalSS + params.otherAnnualIncome;

    // Expenses this year (inflation-adjusted from retirement start)
    const yearsFromRetirement = age - retirementAge;
    const expenses = Math.round(annualExpenses * Math.pow(1 + inflationRate, yearsFromRetirement));

    // Expense gap: if income doesn't cover expenses, must withdraw from TSP
    // Tax on base income (without any withdrawal or conversion)
    const totalSSIncome = ssIncome + spousalSS;
    const baseTax = estimateTotalTax({
      pensionIncome: params.annualPension,
      tspWithdrawal: 0,
      ssIncome: totalSSIncome,
      otherIncome: params.otherAnnualIncome,
      filingStatus,
      age,
      state,
    }).total;
    const netIncome = otherIncome - baseTax;
    const expenseGap = Math.max(0, expenses - netIncome);

    // If there's a gap, withdraw from traditional TSP (taxable withdrawal)
    const tspWithdrawalForExpenses = Math.min(expenseGap, traditionalBal);
    traditionalBal -= tspWithdrawalForExpenses;
    traditionalBalNoConversion -= Math.min(expenseGap, traditionalBalNoConversion);

    // Room in the target bracket, accounting for the expense withdrawal as taxable income
    const bracketTop = getBracketTop(targetBracketIndex);
    const totalGrossBeforeConversion = otherIncome + tspWithdrawalForExpenses;
    const taxableIncomeBeforeConversion = Math.max(0, totalGrossBeforeConversion - TAX_STANDARD_DEDUCTION_MFJ);
    const roomInBracket = Math.max(0, bracketTop - taxableIncomeBeforeConversion);

    const conversionAmount = Math.min(roomInBracket, traditionalBal);

    // Tax on conversion (incremental: tax with conversion - tax without)
    const taxWithout = estimateTotalTax({
      pensionIncome: params.annualPension,
      tspWithdrawal: tspWithdrawalForExpenses,
      ssIncome: totalSSIncome,
      otherIncome: params.otherAnnualIncome,
      filingStatus,
      age,
      state,
    }).total;
    const taxWith = estimateTotalTax({
      pensionIncome: params.annualPension,
      tspWithdrawal: tspWithdrawalForExpenses + conversionAmount,
      ssIncome: totalSSIncome,
      otherIncome: params.otherAnnualIncome,
      filingStatus,
      age,
      state,
    }).total;
    const taxOnConversion = taxWith - taxWithout;
    const effectiveRate = conversionAmount > 0 ? taxOnConversion / conversionAmount : 0;

    traditionalBal -= conversionAmount;
    rothBal += conversionAmount;
    totalConverted += conversionAmount;
    totalTaxPaid += taxOnConversion;

    traditionalBal *= (1 + expectedReturnRate);
    rothBal *= (1 + expectedReturnRate);
    traditionalBalNoConversion *= (1 + expectedReturnRate);

    const projectedRMDWithout = calculateRMD(traditionalBalNoConversion, rmdStartAge, birthYear);
    const projectedRMDWith = calculateRMD(traditionalBal, rmdStartAge, birthYear);

    years.push({
      age,
      year,
      phase,
      traditionalBalance: Math.round(traditionalBal),
      rothBalance: Math.round(rothBal),
      otherIncome: Math.round(otherIncome),
      expenses: Math.round(expenses),
      expenseGap: Math.round(expenseGap),
      tspWithdrawalForExpenses: Math.round(tspWithdrawalForExpenses),
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
