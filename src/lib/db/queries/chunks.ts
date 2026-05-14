import { createClient } from '../supabase/server';

export async function insertChunks(chunks: any[]) {
  const supabase = createClient();
  const { data, error } = await supabase.from('chunks').insert(chunks);
  return { data, error };
}
