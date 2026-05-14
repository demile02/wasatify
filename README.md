# WASATIFY

WASATIFY adalah web app microlearning Islam Wasathiyah untuk siswa dan guru. App ini memakai Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui-ready primitives, lucide-react, Supabase Auth, Supabase PostgreSQL, dan Supabase Storage.

## Fitur Utama

- Landing page responsive.
- Auth email/password untuk siswa dan guru.
- Student app: dashboard, modul, lesson detail, kuis, hasil kuis, refleksi, progress.
- Teacher app: dashboard, modul, create/edit module flow, detail kelas, laporan, chart analitik.
- Supabase RLS untuk role student, teacher, dan admin.

## Requirements

- Node.js 20 atau lebih baru.
- npm.
- Project Supabase.
- Akun Vercel untuk deploy frontend.

## Install Lokal

```bash
npm install
```

Buat file `.env.local` dari `.env.example`:

```bash
cp .env.example .env.local
```

Di Windows PowerShell, bisa pakai:

```powershell
Copy-Item .env.example .env.local
```

Isi env sesuai project Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only. Opsional, hanya untuk script/admin server jika diperlukan.
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Jangan import atau pakai `SUPABASE_SERVICE_ROLE_KEY` di Client Component. Key itu tidak dibutuhkan untuk flow UI saat ini.

## Setup Supabase

1. Buat project baru di Supabase.
2. Buka SQL Editor.
3. Jalankan file SQL berikut sesuai urutan:

```txt
supabase/schema.sql
supabase/rls.sql
supabase/storage.sql
supabase/seed.sql
```

Catatan:

- `schema.sql` membuat enum, tabel, trigger, index, dan field tambahan seperti `tags`, `infographic_url`, dan `show_explanation`.
- `rls.sql` mengaktifkan RLS dan policy untuk student, teacher, dan admin.
- `storage.sql` membuat bucket `module-covers` dan `module-media`, plus policy upload folder per user.
- `seed.sql` menambahkan modul demo, lesson Tawazun, kuis, achievement, dan pengumuman demo.

## Auth Supabase

Di Supabase Dashboard:

1. Buka Authentication.
2. Pastikan Email provider aktif.
3. Tambahkan Site URL untuk lokal:

```txt
http://localhost:3000
```

4. Saat deploy, tambahkan URL Vercel production ke Site URL atau Redirect URLs.

## Run Lokal

```bash
npm run dev
```

Default URL:

```txt
http://localhost:3000
```

## Quality Checks

```bash
npm run lint
npm run build
```

Build production lokal:

```bash
npm run start
```

`npm run start` harus dijalankan setelah `npm run build`.

## Struktur Penting

```txt
src/app
src/components/auth
src/components/shared
src/components/student
src/components/teacher
src/components/ui
src/lib/auth
src/lib/constants
src/lib/student
src/lib/teacher
src/lib/supabase
supabase/schema.sql
supabase/rls.sql
supabase/storage.sql
supabase/seed.sql
```

## Route Protection

Protected route memakai middleware dan server guard:

- `/student/*` hanya untuk role `student`, admin akan diarahkan ke dashboard teacher.
- `/teacher/*` untuk role `teacher` dan `admin`.
- Authenticated user yang membuka `/login` atau `/register` akan diarahkan ke dashboard sesuai role.

Jika Supabase env belum dikonfigurasi, app berjalan dalam mode demo lokal agar UI bisa dikembangkan tanpa login.

## Deploy ke Vercel

1. Push repository ke GitHub.
2. Import project di Vercel.
3. Framework preset: Next.js.
4. Tambahkan environment variables:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` opsional untuk app UI saat ini. Jika ditambahkan, pastikan hanya tersimpan sebagai server-side env di Vercel dan tidak pernah dipakai di client.

5. Build command:

```bash
npm run build
```

6. Install command:

```bash
npm install
```

7. Deploy.
8. Tambahkan domain Vercel ke Supabase Authentication Redirect URLs.

## Catatan Project

Folder legacy React/Vite masih ada sebagai referensi lama, tetapi entrypoint aktif adalah Next.js App Router di `src/app`. ESLint dan build production hanya memakai implementasi TypeScript yang aktif.
