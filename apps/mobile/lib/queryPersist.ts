import { mmkv } from './storage';

export const mmkvPersister = {
  persistClient: async (client: unknown) => {
    mmkv.set('rq.cache', JSON.stringify(client));
  },
  restoreClient: async () => {
    const raw = mmkv.getString('rq.cache');
    return raw ? JSON.parse(raw) : undefined;
  },
  removeClient: async () => mmkv.delete('rq.cache'),
};
