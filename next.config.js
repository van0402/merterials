/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone build for Docker deployments
  output: 'standalone',
  // Enable Turbopack (default in Next.js 16)
  turbopack: {},
};

module.exports = nextConfig;
