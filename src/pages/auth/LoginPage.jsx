import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Lock, Mail, UserRound, GraduationCap, X } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { Button } from '../../components/ui/Button';
import { getAuthRedirectUrl, isSupabaseConfigured, supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { forgetRememberedAccount, getRememberedAccounts, rememberAccount } from '../../utils/rememberedAccounts';

export function LoginPage() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberedAccounts, setRememberedAccounts] = useState(() => getRememberedAccounts());
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

    try {
      setSubmitting(true);
      const { data, error: loginError } = await withLoginTimeout(
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
      );

      if (loginError) {
        setError(getLoginErrorMessage(loginError));
        return;
      }

      let userProfile = null;
      try {
        userProfile = await refreshProfile();
      } catch (profileError) {
        console.error(profileError);
      }

      if (!userProfile && data.user) {
        const { data: foundProfile, error: profileFetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileFetchError) {
          throw profileFetchError;
        }

        userProfile = foundProfile;
      }

      if (userProfile?.role && userProfile.role !== role) {
        setError(`Akun ini terdaftar sebagai ${userProfile.role === 'teacher' ? 'guru' : 'siswa'}. Pilih tab login yang sesuai.`);
        await supabase.auth.signOut();
        return;
      }

      setRememberedAccounts(rememberAccount({
        email: data.user?.email || email.trim(),
        name: userProfile?.name,
        role: userProfile?.role || role,
        className: userProfile?.class_name,
      }));
      navigate(userProfile?.role === 'teacher' || role === 'teacher' ? '/guru' : '/siswa', { replace: true });
    } catch (loginException) {
      console.error(loginException);
      setError(getLoginErrorMessage(loginException));
    } finally {
      setSubmitting(false);
    }
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

  function chooseRememberedAccount(account) {
    setRole(account.role || 'student');
    setEmail(account.email);
    setPassword('');
    setError('');
  }

  function removeRememberedAccount(event, account) {
    event.stopPropagation();
    setRememberedAccounts(forgetRememberedAccount(account.email));
    if (email === account.email) {
      setEmail('');
      setPassword('');
    }
  }

  return (
    <AuthShell
      illustration={false}
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
        {rememberedAccounts.length > 0 && (
          <div className="mb-6 rounded-2xl border border-emerald-900/10 bg-emerald-50/60 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-emerald-900">Akun tersimpan</p>
              <span className="text-xs font-semibold text-emerald-700">Klik untuk pilih akun</span>
            </div>
            <div className="space-y-2">
              {rememberedAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => chooseRememberedAccount(account)}
                  className="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm transition hover:border-emerald-200 hover:bg-white/90"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-800">
                    {(account.name || account.email).slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{account.name || account.email}</span>
                    <span className="block truncate text-xs text-slate-500">{account.email} · {account.role === 'teacher' ? 'Guru' : 'Siswa'}</span>
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => removeRememberedAccount(event, account)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') removeRememberedAccount(event, account);
                    }}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    aria-label={`Hapus akun ${account.email}`}
                  >
                    <X className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
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

function withLoginTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Login timeout')), 20000);
    }),
  ]);
}

function getLoginErrorMessage(error) {
  const message = error?.message || '';

  if (message.toLowerCase().includes('failed to fetch') || message === 'Login timeout') {
    return 'Tidak bisa terhubung ke Supabase. Cek koneksi internet, URL Supabase, atau restart server lokal.';
  }

  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Email atau password tidak valid.';
  }

  if (message.toLowerCase().includes('email not confirmed')) {
    return 'Email belum dikonfirmasi. Cek inbox Gmail atau matikan Confirm email saat testing lokal.';
  }

  return message || 'Login gagal diproses. Coba lagi beberapa saat.';
}
