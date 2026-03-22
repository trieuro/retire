import type { Account, NetWorthSnapshot } from "../types/net-worth";

/** Compute net worth from a list of accounts */
export function computeNetWorth(accounts: Account[]): {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
} {
  const totalAssets = accounts
    .filter((a) => a.type === "asset")
    .reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = accounts
    .filter((a) => a.type === "liability")
    .reduce((sum, a) => sum + a.balance, 0);

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  };
}

/** Create a snapshot from current accounts */
export function createSnapshot(
  accounts: Account[],
  date: string,
): NetWorthSnapshot {
  const { totalAssets, totalLiabilities, netWorth } = computeNetWorth(accounts);
  const accountBalances: Record<string, number> = {};
  for (const account of accounts) {
    accountBalances[account.id] = account.balance;
  }

  return {
    date,
    totalAssets,
    totalLiabilities,
    netWorth,
    accounts: accountBalances,
  };
}

/** Group accounts by category */
export function groupAccountsByCategory(
  accounts: Account[],
): Record<string, Account[]> {
  const groups: Record<string, Account[]> = {};
  for (const account of accounts) {
    if (!groups[account.category]) {
      groups[account.category] = [];
    }
    groups[account.category].push(account);
  }
  return groups;
}
