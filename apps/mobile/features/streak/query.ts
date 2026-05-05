import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';

export function useUserStreak() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    enabled: !!userId,
    queryKey: ['user_streak', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('current_streak, longest_streak, last_active_date')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
