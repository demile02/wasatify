import { Link, NavLink } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  ChartNoAxesCombined,
  CheckSquare,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  Settings,
  Trophy,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '../components/ui/Logo';
import { cn } from '../utils/cn';

const iconMap = {
  home: Home,
  module: BookOpen,
  quiz: CheckSquare,
  reflection: MessageSquareText,
  progress: ChartNoAxesCombined,
  trophy: Trophy,
  settings: Settings,
  users: Users,
  report: FileText,
  announce: ClipboardList,
};

export const studentNav = [
  { label: 'Beranda', to: '/siswa', icon: 'home' },
  { label: 'Modul Belajar', to: '/siswa/modul', icon: 'module' },
  { label: 'Quiz', to: '/siswa/quiz', icon: 'quiz' },
  { label: 'Refleksi', to: '/siswa/refleksi', icon: 'reflection' },
  { label: 'Progress', to: '/siswa', icon: 'progress' },
  { label: 'Pencapaian', to: '/siswa', icon: 'trophy' },
  { label: 'Pengaturan', to: '/siswa', icon: 'settings' },
];

export const teacherNav = [
  { label: 'Dashboard', to: '/guru', icon: 'home' },
  { label: 'Modul Pembelajaran', to: '/guru/modul', icon: 'module' },
  { label: 'Kelas & Peserta', to: '/guru', icon: 'users' },
  { label: 'Kuis & Evaluasi', to: '/guru', icon: 'quiz' },
  { label: 'Refleksi Siswa', to: '/guru', icon: 'reflection' },
  { label: 'Pengumuman', to: '/guru', icon: 'announce' },
  { label: 'Laporan & Analitik', to: '/guru', icon: 'report' },
  { label: 'Pengaturan', to: '/guru', icon: 'settings' },
];

export function DashboardLayout({ role = 'student', title, subtitle, children }) {
  const isTeacher = role === 'teacher';
  const navItems = isTeacher ? teacherNav : studentNav;

  return (
    <div className="min-h-screen bg-[#fbfaf6]">
      <div className="flex">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-gradient-to-b from-emerald-950 to-emerald-800 p-5 text-white shadow-soft lg:flex">
          <Link to="/" className="mb-8 block">
            <Logo light subtitle={isTeacher ? 'Guru Dashboard' : 'Siswa MA'} />
          </Link>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-emerald-50/85 transition',
                      isActive ? 'bg-emerald-500/95 text-white shadow-card' : 'hover:bg-white/10',
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="mt-auto rounded-2xl bg-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-cream text-emerald-900">
                {isTeacher ? 'AF' : 'AA'}
              </div>
              <div>
                <p className="text-sm font-bold">{isTeacher ? 'Ust. Ahmad Fauzan' : 'Ali Akbar'}</p>
                <p className="text-xs text-emerald-50/70">{isTeacher ? 'Guru PAI' : 'Siswa MA'}</p>
              </div>
            </div>
            <button className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-50/80">
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </div>
        </aside>

        <main className="w-full lg:pl-64">
          <header className="sticky top-0 z-20 border-b border-emerald-900/10 bg-white/78 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <button className="rounded-xl p-2 text-emerald-900 lg:hidden">
                <Menu className="h-6 w-6" />
              </button>
              <div className="hidden lg:block">
                <p className="text-sm font-semibold text-emerald-700">Assalamu'alaikum, {isTeacher ? 'Ust. Ahmad Fauzan' : 'Ali Akbar'} 👋</p>
                <h1 className="font-display text-2xl font-extrabold text-ink">{title}</h1>
                <p className="text-sm text-slate-500">{subtitle}</p>
              </div>
              <div className="ml-auto hidden w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 md:flex">
                <Search className="h-4 w-4 text-slate-400" />
                <input className="w-full outline-none placeholder:text-slate-400" placeholder="Cari sesuatu..." />
              </div>
              <button className="relative rounded-xl border border-slate-200 bg-white p-3">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />
              </button>
            </div>
          </header>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
          >
            <div className="mb-5 lg:hidden">
              <p className="text-sm font-semibold text-emerald-700">Assalamu'alaikum 👋</p>
              <h1 className="font-display text-2xl font-extrabold text-ink">{title}</h1>
              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
            {children}
          </motion.div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-emerald-900/10 bg-white px-2 py-2 shadow-soft lg:hidden">
        {navItems.slice(0, 5).map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                cn('flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold', isActive ? 'text-emerald-700' : 'text-slate-500')
              }
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
