import type { FERSInputs, TSPInputs } from "./fers";
import type { SSInputs, SpousalInputs } from "./social-security";

export interface OtherIncomeSource {
  name: string;
  annualAmount: number;
  startAge: number;
  endAge: number;
}

export interface ExpenseInputs {
  preRetirement: number;
  postRetirement: number;
  inflationRate: number;
}

export interface TaxInputs {
  filingStatus: "married_joint" | "single";
  stateOfResidence: string;
}

export interface RetirementInputs {
  fers: FERSInputs;
  tsp: TSPInputs;
  ss: SSInputs;
  spousal: SpousalInputs;
  ssClaimingAge: number;
  otherIncome: OtherIncomeSource[];
  expenses: ExpenseInputs;
  tax: TaxInputs;
}

export interface ProjectionYear {
  age: number;
  year: number;
  isRetired: boolean;
  fersPension: number;
  fersSupplementIncome: number;
  tspContribution: number;
  tspWithdrawal: number;
  tspRMD: number;
  tspBalance: number;
  ssWorkerBenefit: number;
  ssSpousalBenefit: number;
  otherIncome: number;
  totalGrossIncome: number;
  estimatedTaxes: number;
  totalNetIncome: number;
  expenses: number;
  surplus: number;
  cumulativeSurplus: number;
}

export interface RetirementResult {
  projections: ProjectionYear[];
  retirementReady: boolean;
  shortfallAge: number | null;
  peakTSPBalance: number;
  totalLifetimeIncome: number;
  safeWithdrawalFromTSP: number;
}
