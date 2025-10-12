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
};

export default nextConfig;