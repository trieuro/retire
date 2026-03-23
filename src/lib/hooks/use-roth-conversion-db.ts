"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface RothConversionInputs {
  currentAge: number;
  birthYear: number;
  retirementAge: number;
  traditionalBalance: number;
  rothBalance: number;
  annualPension: number;
  annualSSBenefit: number;
  ssStartAge: number;
  spousalSSBenefit: number;
  spousalSSStartAge: number;
  otherAnnualIncome: number;
  expectedReturnRate: number;
  phase1BracketIndex: number;
  phase2BracketIndex: number;
  annualExpenses: number;
  inflationRate: number;
  lifeExpectancy: number;
}

export function useRothConversionDb(defaultInputs: RothConversionInputs) {
  const [inputs, setInputs] = useState<RothConversionInputs>(defaultInputs);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/roth-conversion")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setInputs({ ...defaultInputs, ...data });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback((newInputs: RothConversionInputs) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/roth-conversion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInputs),
      }).catch(() => {});
    }, 1000);
  }, []);

  const update = useCallback((key: string, value: number) => {
    setInputs((prev) => {
      const next = { ...prev, [key]: value };
      save(next);
      return next;
    });
  }, [save]);

  return { inputs, update, loading };
}
