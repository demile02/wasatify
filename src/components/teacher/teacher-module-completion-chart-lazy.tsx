'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import type { TeacherModuleCompletionChartProps } from '@/components/teacher/teacher-module-completion-chart';

const TeacherModuleCompletionChart = dynamic(
  () => import('@/components/teacher/teacher-module-completion-chart').then((module) => module.TeacherModuleCompletionChart),
  {
    ssr: false,
    loading: () => <div className="h-full w-full" aria-hidden="true" />,
  },
);

export function TeacherModuleCompletionChartLazy({ data }: TeacherModuleCompletionChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [shouldLoadChart, setShouldLoadChart] = useState(false);

  useEffect(() => {
    const chartContainer = chartContainerRef.current;
    if (!chartContainer) return;

    if (!('IntersectionObserver' in window)) {
      setShouldLoadChart(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadChart(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px 0px' },
    );

    observer.observe(chartContainer);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={chartContainerRef} className="h-72 w-full">
      {shouldLoadChart ? <TeacherModuleCompletionChart data={data} /> : null}
    </div>
  );
}
