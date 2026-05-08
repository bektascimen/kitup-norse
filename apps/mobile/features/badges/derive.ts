import { BADGES, type BadgeId } from './catalog';
import type { LearnerStats } from '../stats/queries';

export function deriveEarnedBadges(stats: LearnerStats): Set<BadgeId> {
  const earned = new Set<BadgeId>();
  for (const badge of BADGES) {
    if (badge.isEarned(stats)) earned.add(badge.id);
  }
  return earned;
}
