import { readAllRows } from '@/lib/supabase/read-all-rows';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { AssignmentClassOption, AssignmentItem, AssignmentPageData, AssignmentSubmission } from '@/lib/assignments/types';
import type { Profile } from '@/lib/types';

const pageSize = 20;

type ClassRow = { id: string; name: string };
type AssignmentRow = {
  id: string;
  class_id: string;
  teacher_id: string;
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
type StudentRow = { id: string; full_name: string };

export async function getTeacherAssignmentsData(profile: Profile, requestedPage = 1): Promise<AssignmentPageData> {
  const page = Number.isSafeInteger(requestedPage) ? Math.max(1, requestedPage) : 1;
  if (!isSupabaseConfigured) return { items: [], classes: [], page, hasNextPage: false, hasPreviousPage: page > 1 };

  try {
    const supabase = await createClient();
    let classesQuery = supabase.from('classes').select('id, name').order('name', { ascending: true });
    let assignmentsQuery = supabase
      .from('class_assignments')
      .select('id, class_id, teacher_id, title, instructions, due_at, created_at')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize);
    if (profile.role === 'teacher') {
      classesQuery = classesQuery.eq('teacher_id', profile.id);
      assignmentsQuery = assignmentsQuery.eq('teacher_id', profile.id);
    }

    const [classesResult, assignmentsResult] = await Promise.all([classesQuery, assignmentsQuery]);
    if (classesResult.error || assignmentsResult.error) throw classesResult.error ?? assignmentsResult.error;

    const classes = (classesResult.data ?? []) as ClassRow[];
    const rows = (assignmentsResult.data ?? []) as AssignmentRow[];
    const visibleRows = rows.slice(0, pageSize);
    const classNameById = new Map(classes.map((classItem) => [classItem.id, classItem.name]));
    if (!visibleRows.length) {
      return { items: [], classes: classes as AssignmentClassOption[], page, hasNextPage: false, hasPreviousPage: page > 1 };
    }

    const submissionResult = await readAllRows(
      supabase
        .from('assignment_submissions')
        .select('id, assignment_id, student_id, answer, file_path, file_name, file_size, file_type, status, score, feedback, submitted_at, reviewed_at')
        .in('assignment_id', visibleRows.map((row) => row.id))
        .order('submitted_at', { ascending: false })
        .order('id', { ascending: false }),
    );
    const submissions = submissionResult.data as SubmissionRow[];
    const studentIds = Array.from(new Set(submissions.map((submission) => submission.student_id)));
    const studentRows = studentIds.length
      ? await readAllRows(supabase.from('profiles').select('id, full_name').in('id', studentIds))
      : { data: [], error: null };
    const studentNameById = new Map((studentRows.data as StudentRow[]).map((student) => [student.id, student.full_name]));
    const submissionsByAssignment = new Map<string, AssignmentSubmission[]>();
    for (const submission of submissions) {
      const items = submissionsByAssignment.get(submission.assignment_id) ?? [];
      items.push({
        id: submission.id,
        assignmentId: submission.assignment_id,
        studentId: submission.student_id,
        studentName: studentNameById.get(submission.student_id) ?? 'Siswa',
        answer: submission.answer,
        attachment: submission.file_path && submission.file_name && submission.file_size && submission.file_type
          ? { path: submission.file_path, fileName: submission.file_name, fileSize: submission.file_size, fileType: submission.file_type }
          : null,
        status: submission.status,
        score: submission.score,
        feedback: submission.feedback,
        submittedAt: submission.submitted_at,
        reviewedAt: submission.reviewed_at,
      });
      submissionsByAssignment.set(submission.assignment_id, items);
    }

    return {
      items: visibleRows.map((row): AssignmentItem => ({
        id: row.id,
        classId: row.class_id,
        className: classNameById.get(row.class_id) ?? 'Kelas',
        title: row.title,
        instructions: row.instructions,
        dueAt: row.due_at,
        createdAt: row.created_at,
        submissions: submissionsByAssignment.get(row.id) ?? [],
      })),
      classes: classes as AssignmentClassOption[],
      page,
      hasNextPage: rows.length > pageSize,
      hasPreviousPage: page > 1,
    };
  } catch (error) {
    throw new Error('Daftar tugas kelas gagal dimuat. Silakan coba lagi.', { cause: error });
  }
}
