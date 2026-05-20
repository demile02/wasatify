-- Demo seed for WASATIFY. Replace the dummy teacher UUID with a real auth user
-- id if you already have a teacher account in Supabase Auth.

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'teacher.demo@wasatify.local',
  crypt('wasatify-demo-teacher', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"role": "teacher", "full_name": "Ust. Ahmad Fauzi", "subject": "Pendidikan Agama Islam"}'::jsonb,
  now(),
  now()
)
on conflict (id) do update
set email = excluded.email,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

insert into public.profiles (
  id,
  role,
  full_name,
  email,
  school_name,
  subject,
  bio
)
values (
  '00000000-0000-0000-0000-000000000101',
  'teacher',
  'Ust. Ahmad Fauzi',
  'teacher.demo@wasatify.local',
  'SMP WASATIFY Demo',
  'Pendidikan Agama Islam',
  'Guru demo untuk konten awal WASATIFY.'
)
on conflict (id) do update
set role = excluded.role,
    full_name = excluded.full_name,
    email = excluded.email,
    school_name = excluded.school_name,
    subject = excluded.subject,
    bio = excluded.bio,
    updated_at = now();

insert into public.teacher_invite_codes (code, created_by, expires_at, is_active)
values ('GURU-DEMO-2026', null, null, true)
on conflict (code) do nothing;

insert into public.classes (
  id,
  teacher_id,
  name,
  description,
  grade_level,
  join_code,
  class_code
)
values (
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000101',
  'Kelas VIII - Akhlak & Adab',
  'Kelas demo untuk pembelajaran Islam Wasathiyah.',
  'VIII SMP',
  'WSTFY8A',
  'KLS-WSTFY8'
)
on conflict (id) do update
set teacher_id = excluded.teacher_id,
    name = excluded.name,
    description = excluded.description,
    grade_level = excluded.grade_level,
    join_code = excluded.join_code,
    class_code = excluded.class_code,
    updated_at = now();

with module_seed (
  title,
  slug,
  description,
  estimated_minutes,
  order_index,
  tags
) as (
  values
    (
      'Islam Wasathiyah: Pengantar',
      'islam-wasathiyah-pengantar',
      'Memahami konsep dasar Islam Wasathiyah dan relevansinya di zaman modern.',
      30,
      1,
      array['wasathiyah', 'pengantar', 'moderasi']
    ),
    (
      'Al-Qur''an dan Sunnah sebagai Pedoman Hidup',
      'alquran-dan-sunnah-sebagai-pedoman-hidup',
      'Menjadikan Al-Qur''an dan Sunnah sebagai sumber utama dalam kehidupan.',
      40,
      2,
      array['alquran', 'sunnah', 'pedoman']
    ),
    (
      'Akhlak dalam Islam',
      'akhlak-dalam-islam',
      'Membangun karakter mulia berdasarkan nilai-nilai Islam dalam kehidupan sehari-hari.',
      35,
      3,
      array['akhlak', 'adab', 'karakter']
    ),
    (
      'Fiqih Ibadah',
      'fiqih-ibadah',
      'Memahami aturan dan tata cara ibadah dalam Islam secara ringkas dan praktis.',
      50,
      4,
      array['fiqih', 'ibadah', 'praktik']
    ),
    (
      'Muamalah dan Kehidupan Sosial',
      'muamalah-dan-kehidupan-sosial',
      'Belajar bermuamalah dengan baik dalam kehidupan sosial sehari-hari.',
      45,
      5,
      array['muamalah', 'sosial', 'adab']
    ),
    (
      'Islam dan Lingkungan',
      'islam-dan-lingkungan',
      'Menjaga alam sebagai bagian dari ibadah dan amanah Allah SWT.',
      30,
      6,
      array['lingkungan', 'amanah', 'rahmah']
    )
)
insert into public.modules (
  teacher_id,
  created_by,
  class_id,
  title,
  slug,
  description,
  cover_image_path,
  tags,
  status,
  is_public,
  estimated_minutes,
  order_index,
  published_at
)
select
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000201',
  module_seed.title,
  module_seed.slug,
  module_seed.description,
  '/assets/wasatify-module-art.png',
  module_seed.tags,
  'published',
  true,
  module_seed.estimated_minutes,
  module_seed.order_index,
  now()
