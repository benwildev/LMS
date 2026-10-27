/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
    // Course materials are uploaded through a server action.
    serverActions: { bodySizeLimit: `${Number(process.env.MAX_UPLOAD_MB || 25) + 1}mb` },
    // Never reuse a page the browser fetched earlier: lessons, quizzes and payments change while people use the site.
    staleTimes: { dynamic: 0, static: 30 },
  },
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
