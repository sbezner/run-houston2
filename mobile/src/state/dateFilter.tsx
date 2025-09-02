import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

export type Preset = 'all' | 'thisWeekend' | 'next30' | 'next90' | 'last90' | 'custom';
export type DateRange = { from?: Date; to?: Date };

type DateFilter = {
  applied: { preset: Preset; range: DateRange };
  draft:   { preset: Preset; range: DateRange };
  // commands
  openDraftFromApplied: () => void;
  setDraftPreset: (p: Preset) => void;
  setDraftRange: (from?: Date, to?: Date) => void;
  applyDraft: () => void;
  resetDraftToApplied: () => void;
  hasPendingChanges: () => boolean;
  labelForApplied: () => string;
};

const Ctx = createContext<DateFilter | null>(null);

// Helpers
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date)   { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function sameDay(a?: Date, b?: Date) { return !!a && !!b && a.toDateString() === b.toDateString(); }

function rangeForPreset(p: Preset): DateRange {
  const today = startOfDay(new Date());
  switch (p) {
    case 'thisWeekend': {
      const dow = today.getDay(); // 0 Sun..6 Sat
      const sat = addDays(today, (6 - dow + 7) % 7);
      const sun = addDays(sat, 1);
      return { from: sat, to: endOfDay(sun) };
    }
    case 'next90': return { from: today, to: endOfDay(addDays(today, 90)) };
    case 'last90': return { from: startOfDay(addDays(today, -90)), to: endOfDay(today) };
    case 'next30': return { from: today, to: endOfDay(addDays(today, 30)) };
    case 'all':    return { };
    case 'custom': return { };
  }
}

function formatRange(r: DateRange) {
  const fmt = (d?: Date) => d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  if (r.from && r.to) return `${fmt(r.from)} → ${fmt(r.to)}`;
  if (r.from) return `${fmt(r.from)} → …`;
  if (r.to) return `… → ${fmt(r.to)}`;
  return 'All';
}

export function DateFilterProvider({ children }: { children: React.ReactNode }) {
  // Default applied = next30
  const [applied, setApplied] = useState<{ preset: Preset; range: DateRange }>(
    { preset: 'next30', range: rangeForPreset('next30') }
  );
  const [draft, setDraft] = useState<{ preset: Preset; range: DateRange }>(applied);

  // Use useCallback for functions to prevent stale closures
  const openDraftFromApplied = useCallback(() => {
    setDraft(applied);
  }, [applied]);

  const setDraftPreset = useCallback((p: Preset) => {
    if (p === 'custom') {
      setDraft(s => ({ preset: 'custom', range: s.range })); // custom keeps current inputs
    } else {
      const newRange = rangeForPreset(p);
      setDraft({ preset: p, range: newRange });
    }
  }, []);

  const setDraftRange = useCallback((from?: Date, to?: Date) => {
    // clamp: to >= from if both present
    let f = from, t = to;
    if (f) f = startOfDay(f);
    if (t) t = endOfDay(t);
    if (f && t && t < f) t = endOfDay(f);
    setDraft({ preset: 'custom', range: { from: f, to: t } });
  }, []);

  const applyDraft = useCallback(() => {
    setApplied(draft);
  }, [draft]);

  const resetDraftToApplied = useCallback(() => {
    setDraft(applied);
  }, [applied]);

  const hasPendingChanges = useCallback(() => {
    const a = applied, d = draft;
    const samePreset = a.preset === d.preset;
    const sameRange =
      sameDay(a.range.from, d.range.from) &&
      sameDay(a.range.to, d.range.to);
    return !(samePreset && sameRange);
  }, [applied, draft]);

  const labelForApplied = useCallback(() => {
    switch (applied.preset) {
      case 'all': return 'Date: All';
      case 'thisWeekend': return 'This Weekend';
      case 'next30': return 'Date: Next 30';
      case 'next90': return 'Date: Next 90';
      case 'last90': return 'Date: Last 90';
      case 'custom': return `Date: ${formatRange(applied.range)}`;
    }
  }, [applied]);

  const api = useMemo<DateFilter>(() => ({
    applied,
    draft,
    openDraftFromApplied,
    setDraftPreset,
    setDraftRange,
    applyDraft,
    resetDraftToApplied,
    hasPendingChanges,
    labelForApplied,
  }), [applied, draft, openDraftFromApplied, setDraftPreset, setDraftRange, applyDraft, resetDraftToApplied, hasPendingChanges, labelForApplied]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useDateFilter() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useDateFilter must be used within DateFilterProvider');
  return c;
}
