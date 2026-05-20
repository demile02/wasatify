export type AppRole = 'student' | 'teacher' | 'admin';

export type UserRole = AppRole;

export type ProgressStatus = 'completed' | 'in_progress' | 'not_started' | 'locked';

export type ModuleStatus = ProgressStatus;

export type ModulePublishStatus = 'draft' | 'published' | 'archived';

export type QuizStatus = 'draft' | 'published' | 'archived';

export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false';

export type LessonType = 'article' | 'video' | 'infographic' | 'reflection';

export type QuizAttemptStatus = 'in_progress' | 'submitted' | 'graded';

export type MediaKind = 'avatar' | 'module_cover' | 'lesson_attachment' | 'other';

export type InfographicProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue | undefined }
  | JsonValue[];

export type NavigationItem = {
  label: string;
  href: string;
  icon?: string;
};

export type LandingFeature = {
  title: string;
  description: string;
  icon: 'BookOpen' | 'CheckCircle2' | 'ShieldCheck' | 'BarChart3';
};

export type LandingStat = {
  value: string;
  label: string;
};

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  email?: string | null;
  avatar_url?: string | null;
  school_name?: string | null;
  class_id?: string | null;
  class_name?: string | null;
  last_active_at?: string | null;
  subject?: string | null;
  bio?: string | null;
  xp?: number | null;
  streak_count?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type StudentLearningModule = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: ModuleStatus;
  orderIndex?: number;
  lessonsCount: number;
  estimatedMinutes: number;
  duration: string;
  progress: number;
  imageSrc?: string;
  completedAt?: string;
  lastAccessedAt?: string;
};

export type StudentActivity = {
  title: string;
  time: string;
  type: 'quiz' | 'reflection' | 'module';
};

export type Class = {
  id: string;
  teacher_id: string;
  name: string;
  description?: string | null;
  grade_level?: string | null;
  academic_year?: string | null;
  join_code: string;
  class_code?: string | null;
  created_at: string;
  updated_at: string;
};

export type Module = {
  id: string;
  teacher_id?: string | null;
  created_by?: string | null;
  class_id?: string | null;
  title: string;
  slug: string;
  description: string;
  cover_image_path?: string | null;
  difficulty?: 'pemula' | 'menengah' | 'lanjut' | null;
  tags: string[];
  status: ModulePublishStatus;
  is_public: boolean;
  estimated_minutes: number;
  order_index: number;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type Lesson = {
  id: string;
  module_id: string;
  media_asset_id?: string | null;
  infographic_asset_id?: string | null;
  title: string;
  slug: string;
  type: LessonType;
  content?: string | null;
  reflection_prompt?: string | null;
  video_url?: string | null;
  infographic_url?: string | null;
  order_index: number;
  estimated_minutes: number;
  created_at: string;
  updated_at: string;
};

export type InfographicAsset = {
  id: string;
  module_id?: string | null;
  lesson_id?: string | null;
  media_asset_id?: string | null;
  title: string;
  source_file_url: string;
  source_file_type: string;
  processing_status: InfographicProcessingStatus;
  slide_count: number;
  slide_images: JsonValue[];
  error_message?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
};

export type Quiz = {
  id: string;
  module_id: string;
  teacher_id?: string | null;
  title: string;
  description?: string | null;
  status: QuizStatus;
  passing_score: number;
  max_attempts: number;
  time_limit_seconds?: number | null;
  allow_retake?: boolean | null;
  show_explanation?: boolean | null;
  shuffle_questions?: boolean | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type QuizQuestion = {
  id: string;
  quiz_id: string;
  question_type: QuestionType;
  question_text: string;
  options: JsonValue[];
  correct_answer: Record<string, JsonValue>;
  explanation?: string | null;
  show_explanation: boolean;
  points: number;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type ModuleProgress = {
  id: string;
  student_id: string;
  module_id: string;
  status: ProgressStatus;
  progress_percent: number;
  started_at?: string | null;
  completed_at?: string | null;
  last_accessed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type LessonProgress = {
  id: string;
  student_id: string;
  module_id: string;
  lesson_id: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type QuizAttempt = {
  id: string;
  quiz_id: string;
  student_id: string;
  status: QuizAttemptStatus;
  answers: Record<string, JsonValue>;
  score?: number | null;
  total_points?: number | null;
  earned_points?: number | null;
  passed?: boolean | null;
  total_questions?: number | null;
  correct_answers?: number | null;
  started_at: string;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type Reflection = {
  id: string;
  student_id: string;
  module_id: string;
  reflection_text: string;
  action_plan?: string | null;
  teacher_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type Achievement = {
  id: string;
  code: string;
  title: string;
  description: string;
  icon?: string | null;
  criteria: Record<string, JsonValue>;
  xp_reward: number;
  created_at: string;
  updated_at: string;
};

export type StudentAchievement = {
  id: string;
  student_id: string;
  achievement_id: string;
  earned_at: string;
};

export type Announcement = {
  id: string;
  teacher_id?: string | null;
  class_id?: string | null;
  title: string;
  content: string;
  status?: 'draft' | 'published';
  priority: 'low' | 'normal' | 'high';
  published_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type MediaAsset = {
  id: string;
  owner_id?: string | null;
  module_id?: string | null;
  title?: string | null;
  bucket: string;
  path: string;
  public_url?: string | null;
  file_type?: 'image' | 'video' | 'pdf' | 'document' | 'other' | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  kind: MediaKind;
  created_at: string;
  updated_at: string;
};

export type StatusMeta = {
  label: string;
  description?: string;
  className: string;
};
