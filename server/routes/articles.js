const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { readArticles, writeArticles } = require('../utils/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ---- image upload setup (cover image + inline images from the rich editor) ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'public', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 }, // 6MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('فقط فایل تصویری مجاز است.'));
    }
    cb(null, true);
  },
});

// ---- helpers ----

// lets logged-out visitors see only published posts while the dashboard
// (which sends its token on every request) can also see drafts.
function isAdminRequest(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch (err) {
    return false;
  }
}

// turns a title into a URL-friendly slug (keeps Persian/Arabic script) and
// guarantees uniqueness against the slugs already in use.
function slugify(input, existingSlugs) {
  let base = String(input || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!base) base = 'article';

  let slug = base;
  let i = 2;
  while (existingSlugs.includes(slug)) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}

// minimal server-side hardening: this is a single-admin CMS (not open
// registration), but we still strip the obviously dangerous bits before
// storing HTML produced by the rich editor.
function sanitizeHtml(html) {
  if (!html) return '';
  let out = String(html);
  out = out.replace(/<script[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  out = out.replace(/\son\w+="[^"]*"/gi, '').replace(/\son\w+='[^']*'/gi, '');
  out = out.replace(/javascript:/gi, '');
  return out;
}

function computeReadTime(html) {
  const text = String(html || '').replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function stripHtml(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ---- public: list articles (?tag=, ?search=; dashboard adds ?all=1 + token to include drafts) ----
router.get('/', (req, res) => {
  const { tag, search, all } = req.query;
  const admin = isAdminRequest(req);

  let articles = readArticles();
  if (!(admin && all)) {
    articles = articles.filter((a) => a.status === 'published');
  }
  if (tag) {
    articles = articles.filter((a) => a.tag === tag);
  }
  if (search) {
    const q = search.toLowerCase();
    articles = articles.filter((a) => a.title.toLowerCase().includes(q));
  }

  articles = [...articles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(articles);
});

// ---- protected: upload an inline image from the editor toolbar ----
router.post('/upload-image', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'فایلی ارسال نشده.' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ---- public: single article by slug or id (drafts only visible to dashboard) ----
router.get('/:idOrSlug', (req, res) => {
  const admin = isAdminRequest(req);
  const articles = readArticles();
  const article = articles.find(
    (a) => (a.slug === req.params.idOrSlug || a.id === req.params.idOrSlug) && (admin || a.status === 'published')
  );
  if (!article) return res.status(404).json({ message: 'مقاله پیدا نشد.' });
  res.json(article);
});

// ---- protected: create article ----
router.post('/', requireAuth, upload.single('cover'), (req, res) => {
  const { title, excerpt, tag, body, status, metaTitle, metaDescription, slug } = req.body;

  if (!title || !body) {
    return res.status(400).json({ message: 'عنوان و متن مقاله الزامی است.' });
  }

  const articles = readArticles();
  const finalSlug = slugify(slug || title, articles.map((a) => a.slug));
  const cleanBody = sanitizeHtml(body);

  const newArticle = {
    id: `a-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    slug: finalSlug,
    title,
    excerpt: excerpt || stripHtml(cleanBody).slice(0, 140),
    tag: tag || 'عمومی',
    coverImage: req.file ? `/uploads/${req.file.filename}` : '',
    body: cleanBody,
    status: status === 'draft' ? 'draft' : 'published',
    metaTitle: metaTitle || title,
    metaDescription: metaDescription || '',
    readTime: computeReadTime(cleanBody),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  articles.push(newArticle);
  writeArticles(articles);
  res.status(201).json(newArticle);
});

// ---- protected: update article ----
router.put('/:id', requireAuth, upload.single('cover'), (req, res) => {
  const articles = readArticles();
  const idx = articles.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'مقاله پیدا نشد.' });

  const existing = articles[idx];
  const { title, excerpt, tag, body, status, metaTitle, metaDescription, slug } = req.body;

  let finalSlug = existing.slug;
  if (slug && slug !== existing.slug) {
    const others = articles.filter((a, i) => i !== idx).map((a) => a.slug);
    finalSlug = slugify(slug, others);
  }

  const cleanBody = body !== undefined ? sanitizeHtml(body) : existing.body;

  articles[idx] = {
    ...existing,
    title: title ?? existing.title,
    slug: finalSlug,
    excerpt: excerpt ?? existing.excerpt,
    tag: tag ?? existing.tag,
    body: cleanBody,
    status: status ? (status === 'draft' ? 'draft' : 'published') : existing.status,
    metaTitle: metaTitle ?? existing.metaTitle,
    metaDescription: metaDescription ?? existing.metaDescription,
    coverImage: req.file ? `/uploads/${req.file.filename}` : existing.coverImage,
    readTime: computeReadTime(cleanBody),
    updatedAt: new Date().toISOString(),
  };

  writeArticles(articles);
  res.json(articles[idx]);
});

// ---- protected: delete article ----
router.delete('/:id', requireAuth, (req, res) => {
  const articles = readArticles();
  const idx = articles.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'مقاله پیدا نشد.' });

  const [removed] = articles.splice(idx, 1);
  writeArticles(articles);
  res.json(removed);
});

module.exports = router;
