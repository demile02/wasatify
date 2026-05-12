import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LearningIllustration } from '../components/ui/Illustration';
import { Logo } from '../components/ui/Logo';
import { PageTransition } from '../components/PageTransition';
import { features, modules } from '../services/demoData';

export function LandingPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#fbfaf6] text-ink">
        <section className="pattern px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1480px] gap-5 xl:grid-cols-[1.95fr_1fr]">
            <div className="overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-white/90 shadow-soft">
              <nav className="flex items-center justify-between px-5 py-5 md:px-8">
                <Logo />
                <div className="hidden items-center gap-9 text-sm font-bold md:flex">
                  {['Beranda', 'Tentang', 'Fitur', 'Modul', 'Testimoni', 'Kontak'].map((item) => (
                    <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-emerald-700">
                      {item}
                    </a>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <Link to="/login">
                    <Button variant="secondary" className="hidden px-5 py-2.5 sm:inline-flex">Masuk</Button>
                  </Link>
                  <Link to="/register">
                    <Button className="px-5 py-2.5">Daftar</Button>
                  </Link>
                </div>
              </nav>

              <div className="grid items-center gap-8 px-5 pb-6 pt-6 md:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:pb-0">
                <div className="pb-6 lg:pb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800"
                  >
                    Microlearning Islam Wasathiyah
                  </motion.div>
                  <h1 className="font-display text-4xl font-extrabold leading-tight text-ink sm:text-5xl lg:text-[3.35rem]">
                    Belajar Islam Wasathiyah <span className="text-emerald-700">Kapan Saja, Di Mana Saja</span>
                  </h1>
                  <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                    Platform microlearning interaktif untuk membantu siswa memahami nilai Islam Wasathiyah secara singkat, mudah, dan bermakna.
                  </p>

                  <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {features.map((feature) => {
                      const Icon = feature.icon;
                      return (
                        <div key={feature.title} className="text-center sm:text-left">
                          <div className="mb-3 inline-grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-sm">
                            <Icon className="h-6 w-6" />
                          </div>
                          <p className="font-bold">{feature.title}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{feature.text}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-8 flex flex-wrap gap-4">
                    <Link to="/register">
                      <Button>Mulai Belajar Sekarang <ArrowRight className="h-4 w-4" /></Button>
                    </Link>
                    <a href="#fitur">
                      <Button variant="secondary">Pelajari Lebih Lanjut <ArrowRight className="h-4 w-4" /></Button>
                    </a>
                  </div>

                  <div className="mt-6 rounded-2xl border border-emerald-900/10 bg-white/70 p-5 text-sm leading-7 text-slate-700">
                    <span className="mr-3 text-3xl font-black text-emerald-700">“</span>
                    Dan demikian Kami telah menjadikan kamu umat yang moderat agar kamu menjadi saksi atas manusia.
                    <p className="font-bold text-ink">(QS. Al-Baqarah: 143)</p>
                  </div>
                </div>

                <div className="self-end">
                  <LearningIllustration />
                </div>
              </div>

              <div className="grid gap-3 bg-gradient-to-r from-emerald-950 to-emerald-800 px-5 py-5 text-white sm:grid-cols-4 md:px-8">
                {[
                  ['25+', 'Modul Pembelajaran', BookOpen],
                  ['1000+', 'Siswa Aktif', Users],
                  ['500+', 'Kuis Interaktif', CheckCircle2],
                  ['Aman', 'Konten sesuai nilai Islam', ShieldCheck],
                ].map(([value, label, Icon]) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="h-8 w-8 text-gold" />
                    <div>
                      <p className="font-display text-2xl font-bold">{value}</p>
                      <p className="text-sm text-emerald-50/80">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <LoginPreview />
          </div>
        </section>

        <section id="fitur" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-bold text-emerald-700">Fitur utama</p>
              <h2 className="font-display text-3xl font-extrabold">Dirancang untuk belajar singkat, konsisten, dan bermakna.</h2>
            </div>
            <Link to="/siswa" className="text-sm font-bold text-emerald-700">Lihat demo dashboard →</Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <Icon className="mb-5 h-8 w-8 text-emerald-700" />
                  <h3 className="font-display text-xl font-bold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{feature.text}</p>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="modul" className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="font-bold text-emerald-700">Modul microlearning</p>
            <h2 className="font-display text-3xl font-extrabold">Alur belajar Islam Wasathiyah</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {modules.slice(0, 6).map((module) => (
                <Card key={module.id}>
                  <div className="relative mb-4 h-36 overflow-hidden rounded-2xl bg-emerald-50">
                    <img src="/assets/wasatify-module-art.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/35 to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-emerald-700">Modul {module.id}</span>
                    <span className="absolute bottom-3 right-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-600">{module.duration}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold">{module.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{module.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <footer className="bg-emerald-950 px-4 py-10 text-white">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
            <Logo light />
            <p className="max-w-xl text-sm leading-6 text-emerald-50/75">
              WASATIFY membantu Madrasah Aliyah menghadirkan pembelajaran Islam Wasathiyah yang modern, terukur, dan dekat dengan keseharian peserta didik.
            </p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}

function LoginPreview() {
  return (
    <div className="hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 p-8 shadow-soft xl:block">
      <div className="mx-auto flex h-full min-h-[640px] max-w-md flex-col justify-center rounded-[1.75rem] bg-white p-8 shadow-card">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl font-extrabold">Selamat Datang Kembali!</h2>
          <p className="mt-2 text-sm text-slate-500">Masuk untuk melanjutkan perjalanan belajarmu.</p>
        </div>
        <div className="mb-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
          <button className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-700 shadow-sm">
            <GraduationCap className="h-4 w-4" /> Login Siswa
          </button>
          <button className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-500">
            <UserRound className="h-4 w-4" /> Login Guru
          </button>
        </div>
        <PreviewField label="Email" icon={Mail} placeholder="Masukkan email" />
        <PreviewField label="Password" icon={Lock} placeholder="Masukkan password" trailing={<Eye className="h-4 w-4 text-slate-400" />} />
        <div className="mb-4 text-right text-sm font-bold text-emerald-700">Lupa Password?</div>
        <Link to="/login">
          <Button className="w-full">Masuk</Button>
        </Link>
        <div className="my-6 flex items-center gap-4 text-sm text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> atau <span className="h-px flex-1 bg-slate-200" />
        </div>
        <Link to="/login" className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold">
          <span className="text-lg text-red-500">G</span> Google
        </Link>
        <p className="mt-6 text-center text-sm text-slate-500">
          Belum punya akun? <Link className="font-bold text-emerald-700" to="/register">Daftar sekarang</Link>
        </p>
      </div>
    </div>
  );
}

function PreviewField({ label, icon: Icon, placeholder, trailing }) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
        <Icon className="h-5 w-5 text-slate-400" />
        <span className="flex-1 text-sm text-slate-400">{placeholder}</span>
        {trailing}
      </div>
    </label>
  );
}