from module_seed
on conflict (slug) do update
set teacher_id = excluded.teacher_id,
    created_by = excluded.created_by,
    class_id = excluded.class_id,
    title = excluded.title,
    description = excluded.description,
    cover_image_path = excluded.cover_image_path,
    tags = excluded.tags,
    status = excluded.status,
    is_public = excluded.is_public,
    estimated_minutes = excluded.estimated_minutes,
    order_index = excluded.order_index,
    published_at = coalesce(public.modules.published_at, excluded.published_at),
    updated_at = now();

with module_rows as (
  select id, slug
  from public.modules
  where slug in (
    'islam-wasathiyah-pengantar',
    'alquran-dan-sunnah-sebagai-pedoman-hidup',
    'akhlak-dalam-islam',
    'fiqih-ibadah',
    'muamalah-dan-kehidupan-sosial',
    'islam-dan-lingkungan'
  )
)
insert into public.media_assets (
  owner_id,
  module_id,
  bucket,
  path,
  public_url,
  mime_type,
  kind
)
select
  '00000000-0000-0000-0000-000000000101',
  module_rows.id,
  'module-covers',
  'seed/' || module_rows.slug || '.png',
  '/assets/wasatify-module-art.png',
  'image/png',
  'module_cover'
from module_rows
on conflict (bucket, path) do update
set owner_id = excluded.owner_id,
    module_id = excluded.module_id,
    public_url = excluded.public_url,
    mime_type = excluded.mime_type,
    kind = excluded.kind,
    updated_at = now();

