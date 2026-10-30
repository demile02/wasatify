# WASATIFY Supabase Storage

Run `supabase/storage.sql` after `schema.sql` and `rls.sql`.

## Buckets

- `module-covers`: public bucket for module cover images.
- `module-media`: public bucket for lesson assets, original infographic PDF files, infographic images, and generated slide images.
- `media-assets`: public bucket for the teacher media library.
- `profile-avatars`: public bucket for student and teacher profile pictures.
- `assignment-submissions`: private bucket for student task attachments, up to 10 MB. Only the submitting student and the assigned class teacher can read a submitted file; admins can also read them. Storage RLS policies live in `supabase/rls.sql`, and downloads use short-lived signed URLs.

## Profile Avatar Path

Student and teacher avatar uploads use this path format:

```txt
avatars/{userId}/{timestamp}-avatar.webp
```

The app accepts JPG, PNG, and WebP images up to 20MB, opens a 1:1 crop dialog in the browser, then compresses the result to WebP before uploading. The `profile-avatars` bucket can keep a 2MB Storage limit because the uploaded output is already compressed. The storage policies allow authenticated users to upload, update, and delete only files inside their own `avatars/{userId}` folder. Public read is enabled so topbar avatars can render directly from `profiles.avatar_url`.

## Media Library Path

Teacher media uploads use this path format:

```txt
teacher/{teacherId}/{timestamp}-{safeFileName}
```

The `media-assets` storage policies allow authenticated teachers/admins to upload, update, and delete only inside their own folder. Public read is enabled so media URLs can be used directly in lessons and previews.

## Task Submission Path

Student task files use a generated path that does not contain the original user filename:

```txt
{studentId}/{assignmentId}/{uuid}.{pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpg|jpeg|png|webp}
```

The private bucket accepts only the listed types. Storage policies scope uploads and cleanup to the student's class; downloads are allowed only when the path belongs to a submission readable by that student, their assigned teacher, or an admin. Replacing or removing an unreviewed attachment first updates the submission RPC, then removes the unreferenced object. Reviewed submissions cannot be changed or have their files removed.

Demo task attachments are stored as `Blob` records in IndexedDB and shared between the student and teacher demo views in that browser. They are not uploaded to Supabase.

## Infographic Slide Processing

Infographic uploads from the module editor use:

```txt
{teacherId}/infographics/{timestamp}-{fileName}
{teacherId}/infographic-slides/{assetId}/slide-{page}.png
```

PDF files are rendered in the teacher browser with `pdfjs-dist`, then each generated PNG slide is uploaded to `module-media`. PPTX files are currently blocked in the module editor because direct PPTX-to-image conversion needs a worker/server renderer with an Office renderer such as LibreOffice. Export PPTX files to PDF before uploading.

## SQL Execution Order

```txt
supabase/schema.sql
supabase/rls.sql
supabase/storage.sql
supabase/seed.sql
```
