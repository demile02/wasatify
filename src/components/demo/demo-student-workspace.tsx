'use client';

import { ArrowLeft, BookOpen, ClipboardCheck, Clock3, Layers3 } from 'lucide-react';
import Link from 'next/link';
import { DemoStudentQuiz, type DemoQuizAttempt } from '@/components/demo/demo-student-quiz';
import { DemoAccountSettings } from '@/components/demo/demo-account-settings';
import { useDemoStorage } from '@/components/demo/use-demo-storage';
import { EmptyState } from '@/components/shared/empty-state';
import { LessonReader } from '@/components/student/lesson-reader';
import { ModuleExplorer } from '@/components/student/module-explorer';
import { ReflectionForm } from '@/components/student/reflection-form';
import { StudentDashboardView } from '@/components/student/student-dashboard-view';
import { StudentProgressView } from '@/components/student/student-progress-view';
import { StudentQuizCenterView } from '@/components/student/student-quiz-center-view';
import { StudentReflectionCenterView } from '@/components/student/student-reflection-center-view';
import { StudentMessagesList } from '@/components/student/student-messages-list';
import { StudentCertificatesView } from '@/components/student/student-certificates-view';
import { AssignmentBoard } from '@/components/shared/assignment-board';
import { StudentAnnouncementsList } from '@/components/student/student-announcements-list';
import { PageHeader } from '@/components/shared/page-header';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { demoStudentProfile, type StudentModule } from '@/lib/demo/student';
import { demoStudentDashboardData } from '@/lib/demo/student-dashboard';
import { initialTeacherDemoMessages, studentDemoModules } from '@/lib/demo/workspace-data';
import { resolveReflectionEligibility } from '@/lib/student/reflection-eligibility';
import { initialDemoAssignments } from '@/lib/demo/assignments';
import type { AssignmentAttachment, AssignmentItem } from '@/lib/assignments/types';
import type { StudentLesson } from '@/lib/student/learning';
import type { StudentActivity } from '@/lib/types';
import type { StudentProgressData } from '@/lib/student/progress';
import type { StudentCertificate } from '@/lib/student/certificates';
import type { StudentQuizCenterData, StudentQuizCenterQuiz, StudentQuizHistoryItem } from '@/lib/student/quizzes';
import type { ReflectionCenterData, ReflectionCenterItem, ReflectionModuleOption } from '@/lib/student/reflection';

export type StudentDemoView = 'dashboard' | 'modules' | 'module' | 'quizzes' | 'quiz' | 'reflection' | 'progress' | 'announcements' | 'tasks' | 'certificates' | 'messages' | 'settings';

type StudentDemoState = {
  completedLessonIds: string[];
  quizAttempts: DemoQuizAttempt[];
  reflection: string;
  actionPlan?: string;
  reflectionModuleId?: string;
};

const initialState: StudentDemoState = {
  completedLessonIds: ['tawazun-meaning'],
  quizAttempts: [],
  reflection: '',
};

