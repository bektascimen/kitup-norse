import { useEffect, useMemo } from 'react';
import { useLearnerStats } from '../stats/queries';
import { BADGES, type Badge, type BadgeId } from './catalog';
import { deriveEarnedBadges } from './derive';
import { useBadgesStore } from './store';

export type BadgeView = Badge & {
  earned: boolean;
  newlyEarned: boolean;
};

export type BadgesView = {
  /** Catalog order, augmented with `earned` and `newlyEarned`. */
  badges: BadgeView[];
  /** Total earned count, useful for the section header. */
  earnedCount: number;
  /** Newly-earned ids — pass to `markManySeen` after the user views them. */
  newlyEarned: BadgeId[];
};

export function useBadges(): BadgesView {
  const stats = useLearnerStats();
  const seen = useBadgesStore((s) => s.seenBadges);
  const pruneSeen = useBadgesStore((s) => s.pruneSeen);

  // Drop seen entries that the learner no longer satisfies. A DB reset
  // (e.g. wiping user_progress to retest the unlock flow) should let
  // previously-acknowledged sigils pop again on re-earn.
  useEffect(() => {
    if (!stats.data) return;
    const earnedSet = deriveEarnedBadges(stats.data);
    pruneSeen(earnedSet);
  }, [stats.data, pruneSeen]);

  return useMemo(() => {
    if (!stats.data) {
      return {
        badges: BADGES.map((b) => ({ ...b, earned: false, newlyEarned: false })),
        earnedCount: 0,
        newlyEarned: [],
      };
    }
    const earnedSet = deriveEarnedBadges(stats.data);
    const newlyEarned: BadgeId[] = [];
    const badges: BadgeView[] = BADGES.map((b) => {
      const earned = earnedSet.has(b.id);
      const isNew = earned && !seen.has(b.id);
      if (isNew) newlyEarned.push(b.id);
      return { ...b, earned, newlyEarned: isNew };
    });
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[badges]', {
        completed: stats.data.completed,
        avg: stats.data.avgScore,
        streak: stats.data.longestStreak,
        earned: [...earnedSet],
        seen: [...seen],
        newlyEarned,
      });
    }
    return { badges, earnedCount: earnedSet.size, newlyEarned };
  }, [stats.data, seen]);
}
