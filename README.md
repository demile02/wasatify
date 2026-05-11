# WASATIFY

WASATIFY (Wasathiyah Smart Learning for Youth) adalah web app microlearning Islam Wasathiyah untuk peserta didik Madrasah Aliyah.

## Stack

- React + Vite
- Tailwind CSS
- Framer Motion
- Lucide React Icons
- React Router DOM
- Supabase Auth + PostgreSQL

## Jalankan lokal

```bash
npm install
npm run dev
```

Buat file `.env` dari `.env.example`, lalu isi:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Tanpa env Supabase, aplikasi tetap berjalan sebagai demo UI. Login/register akan mengarahkan ke dashboard demo.

## Supabase

1. Buat project Supabase.
2. Buka SQL Editor.
3. Jalankan isi `supabase/schema.sql`.
4. Aktifkan provider Auth yang dibutuhkan di dashboard Supabase.

## Halaman Demo

- `/` landing page
- `/login`
- `/register`
- `/register/siswa`
- `/register/guru`
- `/siswa`
- `/siswa/modul`
- `/siswa/quiz`
- `/siswa/refleksi`
- `/guru`
- `/guru/modul`

## Deploy Vercel

Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```

Tambahkan environment variable Supabase di Vercel Project Settings.

## Google Login

Kode frontend sudah memakai `supabase.auth.signInWithOAuth({ provider: 'google' })`.
Supabase Dashboard tetap perlu dikonfigurasi:

1. Authentication → Providers → Google → Enable.
2. Isi Google Client ID dan Google Client Secret dari Google Cloud Console.
3. Tambahkan redirect URL Vercel ke Authentication → URL Configuration:

```txt
https://nama-project.vercel.app/**
```

Saat masih lokal, tambahkan:

```txt
http://localhost:5173/**
http://127.0.0.1:5173/**
```
