import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth/server';

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  redirect(profile?.role === 'admin' ? '/admin/invites' : '/admin/login');
}
