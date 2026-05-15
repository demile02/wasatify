# WASATIFY Supabase Storage

Run `supabase/storage.sql` after `schema.sql` and `rls.sql`.

## Buckets

- `module-covers`: public bucket for module cover images.
- `module-media`: public bucket for lesson assets used by the module editor.
- `media-assets`: public bucket for the teacher media library.

## Media Library Path

Teacher media uploads use this path format:

```txt
teacher/{teacherId}/{timestamp}-{safeFileName}
```

The `media-assets` storage policies allow authenticated teachers/admins to upload, update, and delete only inside their own folder. Public read is enabled so media URLs can be used directly in lessons and previews.

## SQL Execution Order

```txt
supabase/schema.sql
supabase/rls.sql
supabase/storage.sql
supabase/seed.sql
```
