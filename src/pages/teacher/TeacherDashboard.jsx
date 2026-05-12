import { Plus, Settings, Upload, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { activities, classProgress, teacherStats } from '../../services/demoData';
import { useModules } from '../../hooks/useModules';

export function TeacherDashboard() {
  const { modules } = useModules();
  const stats = teacherStats.map((stat) => (stat.label === 'Total Modul' ? { ...stat, value: String(modules.length), hint: 'Modul aktif' } : stat));

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
                      <p className="mt-2 font-display text-3xl font-extrabold">{stat.value}</p>
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
              <div className="space-y-4">
                {classProgress.map(([name, value, count]) => (
                  <div key={name}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-bold">{name}</span>
                      <span className="text-slate-500">{value}% · {count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-600" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h2 className="font-display text-xl font-bold">Aktivitas Terbaru</h2>
              <div className="mt-5 space-y-4">
                {activities.map((activity, index) => (
                  <div key={activity} className="flex gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">{index + 1}</div>
                    <div>
                      <p className="text-sm font-semibold">{activity}</p>
                      <p className="text-xs text-slate-400">{index === 0 ? '10 menit lalu' : `${index} jam lalu`}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <Card>
            <h2 className="font-display text-xl font-bold">Penyelesaian Modul</h2>
            <div className="mt-6 flex h-56 items-end gap-3 border-b border-l border-slate-200 px-3">
              {[30, 45, 68, 58, 62, 82, 72, 88].map((value, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-xl bg-gradient-to-t from-emerald-700 to-emerald-300" style={{ height: `${value}%` }} />
                  <span className="text-xs text-slate-400">{['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min', 'Now'][index]}</span>
                </div>
              ))}
            </div>
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
            <div className="mt-4 space-y-3">
              {['Diskusi Online: Islam Wasathiyah', 'Tugas Refleksi Mingguan'].map((item) => (
                <div key={item} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-bold">{item}</p>
                  <p className="mt-2 text-sm text-slate-500">Untuk semua kelas · 20 Mei 2024</p>
                </div>
              ))}
            </div>
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