export function DemoStudentWorkspace({ view, moduleId, reflectionModuleId, initialQuery = '' }: { view: StudentDemoView; moduleId?: string; reflectionModuleId?: string; initialQuery?: string }) {
  const [state, setState, ready] = useDemoStorage('wasatify-demo-student-v2', initialState);
  const [demoMessages, setDemoMessages, messagesReady] = useDemoStorage('wasatify-demo-messages-v1', initialTeacherDemoMessages);
  const [demoAssignments, setDemoAssignments, assignmentsReady] = useDemoStorage('wasatify-demo-assignments-v1', initialDemoAssignments);
  const quizAttempts = state.quizAttempts.slice(0, 3);
  const totalLessons = studentDemoModules.reduce((total, module) => total + module.lessons.length, 0);
  const completedModules = studentDemoModules.filter((module) => module.lessons.every((lesson) => state.completedLessonIds.includes(lesson.id))).length;
  const completedLessons = new Set(state.completedLessonIds).size;
  const progress = Math.round((completedLessons / totalLessons) * 100);
  const moduleItems = studentDemoModules.map((module, index) => {
    const done = module.lessons.filter((lesson) => state.completedLessonIds.includes(lesson.id)).length;
    const moduleProgress = module.lessons.length ? Math.round((done / module.lessons.length) * 100) : 0;
    const estimatedMinutes = module.lessons.reduce((total, lesson) => total + Number.parseInt(lesson.duration, 10), 0);
    const status = moduleProgress === 100 ? 'completed' : moduleProgress > 0 ? 'in_progress' : 'not_started';

    return {
      id: module.id,
      slug: module.id,
      title: module.title,
      description: module.description,
      status,
      orderIndex: index + 1,
      lessonsCount: module.lessons.length,
      lessonsCompleted: done === module.lessons.length,
      estimatedMinutes,
      duration: `${estimatedMinutes} menit`,
      progress: moduleProgress,
      imageSrc: '/assets/wasatify-module-art.png',
    } satisfies StudentModule;
  });
  const activities: StudentActivity[] = [
    ...(quizAttempts.length ? [{ title: 'Mengerjakan kuis Tawazun', time: 'Baru saja', type: 'quiz' as const }] : []),
    ...(state.reflection.trim() ? [{ title: 'Menyimpan refleksi belajar', time: 'Baru saja', type: 'reflection' as const }] : []),
    ...(completedLessons ? [{ title: `Menyelesaikan ${completedLessons} materi`, time: 'Demo ini', type: 'module' as const }] : []),
  ];
  const actionPlan = state.actionPlan ?? '';
  const hasValidReflection = Boolean(state.reflectionModuleId)
    && state.reflection.trim().length >= 30
    && actionPlan.trim().length >= 20;
  const passedDemoQuiz = quizAttempts.some((attempt) => attempt.score >= 70);
  const dashboardData = {
    ...demoStudentDashboardData,
    modules: moduleItems,
    quizAttemptsCount: quizAttempts.length,
    points: 140 + completedLessons * 10 + quizAttempts.reduce((total, attempt) => total + attempt.score, 0),
    activities,
  };
  const progressModules = moduleItems.map((module) => ({
    id: module.id,
    slug: module.slug,
    title: module.title,
    progress: module.progress,
    status: module.status,
    estimatedMinutes: module.estimatedMinutes,
    completedAt: module.status === 'completed' ? new Date().toISOString() : null,
    lastAccessedAt: null,
  }));
  const activityDate = new Date().toISOString();
  const progressData: StudentProgressData = {
    overallProgress: progress,
    xp: dashboardData.points,
    streakDays: 3,
    studyMinutes: Math.round(moduleItems.reduce((total, item) => total + item.estimatedMinutes * item.progress / 100, 0)),
    totalModules: moduleItems.length,
    totalCompletedModules: completedModules,
    totalQuizAttempts: quizAttempts.length,
    totalReflections: hasValidReflection ? 1 : 0,
    reflectionModuleCount: hasValidReflection ? 1 : 0,
    completedModules: progressModules.filter((module) => module.status === 'completed'),
    modules: progressModules,
    badges: [
      { id: 'demo-first-lesson', code: 'first_lesson', title: 'Langkah Pertama', description: 'Menyelesaikan materi pertama.', icon: null, xpReward: 10, earnedAt: completedLessons ? activityDate : null, unlocked: completedLessons > 0 },
      { id: 'demo-quiz', code: 'quiz_passed', title: 'Pemahaman Baik', description: 'Mendapat nilai minimal 70 pada kuis.', icon: null, xpReward: 20, earnedAt: quizAttempts.some((attempt) => attempt.score >= 70) ? activityDate : null, unlocked: quizAttempts.some((attempt) => attempt.score >= 70) },
      { id: 'demo-reflection', code: 'reflection', title: 'Aksi Nyata', description: 'Mengirim refleksi dan rencana aksi.', icon: null, xpReward: 15, earnedAt: hasValidReflection ? activityDate : null, unlocked: hasValidReflection },
    ],
    activities: [
      ...(quizAttempts.length ? [{ id: 'demo-quiz-activity', title: 'Mengerjakan kuis Tawazun', description: `Nilai terbaru ${quizAttempts[0].score}/100.`, date: quizAttempts[0].submittedAt, type: 'quiz' as const }] : []),
      ...(hasValidReflection ? [{ id: 'demo-reflection-activity', title: 'Mengirim refleksi', description: 'Refleksi dan rencana aksi tersimpan di demo ini.', date: activityDate, type: 'reflection' as const }] : []),
      ...(completedLessons ? [{ id: 'demo-module-activity', title: `Menyelesaikan ${completedLessons} materi`, description: 'Materi contoh yang sudah kamu baca.', date: activityDate, type: 'module' as const }] : []),
    ],
    quizHistory: quizAttempts.map((attempt, index) => ({
      id: `${attempt.submittedAt}-${index}`,
      quizTitle: 'Kuis Pemahaman Tawazun',
      moduleTitle: 'Tawazun dalam Keseharian',
      score: attempt.score,
      passed: attempt.score >= 70,
      submittedAt: attempt.submittedAt,
    })),
    isDemo: true,
  };
  const demoQuiz = buildDemoQuizCenterData(quizAttempts, moduleItems.find((module) => module.id === 'tawazun'), hasValidReflection);
  const reflectionOptions: ReflectionModuleOption[] = moduleItems.map((module) => ({
    id: module.id,
    title: module.title,
    description: module.description,
    status: module.status,
    progress: module.progress,
    lessonsCompleted: module.lessonsCompleted,
  }));
  const completeReflection = reflectionOptions.find((module) => hasValidReflection && module.id === state.reflectionModuleId);
  const reflectionCenterData: ReflectionCenterData = {
    modules: reflectionOptions,
    pending: reflectionOptions.filter((module) => module.id !== completeReflection?.id).map((module) => createDemoReflectionItem(module, false, passedDemoQuiz, state.reflection, actionPlan)),
    completed: completeReflection ? [createDemoReflectionItem(completeReflection, true, passedDemoQuiz, state.reflection, actionPlan)] : [],
  };

  function completeLesson(lessonId: string) {
    setState((current) => current.completedLessonIds.includes(lessonId)
      ? current
      : { ...current, completedLessonIds: [...current.completedLessonIds, lessonId] });
    return true;
  }

  function saveQuizAttempt(attempt: DemoQuizAttempt) {
    setState((current) => ({ ...current, quizAttempts: [attempt, ...current.quizAttempts.slice(0, 2)] }));
  }

  function saveReflection(draft: { moduleId: string; reflectionText: string; actionPlan: string }) {
    setState((current) => ({
      ...current,
      reflection: draft.reflectionText,
      actionPlan: draft.actionPlan,
      reflectionModuleId: draft.moduleId,
    }));
  }

  function markDemoMessageRead(messageId: string) {
    setDemoMessages((current) => current.map((message) => message.id === messageId
      ? { ...message, readAt: message.readAt ?? new Date().toISOString() }
      : message));
  }

  function submitDemoAssignment(draft: { assignmentId: string; answer: string; attachment: AssignmentAttachment | null }) {
    const submissionId = `demo-submission-${Date.now()}`;
    setDemoAssignments((current) => current.map((assignment) => assignment.id === draft.assignmentId
      ? {
          ...assignment,
          submission: {
            id: assignment.submission?.id ?? submissionId,
            assignmentId: assignment.id,
            studentId: demoStudentProfile.id,
            studentName: demoStudentProfile.full_name,
            answer: draft.answer,
            attachment: draft.attachment,
            status: 'submitted',
            score: null,
            feedback: null,
            submittedAt: new Date().toISOString(),
            reviewedAt: null,
          },
          submissions: [
            ...(assignment.submissions ?? []).filter((submission) => submission.studentId !== demoStudentProfile.id),
            {
              id: assignment.submissions?.find((submission) => submission.studentId === demoStudentProfile.id)?.id ?? submissionId,
              assignmentId: assignment.id,
              studentId: demoStudentProfile.id,
              studentName: demoStudentProfile.full_name,
              answer: draft.answer,
              attachment: draft.attachment,
              status: 'submitted',
              score: null,
              feedback: null,
              submittedAt: new Date().toISOString(),
              reviewedAt: null,
            },
          ],
        }
      : assignment));
  }

  if (!ready || (view === 'messages' && !messagesReady) || (view === 'tasks' && !assignmentsReady)) return <WorkspaceLoading />;

  switch (view) {
    case 'dashboard':
      return <StudentDashboardView profile={demoStudentProfile} dashboard={dashboardData} basePath="/demo/students" />;
    case 'modules':
      return <div><PageHeader title="Pilih Modul" description="Temukan materi baru atau lanjutkan modul yang sudah kamu mulai." /><ModuleExplorer modules={moduleItems} initialQuery={initialQuery} basePath="/demo/students" /></div>;
    case 'module':
      return <DemoLessonDetail moduleId={moduleId ?? ''} modules={moduleItems} completedLessonIds={state.completedLessonIds} onCompleteLesson={completeLesson} />;
    case 'quizzes':
      return <StudentQuizCenterView quizData={demoQuiz} basePath="/demo/students" />;
    case 'quiz':
      if (quizAttempts.length >= 3) return <div><PageHeader eyebrow="Kuis Pemahaman" title="Kesempatan kuis habis" description="Demo ini menyediakan tiga percobaan, sama seperti aturan kuis contoh." actions={<Button asChild variant="outline"><Link href="/demo/students/quizzes">Kembali ke kuis</Link></Button>} /><EmptyState className="mt-6" icon={ClipboardCheck} title="Tidak ada percobaan tersisa" description="Lihat riwayat nilai di pusat kuis demo." /></div>;
      return <div><PageHeader eyebrow="Kuis Pemahaman" title="Kuis Pemahaman" description="Tawazun dalam Keseharian" actions={<Button asChild variant="outline"><Link href="/demo/students/modules/tawazun"><ArrowLeft className="h-4 w-4" />Kembali</Link></Button>} /><div className="mt-8"><DemoStudentQuiz attempts={quizAttempts} onSubmit={saveQuizAttempt} basePath="/demo/students" moduleId="tawazun" /></div></div>;
    case 'reflection': {
      if (!reflectionModuleId) return <StudentReflectionCenterView data={reflectionCenterData} basePath="/demo/students" />;
      const reflectionTarget = reflectionOptions.find((module) => module.id === reflectionModuleId);
      const eligibility = reflectionTarget
        ? resolveReflectionEligibility({
            moduleStatus: reflectionTarget.status,
            lessonsCompleted: reflectionTarget.lessonsCompleted,
            hasQuiz: reflectionTarget.id === 'tawazun',
            hasPassedQuiz: passedDemoQuiz,
          })
        : null;
      const hasSavedReflection = hasValidReflection && reflectionTarget?.id === state.reflectionModuleId;
      const canEditReflection = Boolean(hasSavedReflection || eligibility?.eligible);
      const blockedReflectionReason = eligibility?.blockedReason
        ? `${eligibility.blockedReason}.`
        : 'Modul tidak ditemukan.';
      const blockedReflectionHref = eligibility?.nextStep === 'quiz' ? '/demo/students/quizzes/tawazun' : `/demo/students/modules/${reflectionModuleId}`;
      const blockedReflectionCta = eligibility?.nextStep === 'quiz' ? 'Buka Kuis' : 'Selesaikan Modul';
      return canEditReflection
        ? <ReflectionEditor modules={moduleItems} moduleId={reflectionModuleId} reflectionModuleId={state.reflectionModuleId} reflection={state.reflection} actionPlan={actionPlan} onSave={saveReflection} />
        : <div><PageHeader eyebrow="Refleksi Diri" title="Refleksi belum terbuka" actions={<Button asChild variant="outline"><Link href="/demo/students/reflection">Kembali ke Refleksi</Link></Button>} /><EmptyState className="mt-8" icon={ClipboardCheck} title={blockedReflectionReason} description="Selesaikan tahap pembelajaran yang belum tuntas untuk membuka refleksi." action={<Button asChild><Link href={blockedReflectionHref}>{blockedReflectionCta}</Link></Button>} /></div>;
    }
    case 'progress':
      return <StudentProgressView data={progressData} basePath="/demo/students" />;
    case 'announcements':
      return <AnnouncementsPage />;
    case 'tasks': {
      const tasks = demoAssignments
        .filter((assignment) => assignment.classId === 'viii-a')
        .map((assignment): AssignmentItem => ({
          ...assignment,
          className: 'X MA C',
          submission: assignment.submissions?.find((submission) => submission.studentId === demoStudentProfile.id) ?? null,
        }));
      return <div><PageHeader eyebrow="Tugas" title="Tugas Pembelajaran" description="Lihat instruksi, kirim jawaban, lalu periksa nilai dan catatan gurumu." /><AssignmentBoard mode="student" basePath="/demo/students/tasks" isDemo items={tasks} page={1} hasNextPage={false} hasPreviousPage={false} onSubmit={submitDemoAssignment} /></div>;
    }
    case 'certificates':
      return <CertificatesPage modules={studentDemoModules} completedLessonIds={state.completedLessonIds} hasPassedQuiz={passedDemoQuiz} />;
    case 'messages':
      return <MessagesPage messages={demoMessages.filter((message) => message.classId === 'viii-a').map((message) => ({ id: message.id, senderName: message.senderName, title: message.title, body: message.body, createdAt: message.createdAt, readAt: message.readAt ?? null }))} onMarkRead={markDemoMessageRead} />;
    case 'settings':
      return <DemoAccountSettings profile={demoStudentProfile} roleLabel="Siswa" roleDescription={demoStudentProfile.class_name ?? 'Siswa WASATIFY'} />;
    default:
      return null;
  }
}

