// Storage may be blocked by browser privacy settings or exhausted by other tabs.
export const browserStorage = {
  get(key: string): string | null {
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string): void {
    try { window.localStorage.setItem(key, value); } catch { /* Local persistence is optional. */ }
  },
  remove(key: string): void {
    try { window.localStorage.removeItem(key); } catch { /* A saved server result must still navigate successfully. */ }
  },
  removeMatching(prefix: string, keepKey?: string): void {
    try {
      for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
        const key = window.localStorage.key(index);
        if (key?.startsWith(prefix) && key !== keepKey) window.localStorage.removeItem(key);
      }
    } catch { /* Browsers can deny access to local drafts. */ }
  },
};
