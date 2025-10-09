/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "images.pexels.com" },
      { hostname: "localhost" },
    ],
  },
  // Optimize for production
  swcMinify: true,
  // Remove experimental features that cause build issues
  experimental: {},
};

export default nextConfig;
