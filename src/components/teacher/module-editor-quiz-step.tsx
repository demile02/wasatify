'use client';

import { memo, useRef, useState } from 'react';
import { Download, FileUp, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SectionCard } from '@/components/shared/section-card';
import { ListPagination } from '@/components/shared/list-pagination';
import { Button } from '@/components/ui/button';
import { Field, inputClass } from '@/components/teacher/module-editor-fields';
import { EditableNumberInput } from '@/components/teacher/editable-number-input';
import type { FormState, QuestionState } from '@/components/teacher/module-editor-types';
import { parseQuizQuestionsJson, type ImportedQuizQuestion } from '@/lib/teacher/module-editor-quiz-json';
import { QUIZ_OPTION_IDS } from '@/lib/teacher/quiz-constants';
import { cn } from '@/lib/utils';

export function QuizStep({
  quiz,
  updateQuiz,
  updateQuestion,
  updateQuestionOption,
  reorderQuestions,
  addQuestion,
  removeQuestion,
  onImportQuestions,
}: {
  quiz: FormState['quiz'];
  updateQuiz: (patch: Partial<FormState['quiz']>) => void;
  updateQuestion: (clientId: string, patch: Partial<QuestionState>) => void;
  updateQuestionOption: (clientId: string, optionIndex: number, value: string) => void;
  reorderQuestions: (clientId: string, direction: -1 | 1) => void;
  addQuestion: () => void;
  removeQuestion: (clientId: string) => void;
  onImportQuestions: (questions: ImportedQuizQuestion[]) => void;
}) {
  const retakeDisabled = Math.max(Math.round(quiz.maxAttempts || 1), 1) <= 1;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [questionPageSize, setQuestionPageSize] = useState(5);
  const [questionPage, setQuestionPage] = useState(1);
  const questionPageCount = Math.max(Math.ceil(quiz.questions.length / questionPageSize), 1);
  const currentQuestionPage = Math.min(questionPage, questionPageCount);
  const firstQuestionIndex = (currentQuestionPage - 1) * questionPageSize;
  const visibleQuestions = quiz.questions.slice(firstQuestionIndex, firstQuestionIndex + questionPageSize);

  async function handleImport(file?: File) {
    if (!file) return;
    setIsImporting(true);
    try {
      const importedQuestions = parseQuizQuestionsJson(await file.text());
      onImportQuestions(importedQuestions);
      setQuestionPage(1);
      toast.success(`${importedQuestions.length} pertanyaan berhasil ditambahkan.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'File kuis tidak dapat dibaca.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <SectionCard>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Judul Kuis">
          <input
            value={quiz.title}
            onChange={(event) => updateQuiz({ title: event.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Nilai Kelulusan">
          <EditableNumberInput
            min={0}
            max={100}
            value={quiz.passingScore}
            onValueChange={(passingScore) => updateQuiz({ passingScore })}
            className={inputClass}
          />
        </Field>
        <Field label="Jumlah Kesempatan">
          <EditableNumberInput
            min={1}
            value={quiz.maxAttempts}
            onValueChange={(maxAttempts) => updateQuiz({ maxAttempts })}
            className={inputClass}
          />
        </Field>
        <Field label="Batas Waktu (Menit)">
          <EditableNumberInput
            min={1}
            step="any"
            value={quiz.timeLimitSeconds / 60}
            onValueChange={(minutes) => updateQuiz({ timeLimitSeconds: minutes * 60 })}
            className={inputClass}
          />
        </Field>
        <label className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3">
          <span>
            <span className="block font-bold text-ink">Izinkan Mengulang</span>
            {retakeDisabled && (
              <span className="mt-1 block text-xs font-semibold text-muted-foreground">
                Retake hanya tersedia jika Jumlah Kesempatan lebih dari 1.
              </span>
            )}
          </span>
          <input
            type="checkbox"
            checked={!retakeDisabled && quiz.allowRetake}
            disabled={retakeDisabled}
            onChange={(event) => updateQuiz({ allowRetake: event.target.checked })}
            className="h-5 w-5 accent-primary disabled:cursor-not-allowed disabled:opacity-45"
          />
        </label>
        <label className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3">
          <span className="font-bold text-ink">Tampilkan Pembahasan</span>
          <input type="checkbox" checked={quiz.showExplanation} onChange={(event) => updateQuiz({ showExplanation: event.target.checked })} className="h-5 w-5 accent-primary" />
        </label>
        <label className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3">
          <span className="font-bold text-ink">Acak Pertanyaan</span>
          <input type="checkbox" checked={quiz.shuffleQuestions} onChange={(event) => updateQuiz({ shuffleQuestions: event.target.checked })} className="h-5 w-5 accent-primary" />
        </label>
        <Field label="Quiz Status">
          <select value={quiz.status} onChange={(event) => updateQuiz({ status: event.target.value as FormState['quiz']['status'], isPublished: event.target.value === 'published' })} className={inputClass}>
            <option value="draft">Draft</option>
            <option value="published">Dipublikasikan</option>
            <option value="archived">Diarsipkan</option>
          </select>
        </Field>
        <Field label="Deskripsi Kuis" className="sm:col-span-2">
          <textarea
            value={quiz.description}
            onChange={(event) => updateQuiz({ description: event.target.value })}
            className={cn(inputClass, 'min-h-24 resize-none py-3')}
          />
        </Field>
      </div>

      <div className="mt-4 rounded-2xl border border-primary/15 bg-mint/25 p-4">
        <div className="grid grid-cols-2 items-stretch gap-3">
          <Button type="button" variant="outline" disabled={isImporting} onClick={() => fileInputRef.current?.click()} className="h-auto min-h-11 w-full min-w-0 justify-center whitespace-normal px-2 py-2 text-center text-xs leading-tight sm:text-sm">
            <FileUp className="h-4 w-4 shrink-0" />
            <span className="min-w-0">{isImporting ? 'Membaca JSON...' : 'Upload Kuis JSON'}</span>
          </Button>
          <Button type="button" variant="outline" onClick={downloadQuizTemplate} className="h-auto min-h-11 w-full min-w-0 justify-center whitespace-normal px-2 py-2 text-center text-xs leading-tight sm:text-sm">
            <Download className="h-4 w-4 shrink-0" />
            <span className="min-w-0">Unduh Template JSON</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Pilih file kuis JSON"
            onChange={(event) => {
              void handleImport(event.currentTarget.files?.[0]);
            }}
          />
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Impor menambahkan soal tanpa menghapus yang sudah ada. Nilai akhir maksimal 100 poin, dibagi sesuai bobot soal.
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="font-bold text-ink">Pertanyaan Multiple Choice</p>
        <Button
          type="button"
          onClick={() => {
            setQuestionPage(Math.ceil((quiz.questions.length + 1) / questionPageSize));
            addQuestion();
          }}
        >
          <Plus className="h-4 w-4" />
          Tambah Pertanyaan
        </Button>
      </div>

      {quiz.questions.length > 0 && (
        <ListPagination
          total={quiz.questions.length}
          page={currentQuestionPage}
          pageSize={questionPageSize}
          onPageChange={setQuestionPage}
          onPageSizeChange={(size) => {
            setQuestionPageSize(size);
            setQuestionPage(1);
          }}
          announceChanges
        />
      )}

      <div className="mt-5 space-y-5">
        {visibleQuestions.map((question, index) => (
          <QuestionItem
            key={question.clientId}
            question={question}
            index={firstQuestionIndex + index}
            count={quiz.questions.length}
            updateQuestion={updateQuestion}
            updateQuestionOption={updateQuestionOption}
            reorderQuestions={reorderQuestions}
            removeQuestion={removeQuestion}
          />
        ))}
      </div>
      {quiz.questions.length > 0 && (
        <ListPagination
          total={quiz.questions.length}
          page={currentQuestionPage}
          pageSize={questionPageSize}
          onPageChange={setQuestionPage}
          onPageSizeChange={(size) => {
            setQuestionPageSize(size);
            setQuestionPage(1);
          }}
        />
      )}
    </SectionCard>
  );
}

function downloadQuizTemplate() {
  const template = {
    maxPoints: 100,
    questions: [
      {
        questionType: 'multiple_choice',
        questionText: 'Apa makna tawazun dalam Islam?',
        options: [
          'Menjaga keseimbangan dalam kehidupan',
          'Mengutamakan urusan dunia saja',
          'Menghindari semua tanggung jawab',
          'Menyamakan seluruh pilihan hidup',
          'Mengabaikan keseimbangan antara ibadah, keluarga, dan masyarakat',
        ],
        correctAnswer: 'a',
        explanation: 'Tawazun mengajarkan keseimbangan dalam berbagai aspek kehidupan.',
      },
    ],
  };
  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'template-kuis-wasatify.json';
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

const QuestionItem = memo(function QuestionItem({
  question, index, count, updateQuestion, updateQuestionOption, reorderQuestions, removeQuestion,
}: {
  question: QuestionState;
  index: number;
  count: number;
  updateQuestion: (clientId: string, patch: Partial<QuestionState>) => void;
  updateQuestionOption: (clientId: string, optionIndex: number, value: string) => void;
  reorderQuestions: (clientId: string, direction: -1 | 1) => void;
  removeQuestion: (clientId: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="font-bold text-ink">Pertanyaan {index + 1}</p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => reorderQuestions(question.clientId, -1)} disabled={index === 0}>
                  Naik
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => reorderQuestions(question.clientId, 1)} disabled={index === count - 1}>
                  Turun
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => window.confirm('Hapus pertanyaan ini?') && removeQuestion(question.clientId)}>
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              <Field label="Question Text">
                <textarea
                  value={question.questionText}
                  onChange={(event) => updateQuestion(question.clientId, { questionText: event.target.value })}
                  className={cn(inputClass, 'min-h-24 resize-none py-3')}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Urutan">
                  <input
                    type="number"
                    min={1}
                    value={question.orderIndex}
                    readOnly
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {QUIZ_OPTION_IDS.map((optionId, optionIndex) => (
                  <Field key={optionId} label={`Opsi ${optionId.toUpperCase()}`}>
                    <input
                      value={question.options[optionIndex]}
                      onChange={(event) => updateQuestionOption(question.clientId, optionIndex, event.target.value)}
                      className={inputClass}
                    />
                  </Field>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Correct Answer">
                  <select
                    value={question.correctAnswer}
                    onChange={(event) =>
                      updateQuestion(question.clientId, {
                        correctAnswer: event.target.value as QuestionState['correctAnswer'],
                      })
                    }
                    className={inputClass}
                  >
                    {QUIZ_OPTION_IDS.map((optionId) => (
                      <option key={optionId} value={optionId}>
                        {optionId.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Bobot Soal">
                  <EditableNumberInput
                    min={1}
                    value={question.points}
                    onValueChange={(points) => updateQuestion(question.clientId, { points })}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Explanation">
                <textarea
                  value={question.explanation}
                  onChange={(event) => updateQuestion(question.clientId, { explanation: event.target.value })}
                  className={cn(inputClass, 'min-h-24 resize-none py-3')}
                />
              </Field>
            </div>
          </div>
  );
});

