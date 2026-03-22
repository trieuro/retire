/**
 * Required Minimum Distribution (RMD) calculations
 * Based on IRS Uniform Lifetime Table (2024+)
 * SECURE 2.0 Act: RMDs start at age 73 (75 starting 2033)
 */

// IRS Uniform Lifetime Table - distribution period by age
const UNIFORM_LIFETIME_TABLE: Record<number, number> = {
  72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9,
  78: 22.0, 79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7,
  84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9,
  90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9,
  96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4, 101: 6.0,
  102: 5.6, 103: 5.2, 104: 4.9, 105: 4.6, 106: 4.3, 107: 4.1,
  108: 3.9, 109: 3.7, 110: 3.5, 111: 3.4, 112: 3.3, 113: 3.1,
  114: 3.0, 115: 2.9, 116: 2.8, 117: 2.7, 118: 2.5, 119: 2.3,
  120: 2.0,
};

/** Get the RMD start age based on birth year */
export function getRMDStartAge(birthYear: number): number {
  // SECURE 2.0: age 73 for those born 1951-1959, age 75 for born 1960+
  if (birthYear >= 1960) return 75;
  return 73;
}

/** Get the distribution period (life expectancy factor) for a given age */
export function getDistributionPeriod(age: number): number {
  if (age < 72) return 0;
  if (age > 120) return 2.0;
  return UNIFORM_LIFETIME_TABLE[age] ?? 2.0;
}

/** Calculate the Required Minimum Distribution for a given age and balance */
export function calculateRMD(
  accountBalance: number,
  age: number,
  birthYear: number,
): number {
  const startAge = getRMDStartAge(birthYear);
  if (age < startAge) return 0;
  if (accountBalance <= 0) return 0;

  const period = getDistributionPeriod(age);
  if (period <= 0) return accountBalance;

  return accountBalance / period;
}

/** Check if RMD applies to an account type */
export function isRMDApplicable(accountType: string): boolean {
  // RMDs apply to traditional tax-deferred accounts
  const rmdAccounts = [
    "tsp_traditional",
    "ira",
    "401k",
    "403b",
    "457",
  ];
  return rmdAccounts.includes(accountType);
}
