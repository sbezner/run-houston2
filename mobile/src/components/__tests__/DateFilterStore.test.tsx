import React from 'react';
import { render, act } from '@testing-library/react-native';
import { DateFilterProvider, useDateFilter } from '../../state/dateFilter';

function Harness() {
  const api = useDateFilter();
  // Expose API on global for assertions without relying on UI labels
  // This avoids brittle locale/date formatting checks
  // @ts-ignore
  global.__dateFilterApi = api;
  return null;
}

describe('DateFilter store logic', () => {
  beforeEach(() => {
    // reset between tests
    // @ts-ignore
    delete global.__dateFilterApi;
  });

  function renderWithProvider() {
    render(
      <DateFilterProvider>
        <Harness />
      </DateFilterProvider>
    );
    // @ts-ignore
    return global.__dateFilterApi as ReturnType<typeof useDateFilter>;
  }

  test('default applied preset is next30 and label reflects it (non-brittle)', () => {
    const api = renderWithProvider();
    expect(api.applied.preset).toBe('next30');
    // verify label method returns a string without asserting exact localized dates
    const label = api.labelForApplied();
    expect(typeof label).toBe('string');
    expect(label.toLowerCase()).toContain('next 30');
  });

  test('draft-then-apply workflow: presets update draft only; apply commits; cancel discards', () => {
    const api = renderWithProvider();
    // open draft from applied
    act(() => api.openDraftFromApplied());
    expect(api.draft.preset).toBe(api.applied.preset);

    // choose preset
    act(() => api.setDraftPreset('next90'));
    expect(api.draft.preset).toBe('next90');
    expect(api.applied.preset).toBe('next30');
    expect(api.hasPendingChanges()).toBe(true);

    // cancel (reset draft to applied)
    act(() => api.resetDraftToApplied());
    expect(api.draft.preset).toBe('next30');
    expect(api.hasPendingChanges()).toBe(false);

    // change again and apply
    act(() => api.setDraftPreset('thisWeekend'));
    expect(api.hasPendingChanges()).toBe(true);
    act(() => api.applyDraft());
    expect(api.applied.preset).toBe('thisWeekend');
    expect(api.hasPendingChanges()).toBe(false);
  });

  test('All Dates is exclusive; selecting other presets clears All', () => {
    const api = renderWithProvider();
    act(() => api.setDraftPreset('all'));
    expect(api.draft.preset).toBe('all');
    act(() => api.setDraftPreset('next30'));
    expect(api.draft.preset).toBe('next30');
  });

  test('custom range clamps to ensure to >= from', () => {
    const api = renderWithProvider();
    const from = new Date(2025, 0, 10);
    const toEarlier = new Date(2025, 0, 5);
    act(() => api.setDraftRange(from, toEarlier));
    expect(api.draft.preset).toBe('custom');
    expect(api.draft.range.from instanceof Date).toBe(true);
    expect(api.draft.range.to instanceof Date).toBe(true);
    // to should be adjusted to endOfDay(from)
    const adjustedTo = api.draft.range.to!;
    expect(adjustedTo.getTime()).toBeGreaterThanOrEqual(api.draft.range.from!.getTime());
  });

  test('pending changes toggles true when draft != applied and false after apply/reset', () => {
    const api = renderWithProvider();
    act(() => api.setDraftPreset('next90'));
    expect(api.hasPendingChanges()).toBe(true);
    act(() => api.applyDraft());
    expect(api.hasPendingChanges()).toBe(false);
    act(() => api.setDraftPreset('all'));
    expect(api.hasPendingChanges()).toBe(true);
    act(() => api.resetDraftToApplied());
    expect(api.hasPendingChanges()).toBe(false);
  });
});


