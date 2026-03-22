import { TSP_ANNUAL_LIMIT, TSP_CATCHUP_LIMIT, TSP_CATCHUP_AGE } from "../constants";
import type { TSPProjectionYear } from "../types/fers";

/** Compute agency match based on employee contribution rate */
export function computeAgencyMatch(
  annualSalary: number,
  employeeContribRate: number,
): number {
  // Agency auto-contributes 1%
  const autoContrib = annualSalary * 0.01;

  // Match: first 3% dollar-for-dollar, next 2% at 50 cents
  const employeeRate = Math.min(employeeContribRate, 1);
  const matchFirst3 = Math.min(employeeRate, 0.03) * annualSalary;
  const matchNext2 = Math.max(0, Math.min(employeeRate - 0.03, 0.02)) * annualSalary * 0.5;

  return autoContrib + matchFirst3 + matchNext2;
}

/** Project TSP balance year by year */
export function projectTSP(inputs: {
  currentBalance: number;
  annualSalary: number;
  employeeContribRate: number;
  expectedReturnRate: number;
  currentAge: number;
  retirementAge: number;
  catchUpEligible: boolean;
  salaryGrowthRate?: number;
}): TSPProjectionYear[] {
  const projections: TSPProjectionYear[] = [];
  let balance = inputs.currentBalance;
  let salary = inputs.annualSalary;
  const salaryGrowth = inputs.salaryGrowthRate ?? 0.02;
  const currentYear = new Date().getFullYear();

  for (let age = inputs.currentAge; age < inputs.retirementAge; age++) {
    const startBalance = balance;
    const yearIndex = age - inputs.currentAge;

    // Employee contribution (capped at IRS limit)
    let maxContrib = TSP_ANNUAL_LIMIT;
    if (inputs.catchUpEligible && age >= TSP_CATCHUP_AGE) {
      maxContrib += TSP_CATCHUP_LIMIT;
    }
    const employeeContrib = Math.min(
      salary * inputs.employeeContribRate,
      maxContrib,
    );

    // Agency match
    const agencyMatch = computeAgencyMatch(salary, inputs.employeeContribRate);

    // Growth on balance + contributions (simplified: mid-year contributions)
    const totalContrib = employeeContrib + agencyMatch;
    const growth = (startBalance + totalContrib * 0.5) * inputs.expectedReturnRate;
    const endBalance = startBalance + totalContrib + growth;

    projections.push({
      age,
      year: currentYear + yearIndex,
      startBalance: Math.round(startBalance),
      employeeContrib: Math.round(employeeContrib),
      agencyMatch: Math.round(agencyMatch),
      growth: Math.round(growth),
      endBalance: Math.round(endBalance),
    });

    balance = endBalance;
    salary *= 1 + salaryGrowth;
  }

  return projections;
}

/** Compute annual TSP withdrawal to last N years */
export function tspWithdrawalAmount(
  balance: number,
  yearsRemaining: number,
  expectedReturn: number,
): number {
  if (yearsRemaining <= 0) return 0;
  if (expectedReturn === 0) return balance / yearsRemaining;
  const r = expectedReturn;
  const n = yearsRemaining;
  return (balance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}
