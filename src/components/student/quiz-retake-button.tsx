'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type QuizRetakeButtonProps = {
  moduleId: string;
  allowRetake: boolean;
  attemptsUsed: number;
  maxAttempts: number;
  size?: 'sm' | 'default';
  variant?: 'outline' | 'ghost';
  iconOnly?: boolean;
};

export function QuizRetakeButton({
  moduleId,
  allowRetake,
  attemptsUsed,
  maxAttempts,
  size = 'sm',
  variant = 'outline',
  iconOnly = false,
}: QuizRetakeButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const attemptsExhausted = attemptsUsed >= maxAttempts;
  const canRetake = allowRetake && !attemptsExhausted;
  const dialogCopy = getDialogCopy({ allowRetake, attemptsExhausted });

  function startRetake() {
    if (!canRetake) return;
    setOpen(false);
    router.push(`/student/modules/${moduleId}/quiz`);
  }

  return (
    <>
      <Button
        type="button"
        variant={iconOnly ? 'ghost' : variant}
        size={iconOnly ? 'icon' : size}
        className={iconOnly ? 'h-12 w-12 shrink-0 rounded-2xl bg-mint p-0 text-primary hover:bg-mint/80' : 'w-fit'}
        aria-label={iconOnly ? 'Ulangi kuis' : undefined}
        title={iconOnly ? 'Ulangi kuis' : undefined}
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="h-4 w-4" />
        {!iconOnly && 'Ulang'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl sm:max-w-md"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle>{dialogCopy.title}</DialogTitle>
            <DialogDescription>{dialogCopy.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {canRetake ? 'Batal' : 'Tutup'}
            </Button>
            {canRetake && (
              <Button type="button" onClick={startRetake}>
                Mulai Ulang
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getDialogCopy({
  allowRetake,
  attemptsExhausted,
}: {
  allowRetake: boolean;
  attemptsExhausted: boolean;
}) {
  if (!allowRetake) {
    return {
      title: 'Pengulangan tidak tersedia',
      description: 'Kuis ini tidak mengizinkan pengulangan.',
    };
  }

  if (attemptsExhausted) {
    return {
      title: 'Kesempatan habis',
      description: 'Batas pengulangan kuis sudah habis. Hubungi guru untuk meminta kesempatan tambahan.',
    };
  }

  return {
    title: 'Ulangi kuis?',
    description: 'Percobaan baru akan menggunakan 1 kesempatan mengulang.',
  };
}
