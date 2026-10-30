export function canOptimizeImage(src: string) {
  if (src.startsWith('/') && !src.startsWith('//')) return true;
  try {
    const configuredOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!configuredOrigin) return false;
    const url = new URL(src);
    return url.protocol === 'https:' && url.origin === new URL(configuredOrigin).origin
      && url.pathname.startsWith('/storage/v1/object/public/');
  } catch {
    return false;
  }
}
