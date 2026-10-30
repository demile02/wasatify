import type { SaveTeacherModuleInput } from '@/lib/teacher/module-actions';
import { QUIZ_OPTION_IDS } from '@/lib/teacher/quiz-constants';
import { normalizeQuizPoints } from '@/lib/quiz-scoring';

export function buildModuleChildren(input: SaveTeacherModuleInput, teacherId: string) {
  const lessons = input.lessons.filter((l) => l.title.trim() || l.content.trim())
    .sort((a, b) => a.orderIndex - b.orderIndex).map((lesson, index) => ({
      id: lesson.id || crypto.randomUUID(), title: lesson.title.trim(),
      slug: `lesson-${crypto.randomUUID()}`, content: lesson.content.trim(),
      key_points: lesson.keyPoints?.map((point) => point.trim()).filter(Boolean) ?? null,
      video_url: lesson.videoUrl.trim() || null, infographic_url: lesson.infographicUrl.trim() || null,
      infographic_asset_id: lesson.infographicAssetId || null,
      reflection_prompt: lesson.reflectionPrompt.trim() || null, order_index: index + 1,
    }));
  const quiz = input.quiz;
  const filledQuestions = quiz.questions.filter((q) => q.questionText.trim()).sort((a, b) => a.orderIndex - b.orderIndex);
  const points = normalizeQuizPoints(filledQuestions.map((q) => q.points));
  const questions = filledQuestions.map((question, index) => ({
    id: question.id || crypto.randomUUID(), question_type: 'multiple_choice',
    question_text: question.questionText.trim(),
    options: question.options.map((text, i) => ({ id: QUIZ_OPTION_IDS[i], text: text.trim() })),
    correct_answer: { type: 'multiple_choice', value: question.correctAnswer },
    explanation: question.explanation.trim(), show_explanation: question.explanation ? quiz.showExplanation : false,
    points: points[index], order_index: index + 1,
  }));
  const saveQuiz = Boolean(quiz.title.trim() || quiz.description.trim() || questions.length || quiz.id);
  const published = input.intent === 'publish' || quiz.isPublished;
  const quizPayload = saveQuiz ? {
    id: quiz.id || null, title: quiz.title.trim() || 'Kuis Pemahaman', description: quiz.description.trim() || null,
    passing_score: Math.round(quiz.passingScore), max_attempts: quiz.maxAttempts,
    time_limit_seconds: Math.max(Math.round(quiz.timeLimitSeconds), 60),
    allow_retake: quiz.maxAttempts > 1 && quiz.allowRetake, show_explanation: quiz.showExplanation,
    shuffle_questions: quiz.shuffleQuestions, is_published: published, status: published ? 'published' : quiz.status,
  } : null;
  const asset = input.coverAsset;
  const cover = asset ? { owner_id: teacherId, bucket: asset.bucket, path: asset.path, public_url: asset.publicUrl,
    mime_type: asset.mimeType ?? null, size_bytes: asset.sizeBytes ?? null, kind: 'module_cover' } : null;
  const type = input.notification?.type ?? (input.intent === 'publish' ? 'publish' : 'update');
  const defaultMessage = type === 'publish' ? `Modul baru ${input.title.trim()} telah tersedia.`
    : type === 'quiz_update' ? `Kuis pada modul ${input.title.trim()} telah diperbarui.` : `Modul ${input.title.trim()} telah diperbarui.`;
  const notification = input.notification?.enabled ? {
    class_id: input.classId || null, title: type === 'publish' ? 'Modul Baru Tersedia' : 'Modul Diperbarui',
    content: input.notification.message?.trim() || defaultMessage,
  } : null;
  return { lessons_input: lessons, quiz_input: quizPayload, questions_input: questions, cover_input: cover, notification_input: notification };
}
