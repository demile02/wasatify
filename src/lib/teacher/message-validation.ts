import { z } from 'zod';

export const teacherMessageSchema = z.object({
  classId: z.string().uuid('Pilih kelas yang valid.'),
  title: z.string().trim().min(5, 'Judul pesan minimal 5 karakter.').max(100, 'Judul pesan maksimal 100 karakter.'),
  body: z.string().trim().min(20, 'Isi pesan minimal 20 karakter.').max(2000, 'Isi pesan maksimal 2.000 karakter.'),
});

export type TeacherMessageDraft = z.infer<typeof teacherMessageSchema>;
