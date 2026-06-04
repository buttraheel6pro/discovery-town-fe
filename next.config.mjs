/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/classes',
        destination: '/play',
        permanent: false,
      },
      {
        source: '/events/take-out-party',
        destination: '/store/cafe-food#take-out-party',
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
