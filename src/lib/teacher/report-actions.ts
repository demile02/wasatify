'use server';

import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getTeacherReportsData } from '@/lib/teacher/analytics';

export async function getTeacherReportScopeAction(classId: string) {
  const profile = (await requireTeacher()) ?? demoTeacherProfile;
  const data = await getTeacherReportsData(profile, classId);
  return data.scopes[0];
}

