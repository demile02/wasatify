# WASATIFY Deployment Checklist

Gunakan checklist ini sebelum dan sesudah deploy ke Vercel.

## Local Verification

- [ ] `npm install` selesai tanpa error.
- [ ] `.env.local` tersedia.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` benar.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` benar.
- [ ] Tidak ada secret hardcoded di source code.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` tidak dipakai di Client Component.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Local app bisa dibuka dengan `npm run dev`.
- [ ] Tidak ada console error fatal saat membuka route utama.

## Vercel Setup

- [ ] Repository GitHub sudah tersambung ke Vercel.
- [ ] Framework preset: Next.js.
- [ ] Install command: `npm install`.
- [ ] Build command: `npm run build`.
- [ ] Output directory memakai default Next.js.
- [ ] Environment variables Vercel lengkap:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` hanya jika diperlukan untuk server/admin script.
- [ ] Production branch benar.
- [ ] Vercel build pass.

## Supabase Production Config

- [ ] Supabase project production sudah dibuat.
- [ ] SQL sudah dijalankan sesuai urutan di `docs/supabase-setup-checklist.md`.
- [ ] Email Auth provider aktif.
- [ ] Site URL Supabase memakai domain production Vercel.
- [ ] Redirect URLs mencakup:
  - [ ] `https://your-domain.vercel.app`
  - [ ] `https://your-domain.vercel.app/login`
  - [ ] `https://your-domain.vercel.app/register`
  - [ ] `https://your-domain.vercel.app/forgot-password`
- [ ] Storage bucket `media-assets` tersedia jika media upload dipakai.
- [ ] Storage policy public read dan teacher own-folder upload/delete sudah aktif.

## Post-Deploy Smoke Test

- [ ] Production domain bisa dibuka.
- [ ] Landing page tidak blank.
- [ ] Login page tidak blank.
- [ ] Register student berhasil.
- [ ] Register teacher berhasil.
- [ ] Login redirect sesuai role.
- [ ] Student dashboard load data.
- [ ] Teacher dashboard load data.
- [ ] Teacher module list terbuka.
- [ ] Teacher announcement create/publish berhasil.
- [ ] Teacher media upload berhasil jika Storage dikonfigurasi.
- [ ] Guest redirect dari `/student/dashboard` ke `/login`.
- [ ] Guest redirect dari `/teacher/dashboard` ke `/login`.
- [ ] Browser console tidak punya error fatal.
- [ ] Network tab tidak menunjukkan request Supabase yang gagal karena RLS untuk flow utama.

## Rollback Plan

- [ ] Simpan deployment Vercel terakhir yang stabil.
- [ ] Jika build production gagal, rollback ke deployment stabil dari Vercel dashboard.
- [ ] Jika RLS memblokir flow utama, perbaiki policy di SQL Editor lalu ulang smoke test.
- [ ] Jika Storage upload gagal, cek bucket name, public setting, MIME type, dan folder policy.

## Known Limitations

- Production email delivery bergantung pada konfigurasi Supabase Auth SMTP/provider.
- OAuth belum aktif sampai provider dikonfigurasi di Supabase.
- Placeholder routes tetap bisa terbuka tetapi belum memiliki fitur penuh.
- Admin memakai teacher area, bukan admin console khusus.
