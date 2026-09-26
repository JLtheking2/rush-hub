const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Set to e.g. `/pokeoh-hub` when deploying under a subpath (GitHub Pages project
// site). Empty in local dev. See src/utils/withBasePath.ts.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

module.exports = withBundleAnalyzer({
  pageExtensions: ['page.tsx'],
  reactStrictMode: true,
  basePath,
  assetPrefix: basePath || undefined,
  // The site ships as a static export (`next export`), which has no image
  // optimization server. All images are local assets in public/.
  images: { unoptimized: true },
});
