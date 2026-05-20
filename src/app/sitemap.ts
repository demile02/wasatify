import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

const publicRoutes = [
  {
    path: '/',
    changeFrequency: 'weekly',
    priority: 1,
  },
  {
    path: '/demo',
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    path: '/register',
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    path: '/register/student',
    changeFrequency: 'monthly',
    priority: 0.6,
  },
  {
    path: '/register/teacher',
    changeFrequency: 'monthly',
    priority: 0.6,
  },
] satisfies Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}>;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
