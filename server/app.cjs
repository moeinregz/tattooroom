require('dotenv').config();

const express = require('express');
const path = require('path');
const { dbMiddleware, serveUpload } = require('./utils/db');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const customerRoutes = require('./routes/customers');
const articleRoutes = require('./routes/articles');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const sitemapRoutes = require('./routes/sitemap');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', dbMiddleware, productRoutes);
app.use('/api/customers', dbMiddleware, customerRoutes);
app.use('/api/articles', dbMiddleware, articleRoutes);
app.use('/api/cart', dbMiddleware, cartRoutes);
app.use('/api/orders', dbMiddleware, orderRoutes);

// تصاویر آپلودشده (Mongo) و بعد فایل‌های ثابت public/uploads
app.get('/uploads/:name', serveUpload);
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// /sitemap.xml روی همون دامنه‌ی سایت سرو می‌شه
app.use('/sitemap.xml', dbMiddleware);
app.use('/', sitemapRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ message: err.message || 'خطای غیرمنتظره رخ داد.' });
});

module.exports = app;
