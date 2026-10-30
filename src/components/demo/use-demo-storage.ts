'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { browserStorage } from '@/lib/browser-storage';

export function useDemoStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [value, setValue] = useState(initialValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = browserStorage.get(key);
    if (stored) {
      try {
        setValue(JSON.parse(stored) as T);
      } catch {
        browserStorage.remove(key);
      }
    }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (ready) browserStorage.set(key, JSON.stringify(value));
  }, [key, ready, value]);

  return [value, setValue, ready];
}
