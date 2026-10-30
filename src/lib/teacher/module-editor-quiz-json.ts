import type { ModuleEditorQuestion } from '@/lib/teacher/module-editor';
import { QUIZ_OPTION_IDS } from '@/lib/teacher/quiz-constants';
import { normalizeQuizPoints } from '@/lib/quiz-scoring';

export type ImportedQuizQuestion = Omit<ModuleEditorQuestion, 'id'>;

export function parseQuizQuestionsJson(source: string): ImportedQuizQuestion[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error('File bukan JSON yang valid.');
  }

  const root = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : null;
  if (root?.maxPoints !== undefined && root.maxPoints !== 100) {
    throw new Error('maxPoints harus bernilai 100.');
  }

  const questions = Array.isArray(parsed)
    ? parsed
    : root && Array.isArray(root.questions)
      ? root.questions
      : null;

  if (!questions?.length) {
    throw new Error('JSON harus berisi array pertanyaan pada properti "questions".');
  }

  const parsedQuestions = questions.map((value, index) => parseQuestion(value, index));
  const points = normalizeQuizPoints(parsedQuestions.map((question) => question.points));

  return parsedQuestions.map((question, index) => ({
    ...question,
    points: points[index],
  }));
}

function parseQuestion(value: unknown, index: number): ImportedQuizQuestion {
  const label = `Pertanyaan ${index + 1}`;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} harus berupa objek JSON.`);
  }

  const item = value as Record<string, unknown>;
  const questionType = item.questionType;
  if (questionType !== 'multiple_choice') {
    throw new Error(`${label}: questionType harus "multiple_choice".`);
  }

  const questionText = typeof item.questionText === 'string' ? item.questionText.trim() : '';
  if (!questionText) throw new Error(`${label}: questionText wajib diisi.`);

  if (!Array.isArray(item.options) || item.options.length !== QUIZ_OPTION_IDS.length) {
    throw new Error(`${label}: isi lima opsi jawaban A–E pada array "options".`);
  }
  const options = item.options.map((option) => typeof option === 'string' ? option.trim() : '');
  if (options.some((option) => !option)) {
    throw new Error(`${label}: semua opsi jawaban wajib diisi.`);
  }

  const correctAnswer = item.correctAnswer;
  const normalizedAnswer = typeof correctAnswer === 'string' ? correctAnswer.toLowerCase() : '';
  if (!QUIZ_OPTION_IDS.some((optionId) => optionId === normalizedAnswer)) {
    throw new Error(`${label}: correctAnswer harus salah satu dari ${QUIZ_OPTION_IDS.join(', ')}.`);
  }

  const explanation = typeof item.explanation === 'string' ? item.explanation.trim() : '';
  if (!explanation) throw new Error(`${label}: explanation wajib diisi.`);

  const pointWeight = item.points === undefined ? 1 : Number(item.points);
  if (!Number.isInteger(pointWeight) || pointWeight < 1) {
    throw new Error(`${label}: points (bobot) harus berupa bilangan bulat minimal 1.`);
  }

  return {
    questionType,
    questionText,
    options: [options[0], options[1], options[2], options[3], options[4]],
    correctAnswer: normalizedAnswer as ModuleEditorQuestion['correctAnswer'],
    explanation,
    points: pointWeight,
    orderIndex: index + 1,
  };
}
