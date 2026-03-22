const STORAGE_VERSION = 1;
const VERSION_KEY = "retireplan_version";

function ensureVersion(): void {
  if (typeof window === "undefined") return;
  const version = localStorage.getItem(VERSION_KEY);
  if (!version) {
    localStorage.setItem(VERSION_KEY, String(STORAGE_VERSION));
  }
}

export function loadFromStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    ensureVersion();
    const raw = localStorage.getItem(`retireplan_${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    ensureVersion();
    localStorage.setItem(`retireplan_${key}`, JSON.stringify(data));
  } catch {
    console.error(`Failed to save ${key} to localStorage`);
  }
}

export function removeFromStorage(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`retireplan_${key}`);
}
