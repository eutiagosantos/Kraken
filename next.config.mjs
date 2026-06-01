/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: "/privacy-policy", destination: "/privacidade", permanent: true }];
  },
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "recharts", "framer-motion"],
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
};

export default nextConfig;
