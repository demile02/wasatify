import { demoStudentModules, type StudentModule } from '@/lib/demo/student';
import { getStudentModules } from '@/lib/student/data';
import type { Profile } from '@/lib/types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export type StudentLesson = {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  type: 'article' | 'video' | 'infographic' | 'reflection';
  content: string | null;
  reflectionPrompt: string | null;
  videoUrl: string | null;
  infographicUrl: string | null;
  infographicAsset: StudentInfographicAsset | null;
  orderIndex: number;
  estimatedMinutes: number;
};

export type StudentInfographicSlide = {
  index: number;
  url: string;
  path?: string;
};

export type StudentInfographicAsset = {
  id: string;
  sourceFileType: string | null;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  slideCount: number;
  slideImages: StudentInfographicSlide[];
  errorMessage: string | null;
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
  allowRetake: boolean;
  timeLimitSeconds: number | null;
  questions: QuizQuestion[];
};

export type StudentQuizAttemptInfo = {
  attemptsCount: number;
  maxAttempts: number;
  allowRetake: boolean;
  canAttempt: boolean;
  bestScore: number | null;
  latestScore: number | null;
  latestAttemptId: string | null;
};

export type QuizReviewQuestion = {
  id: string;
  questionText: string;
  options: QuizOption[];
  correctAnswer: string;
  selectedAnswer: string;
  explanation: string | null;
  isCorrect: boolean;
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
  attemptInfo: StudentQuizAttemptInfo | null;
  isDemo: boolean;
};

export type QuizResultData = {
  module: StudentModule | null;
  quizId?: string;
  quizTitle?: string;
  attemptId?: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
  totalPoints: number;
  earnedPoints: number;
  elapsedSeconds: number;
  passed: boolean;
  bestScore: number | null;
  reviewQuestions: QuizReviewQuestion[];
  available: boolean;
};

type LessonRow = {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  type: StudentLesson['type'];
  content: string | null;
  reflection_prompt?: string | null;
  video_url: string | null;
  infographic_url?: string | null;
  infographic_asset_id?: string | null;
  order_index: number | null;
  estimated_minutes: number | null;
};

