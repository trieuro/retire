"use client";

import { useState, useEffect, useCallback } from "react";
import { loadFromStorage, saveToStorage } from "../storage/local-storage";

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = loadFromStorage<T>(key);
    if (stored !== null) {
      setValue(stored);
    }
    setLoaded(true);
  }, [key]);

  const setAndPersist = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof newValue === "function"
          ? (newValue as (prev: T) => T)(prev)
          : newValue;
        saveToStorage(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  if (!loaded) return [defaultValue, setAndPersist];
  return [value, setAndPersist];
}
