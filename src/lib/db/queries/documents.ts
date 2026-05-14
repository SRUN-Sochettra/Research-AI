import { createClient } from '../supabase/server';

export async function getDocuments() {
  const supabase = createClient();
  const { data, error } = await supabase.from('documents').select('*');
  return { data, error };
}

export async function getDocumentById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from('documents').select('*').eq('id', id).single();
  return { data, error };
}
