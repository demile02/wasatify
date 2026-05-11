import { Link } from 'react-router-dom';
import { GraduationCap, UserCog } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { Button } from '../../components/ui/Button';

export function RegisterChoicePage() {
  return (
    <AuthShell illustration={false}>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-extrabold">Buat Akun Baru</h1>
          <p className="mt-2 text-slate-500">Pilih jenis akun yang sesuai dengan peran Anda.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <RoleCard to="/register/siswa" icon={GraduationCap} title="Saya Siswa" text="Akses materi pembelajaran, kerjakan kuis, dan pantau progress belajar." cta="Daftar sebagai Siswa" />
          <RoleCard to="/register/guru" icon={UserCog} title="Saya Guru" text="Kelola kelas, buat modul, evaluasi siswa, dan lihat laporan pembelajaran." cta="Daftar sebagai Guru" />
        </div>
        <p className="mt-8 text-center text-sm text-slate-500">
          Sudah punya akun? <Link className="font-bold text-emerald-700" to="/login">Masuk di sini</Link>
        </p>
      </div>
    </AuthShell>
  );
}

function RoleCard({ to, icon: Icon, title, text, cta }) {
  return (
    <div className="rounded-2xl border border-emerald-900/10 bg-white p-6 text-center shadow-card">
      <div className="mx-auto mb-5 grid h-32 w-32 place-items-center rounded-[2rem] bg-emerald-50 text-emerald-700">
        <Icon className="h-16 w-16" />
      </div>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-500">{text}</p>
      <Link to={to}>
        <Button className="mt-6 w-full">{cta}</Button>
      </Link>
    </div>
  );
}
