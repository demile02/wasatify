import { useEffect, useRef } from 'react';

export function useQuizAutoScroll(currentIndex: number, selectedAnswer?: string) {
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const feedbackActionsRef = useRef<HTMLDivElement>(null);
  const previousPosition = useRef({ currentIndex, selectedAnswer });

  useEffect(() => {
    const previous = previousPosition.current;

    if (previous.currentIndex !== currentIndex) {
      questionHeadingRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    } else if (!previous.selectedAnswer && selectedAnswer) {
      feedbackActionsRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }

    previousPosition.current = { currentIndex, selectedAnswer };
  }, [currentIndex, selectedAnswer]);

  return { questionHeadingRef, feedbackActionsRef };
}
