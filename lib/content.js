import fs from 'fs';
import path from 'path';
const dir = path.join(process.cwd(), 'content');

// The migrated WordPress HTML uses root-absolute URLs (e.g. /about-us/,
// /wp-content/...). On GitHub Pages the site lives under /Darak/, so those
// references must be prefixed with the base path. Next's basePath/assetPrefix
// only rewrites Next-generated URLs, never strings inside dangerouslySetInnerHTML,
// so we do it here — the single point every page/nav/head/footer flows through.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

function withBase(html) {
  if (!BASE || !html) return html;
  // Attribute URLs: src/href/poster/content/data-* starting with a single "/"
  // (skip protocol-relative "//host" and already-prefixed values).
  html = html.replace(
    /\b(src|href|poster|content|data-[\w-]+)=("|')\/(?!\/)/g,
    (m, attr, q) => `${attr}=${q}${BASE}/`
  );
  // srcset is a comma-separated list of "<url> <descriptor>" candidates.
  html = html.replace(/\bsrcset=("|')([^"']*)\1/g, (m, q, val) => {
    const out = val
      .split(',')
      .map((c) => c.replace(/^(\s*)\/(?!\/)/, `$1${BASE}/`))
      .join(',');
    return `srcset=${q}${out}${q}`;
  });
  // CSS url(/...) inside inline <style>/style="" blocks.
  html = html.replace(/url\((\s*)\/(?!\/)/g, `url($1${BASE}/`);
  return html;
}

function readRaw(name) {
  try { return fs.readFileSync(path.join(dir, name), 'utf8'); } catch { return ''; }
}

export function read(name) { return withBase(readRaw(name)); }

// Root-absolute asset URLs hardcoded inside inline <script> code (e.g. an image
// path in a slider's config array) aren't covered by the HTML rewriter. Prefix
// the well-known asset roots only — anchored to a preceding quote or "(" so we
// never touch a regex literal or unrelated path in the JS.
function rewriteCodeAssets(code) {
  if (!BASE || !code) return code;
  return code.replace(
    /(["'(])\/(wp-content|wp-includes|cdnjs\.cloudflare\.com)\//g,
    (m, lead, root) => `${lead}${BASE}/${root}/`
  );
}

export function readJSON(name) {
  let arr;
  try { arr = JSON.parse(readRaw(name) || '[]'); } catch { return []; }
  if (!BASE || !Array.isArray(arr)) return arr;
  // Prefix root-absolute external script sources (jQuery, GSAP, Elementor, ...)
  // and asset URLs embedded in inline script code.
  return arr.map((s) => {
    if (!s || typeof s !== 'object') return s;
    const out = { ...s };
    if (typeof out.src === 'string') out.src = out.src.replace(/^\/(?!\/)/, `${BASE}/`);
    if (typeof out.code === 'string') out.code = rewriteCodeAssets(out.code);
    return out;
  });
}