with lesson_seed (module_slug, title, slug, content, infographic_url, order_index, estimated_minutes) as (
  values
    (
      'islam-wasathiyah-pengantar',
      'Makna Islam Wasathiyah',
      'makna-islam-wasathiyah',
      $$Islam Wasathiyah adalah cara beragama yang seimbang, adil, dan membawa rahmat. Sikap ini membantu pelajar memahami agama dengan jernih, tidak berlebihan, dan tetap relevan dengan kehidupan sehari-hari.$$,
      null,
      1,
      12
    ),
    (
      'islam-wasathiyah-pengantar',
      'Prinsip Moderasi Beragama',
      'prinsip-moderasi-beragama',
      $$Moderasi beragama menumbuhkan sikap adil, toleran, dan bertanggung jawab. Pelajar diajak menghargai perbedaan tanpa kehilangan prinsip utama dalam Islam.$$,
      null,
      2,
      10
    ),
    (
      'alquran-dan-sunnah-sebagai-pedoman-hidup',
      'Al-Qur''an sebagai Petunjuk',
      'alquran-sebagai-petunjuk',
      $$Al-Qur'an menjadi petunjuk hidup yang membimbing manusia menuju kebaikan. Memahami pesan Al-Qur'an perlu dilakukan dengan ilmu, adab, dan bimbingan yang benar.$$,
      null,
      1,
      14
    ),
    (
      'alquran-dan-sunnah-sebagai-pedoman-hidup',
      'Meneladani Sunnah Nabi',
      'meneladani-sunnah-nabi',
      $$Sunnah Nabi menunjukkan contoh nyata bagaimana nilai Islam diterapkan dalam keluarga, sekolah, ibadah, dan kehidupan sosial.$$,
      null,
      2,
      12
    ),
    (
      'akhlak-dalam-islam',
      'Tawazun (Keseimbangan)',
      'tawazun-keseimbangan',
      $$Tawazun berarti menjaga keseimbangan antara dunia dan akhirat, ibadah dan usaha, serta hak diri sendiri dan hak orang lain. Sikap ini membuat seorang muslim tidak berlebihan, tetap produktif, dan mampu mengambil keputusan dengan adil.$$,
      '/assets/wasatify-tawazun.png',
      1,
      15
    ),
    (
      'akhlak-dalam-islam',
      'Adab kepada Sesama',
      'adab-kepada-sesama',
      $$Akhlak yang baik tampak dari cara berbicara, menghargai orang lain, menepati janji, dan menjaga amanah. Adab menjadi bukti nyata pemahaman agama yang membumi.$$,
      null,
      2,
      10
    ),
    (
      'fiqih-ibadah',
      'Ibadah dengan Ilmu',
      'ibadah-dengan-ilmu',
      $$Ibadah perlu dilandasi ilmu agar sesuai tuntunan. Memahami dasar ibadah membantu pelajar menjalankan kewajiban dengan tenang dan penuh kesadaran.$$,
      null,
      1,
      14
    ),
    (
      'fiqih-ibadah',
      'Kebiasaan Ibadah Harian',
      'kebiasaan-ibadah-harian',
      $$Kebiasaan ibadah harian dapat dibangun dari langkah kecil yang konsisten, seperti menjaga shalat, membaca doa, dan berbuat baik di rumah maupun sekolah.$$,
      null,
      2,
      12
    ),
    (
      'muamalah-dan-kehidupan-sosial',
      'Jujur dalam Interaksi',
      'jujur-dalam-interaksi',
      $$Muamalah yang baik dimulai dari kejujuran. Dalam belajar, berteman, dan bertransaksi, seorang muslim menjaga kepercayaan dan tidak merugikan orang lain.$$,
      null,
      1,
      12
    ),
    (
      'muamalah-dan-kehidupan-sosial',
      'Tolong-menolong dalam Kebaikan',
      'tolong-menolong-dalam-kebaikan',
      $$Islam mendorong kerja sama dalam kebaikan. Pelajar dapat mempraktikkannya lewat kepedulian, kerja kelompok yang adil, dan membantu teman yang membutuhkan.$$,
      null,
      2,
      10
    ),
    (
      'islam-dan-lingkungan',
      'Amanah Menjaga Alam',
      'amanah-menjaga-alam',
      $$Alam adalah amanah dari Allah. Menjaga kebersihan, menghemat air, dan mengurangi sampah menjadi bagian dari akhlak seorang muslim.$$,
      null,
      1,
      12
    ),
    (
      'islam-dan-lingkungan',
      'Aksi Hijau di Sekolah',
      'aksi-hijau-di-sekolah',
      $$Aksi kecil seperti membawa botol minum, memilah sampah, dan merawat tanaman dapat menjadi latihan tanggung jawab terhadap lingkungan.$$,
      null,
      2,
      10
    )
)
insert into public.lessons (
  module_id,
  title,
  slug,
  type,
  content,
  reflection_prompt,
  infographic_url,
  order_index,
  estimated_minutes
)
select
  modules.id,
  lesson_seed.title,
  lesson_seed.slug,
  'article',
  lesson_seed.content,
  case
    when lesson_seed.slug = 'tawazun-keseimbangan'
      then 'Apa bentuk keseimbangan yang ingin kamu latih dalam belajar, ibadah, keluarga, dan pergaulan minggu ini?'
    else null
  end,
  lesson_seed.infographic_url,
  lesson_seed.order_index,
  lesson_seed.estimated_minutes
from lesson_seed
join public.modules on modules.slug = lesson_seed.module_slug
on conflict (module_id, slug) do update
set title = excluded.title,
    type = excluded.type,
    content = excluded.content,
    reflection_prompt = excluded.reflection_prompt,
    infographic_url = excluded.infographic_url,
    order_index = excluded.order_index,
    estimated_minutes = excluded.estimated_minutes,
    updated_at = now();

with target_module as (
  select id
  from public.modules
  where slug = 'akhlak-dalam-islam'
  limit 1
)
insert into public.quizzes (
  module_id,
  teacher_id,
  title,
  description,
  status,
  passing_score,
  max_attempts,
  time_limit_seconds,
  is_published
)
select
  target_module.id,
  '00000000-0000-0000-0000-000000000101',
  'Kuis Pemahaman Tawazun',
  'Uji pemahaman tentang makna tawazun dalam akhlak Islam.',
  'published',
  70,
  3,
  600,
  true
