import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ExportReportButtonProps = {
  classId: string;
  disabled?: boolean;
};

export function ExportReportButton({ classId, disabled = false }: ExportReportButtonProps) {
  const content = <><Download className="h-4 w-4" />Export CSV</>;

  if (disabled) {
    return <Button type="button" variant="outline" className="h-12 bg-white" disabled>{content}</Button>;
  }

  return (
    <Button asChild variant="outline" className="h-12 bg-white">
      <a href={`/teacher/reports/export?classId=${encodeURIComponent(classId)}`}>{content}</a>
    </Button>
  );
}
