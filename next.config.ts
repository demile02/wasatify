import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  pageExtensions: ['ts', 'tsx'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'czvshkgrfyrhmiwydtwt.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
