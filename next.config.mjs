/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/classes',
        destination: '/play',
        permanent: false,
      },
      {
        source: '/store/cafe-food',
        destination: '/cafe',
        permanent: false,
      },
      {
        source: '/store/shop',
        destination: '/shop',
        permanent: false,
      },
      {
        source: '/store/gifts',
        destination: '/gifts',
        permanent: false,
      },
      {
        source: '/events/we-bring-the-party',
        destination: '/rentals#we-bring-play-to-you',
        permanent: false,
      },
      {
        source: '/we-bring-the-party',
        destination: '/rentals#we-bring-play-to-you',
        permanent: false,
      },
      {
        source: '/we-bring-to-play',
        destination: '/play#product-menu-pcat-we-bring-party',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
