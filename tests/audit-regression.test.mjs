import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const nativeRequire = createRequire(import.meta.url);
const cache = new Map();
function loadSource(path) {
  const filename = resolve(path);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const require = (name) => name.startsWith('@/') ? loadSource(`src/${name.slice(2)}.ts`) : nativeRequire(name);
  new Function('require', 'exports', outputText)(require, exports);
  return exports;
}
const { normalizeQuizPoints } = loadSource('src/lib/quiz-scoring.ts');
const { resolveStudentModuleStatus, mergeModulesWithStudentProgress } = loadSource('src/lib/modules/status.ts');
const { resolveReflectionEligibility } = loadSource('src/lib/student/reflection-eligibility.ts');
const { parseModuleImageCropConfig } = loadSource('src/lib/media/image-crops.ts');
const { calculateNextStreak, getEffectiveStreak } = loadSource('src/lib/student/streak.ts');
const { saveTeacherModuleSchema } = loadSource('src/lib/teacher/module-save-validation.ts');
const { teacherMessageSchema } = loadSource('src/lib/teacher/message-validation.ts');
const { createAssignmentSchema, submitAssignmentSchema, reviewAssignmentSchema } = loadSource('src/lib/assignments/validation.ts');
const { browserStorage } = loadSource('src/lib/browser-storage.ts');
const { readAllRows } = loadSource('src/lib/supabase/read-all-rows.ts');

test('aggregate queries retain rows beyond the default API page limit', async () => {
  const rows = Array.from({ length: 1505 }, (_, id) => ({ id }));
  const result = await readAllRows({ range: async (from, to) => ({ data: rows.slice(from, to + 1), error: null }) });
  assert.deepEqual(result.data, rows);
  await assert.rejects(() => readAllRows({ range: async () => ({ data: null, error: new Error('offline') }) }), /offline/);
});
const { toEmbeddableVideoUrl } = loadSource('src/lib/media/video-url.ts');

test('YouTube URLs use exact hosts and validated video IDs', () => {
  const expected = 'https://www.youtube-nocookie.com/embed/abcdefghijk';
  for (const url of ['https://youtu.be/abcdefghijk', 'https://www.youtube.com/watch?v=abcdefghijk', 'https://youtube.com/shorts/abcdefghijk']) {
    assert.equal(toEmbeddableVideoUrl(url), expected);
  }
  for (const url of ['https://youtube.com.evil.example/watch?v=abcdefghijk', 'javascript:alert(1)', 'https://youtube.com/watch?v=abc', 'not a URL']) {
    assert.equal(toEmbeddableVideoUrl(url), null);
  }
});

