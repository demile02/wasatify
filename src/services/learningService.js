import { isSupabaseConfigured, supabase } from '../lib/supabase';

export async function fetchModules() {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('order_number', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createModule(module, userId) {
  const payload = {
    title: module.title,
    description: module.description,
    duration: module.duration,
    order_number: module.order_number,
    thumbnail: module.thumbnail || null,
    created_by: userId || null,
  };

  const { data, error } = await supabase.from('modules').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteModule(moduleId) {
  const { error } = await supabase.from('modules').delete().eq('id', moduleId);
  if (error) throw error;
}

export async function fetchProgress(userId) {
  if (!isSupabaseConfigured || !userId) {
    return [];
  }

  const { data, error } = await supabase.from('user_progress').select('*').eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

export async function completeModule(userId, moduleId, quizScore = null) {
  const payload = {
    user_id: userId,
    module_id: moduleId,
    completed: true,
    completed_at: new Date().toISOString(),
  };

  if (quizScore !== null) {
    payload.quiz_score = quizScore;
  }

  const { data, error } = await supabase
    .from('user_progress')
    .upsert(payload, { onConflict: 'user_id,module_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function saveReflection({ userId, moduleId, reflectionText, actionPlan }) {
  const { data, error } = await supabase
    .from('reflections')
    .insert({
      user_id: userId,
      module_id: moduleId,
      reflection_text: reflectionText,
      action_plan: actionPlan,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function fetchQuizzes(moduleId) {
  if (!isSupabaseConfigured) {
    return [];
  }

  let query = supabase.from('quizzes').select('*');
  if (moduleId) {
    query = query.eq('module_id', moduleId);
  }

  const { data, error } = await query.order('id', { ascending: true });
  if (error) throw error;
  return data || [];
}
