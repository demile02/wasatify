import { notFound } from 'next/navigation';
import { FeedbackInbox } from '@/components/dev-feedback/feedback-inbox';
import { listFeedback } from '@/lib/dev-feedback-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function FeedbackPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  const items = await listFeedback();
  return <FeedbackInbox initialItems={items} />;
}
