import type { TimestampedRecord } from "./common";

export type AssetCategory =
  | "tsp_traditional"
  | "tsp_roth"
  | "ira"
  | "roth_ira"
  | "brokerage"
  | "real_estate"
  | "cash"
  | "crypto"
  | "other_asset";

export type LiabilityCategory =
  | "mortgage"
  | "student_loan"
  | "auto_loan"
  | "credit_card"
  | "other_liability";

export interface Account extends TimestampedRecord {
  name: string;
  category: AssetCategory | LiabilityCategory;
  type: "asset" | "liability";
  balance: number;
  interestRate?: number;
  monthlyPayment?: number;
}

export interface NetWorthSnapshot {
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  accounts: Record<string, number>;
}
