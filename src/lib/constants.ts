// FERS Pension
export const FERS_MULTIPLIER = 0.01;
export const FERS_MULTIPLIER_62_PLUS = 0.011;
export const FERS_SURVIVOR_FULL_REDUCTION = 0.10;
export const FERS_SURVIVOR_PARTIAL_REDUCTION = 0.05;
export const FERS_COLA_CPI_THRESHOLD = 0.02;

// Minimum Retirement Age by birth year
export const MRA_TABLE: [number, number, number][] = [
  [1948, 1952, 55],
  [1953, 1964, 56],
  [1965, 1969, 56.5],
  [1970, 2999, 57],
];

export function getMRAForBirthYear(birthYear: number): number {
  for (const [start, end, mra] of MRA_TABLE) {
    if (birthYear >= start && birthYear <= end) return mra;
  }
  return 57;
}

// TSP Limits (2025)
export const TSP_ANNUAL_LIMIT = 23500;
export const TSP_CATCHUP_LIMIT = 7500;
export const TSP_CATCHUP_AGE = 50;

// Social Security (2025 values)
export const SS_BEND_POINTS = [1174, 7078];
export const SS_BEND_RATES = [0.90, 0.32, 0.15];

// FRA by birth year
export const SS_FRA_TABLE: [number, number, number, number][] = [
  // [startYear, endYear, fraYears, fraMonths]
  [1943, 1954, 66, 0],
  [1955, 1955, 66, 2],
  [1956, 1956, 66, 4],
  [1957, 1957, 66, 6],
  [1958, 1958, 66, 8],
  [1959, 1959, 66, 10],
  [1960, 2999, 67, 0],
];

// Early/delayed SS rates
export const SS_EARLY_REDUCTION_FIRST_36_PER_MONTH = 5 / 900; // 5/9 of 1%
export const SS_EARLY_REDUCTION_AFTER_36_PER_MONTH = 5 / 1200; // 5/12 of 1%
export const SS_DELAYED_CREDIT_PER_YEAR = 0.08; // 8% per year after FRA
export const SS_SPOUSAL_MAX_PERCENT = 0.50;

// Tax Brackets 2025 - Married Filing Jointly
export const TAX_BRACKETS_MFJ: { min: number; max: number; rate: number }[] = [
  { min: 0, max: 23850, rate: 0.10 },
  { min: 23850, max: 96950, rate: 0.12 },
  { min: 96950, max: 206700, rate: 0.22 },
  { min: 206700, max: 394600, rate: 0.24 },
  { min: 394600, max: 501050, rate: 0.32 },
  { min: 501050, max: 751600, rate: 0.35 },
  { min: 751600, max: Infinity, rate: 0.37 },
];

// Tax Brackets 2025 - Single
export const TAX_BRACKETS_SINGLE: { min: number; max: number; rate: number }[] = [
  { min: 0, max: 11925, rate: 0.10 },
  { min: 11925, max: 48475, rate: 0.12 },
  { min: 48475, max: 103350, rate: 0.22 },
  { min: 103350, max: 197300, rate: 0.24 },
  { min: 197300, max: 250525, rate: 0.32 },
  { min: 250525, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 },
];

export const TAX_STANDARD_DEDUCTION_MFJ = 30000;
export const TAX_STANDARD_DEDUCTION_SINGLE = 15000;

// SS Taxation thresholds (MFJ)
export const SS_TAX_THRESHOLD_MFJ_LOW = 32000;
export const SS_TAX_THRESHOLD_MFJ_HIGH = 44000;

// Defaults
export const DEFAULT_INFLATION_RATE = 0.03;
export const DEFAULT_LIFE_EXPECTANCY = 90;
export const DEFAULT_EXPECTED_RETURN = 0.07;
export const DEFAULT_CPI_RATE = 0.025;
