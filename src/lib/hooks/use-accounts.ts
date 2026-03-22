"use client";

import { useState, useEffect, useCallback } from "react";
import type { Account } from "../types/net-worth";

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts");
      if (!res.ok) throw new Error("Failed to fetch accounts");
      const data = await res.json();
      setAccounts(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const addAccount = useCallback(async (account: {
    name: string;
    category: string;
    type: "asset" | "liability";
    balance: number;
  }) => {
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(account),
      });
      if (!res.ok) throw new Error("Failed to add account");
      const newAccount = await res.json();
      setAccounts((prev) => [...prev, newAccount]);
      return newAccount;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, []);

  const updateBalance = useCallback(async (id: string, balance: number) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance }),
      });
      if (!res.ok) throw new Error("Failed to update account");
      const updated = await res.json();
      setAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, balance: updated.balance, updatedAt: updated.updatedAt } : a)),
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const removeAccount = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  return { accounts, loading, error, addAccount, updateBalance, removeAccount, refetch: fetchAccounts };
}