type InfographicAssetRow = {
  id: string;
  source_file_type: string | null;
  processing_status: StudentInfographicAsset['status'];
  slide_count: number | null;
  slide_images: unknown;
  error_message: string | null;
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
  allow_retake?: boolean | null;
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
  answers?: Record<string, unknown> | null;
  score: number | null;
  total_points?: number | null;
  earned_points?: number | null;
  passed?: boolean | null;
  total_questions: number | null;
  correct_answers: number | null;
  started_at: string | null;
  submitted_at: string | null;
  created_at?: string | null;
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
    reflectionPrompt:
      'Bagian mana dari kehidupanmu yang perlu lebih seimbang antara belajar, ibadah, keluarga, dan waktu pribadi?',
    videoUrl: null,
    infographicUrl: '/assets/wasatify-tawazun.png',
    infographicAsset: null,
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
  allowRetake: true,
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
  student?: Profile | string,
): Promise<ModuleLearningData> {
  const studentId = typeof student === 'string' ? student : student?.id;
  const moduleItem = await findStudentModule(moduleId, student);

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
        .select(
          'id, module_id, title, slug, type, content, reflection_prompt, video_url, infographic_url, infographic_asset_id, order_index, estimated_minutes',
        )
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
    const infographicAssetIds = rows.map((lesson) => lesson.infographic_asset_id).filter(Boolean) as string[];
    const infographicAssets = infographicAssetIds.length
      ? await getInfographicAssets(infographicAssetIds)
      : new Map<string, StudentInfographicAsset>();
    const completedRows = progressResult.error ? [] : ((progressResult.data ?? []) as LessonProgressRow[]);

    return {
      module: moduleItem,
      lessons: rows.map((row) =>
        mapLessonRow(row, row.infographic_asset_id ? infographicAssets.get(row.infographic_asset_id) ?? null : null),
      ),
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
    return { module: null, quiz: null, attemptInfo: null, isDemo: !isSupabaseConfigured };
  }

  if (!isSupabaseConfigured) {
    return {
      module: moduleItem,
      quiz: demoQuizForModule(moduleItem),
      attemptInfo: {
        attemptsCount: 0,
        maxAttempts: demoQuiz.maxAttempts,
        allowRetake: true,
        canAttempt: true,
        bestScore: null,
        latestScore: null,
        latestAttemptId: null,
      },
      isDemo: true,
    };
  }

  try {
    const supabase = await createClient();
    const { data: quizRows, error: quizError } = await supabase
      .from('quizzes')
      .select('id, module_id, title, description, passing_score, max_attempts, allow_retake, time_limit_seconds')
      .eq('module_id', moduleItem.id)
      .eq('is_published', true)
      .order('created_at', { ascending: true })
      .limit(1);

    if (quizError) throw quizError;

    const quizRow = ((quizRows ?? []) as QuizRow[])[0];
    if (!quizRow) return { module: moduleItem, quiz: null, attemptInfo: null, isDemo: false };

    const { data: questionRows, error: questionError } = await supabase
      .from('quiz_questions')
      .select('id, question_type, question_text, options, correct_answer, explanation, show_explanation, points, order_index')
      .eq('quiz_id', quizRow.id)
      .order('order_index', { ascending: true });

    if (questionError) throw questionError;

    const maxAttempts = Math.max(quizRow.max_attempts ?? 3, 1);
    const allowRetake = maxAttempts > 1 && Boolean(quizRow.allow_retake ?? true);
    const { data: attemptRows, error: attemptError } = studentId
      ? await supabase
          .from('quiz_attempts')
          .select('id, score, submitted_at, created_at')
          .eq('student_id', studentId)
          .eq('quiz_id', quizRow.id)
          .order('submitted_at', { ascending: false })
      : { data: [], error: null };

    if (attemptError) throw attemptError;

    const attempts = (attemptRows ?? []) as Pick<QuizAttemptRow, 'id' | 'score' | 'submitted_at' | 'created_at'>[];
    const attemptsCount = attempts.length;
    const latestAttempt = attempts[0] ?? null;
    const bestScore = attempts.length
      ? Math.max(...attempts.map((attempt) => Math.round(Number(attempt.score ?? 0))))
      : null;

    return {
      module: moduleItem,
      quiz: {
        id: quizRow.id,
        moduleId: quizRow.module_id,
        title: quizRow.title,
        description: quizRow.description,
        passingScore: quizRow.passing_score ?? 70,
        maxAttempts,
        allowRetake,
        timeLimitSeconds: quizRow.time_limit_seconds,
        questions: ((questionRows ?? []) as QuizQuestionRow[]).map(mapQuizQuestionRow),
      },
      attemptInfo: {
        attemptsCount,
        maxAttempts,
        allowRetake,
        canAttempt: attemptsCount === 0 || (allowRetake && attemptsCount < maxAttempts),
        bestScore,
        latestScore: latestAttempt?.score === null || latestAttempt?.score === undefined ? null : Math.round(Number(latestAttempt.score)),
        latestAttemptId: latestAttempt?.id ?? null,
      },
      isDemo: false,
    };
  } catch {
    return { module: moduleItem, quiz: demoQuizForModule(moduleItem), attemptInfo: null, isDemo: true };
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
      .select('id, title, passing_score')
      .eq('module_id', moduleItem.id)
      .eq('is_published', true);

    if (quizError) throw quizError;

    const quizzes = (quizRows ?? []) as { id: string; title: string; passing_score: number | null }[];
    if (!quizzes.length) return emptyQuizResult(moduleItem);

    const quizIds = quizzes.map((quiz) => quiz.id);
    const quizMetaById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));

    let query = supabase
      .from('quiz_attempts')
      .select('id, quiz_id, answers, score, total_points, earned_points, passed, total_questions, correct_answers, started_at, submitted_at, created_at')
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
    const questionRows = await getQuizReviewQuestions(attempt.quiz_id);
    const answers = attempt.answers ?? {};
    const reviewQuestions = questionRows.map((question) => {
      const selectedAnswer = String(answers[question.id] ?? '');
      return {
        id: question.id,
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        selectedAnswer,
        explanation: question.explanation,
        isCorrect: selectedAnswer === question.correctAnswer,
      };
    });
    const quizMeta = quizMetaById.get(attempt.quiz_id);
    const { data: allAttempts } = await supabase
      .from('quiz_attempts')
      .select('score')
      .eq('student_id', studentId)
      .eq('quiz_id', attempt.quiz_id);
    const bestScore = allAttempts?.length
      ? Math.max(...allAttempts.map((row) => Math.round(Number(row.score ?? 0))))
      : score;

    return {
      module: moduleItem,
      quizId: attempt.quiz_id,
      quizTitle: quizMeta?.title,
      attemptId: attempt.id,
      score,
      correctAnswers,
      wrongAnswers: Math.max(totalQuestions - correctAnswers, 0),
      totalQuestions,
      totalPoints: attempt.total_points ?? questionRows.reduce((total, question) => total + question.points, 0),
      earnedPoints: attempt.earned_points ?? 0,
      elapsedSeconds: calculateElapsedSeconds(attempt.started_at, attempt.submitted_at),
      passed: attempt.passed ?? score >= (quizMeta?.passing_score ?? 70),
      bestScore,
      reviewQuestions,
      available: true,
    };
  } catch {
    return emptyQuizResult(moduleItem);
  }
}

