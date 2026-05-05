import { MMKV } from 'react-native-mmkv';

export const mmkv = new MMKV({ id: 'kitup' });

export const mmkvStorageAdapter = {
  getItem: (key: string) => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string) => mmkv.set(key, value),
  removeItem: (key: string) => mmkv.delete(key),
};
