import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export type PublicRegistrationClass = {
  id: string;
  name: string;
  grade_level: string | null;
  academic_year: string | null;
  teacher_id: string | null;
  join_code: string | null;
};

export async function getPublicClassesForRegistration(): Promise<PublicRegistrationClass[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('classes')
      .select('id, name, grade_level, academic_year, teacher_id, join_code')
      .order('name', { ascending: true });

    if (!error) return (data ?? []) as PublicRegistrationClass[];

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_classes_for_registration');
    if (rpcError) return [];

    return (rpcData ?? []) as PublicRegistrationClass[];
  } catch {
    return [];
  }
}
