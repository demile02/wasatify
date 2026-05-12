import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Lock, Mail, User } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export function RegisterForm({ role, title, fieldLabel, fieldPlaceholder, button }) {
  const [form, setForm] = useState({ name: '', email: '', extra: '', password: '', confirm: '' });
  const navigate = useNavigate();

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleRegister(event) {
    event.preventDefault();
    if (supabase) {
      const { data } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.name, role, class_name: role === 'student' ? form.extra : null, subject: role === 'teacher' ? form.extra : null } },
      });
      if (data.user) {
        await supabase.from('users').upsert({
          id: data.user.id,
          name: form.name,
          email: form.email,
          role,
          class_name: role === 'student' ? form.extra : null,
        });
      }
    }
    navigate(role === 'teacher' ? '/guru' : '/siswa');
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
          <Field icon={User} label="Nama Lengkap" value={form.name} onChange={(value) => update('name', value)} placeholder="Masukkan nama lengkap" />
          <Field icon={Mail} label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} placeholder="Masukkan email aktif" />
          <Field label={fieldLabel} value={form.extra} onChange={(value) => update('extra', value)} placeholder={fieldPlaceholder} />
          <Field icon={Lock} label="Password" type="password" value={form.password} onChange={(value) => update('password', value)} placeholder="Buat password" trailing={<Eye className="h-4 w-4 text-slate-400" />} />
          <Field icon={Lock} label="Konfirmasi Password" type="password" value={form.confirm} onChange={(value) => update('confirm', value)} placeholder="Ulangi password" trailing={<Eye className="h-4 w-4 text-slate-400" />} />
          <Button className="w-full" type="submit">{button}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Sudah punya akun? <Link className="font-bold text-emerald-700" to="/login">Masuk di sini</Link>
        </p>
      </div>
    </AuthShell>
  );
}

function Field({ label, icon: Icon, trailing, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
        {Icon && <Icon className="h-5 w-5 text-slate-400" />}
        <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full outline-none" placeholder={placeholder} type={type} />
        {trailing}
      </div>
    </label>
  );
}
