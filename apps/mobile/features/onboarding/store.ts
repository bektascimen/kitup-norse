import { create } from 'zustand';
import { mmkv } from '../../lib/storage';

const KEY = 'onboarding.completed';

type State = {
  completed: boolean;
  setCompleted: () => void;
  reset: () => void;
};

export const useOnboarding = create<State>((set) => ({
  completed: mmkv.getBoolean(KEY) ?? false,
  setCompleted: () => { mmkv.set(KEY, true); set({ completed: true }); },
  reset: () => { mmkv.delete(KEY); set({ completed: false }); },
}));
