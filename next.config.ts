import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  // Production optimizations (only in production)
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
    compress: true,
  }),
  poweredByHeader: false,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Environment-specific configurations
  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.basalam.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Experimental features for performance
  experimental: {
    // Only enable CSS optimization in production
    ...(process.env.NODE_ENV === 'production' && {
      optimizeCss: true,
    }),
    optimizePackageImports: ['react', 'react-dom'],
  },
};

export default withNextIntl(nextConfig);
