/**
 * Prefixes a root-absolute public asset path with the deployment base path.
 *
 * The site is a static export served from a subpath on GitHub Pages
 * (`/pokeoh-hub`). Next's `basePath` only rewrites `next/link` hrefs and
 * `_next/*` bundles — raw `<img src>` values, CSS `url()` references and
 * `fetch` calls to files in `public/` are left untouched, so they must be
 * prefixed by hand.
 *
 * `NEXT_PUBLIC_BASE_PATH` is inlined at build time, so this works in the
 * fully-static export. It is empty in local dev.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const withBasePath = (path: string): string => `${basePath}${path}`;

export default withBasePath;
