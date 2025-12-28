import type { NextConfig } from 'next';

const securityHeaders = [
  // DNS Prefetch Control
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // Strict Transport Security (HSTS)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Referrer Policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // X-Frame-Options (Clickjacking protection)
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // XSS Protection (legacy browser support)
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // Permissions Policy
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const nextConfig: NextConfig = {
  // Enable response compression
  compress: true,

  // Remove X-Powered-By header for security
  poweredByHeader: false,

  // Custom headers
  async headers() {
    return [
      // Security headers for all routes
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Static assets - long-term cache
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Next.js static files - long-term cache
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Image optimization - long-term cache
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // API routes - no cache by default
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
          // CORS headers for API
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      // Health check endpoint - short cache for monitoring
      {
        source: '/api/health',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      // Fonts - long-term cache
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
