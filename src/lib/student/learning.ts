import { demoStudentModules, type StudentModule } from '@/lib/demo/student';
import { getStudentModules } from '@/lib/student/data';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export type StudentLesson = {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  type: 'article' | 'video' | 'infographic' | 'reflection';
  content: string | null;
  videoUrl: string | null;
  infographicUrl: string | null;
  orderIndex: number;
  estimatedMinutes: number;
};

export type QuizOption = {
  id: string;
  text: string;
};

export type QuizQuestion = {
  id: string;
  questionType: 'single_choice' | 'multiple_choice' | 'true_false';
  questionText: string;
  options: QuizOption[];
  correctAnswer: string;
  explanation: string | null;
  showExplanation: boolean;
  points: number;
  orderIndex: number;
};

export type StudentQuiz = {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  passingScore: number;
  maxAttempts: number;
  timeLimitSeconds: number | null;
  questions: QuizQuestion[];
};

export type ModuleLearningData = {
  module: StudentModule | null;
  lessons: StudentLesson[];
  completedLessonIds: string[];
  isDemo: boolean;
};

export type QuizLearningData = {
  module: StudentModule | null;
  quiz: StudentQuiz | null;
  isDemo: boolean;
};

export type QuizResultData = {
  module: StudentModule | null;
  attemptId?: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
  elapsedSeconds: number;
  passed: boolean;
  available: boolean;
};

type LessonRow = {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  type: StudentLesson['type'];
  content: string | null;
  video_url: string | null;
  infographic_url?: string | null;
  order_index: number | null;
  estimated_minutes: number | null;
};

type LessonProgressRow = {
  lesson_id: string;
};

type QuizRow = {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  passing_score: number | null;
  max_attempts: number | null;
  time_limit_seconds: number | null;
};

type QuizQuestionRow = {
  id: string;
  question_type: QuizQuestion['questionType'];
  question_text: string;
  options: unknown;
  correct_answer: unknown;
  explanation: string | null;
  show_explanation?: boolean | null;
  points: number | null;
  order_index: number | null;
};

type QuizAttemptRow = {
  id: string;
  quiz_id: string;
  score: number | null;
  total_questions: number | null;
  correct_answers: number | null;
  started_at: string | null;
  submitted_at: string | null;
};

const demoLessons: StudentLesson[] = [
  {
    id: 'tawazun-keseimbangan',
    moduleId: 'islam-wasathiyah-pengantar',
    title: 'Tawazun (Keseimbangan)',
    slug: 'tawazun-keseimbangan',
    type: 'article',
    content:
      'Tawazun berarti menjaga keseimbangan dalam berbagai aspek kehidupan agar tidak berlebihan dan tidak mengabaikan. Dalam Islam, tawazun mengajarkan keseimbangan antara dunia dan akhirat, ibadah dan usaha, hak diri sendiri dan hak orang lain. Sikap ini membantu seorang muslim tetap adil, bijak, dan bertanggung jawab dalam mengambil keputusan.',
    videoUrl: null,
    infographicUrl: '/assets/wasatify-tawazun.png',
    orderIndex: 1,
    estimatedMinutes: 12,
  },
];

const demoQuiz: StudentQuiz = {
  id: 'kuis-pemahaman-tawazun',
  moduleId: 'islam-wasathiyah-pengantar',
  title: 'Kuis Pemahaman Tawazun',
  description: 'Uji pemahaman awal tentang makna tawazun dalam Islam Wasathiyah.',
  passingScore: 70,
  maxAttempts: 3,
  timeLimitSeconds: 600,
  questions: [
    {
      id: 'q-tawazun-1',
      questionType: 'single_choice',
      questionText: 'Manakah pernyataan yang paling tepat tentang makna tawazun dalam Islam?',
      options: [
        { id: 'a', text: 'Mengutamakan urusan dunia saja agar hidup menjadi sejahtera.' },
        {
          id: 'b',
          text: 'Menjaga keseimbangan antara dunia dan akhirat, ibadah dan usaha, serta hak diri dan orang lain.',
        },
        { id: 'c', text: 'Menjauhi semua urusan dunia dan fokus pada ibadah saja.' },
        { id: 'd', text: 'Melakukan sesuatu secara berlebihan agar hasilnya lebih cepat tercapai.' },
      ],
      correctAnswer: 'b',
      explanation:
        'Tawazun berarti menjaga keseimbangan agar tidak condong ke salah satu sisi. Islam mengajarkan umatnya untuk menyeimbangkan kebutuhan dunia dan akhirat.',
      showExplanation: true,
      points: 10,
      orderIndex: 1,
    },
  ],
};

