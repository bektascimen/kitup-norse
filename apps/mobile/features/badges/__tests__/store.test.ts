import { useBadgesStore } from '../store';

describe('badges store', () => {
  beforeEach(() => useBadgesStore.getState().reset());

  it('starts with empty seen set', () => {
    expect(useBadgesStore.getState().seenBadges.size).toBe(0);
  });

  it('markSeen adds an id', () => {
    useBadgesStore.getState().markSeen('first_spark');
    expect(useBadgesStore.getState().seenBadges.has('first_spark')).toBe(true);
  });

  it('markSeen is idempotent', () => {
    useBadgesStore.getState().markSeen('first_spark');
    useBadgesStore.getState().markSeen('first_spark');
    expect(useBadgesStore.getState().seenBadges.size).toBe(1);
  });

  it('markManySeen adds all ids in one call', () => {
    useBadgesStore.getState().markManySeen(['first_spark', 'week_falcon']);
    expect(useBadgesStore.getState().seenBadges.size).toBe(2);
  });

  it('reset clears the seen set', () => {
    useBadgesStore.getState().markSeen('first_spark');
    useBadgesStore.getState().reset();
    expect(useBadgesStore.getState().seenBadges.size).toBe(0);
  });
});
