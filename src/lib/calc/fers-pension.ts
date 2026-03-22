import {
  FERS_MULTIPLIER,
  FERS_MULTIPLIER_62_PLUS,
  FERS_SURVIVOR_FULL_REDUCTION,
  FERS_SURVIVOR_PARTIAL_REDUCTION,
  FERS_COLA_CPI_THRESHOLD,
  getMRAForBirthYear,
} from "../constants";

/** Compute annual FERS annuity before survivor reduction */
export function computeFERSAnnuity(
  high3Salary: number,
  yearsOfService: number,
  retirementAge: number,
): number {
  const multiplier =
    retirementAge >= 62 && yearsOfService >= 20
      ? FERS_MULTIPLIER_62_PLUS
      : FERS_MULTIPLIER;
  return high3Salary * multiplier * yearsOfService;
}

/** Compute FERS Supplement (bridge payment from MRA/60 to 62) */
export function computeFERSSupplement(
  yearsOfService: number,
  estimatedFullSSBenefit: number,
): number {
  // Approximate: (FERS years / 40) × full SS benefit
  const totalSSYears = 40;
  return (yearsOfService / totalSSYears) * estimatedFullSSBenefit;
}

/** Apply survivor annuity reduction */
export function applySurvivorReduction(
  annualPension: number,
  election: "full" | "partial" | "none",
): number {
  switch (election) {
    case "full":
      return annualPension * (1 - FERS_SURVIVOR_FULL_REDUCTION);
    case "partial":
      return annualPension * (1 - FERS_SURVIVOR_PARTIAL_REDUCTION);
    case "none":
      return annualPension;
  }
}

/** Apply FERS COLA to pension */
export function applyFERSCOLA(annualPension: number, cpiRate: number): number {
  let cola: number;
  if (cpiRate <= FERS_COLA_CPI_THRESHOLD) {
    cola = cpiRate;
  } else if (cpiRate <= 0.03) {
    cola = 0.02;
  } else {
    cola = cpiRate - 0.01;
  }
  return annualPension * (1 + cola);
}

/** Get Minimum Retirement Age for a birth year */
export function getMRA(birthYear: number): number {
  return getMRAForBirthYear(birthYear);
}

/** Compute full pension details */
export function computeFullPension(
  high3Salary: number,
  yearsOfService: number,
  retirementAge: number,
  survivorElection: "full" | "partial" | "none",
  estimatedSSBenefit: number,
): {
  annualPension: number;
  monthlyPension: number;
  netAfterSurvivor: number;
  netMonthlyAfterSurvivor: number;
  supplementMonthly: number;
  supplementAnnual: number;
} {
  const annualPension = computeFERSAnnuity(high3Salary, yearsOfService, retirementAge);
  const netAfterSurvivor = applySurvivorReduction(annualPension, survivorElection);
  const supplementAnnual = computeFERSSupplement(yearsOfService, estimatedSSBenefit);

  return {
    annualPension,
    monthlyPension: annualPension / 12,
    netAfterSurvivor,
    netMonthlyAfterSurvivor: netAfterSurvivor / 12,
    supplementMonthly: supplementAnnual / 12,
    supplementAnnual,
  };
}
