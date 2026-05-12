import { Link } from 'react-router-dom';
import { BookOpenCheck, GraduationCap, UserCog } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { Button } from '../../components/ui/Button';

export function RegisterChoicePage() {
  return (
    <AuthShell
      illustration="/assets/wasatify-module-art.png"
      panelTitle="Satu ruang belajar untuk siswa dan guru"
      panelText="Pilih peran akun, lalu masuk ke pengalaman belajar yang sesuai: dashboard siswa atau dashboard pengelolaan guru."
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <BookOpenCheck className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-extrabold">Buat Akun Baru</h1>
          <p className="mt-2 text-slate-500">Pilih jenis akun yang sesuai dengan peran Anda.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <RoleCard
            to="/register/siswa"
            icon={GraduationCap}
            image="/assets/wasatify-auth-student.png"
            title="Saya Siswa"
            text="Akses materi pembelajaran, kerjakan kuis, dan pantau progress belajar."
            cta="Daftar sebagai Siswa"
          />
          <RoleCard
            to="/register/guru"
            icon={UserCog}
            image="/assets/wasatify-auth-teacher.png"
            title="Saya Guru"
            text="Kelola kelas, buat modul, evaluasi siswa, dan lihat laporan pembelajaran."
            cta="Daftar sebagai Guru"
          />
        </div>
        <p className="mt-8 text-center text-sm text-slate-500">
          Sudah punya akun? <Link className="font-bold text-emerald-700" to="/login">Masuk di sini</Link>
        </p>
      </div>
    </AuthShell>
  );
}

function RoleCard({ to, icon: Icon, image, title, text, cta }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white text-center shadow-card">
      <div className="relative h-40 bg-gradient-to-br from-emerald-50 to-cream">
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
        <div className="absolute bottom-3 right-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/90 text-emerald-700 shadow-sm backdrop-blur">
          <Icon className="h-7 w-7" />
        </div>
      </div>
      <div className="p-5">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-500">{text}</p>
        <Link to={to}>
          <Button className="mt-5 w-full px-3">{cta}</Button>
        </Link>
      </div>
    </div>
  );
}
