import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/demo', '/register', '/register/student', '/register/teacher'],
        disallow: [
          '/auth/',
          '/student/',
          '/teacher/',
          '/login',
          '/forgot-password',
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
