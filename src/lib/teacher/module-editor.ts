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
  orderIndex: number;
};

export type ModuleEditorQuestion = {
  id?: string;
  questionText: string;
  options: [string, string, string, string];
  correctAnswer: 'a' | 'b' | 'c' | 'd';
  explanation: string;
  points: number;
};

export type ModuleEditorQuiz = {
  id?: string;
  title: string;
  description: string;
  passingScore: number;
  maxAttempts: number;
  timeLimitSeconds: number;
  isPublished: boolean;
  questions: ModuleEditorQuestion[];
};

export type ModuleEditorInitialData = {
  id?: string;
  title: string;
  description: string;
  classId: string;
  estimatedMinutes: number;
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
  title: string;
  description: string;
  class_id: string | null;
  estimated_minutes: number | null;
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
  order_index: number | null;
};

type QuizRow = {
  id: string;
  title: string;
  description: string | null;
  passing_score: number | null;
  max_attempts: number | null;
  time_limit_seconds: number | null;
  is_published: boolean | null;
};

type QuestionRow = {
  id: string;
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
  isPublished: false,
  questions: [createEmptyQuestion()],
};

export function createEmptyLesson(orderIndex = 1): ModuleEditorLesson {
  return {
    title: '',
    content: '',
    videoUrl: '',
    infographicUrl: '',
    orderIndex,
  };
}

export function createEmptyQuestion(): ModuleEditorQuestion {
  return {
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: 'a',
    explanation: '',
    points: 10,
  };
}

export function createEmptyModule(): ModuleEditorInitialData {
  return {
    title: '',
    description: '',
    classId: '',
    estimatedMinutes: 30,
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
                  options: ['Sikap baik', 'Kecepatan belajar', 'Hafalan saja', 'Kegiatan bermain'],
                  correctAnswer: 'a',
                  explanation: 'Adab adalah sikap baik yang tercermin dalam perilaku sehari-hari.',
                  points: 10,
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

  const { data: moduleRow, error: moduleError } = await supabase
    .from('modules')
    .select('id, title, description, class_id, estimated_minutes, tags, cover_image_path, status, is_public')
    .eq('id', moduleId)
    .maybeSingle<ModuleRow>();

  if (moduleError || !moduleRow) {
    return { classes, module: null };
  }

  const [lessonsResult, quizResult] = await Promise.all([
    supabase
      .from('lessons')
      .select('id, title, content, video_url, infographic_url, order_index')
      .eq('module_id', moduleRow.id)
      .order('order_index', { ascending: true }),
    supabase
      .from('quizzes')
      .select('id, title, description, passing_score, max_attempts, time_limit_seconds, is_published')
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
      description: moduleRow.description,
      classId: moduleRow.class_id ?? '',
      estimatedMinutes: moduleRow.estimated_minutes ?? 30,
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
        orderIndex: lesson.order_index ?? index + 1,
      })),
      quiz: quizRow
        ? {
            id: quizRow.id,
            title: quizRow.title,
            description: quizRow.description ?? '',
            passingScore: quizRow.passing_score ?? 70,
            maxAttempts: quizRow.max_attempts ?? 3,
            timeLimitSeconds: quizRow.time_limit_seconds ?? 600,
            isPublished: quizRow.is_published ?? false,
            questions,
          }
        : { ...emptyQuiz, questions: [createEmptyQuestion()] },
    },
  };

  async function getQuestions(quizId: string) {
    const { data } = await supabase
      .from('quiz_questions')
      .select('id, question_text, options, correct_answer, explanation, points, order_index')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true });

    return ((data ?? []) as QuestionRow[]).map(mapQuestionRow);
  }
}

function mapQuestionRow(row: QuestionRow): ModuleEditorQuestion {
  const options = normalizeOptions(row.options);

  return {
    id: row.id,
    questionText: row.question_text,
    options,
    correctAnswer: normalizeCorrectAnswer(row.correct_answer),
    explanation: row.explanation ?? '',
    points: row.points ?? 10,
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
