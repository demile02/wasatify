# WASATIFY Supabase Setup Checklist

Checklist ini memastikan database, RLS, seed, dan storage siap untuk local/dev/prod.

## Execution Order

- [ ] Buka Supabase SQL Editor.
- [ ] Jalankan `supabase/schema.sql`.
- [ ] Jalankan `supabase/rls.sql`.
- [ ] Jalankan `supabase/storage.sql`.
- [ ] Jalankan `supabase/seed.sql`.
- [ ] Tidak ada SQL error setelah setiap file dijalankan.

## Schema Verification

- [ ] Table `profiles` tersedia.
- [ ] Table `classes` tersedia.
- [ ] Table `modules` tersedia.
- [ ] Table `lessons` tersedia.
- [ ] Table `quizzes` tersedia.
- [ ] Table `quiz_questions` tersedia.
- [ ] Table `module_progress` tersedia.
- [ ] Table `lesson_progress` tersedia.
- [ ] Table `quiz_attempts` tersedia.
- [ ] Table `reflections` tersedia.
- [ ] Table `achievements` tersedia.
- [ ] Table `student_achievements` tersedia.
- [ ] Table `announcements` tersedia.
- [ ] Table `media_assets` tersedia.

## Required Columns

- [ ] `quiz_attempts.earned_points`
- [ ] `quiz_attempts.total_points`
- [ ] `quiz_attempts.passed`
- [ ] `classes.academic_year`
- [ ] `profiles.last_active_at`
- [ ] `reflections.teacher_note`
- [ ] `reflections.reviewed_at`
- [ ] `reflections.reviewed_by`
- [ ] `announcements.status`
- [ ] `media_assets.title`
- [ ] `media_assets.file_type`
- [ ] `media_assets.size_bytes`
- [ ] `media_assets.module_id`

## Seed Data

- [ ] Demo teacher placeholder tersedia.
- [ ] Demo class tersedia.
- [ ] 6 published modules tersedia.
- [ ] Minimal 2 lessons per module tersedia.
- [ ] Lesson Tawazun tersedia.
- [ ] Quiz Tawazun tersedia.
- [ ] Quiz questions dengan options tersedia.
- [ ] Achievements awal tersedia.
- [ ] Demo announcements punya `status = published`.

## RLS Verification

- [ ] RLS enabled untuk semua table utama.
- [ ] Student bisa read published modules.
- [ ] Student bisa read lessons dari published modules.
- [ ] Student bisa CRUD own `module_progress`.
- [ ] Student bisa CRUD own `lesson_progress`.
- [ ] Student bisa insert own `quiz_attempts`.
- [ ] Student bisa CRUD own `reflections`.
- [ ] Student bisa unlock own achievements.
- [ ] Teacher bisa CRUD own modules.
- [ ] Teacher bisa CRUD own classes.
- [ ] Teacher bisa CRUD own quizzes/questions.
- [ ] Teacher bisa read progress/attempt/reflection siswa di kelasnya.
- [ ] Teacher bisa update review reflection siswa di kelasnya.
- [ ] Teacher bisa CRUD own announcements.
- [ ] Teacher bisa CRUD own media assets.
- [ ] Admin policy full access tersedia.
- [ ] Policy tidak memberi teacher akses ke data teacher lain.
- [ ] Policy tidak memberi student akses update data siswa lain.

## Storage Setup

- [ ] Bucket `module-covers` tersedia.
- [ ] Bucket `module-media` tersedia.
- [ ] Bucket `media-assets` tersedia.
- [ ] Bucket `media-assets` public jika public URL dipakai.
- [ ] Teacher bisa upload ke `teacher/{teacherId}/...`.
- [ ] Teacher bisa delete file dari folder miliknya.
- [ ] Public read aktif untuk bucket yang butuh direct URL.
- [ ] MIME type file yang diuji diizinkan bucket.

## Auth Setup

- [ ] Email provider aktif.
- [ ] Site URL lokal: `http://localhost:3000`.
- [ ] Redirect URL lokal mencakup `http://localhost:3000`.
- [ ] Redirect URL production Vercel ditambahkan setelah deploy.
- [ ] Register student membuat row `profiles.role = student`.
- [ ] Register student yang memilih kelas menyimpan `profiles.class_id`.
- [ ] Register teacher membuat row `profiles.role = teacher`.
- [ ] Register teacher membuat class default lewat trigger atau guru membuat kelas manual dari `/teacher/classes`.
- [ ] Admin dibuat manual dengan mengubah `profiles.role = admin` jika diperlukan.

## Flow Smoke Tests

- [ ] Student lesson completion membuat `lesson_progress`.
- [ ] Student lesson completion mengubah `module_progress`.
- [ ] Student quiz submit membuat `quiz_attempts`.
- [ ] Student passed quiz mengubah XP sesuai aturan.
- [ ] Student reflection submit membuat/mengubah `reflections`.
- [ ] Teacher review reflection mengisi `teacher_note` dan `reviewed_at`.
- [ ] Teacher create announcement membuat row `announcements`.
- [ ] Published announcement terlihat untuk target student.
- [ ] Teacher media upload membuat object Storage dan row `media_assets`.
- [ ] Teacher media delete menghapus object Storage dan row `media_assets`.

## Known Limitations

- SQL seed memakai UUID demo; ganti atau tambahkan user real setelah Supabase Auth user dibuat.
- Storage upload membutuhkan bucket/policy yang sudah dijalankan dari `supabase/storage.sql`.
- Service role key tidak digunakan untuk UI normal dan tidak boleh dipakai di client.
- RLS perlu diuji langsung dengan user real karena SQL Editor memakai elevated context.
