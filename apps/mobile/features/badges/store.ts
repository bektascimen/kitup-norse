import { create } from 'zustand';
import { mmkv } from '../../lib/storage';
import type { BadgeId } from './catalog';

const KEY_SEEN = 'badges.seen.v1';

function loadSeen(): Set<BadgeId> {
  const raw = mmkv.getString(KEY_SEEN);
  if (!raw) return new Set();
  try {
    const arr = JSON.parse(raw) as string[];
    return new Set(arr as BadgeId[]);
  } catch {
    return new Set();
  }
}

function persist(set: Set<BadgeId>) {
  mmkv.set(KEY_SEEN, JSON.stringify([...set]));
}

type State = {
  seenBadges: Set<BadgeId>;
  markSeen: (id: BadgeId) => void;
  markManySeen: (ids: readonly BadgeId[]) => void;
  /** Drop seen entries that are no longer in `currentlyEarned` — e.g.
   *  after a DB reset that re-locks badges. Without this, re-earning
   *  the same badge silently no-ops because the prior seen state
   *  outlives the underlying progress. */
  pruneSeen: (currentlyEarned: ReadonlySet<BadgeId>) => void;
  reset: () => void;
};

export const useBadgesStore = create<State>((set, get) => ({
  seenBadges: loadSeen(),
  markSeen: (id) => {
    const seen = new Set(get().seenBadges);
    if (seen.has(id)) return;
    seen.add(id);
    persist(seen);
    set({ seenBadges: seen });
  },
  markManySeen: (ids) => {
    const seen = new Set(get().seenBadges);
    let changed = false;
    for (const id of ids) {
      if (!seen.has(id)) {
        seen.add(id);
        changed = true;
      }
    }
    if (!changed) return;
    persist(seen);
    set({ seenBadges: seen });
  },
  pruneSeen: (currentlyEarned) => {
    const cur = get().seenBadges;
    if (cur.size === 0) return;
    let changed = false;
    const next = new Set<BadgeId>();
    for (const id of cur) {
      if (currentlyEarned.has(id)) next.add(id);
      else changed = true;
    }
    if (!changed) return;
    persist(next);
    set({ seenBadges: next });
  },
  reset: () => {
    mmkv.delete(KEY_SEEN);
    set({ seenBadges: new Set() });
  },
}));
