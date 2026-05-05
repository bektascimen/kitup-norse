import NetInfo from '@react-native-community/netinfo';
import { mmkv } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';

const KEY = 'outbox.progress.v1';

type Pending = { lessonId: string; score: number; ts: string };

function read(): Pending[] {
  const raw = mmkv.getString(KEY);
  return raw ? JSON.parse(raw) : [];
}
function write(items: Pending[]) {
  mmkv.set(KEY, JSON.stringify(items));
}

export function enqueueProgress(item: Pending) {
  write([...read(), item]);
}

export async function flushOutbox(): Promise<void> {
  const userId = useAuthStore.getState().session?.user.id;
  if (!userId) return;
  const items = read();
  if (items.length === 0) return;
  const remaining: Pending[] = [];
  for (const it of items) {
    const { error } = await supabase.from('user_progress').upsert({
      user_id: userId, lesson_id: it.lessonId,
      completed_at: it.ts, score: it.score, attempts: 1,
    }, { onConflict: 'user_id,lesson_id' });
    if (error) remaining.push(it);
  }
  write(remaining);
}

export function startOutboxListener() {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected) flushOutbox();
  });
}
