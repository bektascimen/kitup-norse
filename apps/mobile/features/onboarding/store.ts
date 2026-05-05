import { create } from 'zustand';
import { mmkv } from '../../lib/storage';

export type Path = 'wisdom' | 'warrior' | 'traveler';
export const PATHS: readonly Path[] = ['wisdom', 'warrior', 'traveler'] as const;

const KEY_COMPLETED = 'onboarding.completed';
const KEY_PATH = 'onboarding.path';

function readPath(): Path | null {
  const v = mmkv.getString(KEY_PATH);
  return v === 'wisdom' || v === 'warrior' || v === 'traveler' ? v : null;
}

type State = {
  completed: boolean;
  path: Path | null;
  setCompleted: () => void;
  setPath: (p: Path) => void;
  reset: () => void;
};

export const useOnboarding = create<State>((set) => ({
  completed: mmkv.getBoolean(KEY_COMPLETED) ?? false,
  path: readPath(),
  setCompleted: () => {
    mmkv.set(KEY_COMPLETED, true);
    set({ completed: true });
  },
  setPath: (path) => {
    mmkv.set(KEY_PATH, path);
    set({ path });
  },
  reset: () => {
    mmkv.delete(KEY_COMPLETED);
    mmkv.delete(KEY_PATH);
    set({ completed: false, path: null });
  },
}));