function buildDemoQuizCenterData(
  attempts: DemoQuizAttempt[],
  moduleItem: StudentModule | undefined,
  hasReflection: boolean,
): StudentQuizCenterData {
  if (!moduleItem) return { available: [], waiting: [], exhausted: [], history: [], isDemo: true };

  const maxAttempts = 3;
  const visibleAttempts = attempts.slice(0, maxAttempts);
  const bestScore = visibleAttempts.length ? Math.max(...visibleAttempts.map((attempt) => attempt.score)) : null;
  const hasPassed = visibleAttempts.some((attempt) => attempt.score >= 70);
  const quiz: StudentQuizCenterQuiz = {
    id: 'demo-tawazun-quiz',
    moduleId: moduleItem.id,
    moduleTitle: moduleItem.title,
    moduleProgress: moduleItem.progress,
    moduleStatus: moduleItem.status,
    title: 'Kuis Pemahaman Tawazun',
    description: 'Latihan tentang keseimbangan tanggung jawab, sikap adil, dan adab di ruang digital.',
    category: 'Akhlak',
    passingScore: 70,
    maxAttempts,
    allowRetake: true,
    attemptsUsed: visibleAttempts.length,
    bestScore,
    latestAttemptId: visibleAttempts.length ? `${visibleAttempts[0].submittedAt}-0` : null,
    latestScore: visibleAttempts[0]?.score ?? null,
    hasPassed,
    hasReflection,
    canAttempt: visibleAttempts.length < maxAttempts,
    prerequisiteMet: true,
  };
  const history: StudentQuizHistoryItem[] = visibleAttempts.map((attempt, index) => ({
    id: `${attempt.submittedAt}-${index}`,
    quizId: quiz.id,
    moduleId: moduleItem.id,
    moduleTitle: moduleItem.title,
    quizTitle: quiz.title,
    attemptNumber: visibleAttempts.length - index,
    score: attempt.score,
    passed: attempt.score >= quiz.passingScore,
    submittedAt: attempt.submittedAt,
    bestScore: bestScore ?? 0,
    allowRetake: quiz.allowRetake,
    attemptsUsed: visibleAttempts.length,
    maxAttempts,
    canRetake: visibleAttempts.length < maxAttempts,
    hasPassed,
    hasReflection,
  }));

  return {
    available: quiz.canAttempt ? [quiz] : [],
    waiting: [],
    exhausted: quiz.canAttempt ? [] : [quiz],
    history,
    isDemo: true,
  };
}

