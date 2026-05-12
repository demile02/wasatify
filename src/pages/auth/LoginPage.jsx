import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Lock, Mail, UserRound, GraduationCap } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { Button } from '../../components/ui/Button';
import { getAuthRedirectUrl, isSupabaseConfigured, supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export function LoginPage() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, profile, refreshProfile } = useAuth();

  useEffect(() => {
    if (isAuthenticated && profile?.role) {
      navigate(profile.role === 'teacher' ? '/guru' : '/siswa', { replace: true });
    }
  }, [isAuthenticated, profile?.role, navigate]);

  async function handleLogin(event) {
    event.preventDefault();
    setError('');

    if (!isSupabaseConfigured) {
      setError('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY dulu.');
      return;
    }

    setSubmitting(true);
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) {
      setSubmitting(false);
      setError(loginError.message || 'Email atau password tidak valid.');
      return;
    }

    let profile = null;
    try {
      profile = await refreshProfile();
    } catch (profileError) {
      console.error(profileError);
    }

    if (!profile && data.user) {
      const { data: foundProfile } = await supabase.from('users').select('*').eq('id', data.user.id).maybeSingle();
      profile = foundProfile;
    }

    if (profile?.role && profile.role !== role) {
      setSubmitting(false);
      setError(`Akun ini terdaftar sebagai ${profile.role === 'teacher' ? 'guru' : 'siswa'}. Pilih tab login yang sesuai.`);
      await supabase.auth.signOut();
      return;
    }

    navigate(profile?.role === 'teacher' || role === 'teacher' ? '/guru' : '/siswa', { replace: true });
  }

  async function handleGoogleLogin() {
    if (!isSupabaseConfigured) {
      setError('Supabase belum dikonfigurasi. Google login belum bisa dipakai.');
      return;
    }

    window.localStorage.setItem('wasatify.pendingRole', role);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl(role === 'teacher' ? '/guru' : '/siswa'),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  }

  return (
    <AuthShell
      illustration="/assets/wasatify-auth-student.png"
      panelTitle="Belajar singkat, konsisten, dan bermakna"
      panelText="Masuk untuk melanjutkan modul, menjaga streak, menyelesaikan quiz, dan menulis refleksi nilai Wasathiyah."
    >
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
              <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full outline-none" placeholder="Masukkan email" type="email" required />
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Password</span>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <Lock className="h-5 w-5 text-slate-400" />
              <input value={password} onChange={(event) => setPassword(event.target.value)} className="w-full outline-none" placeholder="Masukkan password" type={showPassword ? 'text' : 'password'} required />
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-700" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
                <Eye className="h-5 w-5" />
              </button>
            </div>
          </label>
          <div className="text-right text-sm font-bold text-emerald-700">Lupa Password?</div>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
          <Button className="w-full" type="submit" disabled={submitting}>{submitting ? 'Memproses...' : 'Masuk'}</Button>
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
