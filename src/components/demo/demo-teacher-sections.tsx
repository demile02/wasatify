'use client';

import { useEffect, useState, type ComponentProps, type FormEvent } from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileText,
  FileQuestion,
  ImageIcon,
  Megaphone,
  MessageSquareText,
  PencilLine,
  Plus,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TeacherReportsView } from '@/components/teacher/teacher-reports-view';
import { AssignmentBoard } from '@/components/shared/assignment-board';
import type { AssignmentItem } from '@/lib/assignments/types';
import { TeacherStudentRosterView } from '@/components/teacher/teacher-student-roster-view';
import { formatDateTime } from '@/lib/date';
import type { TeacherReportsData, TeacherReportScope } from '@/lib/teacher/analytics';
import type { TeacherDemoAnnouncement, TeacherDemoModule } from '@/lib/demo/workspace-data';
import { initialTeacherDemoModules, teacherDemoClasses } from '@/lib/demo/workspace-data';

export function TeacherClasses({ classId }: { classId?: string }) {
  const selected = teacherDemoClasses.find((item) => item.id === classId);
  if (selected) return <TeacherClassDetail classItem={selected} />;
  return (
    <div>
      <PageHeader eyebrow="Kelas Saya" title="Kelas & Peserta" description="Kelola kelas dan pantau perkembangan siswa." />
      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        {teacherDemoClasses.map((classItem) => (
          <SectionCard key={classItem.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xl font-extrabold text-ink">{classItem.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">Kelas contoh WASATIFY</p>
                <p className="mt-2 text-xs font-semibold text-primary">Kode Kelas: DEMO-{classItem.id.toUpperCase()}</p>
              </div>
              <Button asChild size="sm">
                <Link href={`/demo/teacher/classes/${classItem.id}`}>Lihat Detail</Link>
              </Button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Metric icon={Users} label="Total Siswa" value={classItem.students} />
              <Metric icon={Users} label="Siswa Aktif" value={classItem.students} />
              <Metric icon={BarChart3} label="Rata-rata Progress" value={`${classItem.progress}%`} />
              <Metric icon={ClipboardCheck} label="Rata-rata Kuis" value={classItem.averageScore} />
            </div>
            <ProgressBar value={classItem.progress} label="Progress kelas" showValue className="mt-5" />
          </SectionCard>
        ))}
      </div>
    </div>
  );
}

function TeacherClassDetail({ classItem }: { classItem: (typeof teacherDemoClasses)[number] }) {
  const studentPreview = classItem.members.slice(0, 5);
  return <div><PageHeader eyebrow={`Kelas Saya / ${classItem.name}`} title={`Kelas ${classItem.name}`} description="Ringkasan dan daftar peserta dari data demo." actions={<Button asChild variant="outline"><Link href="/demo/teacher/classes">Semua kelas</Link></Button>} /><div className="mt-6 grid gap-4 sm:grid-cols-3"><StatCard label="Siswa" value={classItem.students} icon={Users} /><StatCard label="Progress kelas" value={`${classItem.progress}%`} icon={BarChart3} tone="mint" /><StatCard label="Nilai kuis rata-rata" value={`${classItem.averageScore}%`} icon={ClipboardCheck} tone="gold" /></div><SectionCard className="mt-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold text-ink">Peserta contoh</h2><p className="mt-1 text-sm text-muted-foreground">Pratinjau {studentPreview.length} nama dari kelas ini.</p></div><Button asChild variant="link" className="min-h-11"><Link href="/demo/teacher/students">Lihat semua</Link></Button></div><div className="mt-4 divide-y divide-border">{studentPreview.map((student, index) => <div key={`${student}-${index}`} className="flex items-center justify-between gap-4 py-3"><span className="font-semibold text-ink">{student}</span><span className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-primary">{index % 3 === 0 ? 'Materi selesai' : 'Sedang belajar'}</span></div>)}</div></SectionCard></div>;
}

export function TeacherModules({ modules, onAdd, onToggle, initialQuery = '' }: { modules: TeacherDemoModule[]; onAdd: (title: string, category: string) => void; onToggle: (moduleId: string) => void; initialQuery?: string }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Akhlak');
  const [query, setQuery] = useState(initialQuery);
  const [notice, setNotice] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | TeacherDemoModule['status']>('all');
  useEffect(() => setQuery(initialQuery), [initialQuery]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), category.trim() || 'Umum');
    setTitle('');
    setNotice('Modul demo ditambahkan sebagai draf.');
    setIsCreateOpen(false);
  }
  const categories = [...new Set(modules.map((module) => module.category))].sort((a, b) => a.localeCompare(b));
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredModules = modules.filter((module) => {
    const matchesQuery = `${module.title} ${module.category}`.toLocaleLowerCase().includes(normalizedQuery);
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || module.status === selectedStatus;
    return matchesQuery && matchesCategory && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title="Kelola Modul"
        description="Lihat semua modul yang Anda buat dan status publikasinya."
        actions={<Button type="button" onClick={() => setIsCreateOpen((current) => !current)}><Plus className="h-4 w-4" />{isCreateOpen ? 'Tutup Form' : 'Tambah Modul'}</Button>}
      />
      {isCreateOpen && (
        <SectionCard className="mt-6">
          <h2 className="text-lg font-extrabold text-ink">Buat modul demo</h2>
          <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_0.6fr_auto] sm:items-end">
            <div><label htmlFor="demo-module-title" className="mb-1.5 block text-sm font-semibold text-ink">Judul modul</label><Input id="demo-module-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Contoh: Adab berdiskusi" maxLength={80} required /></div>
            <div><label htmlFor="demo-module-category" className="mb-1.5 block text-sm font-semibold text-ink">Kategori</label><Input id="demo-module-category" value={category} onChange={(event) => setCategory(event.target.value)} maxLength={32} /></div>
            <Button type="submit"><Plus className="h-4 w-4" />Tambah draf</Button>
          </form>
        </SectionCard>
      )}
      {notice && <p role="status" className="mt-3 text-sm font-semibold text-primary">{notice}</p>}
      <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
        <label className="sr-only" htmlFor="demo-module-category-filter">Kategori modul</label>
        <select id="demo-module-category-filter" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="h-12 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
          <option value="all">Semua Kategori</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <label className="sr-only" htmlFor="demo-module-status-filter">Status modul</label>
        <select id="demo-module-status-filter" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as typeof selectedStatus)} className="h-12 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
          <option value="all">Semua Status</option><option value="Diterbitkan">Diterbitkan</option><option value="Draf">Draf</option>
        </select>
      </div>
      {filteredModules.length ? (
        <div className="mt-6 max-w-full overflow-x-auto rounded-2xl border border-border bg-white shadow-card">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-4 font-bold">Modul</th><th className="px-5 py-4 font-bold">Kategori</th><th className="px-5 py-4 font-bold">Konten</th><th className="px-5 py-4 font-bold">Durasi</th><th className="px-5 py-4 font-bold">Status</th><th className="px-5 py-4 font-bold">Update</th><th className="px-5 py-4 text-right font-bold">Aksi</th></tr></thead>
            <tbody className="divide-y divide-border">
              {filteredModules.map((module) => <tr key={module.id} className="transition hover:bg-mint/25"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-primary/10 bg-mint text-primary shadow-sm"><BookOpen className="h-6 w-6" /></span><div className="min-w-0"><p className="line-clamp-1 font-extrabold text-ink">{module.title}</p><p className="mt-1 line-clamp-1 max-w-md text-xs text-muted-foreground">Modul contoh untuk {module.category.toLocaleLowerCase()}.</p></div></div></td><td className="px-5 py-4 font-semibold text-foreground">{module.category}</td><td className="px-5 py-4 text-muted-foreground"><span className="block">{module.lessons} lesson</span><span className="mt-1 block text-xs">Kuis demo</span></td><td className="px-5 py-4 text-muted-foreground">{module.lessons * 5} menit</td><td className="px-5 py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${module.status === 'Diterbitkan' ? 'border-primary/15 bg-mint text-primary' : 'border-gold/20 bg-cream text-gold'}`}>{module.status}</span></td><td className="px-5 py-4 text-xs text-muted-foreground">Data demo</td><td className="px-5 py-4"><div className="flex justify-end"><Button type="button" variant="outline" size="sm" onClick={() => onToggle(module.id)}>{module.status === 'Diterbitkan' ? 'Jadikan draf' : 'Terbitkan'}</Button></div></td></tr>)}
            </tbody>
          </table>
        </div>
      ) : <EmptyState className="mt-6" icon={BookOpen} title="Modul tidak ditemukan" description="Coba ubah kata kunci pencarian, kategori, atau status." />}
    </div>
  );
}

export function TeacherQuizzes() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [showAttempts, setShowAttempts] = useState(false);
  const visible = 'kuis pemahaman tawazun akhlak'.includes(query.trim().toLocaleLowerCase())
    && (status === 'all' || status === 'published');

  return (
    <div>
      <PageHeader
        eyebrow="Kuis & Evaluasi"
        title="Kuis & Evaluasi"
        description="Pantau semua kuis dari modul Anda, lihat attempt siswa, dan lanjutkan pengeditan kuis dari satu tempat."
        actions={<Button asChild><Link href="/demo/teacher/modules"><Plus className="h-4 w-4" />Buat Kuis</Link></Button>}
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Kuis" value="1" description="Kuis dari modul demo" icon={ClipboardCheck} />
        <StatCard label="Published" value="1" description="Siap dikerjakan siswa" icon={Eye} tone="mint" />
        <StatCard label="Attempt" value="0" description="Percobaan demo" icon={FileQuestion} tone="gold" />
        <StatCard label="Rata-rata Skor" value="-" description="Belum ada nilai demo" icon={BarChart3} />
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <label className="flex min-h-12 items-center gap-2 rounded-xl border border-border bg-white px-4 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input aria-label="Cari kuis demo" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kuis atau modul..." className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70" />
        </label>
        <select aria-label="Pilih modul kuis" className="h-12 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm"><option>Semua Modul</option><option>Tawazun dalam Keseharian</option></select>
        <select aria-label="Filter status kuis" value={status} onChange={(event) => setStatus(event.target.value)} className="h-12 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm"><option value="all">Semua</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Diarsipkan</option></select>
      </div>
      {visible ? (
        <div className="mt-6 space-y-4">
          <SectionCard className="overflow-hidden p-0">
            <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-primary/15 bg-mint px-3 py-1 text-xs font-bold text-primary">Published</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Modul: Published</span></div>
                <h2 className="mt-3 text-xl font-extrabold text-ink">Kuis Pemahaman Tawazun</h2>
                <p className="mt-1 text-sm font-semibold text-primary">Tawazun dalam Keseharian</p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">Latihan pilihan ganda dengan lima soal, nilai maksimal 100, dan pembahasan setelah dikirim.</p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button asChild variant="outline" size="sm"><Link href="/demo/students/quizzes/tawazun"><Eye className="h-4 w-4" />Preview</Link></Button>
                <Button asChild size="sm"><Link href="/demo/teacher/modules"><PencilLine className="h-4 w-4" />Edit Kuis</Link></Button>
              </div>
            </div>
            <div className="grid gap-3 border-t border-border bg-slate-50/60 p-5 sm:grid-cols-2 xl:grid-cols-7">
              <Metric label="Pertanyaan" value="5" /><Metric label="Nilai Kelulusan" value="70" /><Metric label="Kesempatan" value="3" /><Metric label="Retake" value="Ya" /><Metric label="Attempt" value="0" /><Metric label="Rata-rata" value="-" /><Metric label="Nilai Terbaik" value="-" />
            </div>
            <div className="border-t border-border p-5">
              <button type="button" onClick={() => setShowAttempts((current) => !current)} className="text-sm font-bold text-primary hover:underline">{showAttempts ? 'Tutup hasil' : 'Lihat attempts/results'}</button>
              {showAttempts && <EmptyState className="mt-4 min-h-48" icon={FileQuestion} title="Belum ada attempt" description="Hasil siswa demo akan tampil setelah kuis dikerjakan." />}
            </div>
          </SectionCard>
        </div>
      ) : <EmptyState className="mt-8" icon={Search} title="Kuis tidak ditemukan" description="Coba ubah kata kunci atau filter status." />}
    </div>
  );
}

export function TeacherReports() {
  return <TeacherReportsView data={demoTeacherReportsData} isDemo />;
}

export function TeacherAssignments({
  items,
  onCreate,
  onReview,
}: {
  items: AssignmentItem[];
  onCreate: NonNullable<ComponentProps<typeof AssignmentBoard>['onCreate']>;
  onReview: NonNullable<ComponentProps<typeof AssignmentBoard>['onReview']>;
}) {
  return (
    <div>
      <PageHeader eyebrow="Tugas" title="Tugas Kelas" description="Bagikan tugas ke kelas, lalu periksa jawaban dan nilai siswa." />
      <AssignmentBoard
        mode="teacher"
        basePath="/demo/teacher/tasks"
        isDemo
        items={items}
        classes={teacherDemoClasses.map(({ id, name }) => ({ id, name }))}
        page={1}
        hasNextPage={false}
        hasPreviousPage={false}
        onCreate={onCreate}
        onReview={onReview}
      />
    </div>
  );
}

const demoTeacherReportsData = createDemoTeacherReportsData();

function createDemoTeacherReportsData(): TeacherReportsData {
  const classes = teacherDemoClasses.map((classItem) => ({
    id: classItem.id,
    name: classItem.name,
    gradeLevel: classItem.name.split(' ')[0],
    academicYear: '2026/2027',
    classCode: `DEMO-${classItem.id.toUpperCase()}`,
    description: 'Data contoh untuk pratinjau laporan.',
  }));
  const classScopes = teacherDemoClasses.map((classItem): TeacherReportScope => {
    const students = classItem.members.map((name, index) => ({
      id: `${classItem.id}-student-${index + 1}`,
      className: classItem.name,
      student: name,
      completedModules: Math.floor((index + classItem.progress / 25) % 3),
      averageQuizScore: Math.max(55, Math.min(100, classItem.averageScore + (index - 2) * 4)),
      reflectionCount: index % 3 === 0 ? 0 : 1,
      lastActiveAt: new Date(Date.now() - (index + 1) * 3_600_000).toISOString(),
      progress: Math.max(35, Math.min(100, classItem.progress + (index - 2) * 9)),
    }));
    const metrics = {
      completionRate: classItem.progress,
      averageQuizScore: classItem.averageScore,
      reflectionsCount: students.reduce((total, student) => total + student.reflectionCount, 0),
      activitiesCount: students.length * 3,
    };
    return {
      classId: classItem.id,
      className: classItem.name,
      metrics,
      completionTrend: [{ label: 'Minggu 1', completion: Math.max(0, classItem.progress - 19) }, { label: 'Minggu 2', completion: Math.max(0, classItem.progress - 12) }, { label: 'Minggu 3', completion: Math.max(0, classItem.progress - 6) }, { label: 'Minggu ini', completion: classItem.progress }],
      quizDistribution: [{ label: '0–59', count: 1 }, { label: '60–69', count: 2 }, { label: '70–84', count: 3 }, { label: '85–100', count: 4 }],
      reflectionRate: [{ label: 'Minggu 1', reflections: 1 }, { label: 'Minggu 2', reflections: 2 }, { label: 'Minggu 3', reflections: 3 }, { label: 'Minggu ini', reflections: metrics.reflectionsCount }],
      activityRanking: students.map(({ student }, index) => ({ name: student, activities: Math.max(1, 8 - index) })),
      topModules: initialTeacherDemoModules.map((module, index) => ({
        id: module.id,
        title: module.title,
        completionRate: Math.max(0, classItem.progress - index * 11),
        averageQuizScore: classItem.averageScore - index * 3,
        attemptsCount: students.length - index,
      })),
      students,
      exportRowCount: students.length,
      studentsNeedingAttention: students.filter((student) => student.progress < 70 || student.averageQuizScore < 70),
    };
  });
  const allStudents = classScopes.flatMap((scope) => scope.students);
  const allScope: TeacherReportScope = {
    classId: 'all',
    className: 'Semua Kelas',
    metrics: {
      completionRate: Math.round(classScopes.reduce((total, scope) => total + scope.metrics.completionRate, 0) / classScopes.length),
      averageQuizScore: Math.round(classScopes.reduce((total, scope) => total + scope.metrics.averageQuizScore, 0) / classScopes.length),
      reflectionsCount: classScopes.reduce((total, scope) => total + scope.metrics.reflectionsCount, 0),
      activitiesCount: classScopes.reduce((total, scope) => total + scope.metrics.activitiesCount, 0),
    },
    completionTrend: classScopes[0].completionTrend,
    quizDistribution: classScopes[0].quizDistribution,
    reflectionRate: classScopes[0].reflectionRate,
    activityRanking: classScopes.flatMap((scope) => scope.activityRanking).sort((a, b) => b.activities - a.activities).slice(0, 6),
    topModules: initialTeacherDemoModules.map((module, index) => ({
      id: module.id,
      title: module.title,
      completionRate: Math.max(0, 74 - index * 8),
      averageQuizScore: 83 - index * 4,
      attemptsCount: allStudents.length - index,
    })),
    students: allStudents,
    exportRowCount: allStudents.length,
    studentsNeedingAttention: allStudents.filter((student) => student.progress < 70 || student.averageQuizScore < 70),
  };
  return {
    classes,
    scopes: [allScope, ...classScopes],
    classCompletionData: classScopes.map((scope) => ({ className: scope.className, completion: scope.metrics.completionRate })),
    isDemo: true,
  };
}

export function TeacherAnnouncements({ announcements, onAdd }: { announcements: TeacherDemoAnnouncement[]; onAdd: (title: string, message: string) => void }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState('all');
  const [status, setStatus] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [thisWeekStart] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);
  const classes = teacherDemoClasses;
  const publishedCount = announcements.filter((item) => (item.status ?? 'published') === 'published').length;
  const draftCount = announcements.length - publishedCount;
  const thisWeekCount = announcements.filter((item) => item.createdAt && new Date(item.createdAt).getTime() >= thisWeekStart).length;
  const filtered = announcements.filter((item) => {
    const matchesQuery = `${item.title} ${item.message}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
    const matchesTarget = target === 'all' || (target === 'global' ? !item.classId : item.classId === target);
    const matchesStatus = status === 'all' || (item.status ?? 'published') === status;
    return matchesQuery && matchesTarget && matchesStatus;
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !message.trim()) return;
    onAdd(title.trim(), message.trim());
    setTitle('');
    setMessage('');
    setNotice('Pengumuman demo ditambahkan.');
    setIsCreateOpen(false);
  }
  return (
    <div>
      <PageHeader eyebrow="Komunikasi" title="Pengumuman" description="Buat dan kelola informasi penting untuk siswa." actions={<Button type="button" onClick={() => setIsCreateOpen((open) => !open)}><Plus className="h-4 w-4" />{isCreateOpen ? 'Tutup Form' : 'Buat Pengumuman'}</Button>} />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Pengumuman" value={announcements.length} icon={Megaphone} />
        <StatCard label="Published" value={publishedCount} icon={CheckCircle2} tone="mint" />
        <StatCard label="Draft" value={draftCount} icon={FileText} tone="gold" />
        <StatCard label="Minggu Ini" value={thisWeekCount} icon={CalendarClock} />
      </div>
      {isCreateOpen && <SectionCard className="mt-6"><h2 className="text-lg font-extrabold text-ink">Tulis pengumuman demo</h2><form onSubmit={submit} className="mt-4 space-y-3"><div><label htmlFor="demo-announcement-title" className="mb-1.5 block text-sm font-semibold text-ink">Judul</label><Input id="demo-announcement-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required placeholder="Contoh: Jadwal kuis pekan ini" /><p className="mt-1 text-right text-xs text-muted-foreground">{title.length}/100</p></div><div><label htmlFor="demo-announcement-message" className="mb-1.5 block text-sm font-semibold text-ink">Isi pengumuman</label><Textarea id="demo-announcement-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} required placeholder="Tulis informasi untuk kelas..." /><p className="mt-1 text-right text-xs text-muted-foreground">{message.length}/500</p></div><p className="rounded-xl bg-cream p-3 text-xs leading-5 text-foreground">Pengumuman baru disimpan di browser ini dan ditandai sebagai terbit untuk pratinjau.</p><Button type="submit"><Plus className="h-4 w-4" />Terbitkan demo</Button></form></SectionCard>}
      {notice && <p role="status" className="mt-3 text-sm font-semibold text-primary">{notice}</p>}
      <SectionCard className="mt-6 space-y-4">
        <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr_1fr] xl:items-center">
          <label className="flex min-h-12 items-center gap-2 rounded-xl border border-border bg-white px-4 shadow-sm"><Search className="h-4 w-4 text-muted-foreground" /><input aria-label="Cari pengumuman demo" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari pengumuman..." className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70" /></label>
          <select aria-label="Filter target" value={target} onChange={(event) => setTarget(event.target.value)} className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm"><option value="all">Semua Target</option><option value="global">Global</option>{classes.map((classItem) => <option key={classItem.id} value={classItem.id}>{classItem.name}</option>)}</select>
          <select aria-label="Filter status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm"><option value="all">Semua Status</option><option value="draft">Draft</option><option value="published">Published</option></select>
        </div>
        {filtered.length ? <div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-sm"><thead><tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><th className="py-3 pr-4">Judul</th><th className="px-4 py-3">Isi</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Tanggal</th></tr></thead><tbody>{filtered.map((item) => {const className = classes.find((classItem) => classItem.id === item.classId)?.name ?? 'Global'; const published = (item.status ?? 'published') === 'published'; return <tr key={item.id} className="border-b border-border/70 last:border-0"><td className="py-4 pr-4 align-top font-bold text-ink">{item.title}</td><td className="px-4 py-4 align-top text-muted-foreground">{item.message.length > 120 ? `${item.message.slice(0, 119)}…` : item.message}</td><td className="px-4 py-4 align-top font-semibold text-foreground">{className}</td><td className="px-4 py-4 align-top"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${published ? 'border-primary/15 bg-mint text-primary' : 'border-gold/20 bg-cream text-gold'}`}>{published ? 'Published' : 'Draft'}</span></td><td className="px-4 py-4 align-top text-muted-foreground">{item.publishedAt ? formatDateTime(item.publishedAt) : 'Belum diterbitkan'}</td></tr>;})}</tbody></table></div> : <EmptyState icon={Megaphone} title={announcements.length ? 'Pengumuman tidak ditemukan' : 'Belum ada pengumuman'} description={announcements.length ? 'Coba ubah kata kunci, target, atau status.' : 'Buat pengumuman demo untuk melihat tampilan daftar.'} />}
      </SectionCard>
    </div>
  );
}

export function TeacherStudents() {
  const roster = teacherDemoClasses.flatMap((classItem) => classItem.members.map((fullName, index) => ({
    id: `demo-${classItem.id}-${index}`,
    fullName,
    email: null,
    classId: classItem.id,
    className: classItem.name,
    progress: Math.min(100, (index * 13 + 58) % 100),
    completedModules: index % 4 === 0 ? 1 : 0,
    lastActiveAt: null,
  })));
  return <TeacherStudentRosterView students={roster} />;
}

export function TeacherReflections() {
  const rows = [
    { id: 'reflection-1', classId: 'vii-a', className: 'X MA A', moduleId: 'teacher-tawazun', moduleTitle: 'Tawazun dalam Keseharian', studentName: 'Alya R.', reflection: 'Saya ingin membuat jadwal belajar yang tetap memberi waktu untuk istirahat dan membantu di rumah.', action: 'Membuat jadwal belajar mingguan dan mengevaluasinya pada akhir pekan.', createdAt: '2026-10-28T08:00:00.000Z' },
    { id: 'reflection-2', classId: 'viii-a', className: 'X MA C', moduleId: 'teacher-wasathiyah', moduleTitle: 'Islam Wasathiyah: Pengantar', studentName: 'Kamal D.', reflection: 'Saat berbeda pendapat, saya akan mencoba mendengar sampai selesai sebelum menyampaikan tanggapan.', action: 'Memberi kesempatan teman menyelesaikan pendapat saat diskusi kelas.', createdAt: '2026-10-27T08:00:00.000Z' },
  ];
  const [query, setQuery] = useState('');
  const [classId, setClassId] = useState('all');
  const [moduleId, setModuleId] = useState('all');
  const [status, setStatus] = useState('all');
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = rows.filter((row) => {
    const matchesQuery = `${row.studentName} ${row.moduleTitle} ${row.reflection} ${row.action}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
    return matchesQuery && (classId === 'all' || row.classId === classId) && (moduleId === 'all' || row.moduleId === moduleId) && (status === 'all' || (status === 'reviewed') === reviewedIds.includes(row.id));
  });
  const pendingCount = rows.length - reviewedIds.length;
  const selected = rows.find((row) => row.id === selectedId);
  return (
    <div>
      <PageHeader eyebrow="Review Guru" title="Refleksi Siswa" description="Tinjau refleksi dan aksi nyata siswa setelah menyelesaikan modul." />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Refleksi" value={rows.length} icon={MessageSquareText} />
        <StatCard label="Belum Ditinjau" value={pendingCount} icon={CalendarClock} tone="gold" />
        <StatCard label="Sudah Ditinjau" value={reviewedIds.length} icon={UserCheck} tone="mint" />
        <StatCard label="Refleksi Minggu Ini" value={rows.length} icon={CheckCircle2} />
      </div>
      <SectionCard className="mt-8 space-y-4">
        <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <label className="flex min-h-12 items-center gap-2 rounded-xl border border-border bg-white px-4 shadow-sm"><Search className="h-4 w-4 text-muted-foreground" /><input aria-label="Cari refleksi" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari siswa, modul, atau isi refleksi..." className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70" /></label>
          <select aria-label="Filter kelas refleksi" value={classId} onChange={(event) => setClassId(event.target.value)} className="h-12 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground"><option value="all">Semua Kelas</option>{teacherDemoClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <select aria-label="Filter modul refleksi" value={moduleId} onChange={(event) => setModuleId(event.target.value)} className="h-12 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground"><option value="all">Semua Modul</option>{initialTeacherDemoModules.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
          <select aria-label="Filter status refleksi" value={status} onChange={(event) => setStatus(event.target.value)} className="h-12 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground"><option value="all">Semua Status</option><option value="pending">Belum Ditinjau</option><option value="reviewed">Sudah Ditinjau</option></select>
        </div>
        {filtered.length ? <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm"><thead><tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><th className="py-3 pr-4">Siswa</th><th className="px-4 py-3">Modul</th><th className="px-4 py-3">Refleksi</th><th className="px-4 py-3">Aksi Nyata</th><th className="px-4 py-3">Status</th><th className="py-3 pl-4 text-right">Aksi</th></tr></thead><tbody>{filtered.map((row) => {const reviewed = reviewedIds.includes(row.id); return <tr key={row.id} className="border-b border-border/70 last:border-0"><td className="py-4 pr-4 align-top"><p className="font-bold text-ink">{row.studentName}</p><p className="mt-1 text-xs text-muted-foreground">{row.className} · Contoh</p><p className="mt-1 text-xs text-muted-foreground">{formatDateTime(row.createdAt)}</p></td><td className="px-4 py-4 align-top font-semibold text-foreground">{row.moduleTitle}</td><td className="px-4 py-4 align-top text-muted-foreground">{row.reflection}</td><td className="px-4 py-4 align-top text-muted-foreground">{row.action}</td><td className="px-4 py-4 align-top"><StatusBadge status={reviewed ? 'completed' : 'in_progress'} label={reviewed ? 'Sudah Ditinjau' : 'Belum Ditinjau'} /></td><td className="py-4 pl-4 text-right align-top"><Button type="button" size="sm" variant="outline" onClick={() => setSelectedId((current) => current === row.id ? null : row.id)}>{selectedId === row.id ? 'Tutup' : 'Tinjau'}</Button></td></tr>;})}</tbody></table></div> : <EmptyState icon={MessageSquareText} title="Refleksi tidak ditemukan" description="Coba ubah filter kelas, modul, status, atau kata kunci pencarian." />}
      </SectionCard>
      {selected && <SectionCard className="mt-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-xs font-bold text-primary">{selected.className} · {selected.studentName}</p><h2 className="mt-1 text-lg font-extrabold text-ink">{selected.moduleTitle}</h2><p className="mt-4 text-sm leading-7 text-foreground">{selected.reflection}</p><p className="mt-3 rounded-xl bg-mint/40 p-4 text-sm leading-6 text-foreground"><strong>Aksi nyata:</strong> {selected.action}</p></div><Button type="button" variant={reviewedIds.includes(selected.id) ? 'secondary' : 'default'} onClick={() => setReviewedIds((ids) => ids.includes(selected.id) ? ids.filter((id) => id !== selected.id) : [...ids, selected.id])}>{reviewedIds.includes(selected.id) ? 'Batalkan tinjauan' : 'Tandai ditinjau'}</Button></div></SectionCard>}
    </div>
  );
}

export function TeacherMedia() {
  const assets = [
    { title: 'Infografik Tawazun', kind: 'image', label: 'Gambar', icon: ImageIcon },
    { title: 'Panduan Adab Digital', kind: 'document', label: 'Dokumen', icon: FileText },
    { title: 'Slide Islam Wasathiyah', kind: 'document', label: 'Dokumen', icon: BookOpen },
  ];
  const [query, setQuery] = useState('');
  const [fileType, setFileType] = useState('all');
  const [showUploadNotice, setShowUploadNotice] = useState(false);
  const filtered = assets.filter((asset) => `${asset.title} ${asset.label}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) && (fileType === 'all' || asset.kind === fileType));
  return (
    <div>
      <PageHeader eyebrow="Materi Pendukung" title="Materi & Media" description="Unggah dan kelola file pendukung pembelajaran." actions={<Button type="button" variant="outline" onClick={() => setShowUploadNotice((visible) => !visible)}>{showUploadNotice ? 'Tutup Info' : 'Unggah Media'}</Button>} />
      {showUploadNotice && <SectionCard className="mt-6"><p className="font-bold text-ink">Penyimpanan media demo</p><p className="mt-2 text-sm leading-6 text-muted-foreground">File pada demo hanya pratinjau dan tidak diunggah ke akun atau penyimpanan sekolah.</p></SectionCard>}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total File" value={assets.length} icon={FileText} />
        <StatCard label="Gambar" value={assets.filter((asset) => asset.kind === 'image').length} icon={ImageIcon} tone="mint" />
        <StatCard label="Video" value="0" icon={Eye} />
        <StatCard label="Dokumen" value={assets.filter((asset) => asset.kind === 'document').length} icon={FileText} tone="gold" />
      </div>
      <SectionCard className="mt-6 space-y-4">
        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
          <label className="flex min-h-12 min-w-0 items-center gap-2 rounded-xl border border-border bg-white px-4 shadow-sm"><Search className="h-4 w-4 text-muted-foreground" /><input aria-label="Cari media demo" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari media atau modul..." className="min-w-0 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70" /></label>
          <select aria-label="Filter tipe media" value={fileType} onChange={(event) => setFileType(event.target.value)} className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground"><option value="all">Semua Tipe</option><option value="image">Gambar</option><option value="video">Video</option><option value="document">Dokumen</option></select>
        </div>
        {filtered.length ? <div className="grid min-w-0 w-full gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((asset) => {const Icon = asset.icon; return <article key={asset.title} className="min-w-0 max-w-full rounded-2xl border border-border bg-white p-4 shadow-sm"><div className="flex min-w-0 items-start gap-3"><div className="grid aspect-[4/3] w-24 shrink-0 place-content-center rounded-xl border border-primary/10 bg-mint/60 text-primary sm:w-28"><Icon className="h-6 w-6" /><span className="mt-1 text-[10px] font-bold uppercase tracking-wide">{asset.label}</span></div><div className="min-w-0 flex-1"><p className="truncate font-extrabold text-ink">{asset.title}</p><p className="mt-1 text-xs font-semibold uppercase text-primary">{asset.kind}</p><p className="mt-1 truncate text-xs text-muted-foreground">Modul Tawazun · Data contoh</p></div></div><div className="mt-4 grid min-w-0 grid-cols-2 gap-2 text-xs text-muted-foreground"><span>Data demo</span><span className="text-right">3 menit lalu</span></div><div className="mt-4 flex min-w-0 flex-wrap gap-2"><DemoActionButton label="Pilih media" completedLabel="Dipilih untuk demo" /></div></article>;})}</div> : <EmptyState icon={ImageIcon} title="Media tidak ditemukan" description="Coba ubah kata kunci atau tipe file." />}
      </SectionCard>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon?: LucideIcon; label: string; value: string | number }) { return <div className="rounded-2xl bg-background p-4">{Icon && <Icon className="mb-2 h-4 w-4 text-primary" />}<p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 text-xl font-extrabold text-ink">{value}</p></div>; }
function DemoActionButton({ label, completedLabel }: { label: string; completedLabel: string }) { const [completed, setCompleted] = useState(false); return <Button type="button" variant={completed ? 'secondary' : 'outline'} className="mt-4" onClick={() => setCompleted(true)}>{completed ? completedLabel : label}</Button>; }
