import { createClient } from '../supabase/server';

export async function getUserProfile(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  return { data, error };
}
