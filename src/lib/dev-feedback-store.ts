import 'server-only';

import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';

export type FeedbackStatus = 'open' | 'done';

export type FeedbackItem = {
  id: string;
  timestamp: string;
  page_url: string;
  selector: string;
  tag: string;
  text_snippet: string;
  comment: string;
  viewport: string;
  status: FeedbackStatus;
};

export type NewFeedback = Omit<FeedbackItem, 'id' | 'status'>;

const feedbackDirectory = path.join(process.cwd(), 'db');
const feedbackFile = path.join(feedbackDirectory, 'feedback.json');
let writeQueue: Promise<void> = Promise.resolve();

async function readFeedbackFile(): Promise<FeedbackItem[]> {
  try {
    const content = await readFile(feedbackFile, 'utf8');
    const parsed: unknown = JSON.parse(content);
    if (!Array.isArray(parsed)) throw new Error('Feedback JSON must contain an array');
    return parsed as FeedbackItem[];
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeFeedbackFile(items: FeedbackItem[]) {
  await mkdir(feedbackDirectory, { recursive: true });
  const temporaryFile = path.join(feedbackDirectory, `.feedback.${randomUUID()}.tmp`);
  const handle = await open(temporaryFile, 'wx', 0o600);

  try {
    await handle.writeFile(`${JSON.stringify(items, null, 2)}\n`, 'utf8');
    await handle.sync();
    await handle.close();
    await rename(temporaryFile, feedbackFile);
  } catch (error) {
    await handle.close().catch(() => undefined);
    await unlink(temporaryFile).catch(() => undefined);
    throw error;
  }
}

async function withFeedbackWrite<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

export async function listFeedback(): Promise<FeedbackItem[]> {
  const items = await readFeedbackFile();
  return items.sort((left, right) => right.timestamp.localeCompare(left.timestamp));
}

export function addFeedback(entry: NewFeedback): Promise<FeedbackItem> {
  return withFeedbackWrite(async () => {
    const items = await readFeedbackFile();
    let id = randomUUID().replaceAll('-', '').slice(0, 8);
    while (items.some((item) => item.id === id)) {
      id = randomUUID().replaceAll('-', '').slice(0, 8);
    }

    const created: FeedbackItem = { ...entry, id, status: 'open' };
    await writeFeedbackFile([...items, created]);
    return created;
  });
}

export function setFeedbackStatus(id: string, status: FeedbackStatus): Promise<boolean> {
  return withFeedbackWrite(async () => {
    const items = await readFeedbackFile();
    const item = items.find((feedback) => feedback.id === id);
    if (!item) return false;
    item.status = status;
    await writeFeedbackFile(items);
    return true;
  });
}
