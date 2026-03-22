/** Future value with regular annual contributions */
export function futureValue(
  principal: number,
  annualRate: number,
  years: number,
  annualContribution: number = 0,
): number {
  let balance = principal;
  for (let i = 0; i < years; i++) {
    balance = (balance + annualContribution) * (1 + annualRate);
  }
  return balance;
}

/** Reduce a future amount by inflation to get today's purchasing power */
export function adjustForInflation(
  amount: number,
  inflationRate: number,
  years: number,
): number {
  return amount / Math.pow(1 + inflationRate, years);
}

/** Inflate a present amount to future value */
export function inflateAmount(
  amount: number,
  inflationRate: number,
  years: number,
): number {
  return amount * Math.pow(1 + inflationRate, years);
}

/** Annual withdrawal needed for a balance to last N years at a given return rate */
export function requiredWithdrawal(
  balance: number,
  annualRate: number,
  years: number,
): number {
  if (years <= 0) return 0;
  if (annualRate === 0) return balance / years;
  const r = annualRate;
  const n = years;
  return (balance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/** Present value of a future amount */
export function presentValue(
  futureAmount: number,
  discountRate: number,
  years: number,
): number {
  return futureAmount / Math.pow(1 + discountRate, years);
}
