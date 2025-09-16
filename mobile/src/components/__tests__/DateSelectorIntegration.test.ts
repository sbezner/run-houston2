/* eslint-disable @typescript-eslint/no-unused-vars */
// Local Jest globals to satisfy TypeScript without installing types
declare const describe: any;
declare const test: any;
declare const expect: any;

import { filterRacesByDate, inRangeInclusive } from '../../selectors/races';

describe('Date selector/filtering integration', () => {
  test('inclusive boundaries and unbounded All Dates', () => {
    const races = [
      { id: 1, date: '2025-01-01', start_time: '07:30' },
      { id: 2, date: '2025-01-15', start_time: '08:00' },
      { id: 3, date: '2025-01-31', start_time: '06:00' },
    ];

    const from = new Date(2025, 0, 1);
    const to = new Date(2025, 0, 31, 23, 59, 59, 999);

    const filtered = filterRacesByDate(races as any, { from, to });
    const ids = filtered.map(r => (r as any).id);
    expect(ids).toEqual([1, 2, 3]);

    const all = filterRacesByDate(races as any, {});
    expect(all.length).toBe(3);

    // spot-check inRangeInclusive logic
    expect(inRangeInclusive(new Date(2025,0,1), { from, to })).toBe(true);
    expect(inRangeInclusive(new Date(2025,0,31,23,59,59,999), { from, to })).toBe(true);
  });
});