function createDemoReflectionItem(
  module: ReflectionModuleOption,
  completed: boolean,
  passedDemoQuiz: boolean,
  reflectionText: string,
  actionPlan: string,
): ReflectionCenterItem {
  const hasQuiz = module.id === 'tawazun';
  const eligibility = resolveReflectionEligibility({
    moduleStatus: module.status,
    lessonsCompleted: module.lessonsCompleted,
    hasQuiz,
    hasPassedQuiz: passedDemoQuiz,
  });
  const { eligible, blockedReason } = eligibility;
  const canEdit = eligible || completed;
  const displayedBlockedReason = canEdit ? null : blockedReason;
  const ctaHref = canEdit
    ? `/demo/students/reflection?moduleId=${encodeURIComponent(module.id)}`
    : eligibility.nextStep === 'lessons'
      ? `/demo/students/modules/${encodeURIComponent(module.id)}`
      : '/demo/students/quizzes/tawazun';
  return {
    ...module,
    reflectionId: completed ? `demo-reflection-${module.id}` : null,
    reflectionText: completed ? reflectionText : '',
    actionPlan: completed ? actionPlan : '',
    teacherNote: null,
    reviewedAt: null,
    createdAt: completed ? new Date().toISOString() : null,
    hasValidReflection: completed,
    hasQuiz,
    hasPassedQuiz: hasQuiz && passedDemoQuiz,
    eligible: canEdit,
    blockedReason: displayedBlockedReason,
    ctaHref,
    ctaLabel: completed
      ? 'Lihat / Edit Refleksi'
      : canEdit
        ? 'Tulis Refleksi'
        : eligibility.nextStep === 'lessons'
          ? 'Selesaikan Modul Terlebih Dahulu'
          : 'Buka Menu Kuis',
  };
}

