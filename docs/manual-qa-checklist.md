# WASATIFY Manual QA Checklist

Gunakan checklist ini untuk testing manual sebelum demo atau deploy production.

## Test Accounts

- Guest: browser incognito, belum login.
- Student: akun baru dari `/register/student`.
- Teacher: akun baru dari `/register/teacher`.
- Admin: akun dengan `profiles.role = 'admin'` jika disiapkan manual di Supabase.

## Public/Auth

- [ ] Landing page `/` terbuka.
- [ ] Navbar link public bisa diklik dan tidak membuat halaman blank.
- [ ] CTA `Masuk` menuju `/login`.
- [ ] CTA `Daftar` menuju `/register`.
- [ ] Login page `/login` terbuka.
- [ ] Register role page `/register` terbuka.
- [ ] Register student `/register/student` berhasil membuat auth user dan profile role `student`.
- [ ] Register student menampilkan select kelas jika kelas tersedia.
- [ ] Student yang memilih kelas punya `profiles.class_id`.
- [ ] Register teacher `/register/teacher` berhasil membuat auth user dan profile role `teacher`.
- [ ] Email confirmation redirect ke `/auth/callback`, lalu ke `/login?confirmed=1`.
- [ ] Login page menampilkan pesan email berhasil dikonfirmasi.
- [ ] Forgot password `/forgot-password` terbuka dan tidak crash.
- [ ] Login student redirect ke `/student/dashboard`.
- [ ] Login teacher redirect ke `/teacher/dashboard`.
- [ ] Guest tidak bisa membuka `/student/dashboard`; harus redirect ke `/login`.
- [ ] Guest tidak bisa membuka `/teacher/dashboard`; harus redirect ke `/login`.
- [ ] Student tidak bisa membuka `/teacher/dashboard`; harus redirect ke student dashboard.
- [ ] Teacher tidak bisa membuka `/student/dashboard`; harus redirect ke teacher dashboard.
- [ ] Admin bisa membuka teacher routes tanpa error.

## Student Flow

- [ ] `/student/dashboard` load data tanpa blank page.
- [ ] Greeting menampilkan nama profile.
- [ ] Stat cards tampil: modul selesai, kuis dikerjakan, streak, XP.
- [ ] Pengumuman published tampil jika ada data.
- [ ] `/student/modules` load modules dari Supabase.
- [ ] Search dan filter status module berjalan.
- [ ] Locked module tidak bisa dibuka dan menampilkan toast.
- [ ] Module pertama/unlocked bisa dibuka.
- [ ] `/student/modules/[moduleId]` menampilkan detail module dan lesson list.
- [ ] Lesson bisa dibuka dan tab Materi/Video/Infografik tidak crash.
- [ ] Empty state video/infografik tampil jika URL kosong.
- [ ] Lesson bisa ditandai selesai.
- [ ] Row `lesson_progress` tersimpan.
- [ ] `module_progress.progress_percent` berubah setelah lesson selesai.
- [ ] Tombol sebelumnya/selanjutnya bekerja.
- [ ] `/student/modules/[moduleId]/quiz` load quiz dan questions.
- [ ] User bisa memilih jawaban dan pindah pertanyaan.
- [ ] Feedback benar/salah dan explanation tampil jika tersedia.
- [ ] Submit quiz ditolak jika masih ada pertanyaan belum dijawab.
- [ ] Submit quiz menyimpan `quiz_attempts`.
- [ ] Result page menampilkan score, passed/failed, benar/salah, dan pembahasan.
- [ ] Jika quiz passed, XP bertambah sesuai aturan.
- [ ] XP tidak bertambah berulang di luar aturan.
- [ ] `/student/reflection` bisa memilih module.
- [ ] Reflection valid bisa disimpan.
- [ ] Reflection update tidak menambah XP berulang untuk module yang sama.
- [ ] `/student/progress` menampilkan overall progress, XP, streak, quiz history, reflection count, achievements.
- [ ] Empty states tampil rapi saat data belum tersedia.
- [ ] Mobile student shell memakai bottom navigation dan tidak overflow horizontal.

## Teacher Flow

