import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { TeacherModuleStatus } from '@/lib/teacher/data';
import type { Profile } from '@/lib/types';

export type TeacherClassOption = {
  id: string;
  name: string;
  gradeLevel: string | null;
};

export type ModuleEditorLesson = {
  id?: string;
  title: string;
  content: string;
  videoUrl: string;
  infographicUrl: string;
  reflectionPrompt: string;
  orderIndex: number;
};

export type ModuleEditorQuestion = {
  id?: string;
  questionType: 'multiple_choice' | 'true_false';
  questionText: string;
  options: [string, string, string, string];
  correctAnswer: 'a' | 'b' | 'c' | 'd';
  explanation: string;
  points: number;
  orderIndex: number;
};

export type ModuleEditorQuiz = {
  id?: string;
  title: string;
  description: string;
  passingScore: number;
  maxAttempts: number;
  timeLimitSeconds: number;
  allowRetake: boolean;
  showExplanation: boolean;
  shuffleQuestions: boolean;
  status: TeacherModuleStatus;
  isPublished: boolean;
  questions: ModuleEditorQuestion[];
};

export type ModuleEditorInitialData = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  classId: string;
  estimatedMinutes: number;
  orderIndex: number;
  difficulty: 'pemula' | 'menengah' | 'lanjut' | '';
  tags: string[];
  coverImagePath: string;
  status: TeacherModuleStatus;
  isPublic: boolean;
  lessons: ModuleEditorLesson[];
  quiz: ModuleEditorQuiz;
};

export type ModuleEditorData = {
  module: ModuleEditorInitialData | null;
  classes: TeacherClassOption[];
};

type ClassRow = {
  id: string;
  name: string;
  grade_level: string | null;
};

type ModuleRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  class_id: string | null;
  estimated_minutes: number | null;
  order_index: number | null;
  difficulty: 'pemula' | 'menengah' | 'lanjut' | null;
  tags: string[] | null;
  cover_image_path: string | null;
  status: TeacherModuleStatus;
  is_public: boolean | null;
};

type LessonRow = {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  infographic_url: string | null;
  reflection_prompt: string | null;
  order_index: number | null;
};

type QuizRow = {
  id: string;
  title: string;
  description: string | null;
  passing_score: number | null;
  max_attempts: number | null;
  time_limit_seconds: number | null;
  allow_retake?: boolean | null;
  show_explanation?: boolean | null;
  shuffle_questions?: boolean | null;
  status?: TeacherModuleStatus | null;
  is_published: boolean | null;
};

type QuestionRow = {
  id: string;
  question_type: ModuleEditorQuestion['questionType'];
  question_text: string;
  options: unknown;
  correct_answer: unknown;
  explanation: string | null;
  points: number | null;
  order_index: number | null;
};

const emptyQuiz: ModuleEditorQuiz = {
  title: 'Kuis Pemahaman',
  description: '',
  passingScore: 70,
  maxAttempts: 3,
  timeLimitSeconds: 600,
  allowRetake: true,
  showExplanation: true,
  shuffleQuestions: false,
  status: 'draft',
  isPublished: false,
  questions: [createEmptyQuestion()],
};

export function createEmptyLesson(orderIndex = 1): ModuleEditorLesson {
  return {
    title: '',
    content: '',
    videoUrl: '',
    infographicUrl: '',
    reflectionPrompt: '',
    orderIndex,
  };
}

export function createEmptyQuestion(): ModuleEditorQuestion {
  return {
    questionType: 'multiple_choice',
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: 'a',
    explanation: '',
    points: 10,
    orderIndex: 1,
  };
}

export function createEmptyModule(): ModuleEditorInitialData {
  return {
    title: '',
    slug: '',
    description: '',
    classId: '',
    estimatedMinutes: 30,
    orderIndex: 1,
    difficulty: '',
    tags: [],
    coverImagePath: '',
    status: 'draft',
    isPublic: true,
    lessons: [createEmptyLesson(1)],
    quiz: { ...emptyQuiz, questions: [createEmptyQuestion()] },
  };
}

