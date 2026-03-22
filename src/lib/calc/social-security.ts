import {
  SS_BEND_POINTS,
  SS_BEND_RATES,
  SS_FRA_TABLE,
  SS_EARLY_REDUCTION_FIRST_36_PER_MONTH,
  SS_EARLY_REDUCTION_AFTER_36_PER_MONTH,
  SS_DELAYED_CREDIT_PER_YEAR,
  SS_SPOUSAL_MAX_PERCENT,
} from "../constants";
import type {
  SSClaimingOption,
  SpousalClaimingResult,
  SSAnalysisResult,
  SSInputs,
  SpousalInputs,
} from "../types/social-security";

/** Compute Primary Insurance Amount from AIME using bend points */
export function computePIA(aime: number): number {
  const [bend1, bend2] = SS_BEND_POINTS;
  const [rate1, rate2, rate3] = SS_BEND_RATES;

  let pia = 0;
  if (aime <= bend1) {
    pia = aime * rate1;
  } else if (aime <= bend2) {
    pia = bend1 * rate1 + (aime - bend1) * rate2;
  } else {
    pia = bend1 * rate1 + (bend2 - bend1) * rate2 + (aime - bend2) * rate3;
  }

  return Math.floor(pia * 10) / 10; // SSA rounds down to nearest dime
}

/** Get Full Retirement Age from birth year */
export function getFullRetirementAge(birthYear: number): number {
  for (const [start, end, years, months] of SS_FRA_TABLE) {
    if (birthYear >= start && birthYear <= end) {
      return years + months / 12;
    }
  }
  return 67;
}

/** Compute monthly worker benefit for a given claiming age */
export function computeWorkerBenefit(
  pia: number,
  claimingAge: number,
  fra: number,
): number {
  if (claimingAge < 62) return 0;
  if (claimingAge > 70) return computeWorkerBenefit(pia, 70, fra);

  if (claimingAge < fra) {
    // Early reduction
    const monthsEarly = Math.round((fra - claimingAge) * 12);
    const first36 = Math.min(monthsEarly, 36);
    const after36 = Math.max(0, monthsEarly - 36);
    const reduction =
      first36 * SS_EARLY_REDUCTION_FIRST_36_PER_MONTH +
      after36 * SS_EARLY_REDUCTION_AFTER_36_PER_MONTH;
    return pia * (1 - reduction);
  } else if (claimingAge > fra) {
    // Delayed credits
    const yearsDelayed = claimingAge - fra;
    const increase = yearsDelayed * SS_DELAYED_CREDIT_PER_YEAR;
    return pia * (1 + increase);
  }

  return pia;
}

/** Compute spousal benefit (non-working spouse) */
export function computeSpousalBenefit(
  workerPIA: number,
  spousalClaimingAge: number,
  spousalFRA: number,
): number {
  const maxSpousal = workerPIA * SS_SPOUSAL_MAX_PERCENT;

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

  // Cumulative: earlyMonthly * 12 * (age - earlyAge) = lateMonthly * 12 * (age - lateAge)
  // earlyMonthly * age - earlyMonthly * earlyAge = lateMonthly * age - lateMonthly * lateAge
  // age * (earlyMonthly - lateMonthly) = earlyMonthly * earlyAge - lateMonthly * lateAge
  const age =
    (earlyMonthly * earlyAge - lateMonthly * lateAge) /
    (earlyMonthly - lateMonthly);

  return Math.round(age * 10) / 10;
}

/** Analyze all claiming options for worker and spouse */
export function analyzeClaimingOptions(
  ssInputs: SSInputs,
  spousalInputs?: SpousalInputs,
): SSAnalysisResult {
  const pia = computePIA(ssInputs.aime);
  const fra = getFullRetirementAge(ssInputs.birthYear);
  const lifeExp = ssInputs.lifeExpectancy;

  // Worker options (62-70)
  const benefit62 = computeWorkerBenefit(pia, 62, fra);
  const benefitFRA = computeWorkerBenefit(pia, Math.ceil(fra), fra);
  const workerOptions: SSClaimingOption[] = [];

  for (let age = 62; age <= 70; age++) {
    const monthly = computeWorkerBenefit(pia, age, fra);
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
      const workerMonthly = computeWorkerBenefit(pia, workerAge, fra);
      // Spouse can claim spousal benefits when worker claims (simplified)
      const spousalAge = spousalInputs.spouseBirthYear - ssInputs.birthYear + workerAge;
      const spousalMonthly = computeSpousalBenefit(
        pia,
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
