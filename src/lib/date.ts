const jakartaTimeZone = 'Asia/Jakarta';

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return '-';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const parts = new Intl.DateTimeFormat('id-ID', {
    timeZone: jakartaTimeZone,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const byType = new Map(parts.map((part) => [part.type, part.value]));
  const day = byType.get('day') ?? '';
  const month = byType.get('month') ?? '';
  const year = byType.get('year') ?? '';
  const hour = byType.get('hour') ?? '00';
  const minute = byType.get('minute') ?? '00';

  return `${day} ${month} ${year}, ${hour}.${minute}`;
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return '-';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: jakartaTimeZone,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
