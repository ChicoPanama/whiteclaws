/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  distDir: 'dist',
  trailingSlash: true,
  experimental: {
    webpackBuildWorker: false,
  },
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
  webpack: (config) => {
    // MetaMask SDK (pulled in by some wagmi/onchain wallets) references the RN AsyncStorage
    // package even in browser bundles. Alias it to a tiny web-safe shim.
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@react-native-async-storage/async-storage': path.join(__dirname, 'lib/shims/async-storage.ts'),
    }
    return config
  },
}

module.exports = nextConfig
