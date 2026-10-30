alter table public.modules
  add column if not exists image_crop_config jsonb;
