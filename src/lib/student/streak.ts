const DAY_MS = 24 * 60 * 60 * 1000;
const jakartaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function getJakartaDateKey(value: string | Date = new Date()) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return jakartaDateFormatter.format(Number.isNaN(date.getTime()) ? new Date() : date);
}

export function calculateNextStreak(
  currentStreak: number | null | undefined,
  lastActiveAt: string | null | undefined,
  now: string | Date = new Date(),
) {
  const activeAt = typeof now === 'string' ? new Date(now) : now;
  const todayKey = getJakartaDateKey(activeAt);
  const yesterdayKey = getJakartaDateKey(new Date(activeAt.getTime() - DAY_MS));
  const lastActiveKey = lastActiveAt ? getJakartaDateKey(lastActiveAt) : null;
  const normalizedCurrent = Math.max(Math.round(currentStreak ?? 0), 0);

  if (!lastActiveKey) return 1;
  if (lastActiveKey === todayKey) return Math.max(normalizedCurrent, 1);
  if (lastActiveKey === yesterdayKey) return normalizedCurrent + 1;
  return 1;
}

export function getEffectiveStreak(
  streakCount: number | null | undefined,
  lastActiveAt: string | null | undefined,
  now: string | Date = new Date(),
) {
  if (!lastActiveAt) return 0;

  const activeAt = typeof now === 'string' ? new Date(now) : now;
  const todayKey = getJakartaDateKey(activeAt);
  const yesterdayKey = getJakartaDateKey(new Date(activeAt.getTime() - DAY_MS));
  const lastActiveKey = getJakartaDateKey(lastActiveAt);

  if (lastActiveKey !== todayKey && lastActiveKey !== yesterdayKey) return 0;
  return Math.max(Math.round(streakCount ?? 0), 0);
}