function DemoLessonDetail({
  moduleId,
  modules,
  completedLessonIds,
  onCompleteLesson,
}: {
  moduleId: string;
  modules: StudentModule[];
  completedLessonIds: string[];
  onCompleteLesson: (lessonId: string) => boolean;
}) {
  const moduleItem = modules.find((item) => item.id === moduleId);
  const demoModule = studentDemoModules.find((item) => item.id === moduleId);
  if (!moduleItem || !demoModule) {
    return <EmptyState icon={BookOpen} title="Modul tidak ditemukan" description="Pilih modul dari daftar demo." action={<Button asChild variant="outline"><Link href="/demo/students/modules">Kembali ke modul</Link></Button>} />;
  }

  const lessons: StudentLesson[] = demoModule.lessons.map((lesson, index) => ({
    id: lesson.id,
    moduleId: demoModule.id,
    title: lesson.title,
    slug: lesson.id,
    type: 'article',
    content: lesson.content,
    keyPoints: null,
    reflectionPrompt: null,
    videoUrl: null,
    infographicUrl: null,
    infographicAsset: null,
    orderIndex: index + 1,
    estimatedMinutes: Number.parseInt(lesson.duration, 10),
  }));
  return (
    <div>
      <PageHeader
        eyebrow={`Modul Belajar / ${moduleItem.title}`}
        title={moduleItem.title}
        description={moduleItem.description}
      />
      <SectionCard className="mt-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.45fr] lg:items-center">
          <div className="grid gap-3 sm:grid-cols-3">
            <ModuleMeta icon={Layers3} label="Total Pelajaran" value={`${lessons.length} pelajaran`} />
            <ModuleMeta icon={Clock3} label="Estimasi" value={`${moduleItem.estimatedMinutes} menit`} />
            <div className="rounded-2xl border border-border bg-white px-4 py-3"><p className="text-xs font-semibold text-muted-foreground">Status Modul</p><StatusBadge className="mt-2" status={moduleItem.status} /></div>
          </div>
          <ProgressBar value={moduleItem.progress} label="Progress Modul" showValue />
        </div>
      </SectionCard>
      <div className="mt-8">
        <LessonReader
          moduleItem={moduleItem}
          lessons={lessons}
          completedLessonIds={completedLessonIds}
          basePath="/demo/students"
          quizHref={moduleId === 'tawazun' ? '/demo/students/quizzes/tawazun' : null}
          onCompleteLesson={onCompleteLesson}
        />
      </div>
    </div>
  );
}

