/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: 'dist',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/x402.json',
        destination: '/api/discovery/',
      },
    ]
  },
}

module.exports = nextConfig
