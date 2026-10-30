import type { NextConfig } from 'next';

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ['213.163.193.255'],
  pageExtensions: ['ts', 'tsx'],
  images: {
    remotePatterns: supabaseHostname ? [{
      protocol: 'https',
      hostname: supabaseHostname,
      pathname: '/storage/v1/object/public/**',
    }] : [],
  },
};

export default nextConfig;
