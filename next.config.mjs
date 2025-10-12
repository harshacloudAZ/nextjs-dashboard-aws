/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    serverComponentsExternalPackages: ['bcrypt', '@mapbox/node-pre-gyp'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude bcrypt from client-side bundle
      config.externals.push('bcrypt');
    }
    return config;
  },
  // Skip building seed and query routes - they're only for manual use
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;