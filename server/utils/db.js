const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const PRODUCTS_PATH = path.join(DATA_DIR, 'products.json');
const REVIEWS_PATH = path.join(DATA_DIR, 'reviews.json');
const CUSTOMERS_PATH = path.join(DATA_DIR, 'customers.json');
const ARTICLES_PATH = path.join(DATA_DIR, 'articles.json');
const ORDERS_PATH = path.join(DATA_DIR, 'orders.json');

function ensureFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback), 'utf-8');
  }
}

function readJson(filePath, fallback) {
  ensureFile(filePath, fallback);
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw || JSON.stringify(fallback));
  } catch (err) {
    console.error(`${filePath} is corrupted, resetting.`, err);
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

const readProducts = () => readJson(PRODUCTS_PATH, []);
const writeProducts = (data) => writeJson(PRODUCTS_PATH, data);

const readReviews = () => readJson(REVIEWS_PATH, []);
const writeReviews = (data) => writeJson(REVIEWS_PATH, data);

const readCustomers = () => readJson(CUSTOMERS_PATH, []);
const writeCustomers = (data) => writeJson(CUSTOMERS_PATH, data);

const readArticles = () => readJson(ARTICLES_PATH, []);
const writeArticles = (data) => writeJson(ARTICLES_PATH, data);

const readOrders = () => readJson(ORDERS_PATH, []);
const writeOrders = (data) => writeJson(ORDERS_PATH, data);

module.exports = {
  readProducts,
  writeProducts,
  readReviews,
  writeReviews,
  readCustomers,
  writeCustomers,
  readArticles,
  writeArticles,
  readOrders,
  writeOrders,
};
