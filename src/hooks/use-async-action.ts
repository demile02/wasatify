'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

export function useAsyncAction() {
  const [pending, setPending] = useState(false);
  const running = useRef(false);
  const runAction = useCallback((action: () => Promise<void>) => {
    if (running.current) return;
    running.current = true;
    setPending(true);
    void (async () => {
      try {
        await action();
      } catch {
        toast.error('Permintaan belum selesai. Periksa koneksi lalu coba lagi.');
      } finally {
        running.current = false;
        setPending(false);
      }
    })();
  }, []);
  return [pending, runAction] as const;
}
