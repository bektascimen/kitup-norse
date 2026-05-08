import type { LearnerStats } from '../stats/queries';

export type BadgeId =
  | 'first_spark'
  | 'half_path'
  | 'odins_journey'
  | 'week_falcon'
  | 'fortnight_walker'
  | 'wise_speaker';

export type Badge = {
  id: BadgeId;
  rune: string;
  /** i18n key prefix; suffixes: `.title`, `.condition`, `.lore`. */
  keyPrefix: string;
  /** Predicate evaluated against the latest LearnerStats. */
  isEarned: (stats: LearnerStats) => boolean;
};

export const BADGES: readonly Badge[] = [
  {
    id: 'first_spark',
    rune: 'ᚲ',
    keyPrefix: 'badge.first_spark',
    isEarned: (s) => s.completed >= 1,
  },
  {
    id: 'half_path',
    rune: 'ᛇ',
    keyPrefix: 'badge.half_path',
    isEarned: (s) => s.completed >= Math.ceil(s.totalDays / 2),
  },
  {
    id: 'odins_journey',
    rune: 'ᛟ',
    keyPrefix: 'badge.odins_journey',
    isEarned: (s) => s.totalDays > 0 && s.completed >= s.totalDays,
  },
  {
    id: 'week_falcon',
    rune: 'ᚺ',
    keyPrefix: 'badge.week_falcon',
    isEarned: (s) => s.longestStreak >= 7,
  },
  {
    id: 'fortnight_walker',
    rune: 'ᛉ',
    keyPrefix: 'badge.fortnight_walker',
    isEarned: (s) => s.longestStreak >= 14,
  },
  {
    id: 'wise_speaker',
    rune: 'ᛗ',
    keyPrefix: 'badge.wise_speaker',
    isEarned: (s) => s.avgScore != null && s.avgScore >= 80,
  },
] as const;