async function getQuizReviewQuestions(quizId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('id, question_type, question_text, options, correct_answer, explanation, show_explanation, points, order_index')
    .eq('quiz_id', quizId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return ((data ?? []) as QuizQuestionRow[]).map(mapQuizQuestionRow);
}

async function findStudentModule(moduleId: string, student?: Profile | string) {
  const modules = await getStudentModules(student);
  return modules.find((moduleItem) => moduleItem.id === moduleId || moduleItem.slug === moduleId) ?? null;
}

async function getInfographicAssets(assetIds: string[]) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('infographic_assets')
    .select('id, source_file_type, processing_status, slide_count, slide_images, error_message')
    .in('id', assetIds);

  if (error) throw error;

  return new Map(
    ((data ?? []) as InfographicAssetRow[]).map((asset) => [
      asset.id,
      {
        id: asset.id,
        sourceFileType: asset.source_file_type,
        status: asset.processing_status,
        slideCount: asset.slide_count ?? 0,
        slideImages: normalizeSlideImages(asset.slide_images),
        errorMessage: asset.error_message,
      },
    ]),
  );
}

function mapLessonRow(row: LessonRow, infographicAsset: StudentInfographicAsset | null): StudentLesson {
  return {
    id: row.id,
    moduleId: row.module_id,
    title: row.title,
    slug: row.slug,
    type: row.type,
    content: row.content,
    reflectionPrompt: row.reflection_prompt ?? null,
    videoUrl: row.video_url,
    infographicUrl: row.infographic_url ?? null,
    infographicAsset,
    orderIndex: row.order_index ?? 1,
    estimatedMinutes: row.estimated_minutes ?? 5,
  };
}

function normalizeSlideImages(value: unknown): StudentInfographicSlide[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((slide, index) => {
      if (!slide || typeof slide !== 'object') return null;
      const candidate = slide as Record<string, unknown>;
      const url = String(candidate.url ?? '').trim();
      if (!url) return null;
      const path = typeof candidate.path === 'string' ? candidate.path : undefined;
      return {
        index: Number(candidate.index ?? index + 1),
        url,
        ...(path ? { path } : {}),
      };
    })
    .filter((slide): slide is StudentInfographicSlide => Boolean(slide));
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
    totalPoints: 0,
    earnedPoints: 0,
    elapsedSeconds: 0,
    passed: false,
    bestScore: null,
    reviewQuestions: [],
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
