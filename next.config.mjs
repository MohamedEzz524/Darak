/** @type {import('next').NextConfig} */

// Single source of truth for the deploy sub-path.
// GitHub Pages serves a project repo at https://<user>.github.io/<repo>/,
// so production builds set NEXT_PUBLIC_BASE_PATH=/Darak. Local dev/build leaves
// it empty so the site works at the root. lib/content.js reads the same env var
// to prefix the migrated (hardcoded root-absolute) HTML/asset references.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  reactStrictMode: false,
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
};
export default nextConfig;
