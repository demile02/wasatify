'use client';

import { useState } from 'react';
import { ListPagination } from '@/components/shared/list-pagination';
import type { ModuleEditorQuestion } from '@/lib/teacher/module-editor';

export function ModulePreviewQuizQuestions({ questions }: { questions: ModuleEditorQuestion[] }) {
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const pageCount = Math.max(Math.ceil(questions.length / pageSize), 1);
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * pageSize;
  const visibleQuestions = questions.slice(firstIndex, firstIndex + pageSize);

  if (questions.length <= 5) {
    return (
      <div className="mt-5 space-y-3">
        {questions.map((question, index) => (
          <QuestionPreview key={question.id ?? `${question.questionText}-${index}`} question={question} number={index + 1} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      <ListPagination
        total={questions.length}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
        announceChanges
      />
      {visibleQuestions.map((question, index) => (
        <QuestionPreview
          key={question.id ?? `${question.questionText}-${firstIndex + index}`}
          question={question}
          number={firstIndex + index + 1}
        />
      ))}
    </div>
  );
}

function QuestionPreview({ question, number }: { question: ModuleEditorQuestion; number: number }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-3">
      <p className="text-xs font-bold text-primary">Pertanyaan {number}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{question.questionText}</p>
    </div>
  );
}
