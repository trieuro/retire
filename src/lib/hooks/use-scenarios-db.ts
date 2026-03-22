"use client";

import { useState, useEffect, useCallback } from "react";
import type { Scenario } from "../types/scenario";

export function useScenariosDb() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scenarios")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setScenarios(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addScenario = useCallback(async (scenario: Omit<Scenario, "id" | "createdAt" | "updatedAt">) => {
    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario),
      });
      if (!res.ok) return;
      const created = await res.json();
      setScenarios((prev) => [...prev, created]);
    } catch {}
  }, []);

  const removeScenario = useCallback(async (id: string) => {
    try {
      await fetch(`/api/scenarios/${id}`, { method: "DELETE" });
      setScenarios((prev) => prev.filter((s) => s.id !== id));
    } catch {}
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await fetch("/api/scenarios", { method: "DELETE" });
      setScenarios([]);
    } catch {}
  }, []);

  return { scenarios, loading, addScenario, removeScenario, clearAll };
}
