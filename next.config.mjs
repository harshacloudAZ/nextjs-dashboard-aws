/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    serverComponentsExternalPackages: ['bcrypt'],
  },
  // Don't use output: 'standalone' for Amplify
  // Amplify handles the build process differently
};

export default nextConfig;