import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';
import type { AssignmentItem, AssignmentPageData } from '@/lib/assignments/types';

const pageSize = 20;

type AssignmentRow = {
  id: string;
  class_id: string;
  title: string;
  instructions: string;
  due_at: string | null;
  created_at: string;
};

type SubmissionRow = {
  id: string;
  assignment_id: string;
  student_id: string;
  answer: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  status: 'submitted' | 'reviewed';
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
};

export async function getStudentAssignmentsData(profile: Profile, requestedPage = 1): Promise<AssignmentPageData> {
  const page = Number.isSafeInteger(requestedPage) ? Math.max(1, requestedPage) : 1;
  if (!isSupabaseConfigured || !profile.class_id) {
    return { items: [], page, hasNextPage: false, hasPreviousPage: page > 1 };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('class_assignments')
      .select('id, class_id, title, instructions, due_at, created_at')
      .eq('class_id', profile.class_id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize);
    if (error) throw error;

    const rows = (data ?? []) as AssignmentRow[];
    const visibleRows = rows.slice(0, pageSize);
    if (!visibleRows.length) {
      return { items: [], page, hasNextPage: false, hasPreviousPage: page > 1 };
    }

    const { data: submissionsData, error: submissionsError } = await supabase
      .from('assignment_submissions')
      .select('id, assignment_id, student_id, answer, file_path, file_name, file_size, file_type, status, score, feedback, submitted_at, reviewed_at')
      .eq('student_id', profile.id)
      .in('assignment_id', visibleRows.map((row) => row.id));
    if (submissionsError) throw submissionsError;

    const submissionByAssignment = new Map(
      ((submissionsData ?? []) as SubmissionRow[]).map((submission) => [submission.assignment_id, {
        id: submission.id,
        assignmentId: submission.assignment_id,
        studentId: submission.student_id,
        studentName: profile.full_name,
        answer: submission.answer,
        attachment: submission.file_path && submission.file_name && submission.file_size && submission.file_type
          ? { path: submission.file_path, fileName: submission.file_name, fileSize: submission.file_size, fileType: submission.file_type }
          : null,
        status: submission.status,
        score: submission.score,
        feedback: submission.feedback,
        submittedAt: submission.submitted_at,
        reviewedAt: submission.reviewed_at,
      }]),
    );

    return {
      items: visibleRows.map((row): AssignmentItem => ({
        id: row.id,
        classId: row.class_id,
        className: profile.class_name ?? 'Kelas saya',
        title: row.title,
        instructions: row.instructions,
        dueAt: row.due_at,
        createdAt: row.created_at,
        submission: submissionByAssignment.get(row.id) ?? null,
      })),
      page,
      hasNextPage: rows.length > pageSize,
      hasPreviousPage: page > 1,
    };
  } catch (error) {
    throw new Error('Daftar tugas gagal dimuat. Silakan coba lagi.', { cause: error });
  }
}