from target_module
on conflict (module_id, title) do update
set teacher_id = excluded.teacher_id,
    description = excluded.description,
    status = excluded.status,
    passing_score = excluded.passing_score,
    max_attempts = excluded.max_attempts,
    time_limit_seconds = excluded.time_limit_seconds,
    is_published = excluded.is_published,
    updated_at = now();

with target_quiz as (
  select q.id
  from public.quizzes q
  join public.modules m on m.id = q.module_id
  where m.slug = 'akhlak-dalam-islam'
    and q.title = 'Kuis Pemahaman Tawazun'
  limit 1
)
insert into public.quiz_questions (
  quiz_id,
  question_type,
  question_text,
  options,
  correct_answer,
  explanation,
  show_explanation,
  points,
  order_index
)
select
  target_quiz.id,
  'single_choice',
  'Manakah pernyataan yang paling tepat tentang makna tawazun dalam Islam?',
  '[
    {"id": "a", "text": "Mengutamakan urusan dunia saja agar hidup menjadi sejahtera."},
    {"id": "b", "text": "Menjaga keseimbangan antara dunia dan akhirat, ibadah dan usaha, serta hak diri dan orang lain."},
    {"id": "c", "text": "Menjauhi semua urusan dunia dan fokus pada ibadah saja."},
    {"id": "d", "text": "Melakukan sesuatu secara berlebihan agar hasilnya lebih cepat tercapai."}
  ]'::jsonb,
  '{"type": "single_choice", "value": "b"}'::jsonb,
  'Tawazun berarti menjaga keseimbangan agar tidak condong ke salah satu sisi. Islam mengajarkan umatnya untuk menyeimbangkan kebutuhan dunia dan akhirat.',
  true,
  10,
  1
from target_quiz
on conflict (quiz_id, order_index) do update
set question_type = excluded.question_type,
    question_text = excluded.question_text,
    options = excluded.options,
    correct_answer = excluded.correct_answer,
    explanation = excluded.explanation,
    show_explanation = excluded.show_explanation,
    points = excluded.points,
    updated_at = now();

insert into public.achievements (
  code,
  title,
  description,
  icon,
  criteria,
  xp_reward
)
values
  (
    'consistent_learner',
    'Pembelajar Konsisten',
    'Belajar beberapa hari berturut-turut dengan ritme yang stabil.',
    'flame',
    '{"type": "streak", "days": 7}'::jsonb,
    250
  ),
  (
    'deep_understanding',
    'Pemahaman Mendalam',
    'Mendapatkan skor kuis minimal 80.',
    'badge-check',
    '{"type": "quiz_score", "minimum": 80}'::jsonb,
    200
  ),
  (
    'real_action',
    'Aksi Nyata',
    'Mengumpulkan refleksi dan rencana aksi pembelajaran.',
    'pen-line',
    '{"type": "reflection_submitted", "count": 1}'::jsonb,
    150
  ),
  (
    'explorer',
    'Explorer',
    'Menjelajahi beberapa modul pembelajaran.',
    'compass',
    '{"type": "module_started", "count": 3}'::jsonb,
    150
  )
on conflict (code) do update
set title = excluded.title,
    description = excluded.description,
    icon = excluded.icon,
    criteria = excluded.criteria,
    xp_reward = excluded.xp_reward,
    updated_at = now();

insert into public.announcements (
  teacher_id,
  class_id,
  title,
  content,
  status,
  priority,
  published_at
)
select
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000201',
  'Kuis Akhir Pekan',
  'Ikuti kuis akhir pekan dan dapatkan poin tambahan untuk memperkuat pemahamanmu.',
  'published',
  'normal',
  now()
where not exists (
  select 1
  from public.announcements
  where title = 'Kuis Akhir Pekan'
    and class_id = '00000000-0000-0000-0000-000000000201'
);

insert into public.announcements (
  teacher_id,
  class_id,
  title,
  content,
  status,
  priority,
  published_at
)
select
  '00000000-0000-0000-0000-000000000101',
  null,
  'Modul Baru Tersedia',
  'Modul Islam dan Lingkungan sudah tersedia untuk dipelajari.',
  'published',
  'low',
  now()
where not exists (
  select 1
  from public.announcements
  where title = 'Modul Baru Tersedia'
    and class_id is null
);
