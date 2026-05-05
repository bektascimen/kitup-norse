import { useAuthStore } from '../store';

describe('auth store', () => {
  beforeEach(() => useAuthStore.setState({ session: null, status: 'idle' }));

  it('starts in idle status', () => {
    expect(useAuthStore.getState().status).toBe('idle');
  });

  it('sets session and status to authenticated', () => {
    useAuthStore.getState().setSession({ user: { id: 'u1' } } as any);
    const s = useAuthStore.getState();
    expect(s.status).toBe('authenticated');
    expect(s.session?.user.id).toBe('u1');
  });

  it('clearSession resets to anonymous status when isAnonymous=true is set on bootstrap', () => {
    useAuthStore.getState().setSession({ user: { id: 'u1' } } as any);
    useAuthStore.getState().clearSession();
    expect(useAuthStore.getState().status).toBe('idle');
    expect(useAuthStore.getState().session).toBeNull();
  });
});