function ModuleMeta({ icon: Icon, label, value }: { icon?: typeof Layers3; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3">
      {Icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mint text-primary"><Icon className="h-5 w-5" /></span>}
      <span>
        <span className="block text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="block font-bold text-ink">{value}</span>
      </span>
    </div>
  );
}

function ReflectionEditor({
  modules,
  moduleId,
  reflectionModuleId,
  reflection,
  actionPlan,
  onSave,
}: {
  modules: StudentModule[];
  moduleId: string;
  reflectionModuleId?: string;
  reflection: string;
  actionPlan: string;
  onSave: (draft: { moduleId: string; reflectionText: string; actionPlan: string }) => void;
}) {
  const selectedModule = modules.find((module) => module.id === moduleId);
  if (!selectedModule) {
    return <EmptyState icon={ClipboardCheck} title="Modul tidak ditemukan" description="Pilih modul dari pusat refleksi untuk melanjutkan." action={<Button asChild variant="outline"><Link href="/demo/students/reflection">Kembali ke Refleksi</Link></Button>} />;
  }

  return (
    <div>
      <PageHeader eyebrow="Refleksi Diri" title="Refleksi dan Aksi" description="Renungkan pembelajaranmu dan wujudkan dalam tindakan nyata." />
      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.42fr]">
        <ReflectionForm
          modules={modules}
          selectedModuleId={selectedModule.id}
          existingReflection={moduleId === reflectionModuleId ? { moduleId: selectedModule.id, reflectionText: reflection, actionPlan } : null}
          showCancel
          basePath="/demo/students/reflection"
          onSave={(draft) => { onSave(draft); return { ok: true }; }}
        />
        <SectionCard variant="muted">
          <p className="text-sm font-bold text-primary">Panduan refleksi</p>
          <h2 className="mt-1 text-lg font-extrabold text-ink">{selectedModule.title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Tuliskan hal yang kamu pahami, lalu pilih langkah kecil yang dapat dilakukan dalam kehidupan sehari-hari.</p>
        </SectionCard>
      </div>
    </div>
  );
}

function AnnouncementsPage() {
  const announcements = [
    {
      id: 'demo-announcement-quiz',
      notificationKey: 'demo:announcement:quiz',
      title: 'Kuis pemahaman Tawazun tersedia',
      content: 'Baca materi Tawazun dalam Keseharian, lalu coba kuis lima soal. Pembahasan dapat dilihat setelah jawaban dikirim.',
      publishedAt: '2026-10-29T08:00:00.000Z',
      readAt: null,
    },
    {
      id: 'demo-announcement-module',
      notificationKey: 'demo:announcement:module',
      title: 'Materi Adab Belajar Digital',
      content: 'Modul contoh tersedia di daftar belajar. Kenali cara menjaga fokus dan tanggung jawab saat belajar daring.',
      publishedAt: '2026-10-27T08:00:00.000Z',
      readAt: null,
    },
  ];

  return (
    <div>
      <PageHeader eyebrow="Pengumuman" title="Pengumuman Kelas" description="Informasi terbaru dari guru dan platform WASATIFY." />
      <StudentAnnouncementsList announcements={announcements} persistRead={false} />
    </div>
  );
}

function CertificatesPage({
  modules,
  completedLessonIds,
  hasPassedQuiz,
}: {
  modules: typeof studentDemoModules;
  completedLessonIds: string[];
  hasPassedQuiz: boolean;
}) {
  const certificates: StudentCertificate[] = modules.flatMap((module) => {
    const allLessonsComplete = module.lessons.every((lesson) => completedLessonIds.includes(lesson.id));
    const requiredQuizPassed = module.id !== 'tawazun' || hasPassedQuiz;
    if (!allLessonsComplete || !requiredQuizPassed) return [];
    return [{ moduleId: module.id, moduleTitle: module.title, completedAt: null }];
  });

  return (
    <StudentCertificatesView
      certificates={certificates}
      page={1}
      hasNextPage={false}
      hasPreviousPage={false}
      studentName={demoStudentProfile.full_name}
      basePath="/demo/students/certificates"
      modulesHref="/demo/students/modules"
    />
  );
}

function MessagesPage({ messages, onMarkRead }: {
  messages: import('@/lib/student/messages').StudentMessageItem[];
  onMarkRead: (messageId: string) => void;
}) {
  return (
    <div>
      <PageHeader eyebrow="Pesan" title="Pesan" description="Pesan dari guru atau admin akan muncul di sini." />
      <StudentMessagesList items={messages} page={1} hasNextPage={false} hasPreviousPage={false} persistRead={false} onMarkRead={onMarkRead} />
    </div>
  );
}

function WorkspaceLoading() {
  return <div role="status" className="min-h-56 animate-pulse rounded-3xl bg-mint/40 p-6"><span className="sr-only">Memuat demo siswa</span><div className="h-8 max-w-xs rounded-lg bg-white/80" /><div className="mt-5 h-24 rounded-2xl bg-white/70" /></div>;
}