export async function getModuleEditorData(
  profile: Profile,
  moduleId?: string,
): Promise<ModuleEditorData> {
  if (!isSupabaseConfigured) {
    return {
      classes: [
        { id: 'demo-class-8a', name: 'Kelas 8A', gradeLevel: 'VIII' },
        { id: 'demo-class-9a', name: 'Kelas 9A', gradeLevel: 'IX' },
      ],
      module: moduleId
        ? {
            ...createEmptyModule(),
            id: moduleId,
            title: 'Adab dalam Islam',
            description: 'Memahami pentingnya adab dalam kehidupan sehari-hari.',
            tags: ['Akhlak', 'Adab'],
            status: 'published',
            lessons: [
              {
                title: 'Pengertian Adab',
                content: 'Adab adalah sikap baik yang memuliakan Allah, sesama manusia, dan lingkungan.',
                videoUrl: '',
                infographicUrl: '',
                reflectionPrompt: '',
                orderIndex: 1,
              },
            ],
            quiz: {
              ...emptyQuiz,
              title: 'Kuis Adab',
              isPublished: true,
              questions: [
                {
                  questionText: 'Apa makna adab dalam Islam?',
                  questionType: 'multiple_choice',
                  options: ['Sikap baik', 'Kecepatan belajar', 'Hafalan saja', 'Kegiatan bermain'],
                  correctAnswer: 'a',
                  explanation: 'Adab adalah sikap baik yang tercermin dalam perilaku sehari-hari.',
                  points: 10,
                  orderIndex: 1,
                },
              ],
            },
          }
        : null,
    };
  }

  const supabase = await createClient();
  const classesQuery = supabase
    .from('classes')
    .select('id, name, grade_level')
    .order('name', { ascending: true });
  const classesResult =
    profile.role === 'admin' ? await classesQuery : await classesQuery.eq('teacher_id', profile.id);
  const classes = ((classesResult.data ?? []) as ClassRow[]).map((classItem) => ({
    id: classItem.id,
    name: classItem.name,
    gradeLevel: classItem.grade_level,
  }));

  if (!moduleId) {
    return { classes, module: null };
  }

  let moduleQuery = supabase
    .from('modules')
    .select('id, slug, title, description, class_id, estimated_minutes, order_index, difficulty, tags, cover_image_path, status, is_public, created_by')
    .eq('id', moduleId);

  if (profile.role === 'teacher') {
    moduleQuery = moduleQuery.eq('created_by', profile.id);
  }

  const { data: moduleRow, error: moduleError } = await moduleQuery.maybeSingle<ModuleRow>();

  if (moduleError || !moduleRow) {
    return { classes, module: null };
  }

  const [lessonsResult, quizResult] = await Promise.all([
    supabase
      .from('lessons')
      .select('id, title, content, video_url, infographic_url, reflection_prompt, order_index')
      .eq('module_id', moduleRow.id)
      .order('order_index', { ascending: true }),
    supabase
      .from('quizzes')
      .select('id, title, description, passing_score, max_attempts, time_limit_seconds, allow_retake, show_explanation, shuffle_questions, status, is_published')
      .eq('module_id', moduleRow.id)
      .order('created_at', { ascending: true })
      .limit(1),
  ]);

  const quizRow = ((quizResult.data ?? []) as QuizRow[])[0];
  const questions = quizRow ? await getQuestions(quizRow.id) : [createEmptyQuestion()];

  return {
    classes,
    module: {
      id: moduleRow.id,
      title: moduleRow.title,
      slug: moduleRow.slug,
      description: moduleRow.description,
      classId: moduleRow.class_id ?? '',
      estimatedMinutes: moduleRow.estimated_minutes ?? 30,
      orderIndex: moduleRow.order_index ?? 1,
      difficulty: moduleRow.difficulty ?? '',
      tags: moduleRow.tags ?? [],
      coverImagePath: moduleRow.cover_image_path ?? '',
      status: moduleRow.status,
      isPublic: moduleRow.is_public ?? true,
      lessons: ((lessonsResult.data ?? []) as LessonRow[]).map((lesson, index) => ({
        id: lesson.id,
        title: lesson.title,
        content: lesson.content ?? '',
        videoUrl: lesson.video_url ?? '',
        infographicUrl: lesson.infographic_url ?? '',
        reflectionPrompt: lesson.reflection_prompt ?? '',
        orderIndex: lesson.order_index ?? index + 1,
      })),
      quiz: quizRow
        ? {
            id: quizRow.id,
            title: quizRow.title,
            description: quizRow.description ?? '',
            passingScore: quizRow.passing_score ?? 70,
            maxAttempts: Math.max(quizRow.max_attempts ?? 3, 1),
            timeLimitSeconds: quizRow.time_limit_seconds ?? 600,
            allowRetake: (quizRow.max_attempts ?? 3) > 1 && (quizRow.allow_retake ?? true),
            showExplanation: quizRow.show_explanation ?? true,
            shuffleQuestions: quizRow.shuffle_questions ?? false,
            status: quizRow.status ?? 'draft',
            isPublished: quizRow.is_published ?? false,
            questions,
          }
        : { ...emptyQuiz, questions: [createEmptyQuestion()] },
    },
  };

  async function getQuestions(quizId: string) {
    const { data } = await supabase
      .from('quiz_questions')
      .select('id, question_type, question_text, options, correct_answer, explanation, points, order_index')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true });

    return ((data ?? []) as QuestionRow[]).map(mapQuestionRow);
  }
}

function mapQuestionRow(row: QuestionRow): ModuleEditorQuestion {
  const options = normalizeOptions(row.options);

  return {
    id: row.id,
    questionType: row.question_type ?? 'multiple_choice',
    questionText: row.question_text,
    options,
    correctAnswer: normalizeCorrectAnswer(row.correct_answer),
    explanation: row.explanation ?? '',
    points: row.points ?? 10,
    orderIndex: row.order_index ?? 1,
  };
}

function normalizeOptions(value: unknown): [string, string, string, string] {
  if (!Array.isArray(value)) return ['', '', '', ''];
  const options = value.map((option) => {
    if (!option || typeof option !== 'object') return '';
    return String((option as Record<string, unknown>).text ?? '');
  });

  return [options[0] ?? '', options[1] ?? '', options[2] ?? '', options[3] ?? ''];
}

function normalizeCorrectAnswer(value: unknown): ModuleEditorQuestion['correctAnswer'] {
  if (!value || typeof value !== 'object') return 'a';
  const answer = String((value as Record<string, unknown>).value ?? 'a');

  return answer === 'b' || answer === 'c' || answer === 'd' ? answer : 'a';
}
