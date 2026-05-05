import { nextStreak } from '../calc';

describe('nextStreak', () => {
  it('starts at 1 when no prior activity', () => {
    expect(nextStreak({ lastActiveDate: null, currentStreak: 0, today: '2026-05-04' }))
      .toEqual({ currentStreak: 1, longestDelta: 1 });
  });
  it('increments when yesterday was active', () => {
    expect(nextStreak({ lastActiveDate: '2026-05-03', currentStreak: 4, today: '2026-05-04' }))
      .toEqual({ currentStreak: 5, longestDelta: 1 });
  });
  it('keeps streak unchanged when same-day activity', () => {
    expect(nextStreak({ lastActiveDate: '2026-05-04', currentStreak: 4, today: '2026-05-04' }))
      .toEqual({ currentStreak: 4, longestDelta: 0 });
  });
  it('resets to 1 when more than one day skipped', () => {
    expect(nextStreak({ lastActiveDate: '2026-05-01', currentStreak: 10, today: '2026-05-04' }))
      .toEqual({ currentStreak: 1, longestDelta: 0 });
  });
});
