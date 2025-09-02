// mobile/src/selectors/races.ts
export type Race = {
  id: string | number;
  date?: string | Date | null;       // e.g. '2025-09-12'
  start_time?: string | null;        // e.g. '07:30'
  // ... other fields are ignored for filtering
};

export type DateRange = { from?: Date; to?: Date };

function parseLocalYMD(dateStr: string): Date | null {
  // Strict 'YYYY-MM-DD' → local Date at 00:00
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const y = Number(m[1]); const mo = Number(m[2]) - 1; const d = Number(m[3]);
  return new Date(y, mo, d, 0, 0, 0, 0); // local TZ
}

function parseHHmm(timeStr?: string | null): { h: number; m: number } | null {
  if (!timeStr) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
  if (!m) return null;
  return { h: Math.min(23, Number(m[1])), m: Math.min(59, Number(m[2])) };
}

/** Return a local Date for the race start; falls back to date-only. Invalid → null (excluded). */
export function raceStartLocal(r: Race): Date | null {
  if (!r) return null;
  if (r.date instanceof Date) {
    // Keep local time of given Date; if time present via start_time, add it
    const base = new Date(r.date);
    const hhmm = parseHHmm(r.start_time);
    if (hhmm) {
      base.setHours(hhmm.h, hhmm.m, 0, 0);
    }
    return isNaN(base.getTime()) ? null : base;
  }
  if (typeof r.date === 'string' && r.date.length >= 8) {
    // Accept both 'YYYY-MM-DD' and ISO strings like 'YYYY-MM-DDTHH:MM:SSZ'
    const ymd = r.date.slice(0, 10);
    const d = parseLocalYMD(ymd);
    if (!d) return null;
    const hhmm = parseHHmm(r.start_time);
    if (hhmm) d.setHours(hhmm.h, hhmm.m, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Inclusive range check in local time. Undefined endpoints mean unbounded. */
export function inRangeInclusive(d: Date, range: DateRange): boolean {
  const t = d.getTime();
  const lo = range.from ? range.from.getTime() : -Infinity;
  const hi = range.to ? range.to.getTime() : +Infinity;
  return t >= lo && t <= hi;
}

/** Filter races by applied range; invalid/missing dates are excluded unless range is fully unbounded. */
export function filterRacesByDate<T extends Race>(races: T[], range: DateRange): T[] {
  // If 'All Dates' (no bounds), return all races with a valid date first; if none, return original list
  const unbounded = !range.from && !range.to;
  const out: T[] = [];
  for (const r of races ?? []) {
    const dt = raceStartLocal(r);
    if (!dt) {
      if (unbounded) out.push(r);
      continue;
    }
    if (unbounded || inRangeInclusive(dt, range)) out.push(r);
  }
  return out;
}
