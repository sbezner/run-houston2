export function rangeToday(now: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export function rangeTomorrow(now: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export function rangeThisWeekend(now: Date): { start: Date; end: Date } {
  const dayOfWeek = now.getUTCDay();
  const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilSaturday));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilSunday + 1));
  return { start, end };
}

export function rangeNextNDays(n: number, now: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + n);
  return { start, end };
}

export function rangeCustom(from: string, to: string): { start: Date; end: Date } {
  const start = new Date(from + 'T00:00:00.000Z');
  const end = new Date(to + 'T23:59:59.999Z');
  return { start, end };
}

export function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function isPast(iso: string): boolean {
  return new Date(iso) < new Date();
}
