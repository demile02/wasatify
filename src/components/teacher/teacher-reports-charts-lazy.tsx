'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { SectionCard } from '@/components/shared/section-card';
import type { TeacherReportScope } from '@/lib/teacher/analytics';

const TeacherReportsCharts = dynamic(
  () => import('@/components/teacher/teacher-reports-charts').then((module) => module.TeacherReportsCharts),
  { ssr: false, loading: ChartsPlaceholder },
);

type Props = {
  activeScope: TeacherReportScope;
  classCompletionData: { className: string; completion: number }[];
};

export function TeacherReportsChartsLazy(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || visible) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '200px 0px' });
    observer.observe(container);
    return () => observer.disconnect();
  }, [visible]);

  return <div ref={containerRef}>{visible ? <TeacherReportsCharts {...props} /> : <ChartsPlaceholder />}</div>;
}

function ChartsPlaceholder() {
  return (
    <div className="mt-6" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Memuat grafik laporan...</span>
      <div className="grid min-w-0 gap-6 xl:grid-cols-2" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <SectionCard key={index}>
            <div className="h-5 w-40 rounded bg-border/60" />
            <div className="mt-5 h-[280px] rounded-xl bg-muted/50" />
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