- [ ] `/teacher/dashboard` load data tanpa blank page.
- [ ] Stat cards dashboard guru tampil.
- [ ] Progress kelas, aktivitas, chart, pengumuman, dan quick actions tampil atau empty state.
- [ ] `/teacher/modules` load modules milik teacher.
- [ ] Search dan filter module berjalan.
- [ ] Teacher bisa create module draft di `/teacher/modules/new`.
- [ ] Teacher bisa edit module di `/teacher/modules/[moduleId]/edit`.
- [ ] Teacher bisa mengubah informasi module.
- [ ] Teacher bisa tambah/edit/hapus lesson.
- [ ] Teacher bisa buat/edit quiz.
- [ ] Teacher bisa tambah/edit/hapus question.
- [ ] Publish module ditolak jika readiness belum terpenuhi.
- [ ] Publish module berhasil jika readiness terpenuhi.
- [ ] Teacher tidak bisa edit module milik teacher lain.
- [ ] `/teacher/classes` load classes milik teacher.
- [ ] Teacher bisa create class.
- [ ] Teacher bisa edit class.
- [ ] Guru membuat kelas dulu sebelum siswa memilih kelas saat register.
- [ ] `/teacher/classes/[classId]` load detail class.
- [ ] Tabs detail class berjalan: Overview, Daftar Siswa, Progress Modul, Nilai & Evaluasi, Refleksi.
- [ ] Teacher tidak bisa akses class milik teacher lain.
- [ ] `/teacher/reflections` load refleksi siswa dari kelas teacher.
- [ ] Search/filter refleksi berjalan.
- [ ] Teacher bisa memberi `teacher_note`.
- [ ] Teacher bisa mark reflection reviewed.
- [ ] Teacher tidak bisa update reflection siswa dari kelas teacher lain.
- [ ] `/teacher/reports` load summary, chart, dan table.
- [ ] Export CSV menghasilkan file `wasatify-report.csv`.
- [ ] `/teacher/announcements` load announcements.
- [ ] Teacher bisa create announcement draft.
- [ ] Teacher bisa publish/unpublish announcement.
- [ ] Teacher bisa edit/delete announcement miliknya.
- [ ] Announcement published tampil di student dashboard sesuai target class/global.
- [ ] `/teacher/media` load media library.
- [ ] Teacher bisa upload media jika bucket `media-assets` sudah ada.
- [ ] Media row tersimpan di `media_assets`.
- [ ] Copy URL media bekerja.
- [ ] Open file membuka public URL.
- [ ] Delete media menghapus file Storage dan row database.
- [ ] Mobile/tablet teacher pages tidak overflow kecuali table yang memang horizontal scroll.

## Admin Flow

- [ ] Admin bisa login jika profile role diubah ke `admin`.
- [ ] Admin bisa membuka `/teacher/dashboard`.
- [ ] Admin tidak error saat membuka teacher modules/classes/reflections/reports/announcements/media.
- [ ] Admin diarahkan ke teacher dashboard dari auth routes.
- [ ] Admin tidak bisa membuka student routes jika middleware tetap membatasi role student-only.

## Error/Empty/Loading States

- [ ] Loading skeleton tampil untuk route yang fetching data berat.
- [ ] Empty state tampil saat modules/classes/reflections/media kosong.
- [ ] Data not found tidak membuat page blank.
- [ ] Server action error muncul sebagai sonner toast atau pesan yang jelas.
- [ ] Button submit punya disabled/loading state.

## Known Limitations

- OAuth Google/Microsoft masih UI placeholder kecuali provider dikonfigurasi manual di Supabase.
- Forgot password flow harus disambungkan dengan konfigurasi email template dan redirect URL Supabase.
- Media upload memakai client Supabase anon key dan RLS/Storage policy; bucket `media-assets` wajib dibuat lewat `supabase/storage.sql`.
- Beberapa route sekunder seperti messages, certificates, tasks, students, quizzes, dan settings masih placeholder.
- Admin role tidak punya dashboard khusus; admin memakai teacher area dan bergantung pada RLS policy admin.
- Jika Supabase env kosong, beberapa halaman memakai mode demo untuk pengembangan UI lokal.
