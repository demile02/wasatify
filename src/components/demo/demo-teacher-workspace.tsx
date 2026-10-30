'use client';

import { PageHeader } from '@/components/shared/page-header';
import { DemoAccountSettings } from '@/components/demo/demo-account-settings';
import { TeacherMessagesManager } from '@/components/teacher/teacher-messages-manager';
import { useDemoStorage } from '@/components/demo/use-demo-storage';
import {
  TeacherAnnouncements,
  TeacherAssignments,
  TeacherClasses,
  TeacherMedia,
  TeacherModules,
  TeacherQuizzes,
  TeacherReflections,
  TeacherReports,
  TeacherStudents,
} from '@/components/demo/demo-teacher-sections';
import { initialTeacherDemoAnnouncements, initialTeacherDemoMessages, initialTeacherDemoModules, teacherDemoClasses } from '@/lib/demo/workspace-data';
import { initialDemoAssignments } from '@/lib/demo/assignments';
import type { AssignmentItem } from '@/lib/assignments/types';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import type { TeacherMessageDraft } from '@/lib/teacher/message-validation';

export type TeacherDemoView = 'classes' | 'modules' | 'quizzes' | 'tasks' | 'reports' | 'announcements' | 'students' | 'reflections' | 'media' | 'messages' | 'settings';

type TeacherDemoState = {
  modules: typeof initialTeacherDemoModules;
  announcements: typeof initialTeacherDemoAnnouncements;
};

const initialState: TeacherDemoState = {
  modules: initialTeacherDemoModules,
  announcements: initialTeacherDemoAnnouncements,
};

export function DemoTeacherWorkspace({ view, classId, initialQuery = '' }: { view: TeacherDemoView; classId?: string; initialQuery?: string }) {
  const [state, setState, ready] = useDemoStorage('wasatify-demo-teacher-v2', initialState);
  const [demoMessages, setDemoMessages, messagesReady] = useDemoStorage('wasatify-demo-messages-v1', initialTeacherDemoMessages);
  const [assignments, setAssignments, assignmentsReady] = useDemoStorage('wasatify-demo-assignments-v1', initialDemoAssignments);

  function addModule(title: string, category: string) {
    setState((current) => ({
      ...current,
      modules: [{ id: `new-${Date.now()}`, title, category, lessons: 1, status: 'Draf' }, ...current.modules],
    }));
  }

  function toggleModule(moduleId: string) {
    setState((current) => ({
      ...current,
      modules: current.modules.map((module) => module.id === moduleId
        ? { ...module, status: module.status === 'Diterbitkan' ? 'Draf' : 'Diterbitkan' }
        : module),
    }));
  }

  function addAnnouncement(title: string, message: string) {
    setState((current) => ({
      ...current,
      announcements: [{ id: `new-${Date.now()}`, title, message, classId: null, status: 'published', createdAt: new Date().toISOString(), publishedAt: new Date().toISOString() }, ...current.announcements],
    }));
  }

  function addDemoMessage(draft: TeacherMessageDraft) {
    const targetClass = teacherDemoClasses.find((classItem) => classItem.id === draft.classId);
    if (!targetClass) return { ok: false, error: 'Pilih kelas demo yang tersedia.' };

    setDemoMessages((current) => [{
      id: `demo-message-${Date.now()}`,
      title: draft.title.trim(),
      body: draft.body.trim(),
      classId: targetClass.id,
      senderName: demoTeacherProfile.full_name,
      createdAt: new Date().toISOString(),
      readAt: null,
    }, ...current]);
    return { ok: true };
  }

  function addDemoAssignment(draft: { classId: string; title: string; instructions: string; dueAt: string | null }) {
    const classItem = teacherDemoClasses.find((item) => item.id === draft.classId);
    if (!classItem) return;
    const assignment: AssignmentItem = {
      id: `demo-assignment-${Date.now()}`,
      classId: classItem.id,
      className: classItem.name,
      title: draft.title,
      instructions: draft.instructions,
      dueAt: draft.dueAt,
      createdAt: new Date().toISOString(),
      submissions: [],
    };
    setAssignments((current) => [assignment, ...current]);
  }

  function reviewDemoAssignment(draft: { submissionId: string; score: number; feedback: string }) {
    setAssignments((current) => current.map((assignment) => ({
      ...assignment,
      submissions: assignment.submissions?.map((submission) => submission.id === draft.submissionId
        ? { ...submission, status: 'reviewed', score: draft.score, feedback: draft.feedback || null, reviewedAt: new Date().toISOString() }
        : submission),
    })));
  }

  if (!ready || !messagesReady || (view === 'tasks' && !assignmentsReady)) return <div role="status" className="min-h-56 animate-pulse rounded-3xl bg-mint/40 p-6"><span className="sr-only">Memuat demo guru</span><div className="h-8 max-w-xs rounded-lg bg-white/80" /><div className="mt-5 h-24 rounded-2xl bg-white/70" /></div>;

  switch (view) {
    case 'classes': return <TeacherClasses classId={classId} />;
    case 'modules': return <TeacherModules modules={state.modules} onAdd={addModule} onToggle={toggleModule} initialQuery={initialQuery} />;
    case 'quizzes': return <TeacherQuizzes />;
    case 'tasks': return <TeacherAssignments items={assignments} onCreate={addDemoAssignment} onReview={reviewDemoAssignment} />;
    case 'reports': return <TeacherReports />;
    case 'announcements': return <TeacherAnnouncements announcements={state.announcements} onAdd={addAnnouncement} />;
    case 'students': return <TeacherStudents />;
    case 'reflections': return <TeacherReflections />;
    case 'media': return <TeacherMedia />;
    case 'messages': return <div><PageHeader eyebrow="Komunikasi" title="Pesan" description="Kirim informasi langsung ke kotak pesan siswa di kelas demo." /><TeacherMessagesManager data={{ classes: teacherDemoClasses.map(({ id, name }) => ({ id, name })), messages: demoMessages.map((message) => ({ id: message.id, title: message.title, body: message.body, targetName: teacherDemoClasses.find((classItem) => classItem.id === message.classId)?.name ?? 'Kelas', createdAt: message.createdAt })), page: 1, hasNextPage: false, hasPreviousPage: false }} basePath="/demo/teacher/messages" onSend={async (draft) => addDemoMessage(draft)} /> </div>;
    case 'settings': return <DemoAccountSettings profile={demoTeacherProfile} roleLabel="Guru" roleDescription={demoTeacherProfile.subject ?? demoTeacherProfile.school_name ?? 'Guru WASATIFY'} />;
    default: return null;
  }
}
