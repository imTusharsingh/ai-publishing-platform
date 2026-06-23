import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/shared'],
  // Monorepo: trace dependencies from workspace root
  outputFileTracingRoot: path.join(__dirname, '../../'),
  // Avoid intermittent SegmentViewNode / client-manifest errors in dev
  experimental: {
    devtoolSegmentExplorer: false,
  },
  devIndicators: false,
};

export default nextConfig;
