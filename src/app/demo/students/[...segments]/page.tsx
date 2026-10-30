import { notFound } from 'next/navigation';
import { DemoStudentWorkspace, type StudentDemoView } from '@/components/demo/demo-student-workspace';
import { DemoWorkspaceShell } from '@/components/demo/demo-workspace-shell';

type StudentDemoRouteProps = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ q?: string | string[]; moduleId?: string | string[] }>;
};

export default async function StudentDemoRoutePage({ params, searchParams }: StudentDemoRouteProps) {
  const { segments } = await params;
  const queryParams = await searchParams;
  const [section, itemId, ...extra] = segments;
  if (extra.length) notFound();

  let view: StudentDemoView;
  if (section === 'modules') view = itemId ? 'module' : 'modules';
  else if (section === 'quizzes') view = itemId ? 'quiz' : 'quizzes';
  else if (!itemId && ['dashboard', 'reflection', 'progress', 'announcements', 'tasks', 'certificates', 'messages', 'settings'].includes(section ?? '')) view = section as StudentDemoView;
  else notFound();

  const initialQuery = Array.isArray(queryParams.q) ? queryParams.q[0] ?? '' : queryParams.q ?? '';
  const reflectionModuleId = Array.isArray(queryParams.moduleId) ? queryParams.moduleId[0] : queryParams.moduleId;

  return (
    <DemoWorkspaceShell role="student">
      <DemoStudentWorkspace
        view={view}
        moduleId={view === 'module' ? itemId : undefined}
        reflectionModuleId={view === 'reflection' ? reflectionModuleId : undefined}
        initialQuery={initialQuery}
      />
    </DemoWorkspaceShell>
  );
}
