import type { RetirementInputs, ProjectionYear, RetirementResult } from "../types/calculator";
import { computeFERSAnnuity, applySurvivorReduction, computeFERSSupplement, applyFERSCOLA } from "./fers-pension";
import { projectTSP, tspWithdrawalAmount } from "./tsp";
import { getFullRetirementAge, interpolateBenefit, computeSpousalBenefit } from "./social-security";
import { estimateFederalTax, computeSSTaxableAmount } from "./tax";
import { inflateAmount } from "./compound";
import { DEFAULT_CPI_RATE } from "../constants";

/** Generate combined year-by-year retirement projection */
export function projectRetirement(inputs: RetirementInputs): RetirementResult {
  const { fers, tsp, ss, spousal, expenses, tax } = inputs;
  const currentYear = new Date().getFullYear();
  const lifeExpectancy = ss.lifeExpectancy;
  const ssClaimingAge = inputs.ssClaimingAge;
  const projections: ProjectionYear[] = [];

  // Pre-compute values
  const fra = getFullRetirementAge(ss.birthYear);
  const spousalFRA = getFullRetirementAge(spousal.spouseBirthYear);
  const basePension = computeFERSAnnuity(fers.high3Salary, fers.yearsOfService, fers.retirementAge);
  const pensionAfterSurvivor = applySurvivorReduction(basePension, fers.survivorAnnuityElection);

  // Use SSA statement estimates to get benefit at claiming age
  const b62 = ss.monthlyBenefitAt62 || 0;
  const bFRA = ss.monthlyBenefitAtFRA || 0;
  const b70 = ss.monthlyBenefitAt70 || 0;
  const workerSSMonthly = interpolateBenefit(ssClaimingAge, b62, bFRA, b70, fra);
  const workerSSAnnual = workerSSMonthly * 12;

  // FERS supplement (from retirement to 62)
  const fersSupplementAnnual = fers.fersSupplementEligible
    ? computeFERSSupplement(fers.yearsOfService, bFRA * 12)
    : 0;

  // TSP projection during working years
  const tspProjection = projectTSP({
    currentBalance: tsp.currentBalance,
    annualSalary: tsp.annualSalary,
    employeeContribRate: tsp.employeeContribRate,
    expectedReturnRate: tsp.expectedReturnRate,
    currentAge: fers.currentAge,
    retirementAge: fers.retirementAge,
    catchUpEligible: tsp.catchUpEligible,
  });

  let tspBalance = tspProjection.length > 0
    ? tspProjection[tspProjection.length - 1].endBalance
    : tsp.currentBalance;

  let peakTSP = tspBalance;
  let cumulativeSurplus = 0;
  let totalLifetimeIncome = 0;
  let shortfallAge: number | null = null;
  let currentPension = pensionAfterSurvivor;

  for (let age = fers.currentAge; age <= lifeExpectancy; age++) {
    const yearIndex = age - fers.currentAge;
    const year = currentYear + yearIndex;
    const isRetired = age >= fers.retirementAge;

    // Pre-retirement
    if (!isRetired) {
      const tspYear = tspProjection.find((t) => t.age === age);
      const tspContrib = tspYear ? tspYear.employeeContrib + tspYear.agencyMatch : 0;
      tspBalance = tspYear ? tspYear.endBalance : tspBalance;
      peakTSP = Math.max(peakTSP, tspBalance);

      const expenseAmount = inflateAmount(expenses.preRetirement, expenses.inflationRate, yearIndex);

      projections.push({
        age,
        year,
        isRetired: false,
        fersPension: 0,
        fersSupplementIncome: 0,
        tspContribution: Math.round(tspContrib),
        tspWithdrawal: 0,
        tspBalance: Math.round(tspBalance),
        ssWorkerBenefit: 0,
        ssSpousalBenefit: 0,
        otherIncome: 0,
        totalGrossIncome: Math.round(tsp.annualSalary),
        estimatedTaxes: Math.round(estimateFederalTax(tsp.annualSalary, tax.filingStatus)),
        totalNetIncome: 0,
        expenses: Math.round(expenseAmount),
        surplus: 0,
        cumulativeSurplus: 0,
      });
      continue;
    }

    // Retired years
    const yearsRetired = age - fers.retirementAge;

    // FERS pension with COLA (COLA starts at 62)
    if (age >= 62 && yearsRetired > 0) {
      currentPension = applyFERSCOLA(currentPension, DEFAULT_CPI_RATE);
    }

    // FERS supplement (retirement age to 62)
    const supplement = age < 62 && fers.fersSupplementEligible ? fersSupplementAnnual : 0;

    // Social Security
    const ssWorker = age >= ssClaimingAge ? workerSSAnnual : 0;
    const spousalAge = age - (ss.birthYear - spousal.spouseBirthYear);
    const ssSpousal =
      age >= ssClaimingAge && !spousal.isWorking
        ? computeSpousalBenefit(bFRA, Math.max(62, spousalAge), spousalFRA) * 12
        : 0;

    // Other income
    const otherInc = inputs.otherIncome
      .filter((o) => age >= o.startAge && age <= o.endAge)
      .reduce((sum, o) => sum + o.annualAmount, 0);

    // TSP withdrawal
    const yearsRemaining = lifeExpectancy - age;
    const expenseAmount = inflateAmount(expenses.postRetirement, expenses.inflationRate, yearIndex);
    const incomeWithoutTSP = currentPension + supplement + ssWorker + ssSpousal + otherInc;

    let tspWithdrawal = 0;
    if (incomeWithoutTSP < expenseAmount && tspBalance > 0) {
      tspWithdrawal = Math.min(expenseAmount - incomeWithoutTSP, tspBalance);
    }

    // TSP growth on remaining balance
    const tspGrowth = (tspBalance - tspWithdrawal * 0.5) * tsp.expectedReturnRate;
    tspBalance = Math.max(0, tspBalance - tspWithdrawal + tspGrowth);
    peakTSP = Math.max(peakTSP, tspBalance);

    // Track shortfall
    if (tspBalance <= 0 && incomeWithoutTSP < expenseAmount && shortfallAge === null) {
      shortfallAge = age;
    }

    // Taxes
    const nonSSIncome = currentPension + supplement + tspWithdrawal + otherInc;
    const ssTaxable = computeSSTaxableAmount(ssWorker + ssSpousal, nonSSIncome);
    const taxableIncome = nonSSIncome + ssTaxable;
    const taxes = estimateFederalTax(taxableIncome, tax.filingStatus);

    const totalGross = currentPension + supplement + tspWithdrawal + ssWorker + ssSpousal + otherInc;
    const totalNet = totalGross - taxes;
    const surplus = totalNet - expenseAmount;
    cumulativeSurplus += surplus;
    totalLifetimeIncome += totalGross;

    projections.push({
      age,
      year,
      isRetired: true,
      fersPension: Math.round(currentPension),
      fersSupplementIncome: Math.round(supplement),
      tspContribution: 0,
      tspWithdrawal: Math.round(tspWithdrawal),
      tspBalance: Math.round(tspBalance),
      ssWorkerBenefit: Math.round(ssWorker),
      ssSpousalBenefit: Math.round(ssSpousal),
      otherIncome: Math.round(otherInc),
      totalGrossIncome: Math.round(totalGross),
      estimatedTaxes: Math.round(taxes),
      totalNetIncome: Math.round(totalNet),
      expenses: Math.round(expenseAmount),
      surplus: Math.round(surplus),
      cumulativeSurplus: Math.round(cumulativeSurplus),
    });
  }

  // Safe withdrawal from TSP at retirement
  const tspAtRetirement = tspProjection.length > 0
    ? tspProjection[tspProjection.length - 1].endBalance
    : tsp.currentBalance;
  const retirementYears = lifeExpectancy - fers.retirementAge;
  const safeWithdrawal = tspWithdrawalAmount(tspAtRetirement, retirementYears, tsp.expectedReturnRate * 0.5);

  return {
    projections,
    retirementReady: shortfallAge === null,
    shortfallAge,
    peakTSPBalance: Math.round(peakTSP),
    totalLifetimeIncome: Math.round(totalLifetimeIncome),
    safeWithdrawalFromTSP: Math.round(safeWithdrawal),
  };
}
