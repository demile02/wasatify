import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Lock, Mail, UserRound, GraduationCap } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { Button } from '../../components/ui/Button';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

export function LoginPage() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  async function handleLogin(event) {
    event.preventDefault();
    if (supabase) {
      await supabase.auth.signInWithPassword({ email, password });
    }
    navigate(role === 'teacher' ? '/guru' : '/siswa');
  }

  async function handleGoogleLogin() {
    if (!isSupabaseConfigured) {
      navigate(role === 'teacher' ? '/guru' : '/siswa');
      return;
    }

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${role === 'teacher' ? '/guru' : '/siswa'}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  }

  return (
    <AuthShell>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-extrabold">Selamat Datang Kembali!</h1>
          <p className="mt-2 text-sm text-slate-500">Masuk untuk melanjutkan perjalanan belajarmu.</p>
        </div>
        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
          <button
            onClick={() => setRole('student')}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${role === 'student' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
          >
            <GraduationCap className="h-4 w-4" /> Login Siswa
          </button>
          <button
            onClick={() => setRole('teacher')}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${role === 'teacher' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
          >
            <UserRound className="h-4 w-4" /> Login Guru
          </button>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Email</span>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <Mail className="h-5 w-5 text-slate-400" />
              <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full outline-none" placeholder="Masukkan email" type="email" />
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Password</span>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <Lock className="h-5 w-5 text-slate-400" />
              <input value={password} onChange={(event) => setPassword(event.target.value)} className="w-full outline-none" placeholder="Masukkan password" type="password" />
              <Eye className="h-5 w-5 text-slate-400" />
            </div>
          </label>
          <div className="text-right text-sm font-bold text-emerald-700">Lupa Password?</div>
          <Button className="w-full" type="submit">Masuk</Button>
        </form>
        <div className="my-6 flex items-center gap-4 text-sm text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> atau masuk dengan <span className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"
          >
            <span className="text-lg text-red-500">G</span> Masuk dengan Google
          </button>
          <button type="button" className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold">
            <span className="grid grid-cols-2 gap-0.5">
              <span className="h-2 w-2 bg-red-500" />
              <span className="h-2 w-2 bg-emerald-500" />
              <span className="h-2 w-2 bg-blue-500" />
              <span className="h-2 w-2 bg-yellow-400" />
            </span>
            Masuk dengan Microsoft
          </button>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Belum punya akun? <Link className="font-bold text-emerald-700" to="/register">Daftar sekarang</Link>
        </p>
      </div>
    </AuthShell>
  );
}
