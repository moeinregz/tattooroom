const express = require('express');
const { readCustomers, writeCustomers, readProducts } = require('../utils/db');
const { requireCustomerAuth } = require('../middleware/customerAuth');

const router = express.Router();
router.use(requireCustomerAuth);

function getCustomerIdx(customers, customerId) {
  return customers.findIndex((c) => c.id === customerId);
}

// joins the raw {productId, qty} cart entries with live product data so the
// frontend always shows current price/stock/name without duplicating them.
function enrichCart(cartItems) {
  const products = readProducts();
  const items = [];
  let subtotal = 0;

  (cartItems || []).forEach((entry) => {
    const product = products.find((p) => p.id === entry.productId);
    if (!product) return; // product removed/deleted since it was added
    const qty = Math.max(1, entry.qty || 1);
    const lineTotal = product.price * qty;
    subtotal += lineTotal;
    items.push({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      stock: product.stock,
      qty,
      lineTotal,
    });
  });

  return { items, subtotal, count: items.reduce((n, i) => n + i.qty, 0) };
}

// ---- GET current cart ----
router.get('/', (req, res) => {
  const customers = readCustomers();
  const customer = customers.find((c) => c.id === req.customerId);
  if (!customer) return res.status(404).json({ message: 'حساب کاربری پیدا نشد.' });
  res.json(enrichCart(customer.cart));
});

// ---- POST add product to cart (or increment qty if already there) ----
router.post('/', (req, res) => {
  const { productId, qty } = req.body || {};
  if (!productId) return res.status(400).json({ message: 'محصول مشخص نشده.' });

  const products = readProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ message: 'محصول پیدا نشد.' });

  const customers = readCustomers();
  const idx = getCustomerIdx(customers, req.customerId);
  if (idx === -1) return res.status(404).json({ message: 'حساب کاربری پیدا نشد.' });

  const cart = customers[idx].cart || [];
  const existing = cart.find((i) => i.productId === productId);
  const addQty = Math.max(1, Number(qty) || 1);

  if (existing) {
    existing.qty += addQty;
  } else {
    cart.push({ productId, qty: addQty });
  }

  customers[idx].cart = cart;
  writeCustomers(customers);
  res.status(201).json(enrichCart(customers[idx].cart));
});

// ---- PUT set exact quantity for one item (qty <= 0 removes it) ----
router.put('/:productId', (req, res) => {
  const { qty } = req.body || {};
  const customers = readCustomers();
  const idx = getCustomerIdx(customers, req.customerId);
  if (idx === -1) return res.status(404).json({ message: 'حساب کاربری پیدا نشد.' });

  let cart = customers[idx].cart || [];
  const newQty = Number(qty) || 0;

  if (newQty <= 0) {
    cart = cart.filter((i) => i.productId !== req.params.productId);
  } else {
    const existing = cart.find((i) => i.productId === req.params.productId);
    if (existing) existing.qty = newQty;
  }

  customers[idx].cart = cart;
  writeCustomers(customers);
  res.json(enrichCart(customers[idx].cart));
});

// ---- DELETE one item ----
router.delete('/:productId', (req, res) => {
  const customers = readCustomers();
  const idx = getCustomerIdx(customers, req.customerId);
  if (idx === -1) return res.status(404).json({ message: 'حساب کاربری پیدا نشد.' });

  customers[idx].cart = (customers[idx].cart || []).filter((i) => i.productId !== req.params.productId);
  writeCustomers(customers);
  res.json(enrichCart(customers[idx].cart));
});

// ---- DELETE clear cart ----
router.delete('/', (req, res) => {
  const customers = readCustomers();
  const idx = getCustomerIdx(customers, req.customerId);
  if (idx === -1) return res.status(404).json({ message: 'حساب کاربری پیدا نشد.' });

  customers[idx].cart = [];
  writeCustomers(customers);
  res.json(enrichCart([]));
});

module.exports = router;
