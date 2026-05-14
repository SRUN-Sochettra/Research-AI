import { getSupabaseServerClient } from '../supabase/server';

export async function getUserProfile(id: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  return { data, error };
}
