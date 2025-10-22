/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  images: {
    // Allow HTTPS images from any domain (tighten to specific hosts for production if desired)
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ],
    // DiceBear and some user avatars are SVGs; permit optimized SVGs safely
    dangerouslyAllowSVG: true,
    // Hardened CSP for the image optimizer when serving SVGs
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  }
}

export default nextConfig
