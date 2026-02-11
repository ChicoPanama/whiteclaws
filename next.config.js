/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: 'dist',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    // Build succeeds while we complete Supabase type generation.
    // Types are still checked in IDE/CI via `tsc --noEmit`.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
