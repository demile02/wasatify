const STORAGE_KEY = 'wasatify.rememberedAccounts';
const MAX_ACCOUNTS = 4;

export function getRememberedAccounts() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function rememberAccount(account) {
  if (!account?.email) return [];

  const nextAccount = {
    email: account.email,
    name: account.name || account.email,
    role: account.role || 'student',
    className: account.className || '',
    rememberedAt: new Date().toISOString(),
  };

  const existing = getRememberedAccounts().filter((item) => item.email !== nextAccount.email);
  const nextAccounts = [nextAccount, ...existing].slice(0, MAX_ACCOUNTS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAccounts));
  return nextAccounts;
}

export function forgetRememberedAccount(email) {
  const nextAccounts = getRememberedAccounts().filter((item) => item.email !== email);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAccounts));
  return nextAccounts;
}
