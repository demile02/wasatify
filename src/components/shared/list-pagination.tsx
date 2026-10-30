'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PAGE_SIZES = [5, 10, 15, 20, 50];

type ListPaginationProps = {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  announceChanges?: boolean;
};

export function ListPagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  announceChanges = false,
}: ListPaginationProps) {
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);
  const currentPage = Math.min(page, pageCount);
  const firstItem = total ? (currentPage - 1) * pageSize + 1 : 0;
  const lastItem = Math.min(currentPage * pageSize, total);

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:justify-start">
        <p className="text-sm font-semibold text-ink" aria-live={announceChanges ? 'polite' : undefined}>
          Soal {firstItem}–{lastItem} dari {total}
        </p>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground">
          <span>Per halaman</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="min-h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      </div>

      <nav aria-label="Navigasi halaman soal" className="flex min-w-0 items-center justify-between gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Halaman sebelumnya"
          className="h-11 min-w-0 flex-1 gap-1 px-2 sm:flex-none sm:px-3"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span className="sm:hidden">Sebelum</span>
          <span className="hidden sm:inline">Sebelumnya</span>
        </Button>
        <span className="shrink-0 px-1 text-center text-sm font-semibold text-muted-foreground" aria-live={announceChanges ? 'polite' : undefined}>
          Halaman {currentPage} dari {pageCount}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= pageCount}
          aria-label="Halaman berikutnya"
          className="h-11 min-w-0 flex-1 gap-1 px-2 sm:flex-none sm:px-3"
        >
          <span className="sm:hidden">Lanjut</span>
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </Button>
      </nav>
    </div>
  );
}
