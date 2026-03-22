import {
  SS_FRA_TABLE,
  SS_SPOUSAL_MAX_PERCENT,
  SS_EARLY_REDUCTION_FIRST_36_PER_MONTH,
  SS_EARLY_REDUCTION_AFTER_36_PER_MONTH,
} from "../constants";
import type {
  SSClaimingOption,
  SpousalClaimingResult,
  SSAnalysisResult,
  SSInputs,
  SpousalInputs,
} from "../types/social-security";

/** Get Full Retirement Age from birth year */
export function getFullRetirementAge(birthYear: number): number {
  for (const [start, end, years, months] of SS_FRA_TABLE) {
    if (birthYear >= start && birthYear <= end) {
      return years + months / 12;
    }
  }
  return 67;
}

/**
 * Interpolate monthly benefit for any claiming age (62-70)
 * using the three SSA statement estimates (at 62, FRA, and 70).
 * SSA provides estimates for each year 62-70 on the statement,
 * but this function interpolates smoothly between the anchors.
 */
export function interpolateBenefit(
  claimingAge: number,
  benefitAt62: number,
  benefitAtFRA: number,
  benefitAt70: number,
  fra: number,
): number {
  if (claimingAge <= 62) return benefitAt62;
  if (claimingAge >= 70) return benefitAt70;

  if (claimingAge <= fra) {
    // Linear interpolation between 62 and FRA
    const t = (claimingAge - 62) / (fra - 62);
    return benefitAt62 + t * (benefitAtFRA - benefitAt62);
  } else {
    // Linear interpolation between FRA and 70
    const t = (claimingAge - fra) / (70 - fra);
    return benefitAtFRA + t * (benefitAt70 - benefitAtFRA);
  }
}

/** Compute spousal benefit (non-working spouse gets up to 50% of worker's FRA benefit) */
export function computeSpousalBenefit(
  workerBenefitAtFRA: number,
  spousalClaimingAge: number,
  spousalFRA: number,
): number {
  const maxSpousal = workerBenefitAtFRA * SS_SPOUSAL_MAX_PERCENT;

  if (spousalClaimingAge >= spousalFRA) {
    return maxSpousal;
  }

  // Early reduction for spousal benefits
  const monthsEarly = Math.round((spousalFRA - spousalClaimingAge) * 12);
  const first36 = Math.min(monthsEarly, 36);
  const after36 = Math.max(0, monthsEarly - 36);
  const reduction =
    first36 * SS_EARLY_REDUCTION_FIRST_36_PER_MONTH +
    after36 * SS_EARLY_REDUCTION_AFTER_36_PER_MONTH;

  return maxSpousal * (1 - reduction);
}

/** Compute survivor benefit (100% of worker's benefit) */
export function computeSurvivorBenefit(workerMonthlyBenefit: number): number {
  return workerMonthlyBenefit;
}

/** Compute lifetime total benefits from claiming age to life expectancy */
function lifetimeTotal(
  monthlyBenefit: number,
  claimingAge: number,
  lifeExpectancy: number,
): number {
  const years = lifeExpectancy - claimingAge;
  if (years <= 0) return 0;
  return monthlyBenefit * 12 * years;
}

/** Find breakeven age between two claiming options */
function breakevenAge(
  earlyMonthly: number,
  earlyAge: number,
  lateMonthly: number,
  lateAge: number,
): number | null {
  if (lateMonthly <= earlyMonthly) return null;

  const age =
    (earlyMonthly * earlyAge - lateMonthly * lateAge) /
    (earlyMonthly - lateMonthly);

  if (age < lateAge || age > 120) return null;
  return Math.round(age * 10) / 10;
}

/** Analyze all claiming options using SSA statement estimates */
export function analyzeClaimingOptions(
  ssInputs: SSInputs,
  spousalInputs?: SpousalInputs,
): SSAnalysisResult {
  const fra = getFullRetirementAge(ssInputs.birthYear);
  const lifeExp = ssInputs.lifeExpectancy;

  const benefit62 = ssInputs.monthlyBenefitAt62;
  const benefitFRA = ssInputs.monthlyBenefitAtFRA;
  const benefit70 = ssInputs.monthlyBenefitAt70;

  // Worker options (62-70)
  const workerOptions: SSClaimingOption[] = [];

  for (let age = 62; age <= 70; age++) {
    const monthly = interpolateBenefit(age, benefit62, benefitFRA, benefit70, fra);
    const annual = monthly * 12;
    const total = lifetimeTotal(monthly, age, lifeExp);
    const pctChange = ((monthly - benefitFRA) / benefitFRA) * 100;
    const sign = pctChange >= 0 ? "+" : "";

    workerOptions.push({
      claimingAge: age,
      monthlyBenefit: Math.round(monthly),
      annualBenefit: Math.round(annual),
      lifetimeTotal: Math.round(total),
      reductionOrIncrease: `${sign}${pctChange.toFixed(0)}%`,
      breakevenVs62: age === 62 ? null : breakevenAge(benefit62, 62, monthly, age),
      breakevenVsFRA:
        age <= Math.ceil(fra)
          ? null
          : breakevenAge(benefitFRA, Math.ceil(fra), monthly, age),
    });
  }

  // Combined options with spousal benefits
  const combinedOptions: SpousalClaimingResult[] = [];
  if (spousalInputs && !spousalInputs.isWorking) {
    const spousalFRA = getFullRetirementAge(spousalInputs.spouseBirthYear);
    const spousalLifeExp = spousalInputs.spouseLifeExpectancy ?? lifeExp;

    for (let workerAge = 62; workerAge <= 70; workerAge++) {
      const workerMonthly = interpolateBenefit(workerAge, benefit62, benefitFRA, benefit70, fra);
      // Spouse can claim when worker claims
      const spousalAge = workerAge - (ssInputs.birthYear - spousalInputs.spouseBirthYear);
      const spousalMonthly = computeSpousalBenefit(
        benefitFRA,
        Math.max(62, spousalAge),
        spousalFRA,
      );
      const combined = workerMonthly + spousalMonthly;
      const maxLifeExp = Math.max(lifeExp, spousalLifeExp);
      const yearsReceiving = maxLifeExp - workerAge;

      combinedOptions.push({
        workerClaimingAge: workerAge,
        workerMonthly: Math.round(workerMonthly),
        spousalMonthly: Math.round(spousalMonthly),
        combinedMonthly: Math.round(combined),
        combinedAnnual: Math.round(combined * 12),
        combinedLifetime: Math.round(combined * 12 * yearsReceiving),
      });
    }
  }

  // Find best options
  const bestWorker = workerOptions.reduce((best, opt) =>
    opt.lifetimeTotal > best.lifetimeTotal ? opt : best,
  );
  const bestCombined =
    combinedOptions.length > 0
      ? combinedOptions.reduce((best, opt) =>
          opt.combinedLifetime > best.combinedLifetime ? opt : best,
        )
      : null;

  return {
    workerOptions,
    combinedOptions,
    bestWorkerAge: bestWorker.claimingAge,
    bestCombinedAge: bestCombined?.workerClaimingAge ?? bestWorker.claimingAge,
  };
}
