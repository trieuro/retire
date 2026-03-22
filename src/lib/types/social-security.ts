export interface SSInputs {
  birthYear: number;
  /** Use SSA statement estimates directly instead of AIME */
  monthlyBenefitAt62: number;
  monthlyBenefitAtFRA: number;
  monthlyBenefitAt70: number;
  lifeExpectancy: number;
}

export interface SpousalInputs {
  spouseBirthYear: number;
  isWorking: boolean;
  spouseLifeExpectancy?: number;
}

export interface SSClaimingOption {
  claimingAge: number;
  monthlyBenefit: number;
  annualBenefit: number;
  lifetimeTotal: number;
  reductionOrIncrease: string;
  breakevenVs62: number | null;
  breakevenVsFRA: number | null;
}

export interface SpousalClaimingResult {
  workerClaimingAge: number;
  workerMonthly: number;
  spousalMonthly: number;
  combinedMonthly: number;
  combinedAnnual: number;
  combinedLifetime: number;
}

export interface SSAnalysisResult {
  workerOptions: SSClaimingOption[];
  combinedOptions: SpousalClaimingResult[];
  bestWorkerAge: number;
  bestCombinedAge: number;
}
