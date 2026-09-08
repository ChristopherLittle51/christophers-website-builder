import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  serverExternalPackages: ['@aws-sdk/client-s3'],
};

export default nextConfig;
