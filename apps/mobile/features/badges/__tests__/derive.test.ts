import { deriveEarnedBadges } from '../derive';
import type { LearnerStats } from '../../stats/queries';

const baseStats: LearnerStats = {
  completed: 0,
  totalDays: 21,
  avgScore: null,
  currentStreak: 0,
  longestStreak: 0,
  dueReviews: 0,
};

describe('deriveEarnedBadges', () => {
  it('returns empty set for fresh learner', () => {
    expect(deriveEarnedBadges(baseStats).size).toBe(0);
  });

  it('unlocks first_spark on day 1 done', () => {
    const earned = deriveEarnedBadges({ ...baseStats, completed: 1 });
    expect(earned.has('first_spark')).toBe(true);
    expect(earned.has('half_path')).toBe(false);
  });

  it('unlocks half_path at 11/21', () => {
    const earned = deriveEarnedBadges({ ...baseStats, completed: 11 });
    expect(earned.has('half_path')).toBe(true);
    expect(earned.has('odins_journey')).toBe(false);
  });

  it('unlocks odins_journey only when all days done', () => {
    expect(deriveEarnedBadges({ ...baseStats, completed: 20 }).has('odins_journey')).toBe(false);
    expect(deriveEarnedBadges({ ...baseStats, completed: 21 }).has('odins_journey')).toBe(true);
  });

  it('does not unlock odins_journey when totalDays is 0', () => {
    const earned = deriveEarnedBadges({ ...baseStats, completed: 0, totalDays: 0 });
    expect(earned.has('odins_journey')).toBe(false);
  });

  it('uses longestStreak (not currentStreak) for streak badges', () => {
    const earned = deriveEarnedBadges({
      ...baseStats,
      currentStreak: 0,
      longestStreak: 14,
    });
    expect(earned.has('week_falcon')).toBe(true);
    expect(earned.has('fortnight_walker')).toBe(true);
  });

  it('unlocks wise_speaker at avg >= 80', () => {
    expect(deriveEarnedBadges({ ...baseStats, avgScore: 79 }).has('wise_speaker')).toBe(false);
    expect(deriveEarnedBadges({ ...baseStats, avgScore: 80 }).has('wise_speaker')).toBe(true);
  });

  it('keeps wise_speaker locked when avgScore is null', () => {
    expect(deriveEarnedBadges({ ...baseStats, avgScore: null }).has('wise_speaker')).toBe(false);
  });
});
