'use server';

import { revalidatePath } from 'next/cache';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type {
  ModuleEditorLesson,
  ModuleEditorQuestion,
  ModuleEditorQuiz,
} from '@/lib/teacher/module-editor';
import type { AppRole } from '@/lib/types';

export type UploadedAssetInput = {
  bucket: string;
  path: string;
  publicUrl: string;
  mimeType?: string;
  sizeBytes?: number;
};

export type SaveTeacherModuleInput = {
  moduleId?: string;
  title: string;
  description: string;
  classId?: string;
  estimatedMinutes: number;
  tags: string[];
  coverImagePath?: string;
  coverAsset?: UploadedAssetInput;
  status: 'draft' | 'published' | 'archived';
  isPublic: boolean;
  lessons: ModuleEditorLesson[];
  quiz: ModuleEditorQuiz;
  intent: 'draft' | 'publish';
};

export type SaveTeacherModuleResult = {
  ok: boolean;
  moduleId?: string;
  error?: string;
};

type ProfileRoleRow = {
  role: AppRole;
};

type ExistingIdRow = {
  id: string;
};

type QuizIdRow = {
  id: string;
};

export async function saveTeacherModuleAction(
  input: SaveTeacherModuleInput,
): Promise<SaveTeacherModuleResult> {
  const validationError = validateModuleInput(input);
  if (validationError) return { ok: false, error: validationError };

  if (!isSupabaseConfigured) {
    return { ok: true, moduleId: input.moduleId ?? 'demo-module-saved' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: 'Sesi guru belum aktif. Silakan masuk kembali.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle<ProfileRoleRow>();

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
      return { ok: false, error: 'Akses hanya untuk guru atau admin.' };
    }

    const isPublishing = input.intent === 'publish';
    const now = new Date().toISOString();
    const modulePayload = {
      teacher_id: user.id,
      created_by: user.id,
      class_id: input.classId || null,
      title: input.title.trim(),
      description: input.description.trim(),
      cover_image_path: input.coverImagePath?.trim() || null,
      tags: normalizeTags(input.tags),
      status: isPublishing ? 'published' : input.status === 'archived' ? 'archived' : 'draft',
      is_public: input.isPublic,
      estimated_minutes: Math.max(Math.round(input.estimatedMinutes), 1),
      published_at: isPublishing ? now : null,
    };

    const moduleId = input.moduleId
      ? await updateModule(input.moduleId, modulePayload)
      : await createModule(modulePayload);

    await saveCoverAsset(moduleId, user.id, input.coverAsset);
    await syncLessons(moduleId, input.lessons);
    await syncQuiz(moduleId, user.id, input.quiz, isPublishing);

    revalidatePath('/teacher/dashboard');
    revalidatePath('/teacher/modules');
    revalidatePath(`/teacher/modules/${moduleId}/edit`);
    revalidatePath('/student/modules');

    return { ok: true, moduleId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Gagal menyimpan modul.',
    };
  }
}

function validateModuleInput(input: SaveTeacherModuleInput) {
  if (!input.title.trim()) return 'Judul modul wajib diisi.';
  if (input.title.trim().length < 4) return 'Judul modul minimal 4 karakter.';
  if (!input.description.trim()) return 'Deskripsi singkat wajib diisi.';
  if (input.description.trim().length < 12) return 'Deskripsi minimal 12 karakter.';
  if (!Number.isFinite(input.estimatedMinutes) || input.estimatedMinutes < 1) {
    return 'Durasi belajar harus lebih dari 0 menit.';
  }

  const filledLessons = input.lessons.filter((lesson) => lesson.title.trim() || lesson.content.trim());

  if (input.intent === 'publish' && !filledLessons.length) {
    return 'Tambahkan minimal satu lesson sebelum publish.';
  }

  for (const lesson of filledLessons) {
    if (!lesson.title.trim()) return 'Setiap lesson wajib memiliki judul.';
    if (!lesson.content.trim()) return `Konten lesson "${lesson.title}" wajib diisi.`;
  }

  const filledQuestions = input.quiz.questions.filter((question) => question.questionText.trim());

  if (input.intent === 'publish' && !filledQuestions.length) {
    return 'Tambahkan minimal satu pertanyaan kuis sebelum publish.';
  }

  for (const question of filledQuestions) {
    if (question.options.some((option) => !option.trim())) {
      return 'Setiap pertanyaan kuis wajib memiliki empat opsi jawaban.';
    }
    if (!question.explanation.trim()) {
      return 'Setiap pertanyaan kuis wajib memiliki penjelasan.';
    }
    if (!Number.isFinite(question.points) || question.points < 1) {
      return 'Poin pertanyaan harus lebih dari 0.';
    }
  }

  return null;
}

async function createModule(payload: Record<string, unknown>) {
  const supabase = await createClient();
  const slug = `${slugify(String(payload.title))}-${Date.now().toString(36)}`;
  const { data, error } = await supabase
    .from('modules')
    .insert({ ...payload, slug })
    .select('id')
    .single<{ id: string }>();

  if (error) throw error;
  return data.id;
}

async function updateModule(moduleId: string, payload: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase.from('modules').update(payload).eq('id', moduleId);

  if (error) throw error;
  return moduleId;
}

