/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static HTML export for Cloudflare Pages.
  output: "export",
  images: { unoptimized: true },
  allowedDevOrigins: [
    "192.168.0.106",
    "192.168.0.*",
    "192.168.*.*",
    "10.*.*.*",
    "localhost",
    "127.0.0.1",
  ],
};

export default nextConfig;
