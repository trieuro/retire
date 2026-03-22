export interface FERSInputs {
  currentAge: number;
  retirementAge: number;
  yearsOfService: number;
  high3Salary: number;
  survivorAnnuityElection: "full" | "partial" | "none";
  fersSupplementEligible: boolean;
}

export interface PensionResult {
  annualPension: number;
  monthlyPension: number;
  survivorReduction: number;
  netAnnualPension: number;
  netMonthlyPension: number;
  fersSupplementMonthly: number;
  fersSupplementAnnual: number;
}

export interface TSPInputs {
  currentBalance: number;
  annualSalary: number;
  employeeContribRate: number;
  agencyMatchRate: number;
  expectedReturnRate: number;
  rothPercentage: number;
  catchUpEligible: boolean;
}

export interface TSPProjectionYear {
  age: number;
  year: number;
  startBalance: number;
  employeeContrib: number;
  agencyMatch: number;
  growth: number;
  endBalance: number;
}
