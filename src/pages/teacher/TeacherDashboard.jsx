import { useEffect, useMemo, useState } from 'react';
import { BarChart3, BookOpen, ClipboardCheck, Plus, Settings, Upload, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { useModules } from '../../hooks/useModules';

const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export function TeacherDashboard() {
  const { modules } = useModules();
  const [students, setStudents] = useState([]);
  const [quizzesCount, setQuizzesCount] = useState(0);
  const [progressRows, setProgressRows] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [studentsResult, quizzesResult, progressResult, announcementsResult] = await Promise.all([
          supabase.from('users').select('id, name, class_name, created_at').eq('role', 'student'),
          supabase.from('quizzes').select('id', { count: 'exact', head: true }),
          supabase
            .from('user_progress')
            .select('id, user_id, module_id, completed, quiz_score, completed_at, users(name, class_name), modules(title)')
            .order('completed_at', { ascending: false, nullsFirst: false }),
          supabase.from('announcements').select('id, title, content, created_at').order('created_at', { ascending: false }).limit(2),
        ]);

        if (ignore) return;

        setStudents(studentsResult.error ? [] : studentsResult.data || []);
        setQuizzesCount(quizzesResult.error ? 0 : quizzesResult.count || 0);
        setProgressRows(progressResult.error ? [] : progressResult.data || []);
        setAnnouncements(announcementsResult.error ? [] : announcementsResult.data || []);
      } catch (error) {
        console.error('Failed to load teacher dashboard data', error);
        if (!ignore) {
          setStudents([]);
          setQuizzesCount(0);
          setProgressRows([]);
          setAnnouncements([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      ignore = true;
    };
  }, []);

  const completedRows = progressRows.filter((row) => row.completed);
  const averageCompletion = useMemo(() => {
    if (!students.length || !modules.length) return 0;
    const totalPossible = students.length * modules.length;
    return Math.round((completedRows.length / totalPossible) * 100);
  }, [completedRows.length, modules.length, students.length]);

  const classProgress = useMemo(() => {
    if (!students.length || !modules.length) return [];

    return Object.values(
      students.reduce((groups, student) => {
        const className = student.class_name || 'Tanpa Kelas';
        groups[className] ||= { name: className, total: 0, completed: 0 };
        groups[className].total += 1;
        groups[className].completed += completedRows.filter((row) => row.user_id === student.id).length;
        return groups;
      }, {}),
    ).map((item) => ({
      ...item,
      percent: Math.round((item.completed / (item.total * modules.length)) * 100),
    }));
  }, [completedRows, modules.length, students]);

  const chartValues = useMemo(() => {
    const start = startOfToday();
    start.setDate(start.getDate() - 6);

    return dayLabels.map((label, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const count = completedRows.filter((row) => isSameDay(row.completed_at, day)).length;
      return { label, value: count };
    });
  }, [completedRows]);

  const maxChartValue = Math.max(...chartValues.map((item) => item.value), 0);
  const recentActivities = completedRows.slice(0, 4).map((row) => ({
    id: row.id,
    text: `${row.users?.name || 'Siswa'} menyelesaikan ${row.modules?.title || 'modul'}`,
    time: formatRelativeTime(row.completed_at),
  }));

  const stats = [
    { label: 'Total Modul', value: modules.length, hint: 'Modul aktif', icon: BookOpen },
    { label: 'Total Siswa', value: students.length, hint: students.length ? 'Terdaftar' : 'Belum ada siswa', icon: Users },
    { label: 'Tingkat Penyelesaian', value: `${averageCompletion}%`, hint: 'Berdasarkan progress nyata', icon: BarChart3 },
    { label: 'Kuis Dibuat', value: quizzesCount, hint: 'Total kuis', icon: ClipboardCheck },
  ];

  return (
    <DashboardLayout role="teacher" title="Dashboard Guru" subtitle="Kelola pembelajaran Islam Wasathiyah dengan lebih efektif.">
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-500">{stat.label}</p>
                      <p className="mt-2 font-display text-3xl font-extrabold">{loading ? '-' : stat.value}</p>
                      <p className="mt-1 text-xs text-emerald-700">{stat.hint}</p>
                    </div>
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">Progress Kelas</h2>
                <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">
                  <option>Semua Kelas</option>
                </select>
              </div>
              {classProgress.length ? (
                <div className="space-y-4">
                  {classProgress.map((item) => (
                    <div key={item.name}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-bold">{item.name}</span>
                        <span className="text-slate-500">{item.percent}% · {item.total} siswa</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="Belum ada siswa atau progress kelas." />
              )}
            </Card>
            <Card>
              <h2 className="font-display text-xl font-bold">Aktivitas Terbaru</h2>
              {recentActivities.length ? (
                <div className="mt-5 space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">{index + 1}</div>
                      <div>
                        <p className="text-sm font-semibold">{activity.text}</p>
                        <p className="text-xs text-slate-400">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="Aktivitas siswa akan muncul setelah mereka menyelesaikan modul atau kuis." />
              )}
            </Card>
          </div>
          <Card>
            <h2 className="font-display text-xl font-bold">Penyelesaian Modul</h2>
            {maxChartValue ? (
              <div className="mt-6 flex h-56 items-end gap-3 border-b border-l border-slate-200 px-3">
                {chartValues.map((item) => (
                  <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-xl bg-gradient-to-t from-emerald-700 to-emerald-300"
                      style={{ height: `${Math.max((item.value / maxChartValue) * 100, 8)}%` }}
                    />
                    <span className="text-xs text-slate-400">{item.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 grid h-56 place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm font-semibold text-slate-500">
                Grafik akan terisi otomatis setelah siswa menyelesaikan modul.
              </div>
            )}
          </Card>
        </div>
        <aside className="space-y-6 pb-20 lg:pb-0">
          <Card className="overflow-hidden p-0">
            <div className="relative h-56 bg-emerald-50">
              <img src="/assets/wasatify-auth-teacher.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className="p-5">
              <p className="font-display text-xl font-bold">Ruang guru modern</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Pantau kelas, evaluasi, refleksi, dan pengumuman dari satu dashboard.</p>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Pengumuman Terbaru</h2>
              <Button className="px-3 py-2 text-xs">Buat Baru</Button>
            </div>
            {announcements.length ? (
              <div className="mt-4 space-y-3">
                {announcements.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="font-bold">{item.title}</p>
                    <p className="mt-2 text-sm text-slate-500">{formatDate(item.created_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="Belum ada pengumuman." />
            )}
          </Card>
          <Card>
            <h2 className="font-display text-xl font-bold">Aksi Cepat</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link to="/guru/modul"><Button className="w-full px-3 py-3 text-xs"><Plus className="h-4 w-4" /> Modul</Button></Link>
              <Button variant="secondary" className="px-3 py-3 text-xs"><Upload className="h-4 w-4" /> Upload</Button>
              <Button variant="secondary" className="px-3 py-3 text-xs"><Users className="h-4 w-4" /> Kelas</Button>
              <Button variant="secondary" className="px-3 py-3 text-xs"><Settings className="h-4 w-4" /> Atur</Button>
            </div>
          </Card>
        </aside>
      </div>
    </DashboardLayout>
  );
}

function EmptyState({ text }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
      {text}
    </div>
  );
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function isSameDay(value, target) {
  if (!value) return false;
  const date = new Date(value);
  return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth() && date.getDate() === target.getDate();
}

function formatRelativeTime(value) {
  if (!value) return 'Baru saja';
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.round(hours / 24)} hari lalu`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}
