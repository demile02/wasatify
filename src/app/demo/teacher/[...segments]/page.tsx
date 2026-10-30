import { notFound } from 'next/navigation';
import { DemoTeacherWorkspace, type TeacherDemoView } from '@/components/demo/demo-teacher-workspace';
import { DemoWorkspaceShell } from '@/components/demo/demo-workspace-shell';

type TeacherDemoRouteProps = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function TeacherDemoRoutePage({ params, searchParams }: TeacherDemoRouteProps) {
  const { segments } = await params;
  const queryParams = await searchParams;
  const [section, itemId, ...extra] = segments;
  if (extra.length) notFound();

  let view: TeacherDemoView;
  if (section === 'classes') view = 'classes';
  else if (['modules', 'quizzes', 'tasks', 'reports', 'announcements', 'students', 'reflections', 'media', 'messages', 'settings'].includes(section ?? '')) {
    if (itemId) notFound();
    view = section as TeacherDemoView;
  } else notFound();

  const initialQuery = Array.isArray(queryParams.q) ? queryParams.q[0] ?? '' : queryParams.q ?? '';

  return (
    <DemoWorkspaceShell role="teacher">
      <DemoTeacherWorkspace view={view} classId={view === 'classes' ? itemId : undefined} initialQuery={initialQuery} />
    </DemoWorkspaceShell>
  );
}
