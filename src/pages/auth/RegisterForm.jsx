import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Lock, Mail, User } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { Button } from '../../components/ui/Button';
import { getAuthRedirectUrl, isSupabaseConfigured, supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export function RegisterForm({ role, title, fieldLabel, fieldPlaceholder, button }) {
  const [form, setForm] = useState({ name: '', email: '', extra: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, profile } = useAuth();

  useEffect(() => {
    if (isAuthenticated && profile?.role) {
      navigate(profile.role === 'teacher' ? '/guru' : '/siswa', { replace: true });
    }
  }, [isAuthenticated, profile?.role, navigate]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleRegister(event) {
    event.preventDefault();
    setError('');

    if (!isSupabaseConfigured) {
      setError('Supabase belum dikonfigurasi. Isi environment variable sebelum publik.');
      return;
    }

    if (!form.name.trim()) {
      setError('Nama lengkap wajib diisi.');
      return;
    }

    if (!form.email.trim()) {
      setError('Email wajib diisi.');
      return;
    }

    if (!form.extra.trim()) {
      setError(`${fieldLabel} wajib diisi.`);
      return;
    }

    if (form.password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    if (form.password !== form.confirm) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    setSubmitting(true);
    const normalizedEmail = form.email.trim();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: form.password,
      options: {
        emailRedirectTo: getAuthRedirectUrl('/login'),
        data: {
          name: form.name.trim(),
          role,
          class_name: role === 'student' ? form.extra.trim() : null,
          subject: role === 'teacher' ? form.extra.trim() : null,
        },
      },
    });

    if (signUpError) {
      setSubmitting(false);
      setError(signUpError.message || 'Pendaftaran gagal.');
      return;
    }

    if (data.session && data.user) {
      const { error: profileError } = await supabase.from('users').upsert({
        id: data.user.id,
        name: form.name.trim(),
        email: normalizedEmail,
        role,
        class_name: role === 'student' ? form.extra.trim() : null,
      });

      if (profileError) {
        setSubmitting(false);
        setError(profileError.message || 'Profil gagal dibuat.');
        return;
      }
    }

    if (!data.session) {
      setSubmitting(false);
      setError('Akun dibuat. Silakan cek email untuk konfirmasi, lalu login.');
      return;
    }

    navigate(role === 'teacher' ? '/guru' : '/siswa', { replace: true });
  }

  return (
    <AuthShell
      backTo="/register"
      illustration={role === 'teacher' ? '/assets/wasatify-auth-teacher.png' : '/assets/wasatify-auth-student.png'}
      panelTitle={role === 'teacher' ? 'Kelola kelas Wasathiyah modern' : 'Mulai perjalanan belajar Wasathiyah'}
      panelText={
        role === 'teacher'
          ? 'Buat modul, pantau progress siswa, dan kelola refleksi pembelajaran dalam satu dashboard yang rapi.'
          : 'Akses materi mikro, quiz interaktif, XP, badge, dan refleksi harian dari dashboard yang nyaman.'
      }
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <h1 className="font-display text-3xl font-extrabold">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Isi data diri untuk membuat akun baru.</p>
        <form onSubmit={handleRegister} className="mt-8 space-y-4">
          <Field icon={User} label="Nama Lengkap" value={form.name} onChange={(value) => update('name', value)} placeholder="Masukkan nama lengkap" required />
          <Field icon={Mail} label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} placeholder="Masukkan email aktif" required />
          <Field label={fieldLabel} value={form.extra} onChange={(value) => update('extra', value)} placeholder={fieldPlaceholder} required />
          <Field
            icon={Lock}
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(value) => update('password', value)}
            placeholder="Buat password"
            required
            trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((current) => !current)} />}
          />
          <Field
            icon={Lock}
            label="Konfirmasi Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={form.confirm}
            onChange={(value) => update('confirm', value)}
            placeholder="Ulangi password"
            required
            trailing={<PasswordToggle visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((current) => !current)} />}
          />
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
          <Button className="w-full" type="submit" disabled={submitting}>{submitting ? 'Mendaftarkan...' : button}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Sudah punya akun? <Link className="font-bold text-emerald-700" to="/login">Masuk di sini</Link>
        </p>
      </div>
    </AuthShell>
  );
}

function Field({ label, icon: Icon, trailing, value, onChange, placeholder, type = 'text', required = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
        {Icon && <Icon className="h-5 w-5 text-slate-400" />}
        <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full outline-none" placeholder={placeholder} type={type} required={required} />
        {trailing}
      </div>
    </label>
  );
}

function PasswordToggle({ visible, onToggle }) {
  return (
    <button type="button" onClick={onToggle} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-700" aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}>
      <Eye className="h-4 w-4" />
    </button>
  );
}
