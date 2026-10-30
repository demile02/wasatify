import type { ModuleEditorInitialData, ModuleEditorLesson, ModuleEditorQuestion } from '@/lib/teacher/module-editor';

export type LessonState = ModuleEditorLesson & {
  clientId: string;
  infographicFile?: File;
};

export type QuestionState = ModuleEditorQuestion & {
  clientId: string;
};

export type FormState = Omit<ModuleEditorInitialData, 'lessons' | 'quiz'> & {
  lessons: LessonState[];
  quiz: Omit<ModuleEditorInitialData['quiz'], 'questions'> & {
    questions: QuestionState[];
  };
};

export type NotificationState = {
  enabled: boolean;
  message: string;
};