async function saveCoverAsset(moduleId: string, ownerId: string, asset?: UploadedAssetInput) {
  if (!asset?.bucket || !asset.path || !asset.publicUrl) return;

  const supabase = await createClient();
  const { error } = await supabase.from('media_assets').upsert(
    {
      owner_id: ownerId,
      module_id: moduleId,
      bucket: asset.bucket,
      path: asset.path,
      public_url: asset.publicUrl,
      mime_type: asset.mimeType ?? null,
      size_bytes: asset.sizeBytes ?? null,
      kind: 'module_cover',
    },
    { onConflict: 'bucket,path' },
  );

  if (error) throw error;
}

async function syncLessons(moduleId: string, lessons: ModuleEditorLesson[]) {
  const supabase = await createClient();
  const normalizedLessons = lessons
    .filter((lesson) => lesson.title.trim() || lesson.content.trim())
    .map((lesson, index) => ({
      id: lesson.id,
      module_id: moduleId,
      title: lesson.title.trim(),
      slug: lesson.id ? undefined : `${slugify(lesson.title)}-${Date.now().toString(36)}-${index + 1}`,
      type: 'article',
      content: lesson.content.trim(),
      video_url: lesson.videoUrl.trim() || null,
      infographic_url: lesson.infographicUrl.trim() || null,
      order_index: Number.isFinite(lesson.orderIndex) ? Math.max(Math.round(lesson.orderIndex), 1) : index + 1,
      estimated_minutes: 5,
    }));
  const keepIds = normalizedLessons.map((lesson) => lesson.id).filter(Boolean) as string[];
  const { data: existingLessons } = await supabase.from('lessons').select('id').eq('module_id', moduleId);
  const existingIds = ((existingLessons ?? []) as ExistingIdRow[]).map((row) => row.id);
  const deleteIds = existingIds.filter((id) => !keepIds.includes(id));

  if (deleteIds.length) {
    const { error } = await supabase.from('lessons').delete().in('id', deleteIds);
    if (error) throw error;
  }

  for (const lesson of normalizedLessons) {
    if (lesson.id) {
      const payload = { ...lesson };
      delete payload.id;
      delete payload.slug;
      const { error } = await supabase.from('lessons').update(payload).eq('id', lesson.id);
      if (error) throw error;
    } else {
      const payload = { ...lesson };
      delete payload.id;
      const { error } = await supabase.from('lessons').insert(payload);
      if (error) throw error;
    }
  }
}

async function syncQuiz(
  moduleId: string,
  teacherId: string,
  quiz: ModuleEditorQuiz,
  publishQuiz: boolean,
) {
  const shouldSaveQuiz =
    quiz.title.trim() ||
    quiz.description.trim() ||
    quiz.questions.some((question) => question.questionText.trim());

  if (!shouldSaveQuiz) return;

  const quizPayload = {
    module_id: moduleId,
    teacher_id: teacherId,
    title: quiz.title.trim() || 'Kuis Pemahaman',
    description: quiz.description.trim() || null,
    passing_score: clampNumber(quiz.passingScore, 0, 100),
    max_attempts: Math.max(Math.round(quiz.maxAttempts), 1),
    time_limit_seconds: Math.max(Math.round(quiz.timeLimitSeconds), 60),
    is_published: publishQuiz || quiz.isPublished,
    status: publishQuiz || quiz.isPublished ? 'published' : 'draft',
  };
  const quizId = quiz.id ? await updateQuiz(quiz.id, quizPayload) : await createQuiz(quizPayload);

  await syncQuestions(quizId, quiz.questions);
}

async function createQuiz(payload: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('quizzes').insert(payload).select('id').single<QuizIdRow>();

  if (error) throw error;
  return data.id;
}

async function updateQuiz(quizId: string, payload: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase.from('quizzes').update(payload).eq('id', quizId);

  if (error) throw error;
  return quizId;
}

async function syncQuestions(quizId: string, questions: ModuleEditorQuestion[]) {
  const supabase = await createClient();
  const normalizedQuestions = questions
    .filter((question) => question.questionText.trim())
    .map((question, index) => ({
      id: question.id,
      quiz_id: quizId,
      question_type: 'single_choice',
      question_text: question.questionText.trim(),
      options: ['a', 'b', 'c', 'd'].map((id, optionIndex) => ({
        id,
        text: question.options[optionIndex].trim(),
      })),
      correct_answer: {
        type: 'single_choice',
        value: question.correctAnswer,
      },
      explanation: question.explanation.trim(),
      show_explanation: true,
      points: Math.max(Math.round(question.points), 1),
      order_index: index + 1,
    }));
  const keepIds = normalizedQuestions.map((question) => question.id).filter(Boolean) as string[];
  const { data: existingQuestions } = await supabase.from('quiz_questions').select('id').eq('quiz_id', quizId);
  const existingIds = ((existingQuestions ?? []) as ExistingIdRow[]).map((row) => row.id);
  const deleteIds = existingIds.filter((id) => !keepIds.includes(id));

  if (deleteIds.length) {
    const { error } = await supabase.from('quiz_questions').delete().in('id', deleteIds);
    if (error) throw error;
  }

  for (const question of normalizedQuestions) {
    if (question.id) {
      const { id, ...payload } = question;
      const { error } = await supabase.from('quiz_questions').update(payload).eq('id', id);
      if (error) throw error;
    } else {
      const payload = { ...question };
      delete payload.id;
      const { error } = await supabase.from('quiz_questions').insert(payload);
      if (error) throw error;
    }
  }
}

function normalizeTags(tags: string[]) {
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'modul';
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max);
}
