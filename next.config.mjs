/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained server bundle for a small production Docker image.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // Lint is run separately (npm run lint); don't block production builds on it.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