for (const count of [1, 7, 10, 15, 20, 100]) {
  test(`${count} questions total exactly 100 points`, () => {
    const points = normalizeQuizPoints(Array(count).fill(10));
    assert.equal(points.reduce((a, b) => a + b, 0), 100);
    assert.ok(points.every((p) => Number.isInteger(p) && p >= 1));
    assert.deepEqual(normalizeQuizPoints(points), points);
  });
}
test('saved uneven weights are not normalized a second time', () => {
  assert.deepEqual(normalizeQuizPoints([80, 20]), [80, 20]);
  assert.throws(() => normalizeQuizPoints(Array(101).fill(1)));
});
test('100 percent lesson progress does not imply passed quiz', () => {
  assert.equal(resolveStudentModuleStatus({ status: 'in_progress', completed_at: null }, 100), 'in_progress');
  assert.equal(resolveStudentModuleStatus({ status: 'completed', completed_at: null }, 100), 'completed');
});
test('next module stays locked until explicit completion', () => {
  const modules = [1, 2].map((id) => ({ id: String(id), slug: String(id), title: String(id), description: '', estimated_minutes: 10, order_index: id, lesson_count: 1, completed_lesson_count: 1 }));
  const result = mergeModulesWithStudentProgress({ modules, lessons: [], progressRows: [{ module_id: '1', status: 'in_progress', progress_percent: 100, completed_at: null, last_accessed_at: null }] });
  assert.equal(result[0].lessonsCompleted, true);
  assert.equal(result[1].status, 'locked');
});
test('reflection requirements follow lesson completion before quiz status', () => {
  const incompleteLessons = resolveReflectionEligibility({
    moduleStatus: 'in_progress',
    lessonsCompleted: false,
    hasQuiz: true,
    hasPassedQuiz: false,
  });
  assert.equal(incompleteLessons.eligible, false);
  assert.equal(incompleteLessons.nextStep, 'lessons');
  assert.equal(incompleteLessons.blockedReason, 'Selesaikan materi modul terlebih dahulu');

  const quizStillRequired = resolveReflectionEligibility({
    moduleStatus: 'in_progress',
    lessonsCompleted: true,
    hasQuiz: true,
    hasPassedQuiz: false,
  });
  assert.equal(quizStillRequired.eligible, false);
  assert.equal(quizStillRequired.nextStep, 'quiz');
  assert.equal(quizStillRequired.blockedReason, 'Selesaikan kuis terlebih dahulu');

  const quizPassedButLessonsIncomplete = resolveReflectionEligibility({
    moduleStatus: 'in_progress',
    lessonsCompleted: false,
    hasQuiz: true,
    hasPassedQuiz: true,
  });
  assert.equal(quizPassedButLessonsIncomplete.eligible, false);
  assert.equal(quizPassedButLessonsIncomplete.nextStep, 'lessons');

  const noQuiz = resolveReflectionEligibility({
    moduleStatus: 'completed',
    hasQuiz: false,
    hasPassedQuiz: false,
  });
  assert.equal(noQuiz.eligible, true);
  assert.equal(noQuiz.nextStep, 'reflection');
});
test('crop coordinates reject invalid or out-of-image rectangles', () => {
  assert.equal(parseModuleImageCropConfig({ thumbnail: { x: .8, y: 0, width: .4, height: 1 } }), null);
  assert.equal(parseModuleImageCropConfig({ thumbnail: { x: 0, y: 0, width: NaN, height: 1 } }), null);
  assert.equal(parseModuleImageCropConfig({ thumbnail: { x: .1, y: .2, width: .4, height: .5 } }).thumbnail.width, .4);
});
test('streak uses Jakarta calendar date across UTC midnight', () => {
  assert.equal(calculateNextStreak(2, '2026-10-27T16:59:00Z', '2026-10-27T17:01:00Z'), 3);
  assert.equal(calculateNextStreak(2, '2026-10-27T17:01:00Z', '2026-10-28T02:00:00Z'), 2);
  assert.equal(getEffectiveStreak(7, '2026-10-25T00:00:00Z', '2026-10-28T00:00:00Z'), 0);
});
test('malformed nested editor input fails validation without throwing', () => {
  assert.equal(saveTeacherModuleSchema.safeParse({ lessons: [null], quiz: null }).success, false);
});
test('teacher messages require an owned-class ID, a useful title, and a readable body', () => {
  const valid = { classId: '99c9ffea-5d6c-41f3-a2d4-ba18cfa632a6', title: 'Pengingat kuis', body: 'Baca kembali materi sebelum mengerjakan kuis pekan ini.' };
  assert.equal(teacherMessageSchema.safeParse(valid).success, true);
  assert.equal(teacherMessageSchema.safeParse({ ...valid, classId: 'viii-a' }).success, false);
  assert.equal(teacherMessageSchema.safeParse({ ...valid, title: 'Hai' }).success, false);
  assert.equal(teacherMessageSchema.safeParse({ ...valid, body: 'Singkat' }).success, false);
  assert.equal(teacherMessageSchema.safeParse({ ...valid, body: 'x'.repeat(2001) }).success, false);
});
test('class assignments validate class IDs, useful instructions, and optional deadlines', () => {
  const valid = {
    classId: '99c9ffea-5d6c-41f3-a2d4-ba18cfa632a6',
    title: 'Refleksi keseimbangan',
    instructions: 'Jelaskan satu cara menjaga keseimbangan belajar dan istirahat.',
    dueAt: null,
  };
  assert.equal(createAssignmentSchema.safeParse(valid).success, true);
  assert.equal(createAssignmentSchema.safeParse({ ...valid, classId: 'viii-a' }).success, false);
  assert.equal(createAssignmentSchema.safeParse({ ...valid, title: 'Tes' }).success, false);
  assert.equal(createAssignmentSchema.safeParse({ ...valid, instructions: 'Terlalu pendek' }).success, false);
  assert.equal(createAssignmentSchema.safeParse({ ...valid, dueAt: 'besok' }).success, false);
});
test('assignment submissions accept text, a file, or both and reject empty or invalid attachments', () => {
  const valid = { assignmentId: '99c9ffea-5d6c-41f3-a2d4-ba18cfa632a6', answer: 'Saya menjaga keseimbangan dengan mengatur waktu secara konsisten.', attachment: null };
  const fileOnly = {
    ...valid,
    answer: '',
    attachment: {
      path: 'student-id/assignment-id/123e4567-e89b-42d3-a456-426614174000.pdf',
      fileName: 'jawaban.pdf',
      fileSize: 1024,
      fileType: 'application/pdf',
    },
  };
  assert.equal(submitAssignmentSchema.safeParse(valid).success, true);
  assert.equal(submitAssignmentSchema.safeParse(fileOnly).success, true);
  assert.equal(submitAssignmentSchema.safeParse({ ...valid, attachment: fileOnly.attachment }).success, true);
  assert.equal(submitAssignmentSchema.safeParse({ ...valid, answer: 'Singkat' }).success, false);
  assert.equal(submitAssignmentSchema.safeParse({ ...valid, answer: '', attachment: null }).success, false);
  assert.equal(submitAssignmentSchema.safeParse({ ...fileOnly, attachment: { ...fileOnly.attachment, fileSize: 10 * 1024 * 1024 + 1 } }).success, false);
  assert.equal(submitAssignmentSchema.safeParse({ ...fileOnly, attachment: { ...fileOnly.attachment, fileType: 'text/html' } }).success, false);
  assert.equal(submitAssignmentSchema.safeParse({ ...valid, assignmentId: 'invalid' }).success, false);
});
test('assignment reviews only accept whole-number grades from 0 to 100', () => {
  const valid = { submissionId: '99c9ffea-5d6c-41f3-a2d4-ba18cfa632a6', score: 88, feedback: 'Jawaban jelas.' };
  assert.equal(reviewAssignmentSchema.safeParse(valid).success, true);
  assert.equal(reviewAssignmentSchema.safeParse({ ...valid, score: 100.5 }).success, false);
  assert.equal(reviewAssignmentSchema.safeParse({ ...valid, score: 101 }).success, false);
  assert.equal(reviewAssignmentSchema.safeParse({ ...valid, feedback: 'x'.repeat(2001) }).success, false);
});
test('blocked local storage cannot break saving or navigation', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { get localStorage() { throw new Error('Blocked'); } } });
  try {
    assert.equal(browserStorage.get('draft'), null);
    assert.doesNotThrow(() => browserStorage.set('draft', '{}'));
    assert.doesNotThrow(() => browserStorage.remove('draft'));
    assert.doesNotThrow(() => browserStorage.removeMatching('draft:'));
  } finally {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else delete globalThis.window;
  }
});
