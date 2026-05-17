# WASATIFY

WASATIFY adalah web app microlearning Islam Wasathiyah untuk siswa dan guru. Aplikasi ini mencakup pembelajaran modul ringkas, kuis, refleksi, progress belajar, manajemen kelas, analitik guru, pengumuman, dan media library.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Vercel

## Features

Student:

- Dashboard siswa dengan progress, pengumuman, rekomendasi modul, dan aktivitas terbaru.
- Modul belajar dynamic dari Supabase.
- Detail lesson dengan materi, video, infografik, dan lesson progress.
- Kuis, hasil kuis, pembahasan, XP, refleksi, progress, dan achievement.

Teacher:

- Dashboard guru, daftar modul, create/edit module, lessons, quiz, dan questions.
- Kelas, detail kelas, progress siswa, refleksi, reports/analytics, dan CSV export.
- Pengumuman global/per kelas.
- Media library dengan upload Supabase Storage.

## Environment Variables

Buat `.env.local` dari `.env.example`.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Opsional. Server/admin script only. Jangan expose ke client.
SUPABASE_SERVICE_ROLE_KEY=
```

`NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dipakai client dan server Supabase helpers. `SUPABASE_SERVICE_ROLE_KEY` tidak dibutuhkan untuk UI normal.

## Install

```bash
npm install
```

## Supabase Setup

Jalankan SQL di Supabase SQL Editor dengan urutan:

```txt
supabase/schema.sql
supabase/rls.sql
supabase/storage.sql
supabase/seed.sql
```

Catatan:

- `schema.sql` membuat enum, tabel, trigger, index, dan kolom tambahan yang dipakai app.
- `rls.sql` mengaktifkan RLS untuk student, teacher, dan admin.
- `storage.sql` membuat bucket `module-covers`, `module-media`, dan `media-assets`.
- `seed.sql` menambahkan data demo modul, lesson Tawazun, quiz, achievement, class, media, dan pengumuman.
- Detail storage ada di `supabase/storage.md`.
- Data modul siswa di-scope berdasarkan kelas: siswa hanya melihat modul `published` yang dibuat oleh guru kelasnya (`modules.created_by = classes.teacher_id`). Progress, kuis, refleksi, dan analytics guru juga dihitung hanya dari siswa kelas guru dan modul milik guru tersebut.
- Jika database demo lama sudah tercampur dengan progress modul global/demo, jangan migrasi otomatis tanpa backup. Untuk reset demo bersih, backup data penting lalu hapus atau truncate data progress/attempt/reflection terkait testing sebelum rerun seed sesuai urutan di atas.

Kolom penting yang harus ada:

- `quiz_attempts.total_points`, `quiz_attempts.earned_points`, `quiz_attempts.passed`
- `classes.academic_year`
- `profiles.last_active_at`
- `reflections.teacher_note`, `reflections.reviewed_at`, `reflections.reviewed_by`
- `announcements.status`
- `media_assets.title`, `media_assets.file_type`, `media_assets.size_bytes`, `media_assets.module_id`

## Supabase Auth

Di Supabase Dashboard:

1. Aktifkan Email provider.
2. Set Site URL lokal:

```txt
http://localhost:3000
```

3. Tambahkan URL production Vercel ke Redirect URLs setelah deploy.
4. Tambahkan callback auth:

```txt
https://your-domain.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

Untuk testing praktis, wildcard juga boleh:

```txt
https://your-domain.vercel.app/**
http://localhost:3000/**
```

Register siswa membuat profile role `student`. Register guru membuat profile role `teacher`. Middleware membatasi `/student/*` untuk student dan `/teacher/*` untuk teacher/admin.

## Run Local

```bash
npm run dev
```

URL default:

```txt
http://localhost:3000
```

## Quality Checks

```bash
npm run lint
npm run build
```

Production preview lokal:

```bash
npm run build
npm run start
```

## Route Map

Public:

- `/`
- `/login`
- `/register`
- `/register/student`
- `/register/teacher`
- `/forgot-password`

Student:

- `/student/dashboard`
- `/student/modules`
- `/student/modules/[moduleId]`
- `/student/modules/[moduleId]/quiz`
- `/student/modules/[moduleId]/quiz/result`
- `/student/reflection`
- `/student/progress`
- `/student/profile`

Teacher:

- `/teacher/dashboard`
- `/teacher/modules`
- `/teacher/modules/new`
- `/teacher/modules/[moduleId]/edit`
- `/teacher/classes`
- `/teacher/classes/[classId]`
- `/teacher/reflections`
- `/teacher/reports`
- `/teacher/announcements`
- `/teacher/media`
- `/teacher/settings`

## Deploy to Vercel

1. Push repository ke GitHub.
2. Import project di Vercel.
3. Framework preset: Next.js.
4. Tambahkan Environment Variables:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

5. Install command:

```bash
npm install
```

6. Build command:

```bash
npm run build
```

7. Deploy.
8. Tambahkan domain Vercel ke Supabase Auth Redirect URLs.

## Notes

- Jangan commit `.env.local`.
- Jangan import service role key ke Client Component.
- Jika Supabase env belum diisi, beberapa helper memakai mode demo agar UI tetap bisa dikembangkan lokal.
