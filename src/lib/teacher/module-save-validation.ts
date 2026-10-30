import { z } from 'zod';
import { QUIZ_OPTION_IDS } from '@/lib/teacher/quiz-constants';

const optionalId = z.uuid().or(z.literal('')).optional();
const cropRect = z.object({
  x: z.number().min(0).max(1), y: z.number().min(0).max(1),
  width: z.number().positive().max(1), height: z.number().positive().max(1),
}).strict().refine((r) => r.x + r.width <= 1.00001 && r.y + r.height <= 1.00001);
const question = z.object({
  id: optionalId, questionType: z.literal('multiple_choice'), questionText: z.string().max(10000),
  options: z.tuple([z.string(), z.string(), z.string(), z.string(), z.string()]),
  correctAnswer: z.enum(QUIZ_OPTION_IDS), explanation: z.string().max(10000),
  points: z.number().finite().positive().max(100000), orderIndex: z.number().int(),
});
const lesson = z.object({
  id: optionalId, title: z.string().max(500), content: z.string().max(200000),
  keyPoints: z.array(z.string().max(10000)).max(100).nullable(), videoUrl: z.string().max(2048),
  infographicUrl: z.string().max(2048), infographicAssetId: optionalId,
  reflectionPrompt: z.string().max(10000), orderIndex: z.number().int(),
});

export const saveTeacherModuleSchema = z.object({
  moduleId: optionalId, title: z.string().trim().min(5, 'Judul modul minimal 5 karakter.').max(500),
  slug: z.string().trim().max(500).optional(),
  description: z.string().trim().min(20, 'Deskripsi minimal 20 karakter.').max(20000),
  classId: optionalId, estimatedMinutes: z.number().finite().min(1).max(100000),
  orderIndex: z.number().finite().min(1).max(100000),
  difficulty: z.enum(['pemula', 'menengah', 'lanjut', '']).optional(), tags: z.array(z.string().max(100)).max(8),
  coverImagePath: z.string().max(2048).optional(), heroImagePath: z.string().max(2048).optional(),
  coverAsset: z.object({
    bucket: z.string(), path: z.string(), publicUrl: z.string(), mimeType: z.string().optional(),
    sizeBytes: z.number().finite().nonnegative().optional(),
  }).optional(),
  imageCropConfig: z.object({heroDesktop: cropRect.nullable(), heroMobile: cropRect.nullable(), thumbnail: cropRect.nullable()}).nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']), isPublic: z.boolean(), lessons: z.array(lesson).max(100),
  quiz: z.object({
    id: optionalId, title: z.string().max(500), description: z.string().max(20000),
    passingScore: z.number().finite().min(0).max(100), maxAttempts: z.number().int().min(1).max(100),
    timeLimitSeconds: z.number().finite().min(0).max(86400), allowRetake: z.boolean(), showExplanation: z.boolean(),
    shuffleQuestions: z.boolean(), status: z.enum(['draft', 'published', 'archived']), isPublished: z.boolean(),
    questions: z.array(question).max(100),
  }),
  intent: z.enum(['draft', 'publish']),
  notification: z.object({ enabled: z.boolean(), message: z.string().max(20000).optional(), type: z.enum(['publish', 'update', 'quiz_update']).optional() }).optional(),
});
