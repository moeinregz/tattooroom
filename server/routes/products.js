const express = require('express');
const multer = require('multer');
const { persistUpload } = require('../utils/db');
const path = require('path');
const crypto = require('crypto');

const { readProducts, writeProducts, readReviews, writeReviews } = require('../utils/db');
const { addPoints, hasReason } = require('../utils/customers');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ---- image upload setup ----
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB (سقف بدنه‌ی درخواست در Vercel حدود 4.5MB است)
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('فقط فایل تصویری مجاز است.'));
    }
    cb(null, true);
  },
});

// ---- helpers ----

// roughly 1 loyalty point per 1,000 تومان of price, minimum 10 for priced items.
function pointsForPrice(price) {
  const p = Number(price) || 0;
  if (p <= 0) return 0;
  return Math.max(10, Math.round(p / 1000));
}

function ratingSummary(productReviews) {
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  productReviews.forEach((r) => {
    breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
    sum += r.rating;
  });
  const count = productReviews.length;
  const avg = count ? Math.round((sum / count) * 10) / 10 : 0;
  return { avg, count, breakdown };
}

// splits comma or newline separated admin input into a clean array
function splitList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(/[\n,]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

// parses "برچسب: مقدار" lines into [{ label, value }]
function parseFeatures(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split(':');
      return { label: (label || '').trim(), value: rest.join(':').trim() };
    })
    .filter((f) => f.label);
}

// turns a name into a URL-friendly slug (keeps Persian/Arabic script) and
// guarantees uniqueness against the slugs already in use — same approach as
// the one used for articles, so admins can fix up an ugly/too-long default
// slug (or set their own) instead of being stuck with the raw product id.
function slugify(input, existingSlugs) {
  let base = String(input || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!base) base = 'product';

  let slug = base;
  let i = 2;
  while (existingSlugs.includes(slug)) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}

function enrich(product) {
  const reviews = readReviews().filter((r) => r.productId === product.id);
  return {
    ...product,
    likes: (product.likedBy || []).length,
    points: pointsForPrice(product.price),
    rating: ratingSummary(reviews),
  };
}

// ---- public: list products (supports ?category= & ?search=) ----
router.get('/', (req, res) => {
  const { category, search } = req.query;
  let products = readProducts();

  if (category) {
    products = products.filter((p) => p.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(q));
  }

  // newest first
  products = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(products);
});

// ---- public: single product (includes computed points / rating / likes) ----
// matches by slug first (what real product links use) but falls back to the
// raw id so old/bookmarked links (or the dashboard) keep working.
router.get('/:id', (req, res) => {
  const products = readProducts();
  const product = products.find((p) => p.slug === req.params.id || p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'محصول پیدا نشد.' });
  res.json(enrich(product));
});

// ---- public: reviews for a product ----
router.get('/:id/reviews', (req, res) => {
  const products = readProducts();
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'محصول پیدا نشد.' });

  const reviews = readReviews()
    .filter((r) => r.productId === req.params.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ reviews, summary: ratingSummary(reviews) });
});

