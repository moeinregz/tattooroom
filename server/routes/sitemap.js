const express = require('express');
const { readProducts, readArticles } = require('../utils/db');

const router = express.Router();

// SITE_URL should be the site's real public domain (the one people actually
// visit — usually the frontend's domain, e.g. https://tattooroom.ir), not
// the backend's own host/port. Set it in backend/.env before deploying.
const SITE_URL = (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : 'http://localhost:5173')).replace(/\/$/, '');

function xmlEscape(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, { lastmod, changefreq, priority } = {}) {
  return [
    '  <url>',
    `    <loc>${xmlEscape(loc)}</loc>`,
    lastmod ? `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority != null ? `    <priority>${priority}</priority>` : null,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

// GET /sitemap.xml — lists every publicly indexable page: the static
// marketing pages plus every product and published article, generated live
// from the same JSON files the shop and dashboard use, so it never goes
// stale the way a build-time sitemap would.
router.get('/sitemap.xml', (req, res) => {
  const products = readProducts();
  const articles = readArticles().filter((a) => a.status === 'published');

  const staticEntries = [
    urlEntry(`${SITE_URL}/`, { changefreq: 'weekly', priority: '1.0' }),
    urlEntry(`${SITE_URL}/shop`, { changefreq: 'daily', priority: '0.9' }),
    urlEntry(`${SITE_URL}/blog`, { changefreq: 'weekly', priority: '0.7' }),
  ];

  const productEntries = products.map((p) =>
    urlEntry(`${SITE_URL}/product/${p.slug || p.id}`, {
      lastmod: p.createdAt,
      changefreq: 'weekly',
      priority: '0.8',
    })
  );

  const articleEntries = articles.map((a) =>
    urlEntry(`${SITE_URL}/blog/${a.slug}`, {
      lastmod: a.updatedAt || a.createdAt,
      changefreq: 'monthly',
      priority: '0.6',
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...productEntries, ...articleEntries].join('\n')}
</urlset>`;

  res.type('application/xml').send(xml);
});

module.exports = router;
