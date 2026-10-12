const express = require('express');
const crypto = require('crypto');

const { readOrders, writeOrders, readCustomers, writeCustomers, readProducts } = require('../utils/db');
const { requireCustomerAuth } = require('../middleware/customerAuth');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// same welcome-style points logic used for buy-intent (1 point per 10,000 تومان spent)
function pointsForTotal(total) {
  return Math.max(1, Math.round(total / 10000));
}

// ---- protected (customer): checkout — creates an order from the current cart ----
router.post('/', requireCustomerAuth, (req, res) => {
  const { addressId, address, note } = req.body || {};

  const customers = readCustomers();
  const cIdx = customers.findIndex((c) => c.id === req.customerId);
  if (cIdx === -1) return res.status(404).json({ message: 'حساب کاربری پیدا نشد.' });
  const customer = customers[cIdx];

  const cart = customer.cart || [];
  if (cart.length === 0) {
    return res.status(400).json({ message: 'سبد خرید شما خالی است.' });
  }

  const products = readProducts();
  const items = [];
  let total = 0;

  cart.forEach((entry) => {
    const product = products.find((p) => p.id === entry.productId);
    if (!product) return;
    const qty = Math.max(1, entry.qty || 1);
    const lineTotal = product.price * qty;
    total += lineTotal;
    items.push({ productId: product.id, name: product.name, price: product.price, qty, lineTotal });
  });

  if (items.length === 0) {
    return res.status(400).json({ message: 'محصولات سبد خرید دیگر در دسترس نیستند.' });
  }

  let shippingAddress = address || null;
  if (!shippingAddress && addressId) {
    shippingAddress = (customer.addresses || []).find((a) => a.id === addressId) || null;
  }

  const orders = readOrders();
  const awarded = pointsForTotal(total);

  const order = {
    id: `o-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    items,
    total,
    address: shippingAddress,
    note: note || '',
    status: 'pending', // pending -> confirmed -> shipped -> delivered (or cancelled)
    pointsAwarded: awarded,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  orders.push(order);
  writeOrders(orders);

  // clear the cart and award loyalty points for the purchase
  customer.cart = [];
  customer.points = (customer.points || 0) + awarded;
  customer.history = [
    ...(customer.history || []),
    { amount: awarded, reason: 'order', label: `خرید سفارش #${order.id.slice(-5)}`, date: new Date().toISOString() },
  ];
  customers[cIdx] = customer;
  writeCustomers(customers);

  res.status(201).json(order);
});

// ---- protected (customer): my orders ----
router.get('/me', requireCustomerAuth, (req, res) => {
  const orders = readOrders()
    .filter((o) => o.customerId === req.customerId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(orders);
});

router.get('/me/:id', requireCustomerAuth, (req, res) => {
  const order = readOrders().find((o) => o.id === req.params.id && o.customerId === req.customerId);
  if (!order) return res.status(404).json({ message: 'سفارش پیدا نشد.' });
  res.json(order);
});

// ---- protected (admin): manage all orders ----
router.get('/', requireAuth, (req, res) => {
  const orders = [...readOrders()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(orders);
});

router.put('/:id/status', requireAuth, (req, res) => {
  const { status } = req.body || {};
  const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'وضعیت نامعتبر است.' });
  }

  const orders = readOrders();
  const idx = orders.findIndex((o) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'سفارش پیدا نشد.' });

  orders[idx].status = status;
  orders[idx].updatedAt = new Date().toISOString();
  writeOrders(orders);
  res.json(orders[idx]);
});

module.exports = router;