// ---- public: submit a review (phone optional -> earns loyalty points) ----
router.post('/:id/reviews', (req, res) => {
  const products = readProducts();
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'محصول پیدا نشد.' });

  const { name, comment, phone } = req.body || {};
  const rating = Number(req.body?.rating);

  if (!name || !comment || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'نام، امتیاز (بین ۱ تا ۵) و متن نظر الزامی است.' });
  }

  const reviews = readReviews();
  const newReview = {
    id: `r-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    productId: req.params.id,
    name: String(name).trim(),
    rating,
    comment: String(comment).trim(),
    likes: 0,
    likedBy: [],
    createdAt: new Date().toISOString(),
  };
  reviews.push(newReview);
  writeReviews(reviews);

  let profile = null;
  let pointsAwarded = 0;
  if (phone && phone.trim().length >= 6) {
    pointsAwarded = 30;
    profile = addPoints(phone.trim(), name, pointsAwarded, `review-${newReview.id}`, `ثبت نظر برای ${product.name}`);
  }

  const productReviews = reviews.filter((r) => r.productId === req.params.id);
  res.status(201).json({ review: newReview, summary: ratingSummary(productReviews), pointsAwarded, profile });
});

// ---- public: toggle like on a review ----
router.post('/:id/reviews/:reviewId/like', (req, res) => {
  const { voterId } = req.body || {};
  if (!voterId) return res.status(400).json({ message: 'شناسه کاربر ارسال نشده.' });

  const reviews = readReviews();
  const idx = reviews.findIndex((r) => r.id === req.params.reviewId && r.productId === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'نظر پیدا نشد.' });

  const review = reviews[idx];
  review.likedBy = review.likedBy || [];
  const already = review.likedBy.includes(voterId);
  review.likedBy = already ? review.likedBy.filter((v) => v !== voterId) : [...review.likedBy, voterId];
  review.likes = review.likedBy.length;

  writeReviews(reviews);
  res.json({ likes: review.likes, liked: !already });
});

// ---- public: toggle wishlist-like on a product ----
router.post('/:id/like', (req, res) => {
  const { voterId } = req.body || {};
  if (!voterId) return res.status(400).json({ message: 'شناسه کاربر ارسال نشده.' });

  const products = readProducts();
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'محصول پیدا نشد.' });

  const product = products[idx];
  product.likedBy = product.likedBy || [];
  const already = product.likedBy.includes(voterId);
  product.likedBy = already ? product.likedBy.filter((v) => v !== voterId) : [...product.likedBy, voterId];

  writeProducts(products);
  res.json({ likes: product.likedBy.length, liked: !already });
});

// ---- public: award loyalty points for a "call to buy" click (once per product per phone) ----
router.post('/:id/buy-intent', (req, res) => {
  const products = readProducts();
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'محصول پیدا نشد.' });

  const { name, phone } = req.body || {};
  if (!name || !phone || phone.trim().length < 6) {
    return res.status(400).json({ message: 'برای ثبت امتیاز، نام و شماره تماس لازم است.' });
  }

  const reason = `buy-intent-${product.id}`;
  const { findCustomer, toProfile } = require('../utils/customers');
  const existing = findCustomer(phone);

  if (existing && hasReason(existing, reason)) {
    return res.json({ pointsAwarded: 0, profile: toProfile(existing), alreadyAwarded: true });
  }

  const pts = pointsForPrice(product.price);
  const profile = addPoints(phone.trim(), name, pts, reason, `تماس برای خرید «${product.name}»`);
  res.json({ pointsAwarded: pts, profile, alreadyAwarded: false });
});

// ---- protected: create product ----
router.post('/', requireAuth, upload.single('image'), persistUpload, (req, res) => {
  const {
    name,
    category,
    price,
    stock,
    shortDescription,
    description,
    metaTitle,
    metaDescription,
    tags,
    features,
    warranty,
    images,
    slug,
  } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: 'نام و قیمت محصول الزامی است.' });
  }

  const products = readProducts();
  const finalSlug = slugify(slug || name, products.map((p) => p.slug).filter(Boolean));
  const newProduct = {
    id: `p-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    slug: finalSlug,
    name,
    category: category || 'عمومی',
    price: Number(price),
    stock: stock ? Number(stock) : 0,
    image: req.file ? `/uploads/${req.file.filename}` : '',
    images: splitList(images),
    shortDescription: shortDescription || '',
    description: description || '',
    metaTitle: metaTitle || '',
    metaDescription: metaDescription || '',
    tags: splitList(tags),
    features: parseFeatures(features),
    warranty: warranty || '',
    likedBy: [],
    createdAt: new Date().toISOString(),
  };

  products.push(newProduct);
  writeProducts(products);
  res.status(201).json(newProduct);
});

// ---- protected: update product ----
router.put('/:id', requireAuth, upload.single('image'), persistUpload, (req, res) => {
  const products = readProducts();
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'محصول پیدا نشد.' });

  const {
    name,
    category,
    price,
    stock,
    shortDescription,
    description,
    metaTitle,
    metaDescription,
    tags,
    features,
    warranty,
    images,
    slug,
  } = req.body;
  const existing = products[idx];

  let finalSlug = existing.slug;
  if (slug && slug !== existing.slug) {
    const others = products.filter((p, i) => i !== idx).map((p) => p.slug).filter(Boolean);
    finalSlug = slugify(slug, others);
  } else if (!finalSlug) {
    // older products created before slugs existed — give them one for free
    // the first time they're saved again, using the (possibly just-edited) name.
    const others = products.filter((p, i) => i !== idx).map((p) => p.slug).filter(Boolean);
    finalSlug = slugify(name || existing.name, others);
  }

  products[idx] = {
    ...existing,
    name: name ?? existing.name,
    slug: finalSlug,
    category: category ?? existing.category,
    price: price !== undefined ? Number(price) : existing.price,
    stock: stock !== undefined ? Number(stock) : existing.stock,
    shortDescription: shortDescription ?? existing.shortDescription,
    description: description ?? existing.description,
    metaTitle: metaTitle ?? existing.metaTitle,
    metaDescription: metaDescription ?? existing.metaDescription,
    tags: tags !== undefined ? splitList(tags) : existing.tags || [],
    features: features !== undefined ? parseFeatures(features) : existing.features || [],
    warranty: warranty ?? existing.warranty ?? '',
    images: images !== undefined ? splitList(images) : existing.images || [],
    image: req.file ? `/uploads/${req.file.filename}` : existing.image,
  };

  writeProducts(products);
  res.json(products[idx]);
});

// ---- protected: delete product ----
router.delete('/:id', requireAuth, (req, res) => {
  const products = readProducts();
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'محصول پیدا نشد.' });

  const [removed] = products.splice(idx, 1);
  writeProducts(products);
  res.json(removed);
});

module.exports = router;
