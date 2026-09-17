/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  experimental: {
    // Next 14 keeps dynamic pages in the client Router Cache for 30s and reuses
    // them on soft navigations (Link clicks, back/forward), so the slot grid or
    // a booking could show stale state after a mutation. 0 = always refetch.
    // (This is Next 15's default.)
    staleTimes: {
      dynamic: 0,
    },
  },
}

module.exports = nextConfig