export async function getModuleLearningData(
  moduleId: string,
  studentId?: string,
): Promise<ModuleLearningData> {
  const moduleItem = await findStudentModule(moduleId, studentId);

  if (!moduleItem) {
    return { module: null, lessons: [], completedLessonIds: [], isDemo: !isSupabaseConfigured };
  }

  if (!isSupabaseConfigured) {
    return {
      module: moduleItem,
      lessons: demoLessonsForModule(moduleItem),
      completedLessonIds: [],
      isDemo: true,
    };
  }

  try {
    const supabase = await createClient();
    const [lessonsResult, progressResult] = await Promise.all([
      supabase
        .from('lessons')
        .select('id, module_id, title, slug, type, content, video_url, infographic_url, order_index, estimated_minutes')
        .eq('module_id', moduleItem.id)
        .order('order_index', { ascending: true }),
      studentId
        ? supabase
            .from('lesson_progress')
            .select('lesson_id')
            .eq('student_id', studentId)
            .eq('module_id', moduleItem.id)
            .not('completed_at', 'is', null)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (lessonsResult.error) throw lessonsResult.error;

    const rows = (lessonsResult.data ?? []) as LessonRow[];
    const completedRows = progressResult.error ? [] : ((progressResult.data ?? []) as LessonProgressRow[]);

    return {
      module: moduleItem,
      lessons: rows.map(mapLessonRow),
      completedLessonIds: completedRows.map((progress) => progress.lesson_id),
      isDemo: false,
    };
  } catch {
    return {
      module: moduleItem,
      lessons: demoLessonsForModule(moduleItem),
      completedLessonIds: [],
      isDemo: true,
    };
  }
}

export async function getQuizLearningData(moduleId: string, studentId?: string): Promise<QuizLearningData> {
  const moduleItem = await findStudentModule(moduleId, studentId);

  if (!moduleItem) {
    return { module: null, quiz: null, isDemo: !isSupabaseConfigured };
  }

  if (!isSupabaseConfigured) {
    return { module: moduleItem, quiz: demoQuizForModule(moduleItem), isDemo: true };
  }

  try {
    const supabase = await createClient();
    const { data: quizRows, error: quizError } = await supabase
      .from('quizzes')
      .select('id, module_id, title, description, passing_score, max_attempts, time_limit_seconds')
      .eq('module_id', moduleItem.id)
      .eq('is_published', true)
      .order('created_at', { ascending: true })
      .limit(1);

    if (quizError) throw quizError;

    const quizRow = ((quizRows ?? []) as QuizRow[])[0];
    if (!quizRow) return { module: moduleItem, quiz: null, isDemo: false };

    const { data: questionRows, error: questionError } = await supabase
      .from('quiz_questions')
      .select('id, question_type, question_text, options, correct_answer, explanation, show_explanation, points, order_index')
      .eq('quiz_id', quizRow.id)
      .order('order_index', { ascending: true });

    if (questionError) throw questionError;

    return {
      module: moduleItem,
      quiz: {
        id: quizRow.id,
        moduleId: quizRow.module_id,
        title: quizRow.title,
        description: quizRow.description,
        passingScore: quizRow.passing_score ?? 70,
        maxAttempts: quizRow.max_attempts ?? 3,
        timeLimitSeconds: quizRow.time_limit_seconds,
        questions: ((questionRows ?? []) as QuizQuestionRow[]).map(mapQuizQuestionRow),
      },
      isDemo: false,
    };
  } catch {
    return { module: moduleItem, quiz: demoQuizForModule(moduleItem), isDemo: true };
  }
}

export async function getQuizResultData(
  moduleId: string,
  studentId?: string,
  attemptId?: string,
): Promise<QuizResultData> {
  const moduleItem = await findStudentModule(moduleId, studentId);

  if (!moduleItem || !studentId || !isSupabaseConfigured) {
    return emptyQuizResult(moduleItem);
  }

  try {
    const supabase = await createClient();
    const { data: quizRows, error: quizError } = await supabase
      .from('quizzes')
      .select('id, passing_score')
      .eq('module_id', moduleItem.id)
      .eq('is_published', true);

    if (quizError) throw quizError;

    const quizzes = (quizRows ?? []) as { id: string; passing_score: number | null }[];
    if (!quizzes.length) return emptyQuizResult(moduleItem);

    const quizIds = quizzes.map((quiz) => quiz.id);
    const passingScoreByQuiz = new Map(quizzes.map((quiz) => [quiz.id, quiz.passing_score ?? 70]));

    let query = supabase
      .from('quiz_attempts')
      .select('id, quiz_id, score, total_questions, correct_answers, started_at, submitted_at')
      .eq('student_id', studentId)
      .in('quiz_id', quizIds)
      .order('submitted_at', { ascending: false })
      .limit(1);

    if (attemptId) {
      query = query.eq('id', attemptId);
    }

    const { data: attempts, error: attemptError } = await query;
    if (attemptError) throw attemptError;

    const attempt = ((attempts ?? []) as QuizAttemptRow[])[0];
    if (!attempt) return emptyQuizResult(moduleItem);

    const score = Math.round(Number(attempt.score ?? 0));
    const totalQuestions = attempt.total_questions ?? 0;
    const correctAnswers = attempt.correct_answers ?? 0;

    return {
      module: moduleItem,
      attemptId: attempt.id,
      score,
      correctAnswers,
      wrongAnswers: Math.max(totalQuestions - correctAnswers, 0),
      totalQuestions,
      elapsedSeconds: calculateElapsedSeconds(attempt.started_at, attempt.submitted_at),
      passed: score >= (passingScoreByQuiz.get(attempt.quiz_id) ?? 70),
      available: true,
    };
  } catch {
    return emptyQuizResult(moduleItem);
  }
}

async function findStudentModule(moduleId: string, studentId?: string) {
  const modules = await getStudentModules(studentId);
  return modules.find((moduleItem) => moduleItem.id === moduleId || moduleItem.slug === moduleId) ?? null;
}

function mapLessonRow(row: LessonRow): StudentLesson {
  return {
    id: row.id,
    moduleId: row.module_id,
    title: row.title,
    slug: row.slug,
    type: row.type,
    content: row.content,
    videoUrl: row.video_url,
    infographicUrl: row.infographic_url ?? null,
    orderIndex: row.order_index ?? 1,
    estimatedMinutes: row.estimated_minutes ?? 5,
  };
}

function mapQuizQuestionRow(row: QuizQuestionRow): QuizQuestion {
  return {
    id: row.id,
    questionType: row.question_type,
    questionText: row.question_text,
    options: normalizeOptions(row.options),
    correctAnswer: normalizeCorrectAnswer(row.correct_answer),
    explanation: row.explanation,
    showExplanation: row.show_explanation ?? true,
    points: row.points ?? 10,
    orderIndex: row.order_index ?? 1,
  };
}

function normalizeOptions(value: unknown): QuizOption[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((option) => {
      if (!option || typeof option !== 'object') return null;
      const candidate = option as Record<string, unknown>;
      const id = String(candidate.id ?? '').trim();
      const text = String(candidate.text ?? '').trim();
      return id && text ? { id, text } : null;
    })
    .filter((option): option is QuizOption => Boolean(option));
}

export function normalizeCorrectAnswer(value: unknown) {
  if (!value || typeof value !== 'object') return String(value ?? '');
  const candidate = value as Record<string, unknown>;
  const answerValue = candidate.value;

  if (Array.isArray(answerValue)) {
    return answerValue.map((item) => String(item)).sort().join('|');
  }

  return String(answerValue ?? '');
}

function demoLessonsForModule(moduleItem: StudentModule) {
  if (moduleItem.slug === 'islam-wasathiyah-pengantar' || moduleItem.id === 'islam-wasathiyah-pengantar') {
    return demoLessons.map((lesson) => ({ ...lesson, moduleId: moduleItem.id }));
  }

  return [
    {
      ...demoLessons[0],
      id: `${moduleItem.id}-lesson-1`,
      moduleId: moduleItem.id,
      title: moduleItem.title,
      slug: `${moduleItem.slug}-materi-awal`,
      content: moduleItem.description,
      infographicUrl: null,
    },
  ];
}

function demoQuizForModule(moduleItem: StudentModule) {
  return {
    ...demoQuiz,
    moduleId: moduleItem.id,
    id: `${moduleItem.id}-quiz`,
  };
}

function emptyQuizResult(moduleItem: StudentModule | null): QuizResultData {
  return {
    module: moduleItem,
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    totalQuestions: 0,
    elapsedSeconds: 0,
    passed: false,
    available: false,
  };
}

function calculateElapsedSeconds(startedAt: string | null, submittedAt: string | null) {
  if (!startedAt || !submittedAt) return 0;
  const started = new Date(startedAt).getTime();
  const submitted = new Date(submittedAt).getTime();

  if (Number.isNaN(started) || Number.isNaN(submitted) || submitted < started) return 0;
  return Math.round((submitted - started) / 1000);
}

export { demoStudentModules };
