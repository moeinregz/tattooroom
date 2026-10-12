import { useEffect } from 'react';

// Set VITE_SITE_URL in frontend/.env to the site's real, public domain
// (e.g. https://tattooroom.ir) before deploying — it's used to build
// canonical URLs and Open Graph / Twitter share links. It falls back to the
// local dev URL so nothing breaks while developing.
export const SITE_URL = (import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')).replace(/\/$/, '');
export const SITE_NAME = 'TattooRoom';
export const DEFAULT_DESCRIPTION =
  'TattooRoom؛ استودیوی لوکس تتو و آرایش دائم و فروشگاه تخصصیِ تجهیزات، رنگ و محصولات مراقبت از تتو.';

export function absoluteUrl(path = '/') {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}

function setMetaByAttr(attr, key, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd(id) {
  document.getElementById(id)?.remove();
}

/**
 * Sets the document title, meta description, canonical link, Open Graph /
 * Twitter tags, robots directive, and (optionally) a JSON-LD structured
 * data block for whichever page calls it. Everything is restored/cleaned up
 * when the component unmounts or the route changes, so tags from one page
 * never leak into the next (which matters a lot for an SPA where the whole
 * app shares a single index.html <head>).
 *
 * @param {object} opts
 * @param {string} [opts.title] - Page-specific title; site name is appended automatically.
 * @param {string} [opts.description] - Falls back to the site-wide description.
 * @param {string} [opts.path] - Current path (e.g. `/shop`), used for canonical + og:url.
 * @param {string} [opts.image] - Absolute image URL for social share cards.
 * @param {string} [opts.type] - Open Graph type, e.g. 'website', 'article', 'product'.
 * @param {boolean} [opts.noindex] - Set true for account/dashboard/cart pages that shouldn't be indexed.
 * @param {object|null} [opts.jsonLd] - A JSON-LD object (e.g. Product, Article, BreadcrumbList schema).
 */
export function useSeo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image,
  type = 'website',
  noindex = false,
  jsonLd = null,
} = {}) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const prevTitle = document.title;
    const fullTitle = title
      ? `${title} | ${SITE_NAME}`
      : `${SITE_NAME} | استودیوی لوکس تتو و آرایش دائم`;

    document.title = fullTitle;

    setMetaByAttr('name', 'description', description);
    setMetaByAttr('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setLink('canonical', absoluteUrl(path));

    setMetaByAttr('property', 'og:title', fullTitle);
    setMetaByAttr('property', 'og:description', description);
    setMetaByAttr('property', 'og:type', type);
    setMetaByAttr('property', 'og:url', absoluteUrl(path));
    setMetaByAttr('property', 'og:site_name', SITE_NAME);
    setMetaByAttr('property', 'og:locale', 'fa_IR');
    if (image) setMetaByAttr('property', 'og:image', image);

    setMetaByAttr('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMetaByAttr('name', 'twitter:title', fullTitle);
    setMetaByAttr('name', 'twitter:description', description);
    if (image) setMetaByAttr('name', 'twitter:image', image);

    if (jsonLd) setJsonLd('page-jsonld', jsonLd);

    return () => {
      document.title = prevTitle;
      if (jsonLd) removeJsonLd('page-jsonld');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, image, type, noindex, jsonLdKey]);
}
