import type { Scenario } from "../types/scenario";
import type { RetirementResult } from "../types/calculator";
import { projectRetirement } from "./retirement";

/** Run projections for all scenarios and populate results */
export function compareScenarios(scenarios: Scenario[]): Scenario[] {
  return scenarios.map((scenario) => ({
    ...scenario,
    result: projectRetirement(scenario.inputs),
  }));
}

/** Compute delta between two scenario results at a specific age */
export function scenarioDelta(
  a: RetirementResult,
  b: RetirementResult,
  atAge: number,
): {
  balanceDiff: number;
  incomeDiff: number;
  surplusDiff: number;
  shortfallAgeDiff: number | null;
} {
  const yearA = a.projections.find((p) => p.age === atAge);
  const yearB = b.projections.find((p) => p.age === atAge);

  return {
    balanceDiff: (yearA?.tspBalance ?? 0) - (yearB?.tspBalance ?? 0),
    incomeDiff: (yearA?.totalNetIncome ?? 0) - (yearB?.totalNetIncome ?? 0),
    surplusDiff: (yearA?.surplus ?? 0) - (yearB?.surplus ?? 0),
    shortfallAgeDiff:
      a.shortfallAge !== null && b.shortfallAge !== null
        ? a.shortfallAge - b.shortfallAge
        : null,
  };
}
