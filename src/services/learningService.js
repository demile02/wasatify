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
  if (error) {
    if (error.message?.includes('row-level security policy')) {
      throw new Error('Supabase menolak simpan modul karena policy RLS. Jalankan ulang policy guru untuk tabel modules di Supabase SQL Editor.');
    }
    throw error;
  }
  return data;
}

export async function updateModule(moduleId, module) {
  const { data, error } = await supabase
    .from('modules')
    .update({
      title: module.title,
      description: module.description,
      duration: module.duration,
      thumbnail: module.thumbnail || null,
    })
    .eq('id', moduleId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteModule(moduleId) {
  const { error } = await supabase.from('modules').delete().eq('id', moduleId);
  if (error) throw error;
}

export async function fetchModuleContents(moduleId = null) {
  if (!isSupabaseConfigured) {
    return [];
  }

  let query = supabase.from('module_contents').select('*');
  if (moduleId) {
    query = query.eq('module_id', moduleId);
  }

  const { data, error } = await query.order('order_number', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createModuleContent(content) {
  const { data, error } = await supabase
    .from('module_contents')
    .insert({
      module_id: content.module_id,
      content_type: content.content_type,
      title: content.title,
      body: content.body || null,
      media_url: content.media_url || null,
      order_number: content.order_number || 1,
    })
    .select('*')
    .single();

  if (error) {
    if (error.message?.includes('row-level security policy')) {
      throw new Error('Supabase menolak simpan konten. Jalankan supabase/fix-module-content-policies.sql di Supabase SQL Editor.');
    }
    throw error;
  }

  return data;
}

export async function uploadModuleMedia({ file, userId, moduleId }) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase belum dikonfigurasi.');
  }

  if (!file || !userId || !moduleId) {
    throw new Error('File, akun guru, dan modul wajib tersedia sebelum upload.');
  }

  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const path = `${userId}/${moduleId}/${Date.now()}-${safeName || 'media-file'}`;
  const { error } = await supabase.storage.from('module-media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    if (error.message?.includes('bucket') || error.message?.includes('row-level security policy')) {
      throw new Error('Upload media ditolak Supabase. Pastikan bucket module-media dan policy storage sudah dibuat.');
    }
    throw error;
  }

  const { data } = supabase.storage.from('module-media').getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteModuleContent(contentId) {
  const { error } = await supabase.from('module_contents').delete().eq('id', contentId);
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
