'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
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
  slug: string;
  description: string;
  classId?: string;
  estimatedMinutes: number;
  orderIndex: number;
  difficulty?: 'pemula' | 'menengah' | 'lanjut' | '';
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

const saveTeacherModuleSchema = z.object({
  moduleId: z.string().optional(),
  title: z.string().trim().min(5, 'Judul modul minimal 5 karakter.'),
  slug: z.string().trim().optional(),
  description: z.string().trim().min(20, 'Deskripsi minimal 20 karakter.'),
  classId: z.string().optional(),
  estimatedMinutes: z.number().min(1, 'Durasi belajar harus lebih dari 0 menit.'),
  orderIndex: z.number().min(1, 'Order index minimal 1.'),
  difficulty: z.enum(['pemula', 'menengah', 'lanjut', '']).optional(),
  tags: z.array(z.string()),
  coverImagePath: z.string().optional(),
  coverAsset: z.unknown().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  isPublic: z.boolean(),
  lessons: z.array(z.unknown()),
  quiz: z.unknown(),
  intent: z.enum(['draft', 'publish']),
});

export async function saveTeacherModuleAction(
  input: SaveTeacherModuleInput,
): Promise<SaveTeacherModuleResult> {
  const parsed = saveTeacherModuleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Data modul tidak valid.' };
  }

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
    const modulePayload: Record<string, unknown> = {
      class_id: input.classId || null,
      title: input.title.trim(),
      slug: normalizeSlug(input.slug || input.title),
      description: input.description.trim(),
      cover_image_path: input.coverImagePath?.trim() || null,
      difficulty: input.difficulty || null,
      tags: normalizeTags(input.tags),
      status: isPublishing ? 'published' : input.status === 'archived' ? 'archived' : 'draft',
      is_public: input.isPublic,
      estimated_minutes: Math.max(Math.round(input.estimatedMinutes), 1),
      order_index: Math.max(Math.round(input.orderIndex), 1),
      published_at: isPublishing ? now : null,
    };

    const moduleId = input.moduleId
      ? await updateModule(input.moduleId, modulePayload)
      : await createModule({ ...modulePayload, teacher_id: user.id, created_by: user.id });

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
    const requiredOptions = question.questionType === 'true_false' ? question.options.slice(0, 2) : question.options;
    if (requiredOptions.some((option) => !option.trim())) {
      return question.questionType === 'true_false'
        ? 'Pertanyaan benar/salah wajib memiliki opsi Benar dan Salah.'
        : 'Setiap pertanyaan pilihan ganda wajib memiliki empat opsi jawaban.';
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
  const slug = `${normalizeSlug(String(payload.slug || payload.title))}-${Date.now().toString(36)}`;
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
      reflection_prompt: lesson.reflectionPrompt.trim() || null,
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
    allow_retake: quiz.allowRetake,
    show_explanation: quiz.showExplanation,
    shuffle_questions: quiz.shuffleQuestions,
    is_published: publishQuiz || quiz.isPublished,
    status: publishQuiz || quiz.isPublished ? 'published' : quiz.status,
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
      question_type: question.questionType,
      question_text: question.questionText.trim(),
      options: buildQuestionOptions(question).map((text, optionIndex) => ({
        id: ['a', 'b', 'c', 'd'][optionIndex],
        text,
      })),
      correct_answer: {
        type: question.questionType,
        value: question.correctAnswer,
      },
      explanation: question.explanation.trim(),
      show_explanation: true,
      points: Math.max(Math.round(question.points), 1),
      order_index: Number.isFinite(question.orderIndex) ? Math.max(Math.round(question.orderIndex), 1) : index + 1,
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

function buildQuestionOptions(question: ModuleEditorQuestion) {
  if (question.questionType === 'true_false') {
    return [
      question.options[0].trim() || 'Benar',
      question.options[1].trim() || 'Salah',
    ];
  }

  return ['a', 'b', 'c', 'd'].map((_, optionIndex) => question.options[optionIndex].trim());
}

function normalizeTags(tags: string[]) {
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeSlug(value: string) {
  return slugify(value);
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
