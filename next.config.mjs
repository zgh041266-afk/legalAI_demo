/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15+ uses top-level serverExternalPackages
  serverExternalPackages: ['@modelcontextprotocol/sdk'],
  // Use empty turbopack config to silence the webpack config warning
  // and keep the default Turbopack behavior
  turbopack: {},
  // Vercel部署配置
  output: 'standalone',
};

export default nextConfig;
