export type AssignmentAttachment = {
  path: string | null;
  fileName: string;
  fileSize: number;
  fileType: string;
  demoFileId?: string;
};

export type AssignmentSubmission = {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  answer: string | null;
  attachment: AssignmentAttachment | null;
  status: 'submitted' | 'reviewed';
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
};

export type AssignmentItem = {
  id: string;
  classId: string;
  className: string;
  title: string;
  instructions: string;
  dueAt: string | null;
  createdAt: string;
  submission?: AssignmentSubmission | null;
  submissions?: AssignmentSubmission[];
};

export type AssignmentClassOption = { id: string; name: string };

export type AssignmentPageData = {
  items: AssignmentItem[];
  classes?: AssignmentClassOption[];
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
