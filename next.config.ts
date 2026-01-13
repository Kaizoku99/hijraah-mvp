import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable Turbopack for faster development builds
  turbopack: {
    resolveAlias: {
      '@': './src',
      '@shared': './shared',
      '@assets': './attached_assets',
    },
  },

  // Server external packages (for Node.js dependencies)
  serverExternalPackages: [
    'drizzle-orm',
    'postgres',
    'mysql2',
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
    'stripe',
  ],

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },

  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}

export default nextConfig
