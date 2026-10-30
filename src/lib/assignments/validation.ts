import { z } from 'zod';
import { maxAssignmentFileSize } from '@/lib/assignments/files';

export const createAssignmentSchema = z.object({
  classId: z.string().uuid('Pilih kelas yang valid.'),
  title: z.string().trim().min(5, 'Judul tugas minimal 5 karakter.').max(120, 'Judul maksimal 120 karakter.'),
  instructions: z.string().trim().min(20, 'Instruksi tugas minimal 20 karakter.').max(5000, 'Instruksi maksimal 5.000 karakter.'),
  dueAt: z.string().datetime({ offset: true }).nullable(),
});

export const submitAssignmentSchema = z.object({
  assignmentId: z.string().uuid('Tugas tidak valid.'),
  answer: z.string().trim().max(5000, 'Jawaban maksimal 5.000 karakter.'),
  attachment: z.object({
    path: z.string().min(1).max(512),
    fileName: z.string().trim().min(1).max(255),
    fileSize: z.number().int().min(1).max(maxAssignmentFileSize),
    fileType: z.enum([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/webp',
    ]),
  }).nullable(),
}).superRefine((value, context) => {
  if (value.answer && value.answer.length < 20) {
    context.addIssue({ code: 'custom', path: ['answer'], message: 'Jawaban teks minimal 20 karakter.' });
  }
  if (!value.answer && !value.attachment) {
    context.addIssue({ code: 'custom', path: ['answer'], message: 'Tulis jawaban atau lampirkan berkas terlebih dahulu.' });
  }
});

export const reviewAssignmentSchema = z.object({
  submissionId: z.string().uuid('Jawaban tugas tidak valid.'),
  score: z.number().int().min(0).max(100),
  feedback: z.string().trim().max(2000, 'Catatan maksimal 2.000 karakter.'),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
export type ReviewAssignmentInput = z.infer<typeof reviewAssignmentSchema>;
