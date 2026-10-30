import { getStudentClassTeacherContext } from '@/lib/scope';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

const certificatesPerPage = 12;

export type StudentCertificate = {
  moduleId: string;
  moduleTitle: string;
  completedAt: string | null;
};

export type StudentCertificatesData = {
  certificates: StudentCertificate[];
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type CompletedProgressRow = {
  module_id: string;
  completed_at: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type ModuleTitleRow = {
  id: string;
  title: string;
};

export async function getStudentCertificatesData(profile: Profile, requestedPage = 1): Promise<StudentCertificatesData> {
  const page = Number.isSafeInteger(requestedPage) ? Math.max(1, requestedPage) : 1;
  const emptyData = { certificates: [], page, hasNextPage: false, hasPreviousPage: page > 1 };
  if (!isSupabaseConfigured) return emptyData;

  try {
    const scope = await getStudentClassTeacherContext(profile.id);
    if (!scope.teacherId) return emptyData;

    const supabase = await createClient();
    const start = (page - 1) * certificatesPerPage;
    const { data: progressData, error: progressError } = await supabase
      .from('module_progress')
      .select('module_id, completed_at, updated_at, created_at')
      .eq('student_id', profile.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false, nullsFirst: false })
      .order('module_id', { ascending: true })
      .range(start, start + certificatesPerPage);

    if (progressError) throw progressError;
    const rows = (progressData ?? []) as CompletedProgressRow[];
    const hasNextPage = rows.length > certificatesPerPage;
    const visibleRows = rows.slice(0, certificatesPerPage);
    if (!visibleRows.length) return { ...emptyData, hasPreviousPage: page > 1 };

    const moduleIds = visibleRows.map((row) => row.module_id);
    const { data: moduleData, error: moduleError } = await supabase
      .from('modules')
      .select('id, title')
      .eq('created_by', scope.teacherId)
      .eq('status', 'published')
      .in('id', moduleIds);

    if (moduleError) throw moduleError;
    const moduleTitles = new Map(((moduleData ?? []) as ModuleTitleRow[]).map((module) => [module.id, module.title]));
    const certificates = visibleRows.flatMap((row) => {
      const moduleTitle = moduleTitles.get(row.module_id);
      if (!moduleTitle) return [];
      return [{
        moduleId: row.module_id,
        moduleTitle,
        completedAt: row.completed_at ?? row.updated_at ?? row.created_at,
      }];
    });

    return { certificates, page, hasNextPage, hasPreviousPage: page > 1 };
  } catch (error) {
    throw new Error('Sertifikat gagal dimuat. Silakan coba lagi.', { cause: error });
  }
}
