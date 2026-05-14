import { createClient } from '../supabase/server';

export async function getConversations(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId);
  return { data, error };
}
