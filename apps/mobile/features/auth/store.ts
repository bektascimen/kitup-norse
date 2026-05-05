import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'error';

type AuthState = {
  session: Session | null;
  status: AuthStatus;
  error?: string;
  setStatus: (s: AuthStatus, error?: string) => void;
  setSession: (s: Session | null) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  status: 'idle',
  setStatus: (status, error) => set({ status, error }),
  setSession: (session) =>
    set({ session, status: session ? 'authenticated' : 'idle', error: undefined }),
  clearSession: () => set({ session: null, status: 'idle', error: undefined }),
}));
