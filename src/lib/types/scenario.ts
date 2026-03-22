import type { TimestampedRecord } from "./common";
import type { RetirementInputs, RetirementResult } from "./calculator";

export interface Scenario extends TimestampedRecord {
  name: string;
  description?: string;
  color: string;
  inputs: RetirementInputs;
  result?: RetirementResult;
}

export interface ScenarioComparison {
  scenarios: Scenario[];
  baselineId: string;
}
