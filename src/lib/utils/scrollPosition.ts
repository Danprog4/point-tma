const STORAGE_KEY_PREFIX = "scroll:";

export function saveScrollPosition(key: string): void {
  try {
    sessionStorage.setItem(
      STORAGE_KEY_PREFIX + key,
      String(Math.max(0, Math.floor(window.scrollY))),
    );
  } catch {
    // no-op
  }
}

export function getScrollPosition(key: string): number | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (raw == null) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearScrollPosition(key: string): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY_PREFIX + key);
  } catch {
    // no-op
  }
}
