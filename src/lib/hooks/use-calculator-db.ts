"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { RetirementInputs } from "../types/calculator";

export function useCalculatorDb(defaultInputs: RetirementInputs) {
  const [inputs, setInputs] = useState<RetirementInputs>(defaultInputs);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/calculator")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setInputs(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback((newInputs: RetirementInputs) => {
    // Debounce saves to avoid hammering the API on every keystroke
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/calculator", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInputs),
      }).catch(() => {});
    }, 1000);
  }, []);

  const update = useCallback((path: string, value: number | string) => {
    setInputs((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as RetirementInputs;
      const keys = path.split(".");
      let obj: Record<string, unknown> = next as unknown as Record<string, unknown>;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]] as Record<string, unknown>;
      }
      obj[keys[keys.length - 1]] = value;
      save(next);
      return next;
    });
  }, [save]);

  return { inputs, update, loading };
}
